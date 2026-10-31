#!/usr/bin/env python3
"""Decrypt private workbook data using the GitHub Actions SSH key, without printing names."""
import os,base64,gzip,hashlib,json
from pathlib import Path
from cryptography.hazmat.primitives import serialization,hashes
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
payload=json.loads(Path('data/secure/timestamped_genealogy_v13.enc.json').read_text())
assert payload['format']=='shajara-curve25519-aesgcm-v1'
sha='14d797c281b4a180593d9d5fb5631112e7dd8aa9c30a311927abc66050a6d5ff'
assert payload['sha256_original_xlsx']==sha
ssh=serialization.load_ssh_private_key((Path.home()/'.ssh/id_ed25519').read_bytes(),password=None)
seed=ssh.private_bytes(serialization.Encoding.Raw,serialization.PrivateFormat.Raw,serialization.NoEncryption())
scalar=bytearray(hashlib.sha512(seed).digest()[:32])
scalar[0]&=248;scalar[31]&=127;scalar[31]|=64
private=x25519.X25519PrivateKey.from_private_bytes(bytes(scalar))
b64=lambda v:base64.b64decode(v,validate=True)
peer=x25519.X25519PublicKey.from_public_bytes(b64(payload['ephemeral']))
symmetric=HKDF(algorithm=hashes.SHA256(),length=32,salt=b64(payload['salt']),info=b'shajara-secure-v13').derive(private.exchange(peer))
clear=AESGCM(symmetric).decrypt(b64(payload['nonce']),b64(payload['ciphertext']),b64(payload['aad']))
book=json.loads(gzip.decompress(clear))
assert book['__source_sha256']==sha
assert book['__source_filename']=='الشجرة_مع_الجذع_المربوط(20261031-160557).xlsx'
output=Path(os.environ['RUNNER_TEMP'])/'shajara-v13.normalized.json'
output.write_text(json.dumps(book,ensure_ascii=False,separators=(',',':')))
output.chmod(0o600)
print('PRIVATE_EXCEL_VALIDATED')