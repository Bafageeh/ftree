#!/usr/bin/env python3
"""Decrypt private Shajara workbook payload without printing it."""
import os,base64,gzip,hashlib,json
from pathlib import Path
from cryptography.hazmat.primitives import serialization,hashes
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

d=json.loads(Path('data/secure/shajara-v8-data.enc.json').read_text())
assert d['format']=='shajara-curve25519-aesgcm-v1'
sha='9c98d259cf409c844acb2a351110d28e8a0a64b2a4ce21b3aae8fcd8b5f92deb'
assert d['sha256_original_xlsx']==sha
identity=serialization.load_ssh_private_key((Path.home()/'.ssh/id_ed25519').read_bytes(),password=None)
seed=identity.private_bytes(serialization.Encoding.Raw,serialization.PrivateFormat.Raw,serialization.NoEncryption())
scalar=bytearray(hashlib.sha512(seed).digest()[:32])
scalar[0]&=248;scalar[31]&=127;scalar[31]|=64
secret=x25519.X25519PrivateKey.from_private_bytes(bytes(scalar))
decode=lambda t:base64.b64decode(t,validate=True)
counterpart=x25519.X25519PublicKey.from_public_bytes(decode(d['ephemeral']))
symmetric=HKDF(algorithm=hashes.SHA256(),length=32,salt=decode(d['salt']),info=b'shajara-secure-v8').derive(secret.exchange(counterpart))
compressed=AESGCM(symmetric).decrypt(decode(d['nonce']),decode(d['ciphertext']),decode(d['aad']))
book=json.loads(gzip.decompress(compressed))
assert book['__source_sha256']==sha
out=Path(os.environ['RUNNER_TEMP'])/'shajara-v8.normalized.json'
out.write_text(json.dumps(book,ensure_ascii=False,separators=(',',':')))
out.chmod(0o600)
print('PRIVATE_PAYLOAD_VALIDATED')
