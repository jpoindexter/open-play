#!/usr/bin/env python3
"""Build matched stock/reference-policy WASM modules from pinned MIT inputs."""
import argparse
import difflib
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def patch_header(original):
    needle = '\tint channels = 0, bands = 0;'
    helper = '''\tint channels = 0, bands = 0;
\t// Open Play reserved groups: original stereo anchors shared analysis.
\t// Other geometries retain the upstream reference policy.
\tint phaseReferenceChannels() const {
#if defined(OPEN_PLAY_REFERENCE_STEREO) && OPEN_PLAY_REFERENCE_STEREO
\t\tif (channels == 18) return std::min(channels, 2);
#endif
\t\treturn channels;
\t}'''
    assert original.count(needle) == 1
    changed = original.replace(needle, helper)
    needle = '\t\t\t\tfor (int c = 1; c < channels; ++c) {'
    assert changed.count(needle) == 1
    changed = changed.replace(needle, needle.replace('c < channels', 'c < phaseReferenceChannels()'))
    needle = '\t\t\t\t\tenergy[b] += e;'
    assert changed.count(needle) == 1
    changed = changed.replace(needle, '\t\t\t\t\tif (c < phaseReferenceChannels()) energy[b] += e;')
    return changed


def build(source, sdk, output):
    source = source.resolve(); sdk = sdk.resolve(); output = output.resolve()
    assert not output.exists(), 'Use a fresh output directory; preserve all earlier builds'
    for name in ['source-receipt.json', 'additional-source-receipt.json']:
        receipt = json.loads((source/name).read_bytes())
        for row in receipt['files']:
            data = (source/row['path']).read_bytes()
            assert len(data) == row['bytes'] and sha(data) == row['sha256'], row['path']
    output.mkdir(parents=True)
    copied = output/'source'; shutil.copytree(source, copied)
    pre_js = copied/'web/emscripten/pre.js'
    # AudioWorkletGlobalScope has neither window nor WorkerGlobalScope. The
    # generic Emscripten4 shell fallback otherwise tries d8's `os.system` for
    # std::random_device, despite the supplied audio-only crypto fallback.
    pre_js.write_text(pre_js.read_text()+'''\nif (typeof AudioWorkletProcessor === 'function' && !ENVIRONMENT_IS_NODE) {
  ENVIRONMENT_IS_WORKER = true;
  ENVIRONMENT_IS_SHELL = false;
}
''')
    original = (copied/'signalsmith-stretch.h').read_text()
    changed = patch_header(original); (copied/'signalsmith-stretch.h').write_text(changed)
    diff = ''.join(difflib.unified_diff(original.splitlines(True), changed.splitlines(True),
                                      fromfile='a/signalsmith-stretch.h', tofile='b/signalsmith-stretch.h'))
    (output/'reference-policy.patch').write_text(diff)
    production = ROOT/'prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-replace.mjs'
    wrapper = production.read_text(); suffix = wrapper[wrapper.index('function registerWorkletProcessor'):]
    env = os.environ.copy(); env['EM_CONFIG'] = str(sdk/'.emscripten'); env['EM_CACHE'] = str(sdk/'upstream/emscripten/cache')
    compiler = sdk/'upstream/emscripten/em++'
    version = subprocess.check_output([str(compiler), '--version'], env=env, text=True)
    records = []
    for variant, enabled in [('stock', 0), ('candidate', 1)]:
        arguments = [str(compiler), str(copied/'web/emscripten/main.cpp'), '-o', str(output/f'{variant}-dsp.mjs'),
                     '-I', str(copied), '-std=c++11', '-O3', '-ffast-math', '-fno-exceptions', '-fno-rtti',
                     '--pre-js', str(copied/'web/emscripten/pre.js'), '-Wall', '-Wextra', '-Wfatal-errors',
                     '-Wpedantic', '-pedantic-errors', '-sSINGLE_FILE=1', '-sMODULARIZE=1', '-sEXPORT_ES6=1',
                     '-sEXPORT_NAME=OpenPlayDSP155', '-sENVIRONMENT=web,worker,shell', '-sNO_EXIT_RUNTIME=1',
                     '-sFILESYSTEM=0', '-sEXPORTED_RUNTIME_METHODS=HEAP8,UTF8ToString', '-sINITIAL_MEMORY=512kb',
                     '-sALLOW_MEMORY_GROWTH=1', '-sMEMORY_GROWTH_GEOMETRIC_STEP=0.5', '-sABORTING_MALLOC=1',
                     '-sSTRICT=1', '-sDYNAMIC_EXECUTION=0', f'-DOPEN_PLAY_REFERENCE_STEREO={enabled}']
        with (output/f'{variant}-build.log').open('x') as log:
            result = subprocess.run(arguments, env=env, stdout=log, stderr=subprocess.STDOUT)
        if result.returncode:
            raise RuntimeError(f'{variant} build failed; retained full log: {output/ (variant+"-build.log")}')
        key = f'signalsmith-stretch-reference-155-{variant}'
        adapted = suffix.replace('signalsmith-stretch-open-play-replace', key)
        adapted = adapted.replace('./SignalsmithStretch-open-play-replace.mjs', f'./{variant}-worklet.mjs')
        # A controlled diagnostic always uses its selected compiled factory,
        # including when the production suffix has the18-channel selector.
        (output/f'{variant}-worklet.mjs').write_text(f"import createDSP from './{variant}-dsp.mjs';\nlet SignalsmithStretch = createDSP;\nconst ReferenceStereoDSP = createDSP;\n"+adapted)
        records.append(dict(variant=variant, referenceStereo=enabled, processorKey=key, command=arguments,
                            dspSHA256=sha((output/f'{variant}-dsp.mjs').read_bytes()),
                            workletSHA256=sha((output/f'{variant}-worklet.mjs').read_bytes())))
        print(f'{variant}: compiled {len((output/f"{variant}-dsp.mjs").read_bytes())} bytes', flush=True)
    manifest = dict(checkpoint=155, scope='Matched-source/compiler builds only; not executed audio or browser acceptance.',
                    compilerVersion=version.strip(), inputHeaderSHA256=sha(original.encode()), patchedHeaderSHA256=sha(changed.encode()),
                    audioWorkletEnvironmentAdaptation=True, preJsSHA256=sha(pre_js.read_bytes()),
                    buildRecipeSHA256=sha(Path(__file__).read_bytes()),
                    minimalPatchSHA256=sha(diff.encode()), wrapperSourceSHA256=sha(wrapper.encode()), records=records,
                    fullParityAcceptance=False)
    (output/'build-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True); parser.add_argument('--sdk', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True); args = parser.parse_args()
    build(args.source, args.sdk, args.out)
