"""One real CLI extraction and two failure boundaries using original fixtures."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile

SCRIPT = Path(__file__).with_name('inventory_factory_controller_resources.py')
cases = []

with tempfile.TemporaryDirectory() as folder:
    root = Path(folder)
    def run(source, name):
        return subprocess.run([sys.executable, str(SCRIPT), str(source), '--private-output', str(root/name), '--report', str(root/(name+'.json'))], capture_output=True, text=True)
    good = root/'good.zip'
    xml = b'<root><supported_apps><app value="fixture"/></supported_apps><native_intro_device name="Original fixture"/><midi><control channel="1" control="7"><userio event="click"><play deck_id="0"/></userio></control></midi></root>'
    schema = b'<!DOCTYPE schema SYSTEM "file:///never-resolve-this"><schema/>'
    with zipfile.ZipFile(good, 'w', compression=zipfile.ZIP_STORED) as archive:
        archive.writestr('midi/fixture.xml', xml)
        archive.writestr('midi/schema.xsd', schema)
    result = run(good, 'retained'); assert result.returncode == 0, result.stderr
    report = json.loads((root/'retained.json').read_text())
    assert report['hardwareDefinitions'] == 1 and report['definitionControlElements'] == 1
    assert report['allEntryCRCsChecked'] and (root/'retained/midi/fixture.xml').read_bytes() == xml
    assert (root/'retained/midi/schema.xsd').read_bytes() == schema
    assert any(row['root']=='xml_dtd_retained_unparsed' for row in report['files'])
    cases.append('Actual CLI extracts original definition byte-for-byte, retains external-DTD schema as inert data and reports precise counts')
    unsafe = root/'unsafe.zip'
    with zipfile.ZipFile(unsafe, 'w') as archive: archive.writestr('../escape.xml', xml)
    result = run(unsafe, 'unsafe-output')
    assert result.returncode != 0 and not (root/'unsafe-output').exists() and not (root/'escape.xml').exists()
    cases.append('Traversal entry rejected before output creation')
    corrupt = root/'corrupt.zip'; data = bytearray(good.read_bytes()); position = data.index(xml); data[position+10] ^= 1; corrupt.write_bytes(data)
    result = run(corrupt, 'corrupt-output')
    assert result.returncode != 0 and not (root/'corrupt-output').exists()
    cases.append('Corrupt ZIP CRC rejected before any files are retained')

print(json.dumps({'passed':True,'cases':cases,'scope':'Private resource extraction CLI only; no controller dispatch, hardware or full parity acceptance'},indent=2))
