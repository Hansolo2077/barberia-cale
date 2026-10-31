"""Package the explicit public manifest only, never historical submissions or secrets."""
import hashlib
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
manifest_file = root / 'docs/evidencias_pruebas/parcial-iii/manifest.json'
manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
target = root / 'output/calidad-parcial-iii/evidencias-parcial-iii-2026-10-31.zip'
target.parent.mkdir(parents=True, exist_ok=True)
entries = manifest['files']
for entry in entries:
    source = (root / entry['path']).resolve()
    if not source.is_relative_to(root) or any(part in {'.quality-private', '.git', 'node_modules', 'entregas'} for part in source.parts):
        raise RuntimeError('A non-public path was selected')
    if source.name.startswith('.env'):
        raise RuntimeError('An environment file was selected')
    if hashlib.sha256(source.read_bytes()).hexdigest() != entry['sha256']:
        raise RuntimeError('Manifest no longer matches ' + entry['path'])
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
    for entry in entries:
        archive.write(root / entry['path'], entry['path'])
    archive.write(manifest_file, manifest_file.relative_to(root).as_posix())
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(entries) + 1
    assert len(set(archive.namelist())) == len(archive.namelist())
print(json.dumps({'archive': target.relative_to(root).as_posix(), 'files': len(entries) + 1, 'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))
