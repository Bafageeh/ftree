#!/usr/bin/env python3
"""Decrypt user workbook corrections inside the authenticated Actions runner only."""
import os,base64,gzip,hashlib,json
from pathlib import Path
from cryptography.hazmat.primitives import serialization,hashes
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

payload=json.loads(Path('data/secure/shajara-v10-data.enc.json').read_text())
assert payload['format']=='shajara-curve25519-aesgcm-v1'
expected='13e85cacfcc1e0025533fd0f64c408788a515313e17defe0a2c1745af1d1c3a0'
assert payload['sha256_original_xlsx']==expected
ssh=serialization.load_ssh_private_key((Path.home()/'.ssh/id_ed25519').read_bytes(),password=None)
seed=ssh.private_bytes(serialization.Encoding.Raw,serialization.PrivateFormat.Raw,serialization.NoEncryption())
scalar=bytearray(hashlib.sha512(seed).digest()[:32])
scalar[0]&=248;scalar[31]&=127;scalar[31]|=64
mykey=x25519.X25519PrivateKey.from_private_bytes(bytes(scalar))
b64=lambda o:base64.b64decode(o,validate=True)
peer=x25519.X25519PublicKey.from_public_bytes(b64(payload['ephemeral']))
sym=HKDF(algorithm=hashes.SHA256(),length=32,salt=b64(payload['salt']),info=b'shajara-secure-v10').derive(mykey.exchange(peer))
clear=AESGCM(sym).decrypt(b64(payload['nonce']),b64(payload['ciphertext']),b64(payload['aad']))
book=json.loads(gzip.decompress(clear))
assert book['__source_sha256']==expected
assert book['__source_filename']=='الشجرة_مع_الجذع_المربوط(10).xlsx'
output=Path(os.environ['RUNNER_TEMP'])/'shajara-v10.normalized.json'
output.write_text(json.dumps(book,ensure_ascii=False,separators=(',',':')))
output.chmod(0o600)
print('PRIVATE_EXCEL_VALIDATED')