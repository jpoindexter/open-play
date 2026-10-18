#!/usr/bin/env python3
"""Local learned four-source preparation; no native app or remote audio upload.

Run with local-evidence/stems-runtime/venv/bin/python. Model acquisition is explicit;
inference never downloads code or weights. stdout is one final JSON object, while
--status optionally receives atomic progress JSON. A caller may cancel the process.
"""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
from stem_mix_consistency import project_inplace, REVISION as CONSISTENCY_REVISION

ROOT = Path(__file__).resolve().parents[1]
MODEL_SHA256 = "d9fa14133cfcc034a6758923bb3a8ca9f8dfd0b582134643bbf83f72c17576dd"
MODEL_REVISION = "cbc8a9b1a87023b7fd74e7b3412e6321c0eab003"
MODEL_DEFAULT = ROOT / "local-evidence/stems-runtime/models/955717e8.safetensors"
MODEL_URL = f"https://huggingface.co/adefossez/HTDemucs/resolve/{MODEL_REVISION}/955717e8.safetensors"
SPLEETER_DEFAULT = ROOT / "local-evidence/stems-runtime/models/4stems"
SPLEETER_SHA256 = "3adb4a50ad4eb18c7c4d65fcf4cf2367a07d48408a5eb7d03cd20067429dfaa8"
SPLEETER_FILES = {
    "checkpoint": "011c96b970c1f56137037924fe1a0f0851369b0ee6692e120aea798615326f48",
    "model.data-00000-of-00001": "3823e0ef50835cca3907c386dc9667a6a9af77b40a20c3ab845a8d6c9592255d",
    "model.index": "99ea41b3ef9bfbc6a34520409427af5ba7a883173e57ea25d6c487584b891b18",
    "model.meta": "f2c2843e3c8c84c737d0ba642fef798d24056f8dbb0b2e2d58a19de55b20034e",
}
SCNET_DEFAULT = ROOT / "local-evidence/stems-runtime/models/scnet-large.th"
SCNET_SHA256 = "719e5abb8ed920305dad546ac3cd6fb0b1e9c3092d14ce21827bfc0423af3070"
SCNET_SOURCE = ROOT / "local-evidence/stems-runtime/scnet-source"
SCNET_FILES = {
    "scnet/__init__.py": "21b5f8fae849055f3b428d2353de72b477a722cc44e87c6fa0d3b22ac5f36fa2",
    "scnet/SCNet.py": "85a15ea5d28285a0cf0a24d6266a28d043c5a655d47aa41684ef256d84e7bc4a",
    "scnet/separation.py": "43402dc6579436d3b5abb921990572684beed8fa10b377a112892b438f40713b",
}


def digest(path):
    value = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def atomic_json(path, value):
    path = Path(path)
    temp = path.with_name(path.name + f".{os.getpid()}.tmp")
    temp.write_text(json.dumps(value, indent=2) + "\n")
    os.replace(temp, path)


def run(args):
    started = time.monotonic()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)

    def status(state, **extra):
        value = {"state": state, "elapsed_seconds": round(time.monotonic() - started, 3), **extra}
        if args.status:
            atomic_json(args.status, value)
        return value

    status("loading_model", progress=0)
    if args.backend == "htdemucs":
        args.model = args.model or MODEL_DEFAULT
        if not args.model.is_file() or digest(args.model) != MODEL_SHA256:
            raise ValueError("Pinned HTDemucs checkpoint missing or SHA-256 mismatch; no automatic download attempted")
    elif args.backend == "scnet":
        args.model = args.model or SCNET_DEFAULT
        if not args.model.is_file() or digest(args.model) != SCNET_SHA256:
            raise ValueError("Pinned SCNet-large checkpoint missing or SHA-256 mismatch")
        if not all((SCNET_SOURCE / name).is_file() and digest(SCNET_SOURCE / name) == sha
                   for name, sha in SCNET_FILES.items()):
            raise ValueError("Pinned official SCNet inference source missing or SHA-256 mismatch")
        # Only inspected architecture modules and the docstring-only package initializer.
    else:
        args.model = args.model or SPLEETER_DEFAULT
        if not all((args.model / name).is_file() and digest(args.model / name) == sha
                   for name, sha in SPLEETER_FILES.items()):
            raise ValueError("Pinned Spleeter checkpoint missing or SHA-256 mismatch; no automatic download attempted")
    import numpy as np
    import soundfile as sf
    sources = ["drums", "bass", "other", "vocals"]
    if args.backend == "htdemucs":
        import torch
        import demucs
        from safetensors import safe_open
        from demucs.hf import load_safetensors_model
        from demucs.apply import apply_model
        # Upstream's loader resolves a class from metadata. Constrain before loading.
        with safe_open(str(args.model), framework="pt") as checkpoint:
            metadata = checkpoint.metadata()
        if metadata.get("klass") != "demucs.htdemucs.HTDemucs" or "structure" in metadata:
            raise ValueError("Unexpected pinned checkpoint metadata")
        torch.set_num_threads(args.threads)
        torch.manual_seed(0)
        model = load_safetensors_model(args.model).eval()
        if model.sources != sources:
            raise ValueError(f"Unexpected source contract: {model.sources}")
        runtime = {"demucs": demucs.__version__, "torch": torch.__version__}
        sample_rate = model.samplerate
        model_hash = MODEL_SHA256
    elif args.backend == "scnet":
        import torch
        torch.set_num_threads(args.threads)
        torch.manual_seed(0)
        sys.path.insert(0, str(SCNET_SOURCE))
        from scnet.SCNet import SCNet
        # Exact released large config; avoid executing or interpreting arbitrary config.
        model = SCNet(dims=[4, 64, 128, 256], band_SR=[0.225, 0.372, 0.403]).eval()
        checkpoint = torch.load(args.model, map_location="cpu", weights_only=True)
        model.load_state_dict({name.removeprefix("module."): value
                               for name, value in checkpoint["best_state"].items()})
        runtime = {"torch": torch.__version__, "scnet_commit": "5d95bf96b19c3eede63248d171efeca8e3abb948"}
        sample_rate = 44100
        model_hash = SCNET_SHA256
    else:
        os.environ["MODEL_PATH"] = str(args.model.resolve().parent)
        os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
        os.environ["OMP_NUM_THREADS"] = str(args.threads)
        os.environ["TF_NUM_INTRAOP_THREADS"] = str(args.threads)
        os.environ["TF_NUM_INTEROP_THREADS"] = "1"
        import tensorflow as tf
        from spleeter.separator import Separator
        from importlib.metadata import version
        tf.get_logger().setLevel("ERROR")
        model = Separator("spleeter:4stems", multiprocess=False)
        model._params["model_dir"] = str(args.model.resolve())
        runtime = {"spleeter": version("spleeter"), "tensorflow": tf.__version__}
        sample_rate = 44100
        model_hash = SPLEETER_SHA256
    model_load_seconds = time.monotonic() - started
    source_hash = digest(args.input)
    parameters = ({"segment": args.segment, "overlap": 0.25, "shifts": 0, "device": "cpu"}
                  if args.backend == "htdemucs" else {"segment": 30, "overlap_seconds": 1, "device": "cpu"})
    consistency = args.mixture_consistency or ('uniform' if args.backend == 'scnet' else 'none')
    parameters['mixture_consistency'] = CONSISTENCY_REVISION if consistency == 'uniform' else 'none'
    parameters['postprocess_source_sha256'] = digest(Path(__file__).with_name('stem_mix_consistency.py')) if consistency == 'uniform' else None
    cache_key = hashlib.sha256(json.dumps({"input": source_hash, "model": model_hash,
        "parameters": parameters, "worker_sha256": digest(Path(__file__))}, sort_keys=True).encode()).hexdigest()
    manifest_path = output / "manifest.json"
    if manifest_path.exists():
        saved = json.loads(manifest_path.read_text())
        if saved.get("cache_key") == cache_key and 0 < saved.get("duration", 0) <= args.max_seconds and all(
            (output / x["file"]).is_file() and digest(output / x["file"]) == x["sha256"]
            for x in saved.get("stems", [])
        ) and len(saved.get("stems", [])) == 4:
            status("complete", progress=1, cached=True)
            return {**saved, "cached": True}

    status("decoding", progress=0.02)
    decoder = shutil.which("ffmpeg")
    if not decoder:
        raise RuntimeError("ffmpeg is required to decode local audio")
    # Decode to a temporary file rather than a large subprocess stdout allocation.
    decoded = output / f".decoded-{os.getpid()}.wav"
    try:
        subprocess.run([decoder, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(args.input.resolve()), "-t", str(args.max_seconds + 1), "-vn", "-ac", "2",
            "-ar", str(sample_rate), "-c:a", "pcm_f32le", str(decoded)], check=True,
            capture_output=True, timeout=180)
        audio, rate = sf.read(decoded, dtype="float32", always_2d=True)
    finally:
        decoded.unlink(missing_ok=True)
    duration = len(audio) / rate
    if duration <= 0 or duration > args.max_seconds:
        raise ValueError(f"Audio must be between 0 and {args.max_seconds} seconds")
    if not np.isfinite(audio).all():
        raise ValueError("Decoded audio contains non-finite samples")
    stride = (int((1 - parameters["overlap"]) * int(args.segment * rate))
              if args.backend == "htdemucs" else 29 * rate)
    chunks = math.ceil(len(audio) / stride)
    complete = 0

    def progress(info):
        nonlocal complete
        if info["state"] == "end":
            complete += 1
            status("separating", progress=min(0.96, 0.03 + 0.93 * complete / chunks),
                   chunks_complete=complete, chunks_total=chunks)

    inference_start = time.monotonic()
    status("separating", progress=0.03, chunks_complete=0, chunks_total=chunks)
    if args.backend == "htdemucs":
        mixture = torch.from_numpy(audio.T.copy())
        ref = mixture.mean(0)
        mean, std = ref.mean(), ref.std() + 1e-8
        with torch.inference_mode():
            separated = apply_model(model, ((mixture - mean) / std)[None], device="cpu",
                split=True, segment=args.segment, overlap=0.25, shifts=0, progress=False,
                num_workers=0, callback=progress)[0]
        separated = (separated * std + mean).cpu().numpy()
    else:
        separated = np.zeros((4, 2, len(audio)), dtype="float32")
        weights = np.zeros(len(audio), dtype="float32")
        for offset in range(0, len(audio), stride):
            chunk = audio[offset:offset + 30 * rate]
            if args.backend == "scnet":
                mixture = torch.from_numpy(chunk.T.copy())
                ref = mixture.mean(0)
                mean, std = ref.mean(), ref.std() + 1e-8
                with torch.inference_mode():
                    values = (model(((mixture - mean) / std)[None])[0] * std + mean).numpy()
                result = {name: value.T for name, value in zip(model.sources, values)}
            else:
                result = model.separate(chunk)
            weight = np.ones(len(chunk), dtype="float32")
            ramp = min(rate, len(chunk))
            if offset > 0:
                weight[:ramp] = np.linspace(0.0001, 1, ramp)
            if offset + len(chunk) < len(audio):
                weight[-ramp:] = np.linspace(1, 0.0001, ramp)
            for index, name in enumerate(sources):
                separated[index, :, offset:offset + len(chunk)] += result[name][:len(chunk)].T * weight
            weights[offset:offset + len(chunk)] += weight
            progress({"state": "end"})
        separated /= weights[None, None, :]
    inference_seconds = time.monotonic() - inference_start
    if separated.shape != (4, 2, len(audio)) or not np.isfinite(separated).all():
        raise ValueError("Invalid separation result shape or values")
    consistency_result = None
    if consistency == 'uniform':
        status('recombining', progress=0.96)
        consistency_result = project_inplace(audio, separated)
        if not np.isfinite(separated).all():
            raise ValueError('Non-finite mixture-consistent export')
    status("writing", progress=0.97)
    stems = []
    for name, data in zip(sources, separated):
        filename = f"{name}.wav"
        temporary = output / f".{name}-{os.getpid()}.wav"
        # Float WAV preserves model gain relationships; no per-stem normalization.
        sf.write(temporary, data.T, rate, subtype="FLOAT")
        os.replace(temporary, output / filename)
        stems.append({"name": name, "ui_name": "melody" if name == "other" else name,
            "file": filename, "sha256": digest(output / filename),
            "rms": float(np.sqrt(np.mean(data.astype(np.float64) ** 2))),
            "peak": float(np.max(np.abs(data)))})
    manifest = {"schema_version": 1, "state": "complete", "cached": False,
        "cache_key": cache_key, "source_sha256": source_hash,
        "model": "HTDemucs 955717e8" if args.backend == "htdemucs" else "Spleeter 4stems v1.4.0",
        "backend": args.backend, "model_sha256": model_hash,
        "model_revision": MODEL_REVISION if args.backend == "htdemucs" else "v1.4.0",
        "model_url": MODEL_URL if args.backend == "htdemucs" else "https://github.com/deezer/spleeter/releases/download/v1.4.0/4stems.tar.gz",
        "weight_redistribution": "research_only_author_statement" if args.backend == "htdemucs" else "MIT_author_JOSS_paper_explicitly_includes_pretrained_models",
        "runtime": runtime,
        "sample_rate": rate, "channels": 2, "frames": len(audio), "duration": duration,
        "parameters": parameters, "stems": stems, "mixture_consistency": consistency_result,
        "timing": {"model_load_seconds": model_load_seconds,
            "inference_seconds": inference_seconds, "total_seconds": time.monotonic() - started,
            "realtime_factor": inference_seconds / duration},
        "reconstruction_rms_error": float(np.sqrt(np.mean((separated.sum(0).T - audio) ** 2)))}
    if args.backend == "scnet":
        manifest.update({"model": "SCNet-large official", "model_revision": runtime["scnet_commit"],
            "model_url": "https://drive.google.com/file/d/1s7QvQwn8ag9oVstGDBQ6KZvacJkvyK7t/view",
            "weight_redistribution": "MIT_explicit_owner_confirmation_SCNet_issue_35"})
    atomic_json(manifest_path, manifest)
    status("complete", progress=1, cached=False)
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--backend", choices=["htdemucs", "spleeter", "scnet"], default="htdemucs")
    parser.add_argument("--model", type=Path)
    parser.add_argument("--mixture-consistency", choices=["none", "uniform"], help="Default: uniform for SCNet, none for other backends; raw inference metrics stay in the manifest")
    parser.add_argument("--status", type=Path)
    parser.add_argument("--segment", type=float, default=7.8)
    parser.add_argument("--threads", type=int, default=4)
    parser.add_argument("--max-seconds", type=int, default=1800)
    args = parser.parse_args()
    if not 1 <= args.segment <= 7.8 or not 1 <= args.threads <= 12 or args.max_seconds < 1:
        parser.error("segment must be 1..7.8, threads 1..12, max-seconds positive")
    try:
        print(json.dumps(run(args)))
    except Exception as error:
        failure = {"state": "failed", "error": str(error)}
        if args.status:
            atomic_json(args.status, failure)
        print(json.dumps(failure))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
