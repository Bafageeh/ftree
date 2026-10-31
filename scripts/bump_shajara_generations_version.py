#!/usr/bin/env python3
"""Bump Expo SDK 58 Shajara Android version after generation control fix."""
import json,os,pathlib
app=pathlib.Path(os.environ['APP_PATH'])/'shajara-mobile/app.json'
data=json.loads(app.read_text())
expo=data['expo']
assert str(expo['android']['package'])=='sa.pm.shajara'
current=int(expo['android']['versionCode'])
assert current in (10,11),current
assert expo['version'] in ('1.1.0','1.1.1'),expo['version']
if current==10:
    expo['android']['versionCode']=11
    expo['version']='1.1.1'
    app.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
assert expo['android']['versionCode']==11 and expo['version']=='1.1.1'
print('SHAJARA_GENERATIONS_VERSION 1.1.1 (11)')
