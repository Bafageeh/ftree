#!/usr/bin/env python3
"""Install the single-admin login on LIVE Expo58 Shajara, with complete rollback on type error."""
import os, shutil, subprocess, time
from pathlib import Path

root = Path(os.environ['APP_PATH']).resolve()
mobile = root / 'shajara-mobile'
private = root / 'shajara-api/storage/app/private'
stamp = time.strftime('%Y%m%d-%H%M%S')
backup = private / ('before-admin-mobile-' + stamp)
backup.mkdir(parents=True, mode=0o700)

paths = {
    'about': mobile/'app/(tabs)/about.tsx',
    'review': mobile/'app/(tabs)/review.tsx',
    'person': mobile/'app/person/[id].tsx',
    'profile': mobile/'src/components/PersonProfileCard.tsx',
    'personAdmin': mobile/'src/lib/personAdmin.ts',
    'supervisor': mobile/'src/lib/supervisor.ts',
    'auth': mobile/'src/lib/adminSession.ts',
    'login': mobile/'app/admin.tsx',
}
for key, file in paths.items():
    if key not in ('auth','login') and not file.is_file():
        raise RuntimeError('Missing mobile entry: '+str(file))
    if file.exists(): shutil.copy2(file, backup/(key+'.original'))

def replace(text, old, new, label):
    n = text.count(old)
    if n != 1: raise RuntimeError(label + ': expected exactly one match, found '+str(n))
    return text.replace(old,new,1)

try:
    for key,src in (('auth','/tmp/shajara-adminSession.ts'),('login','/tmp/shajara-admin-login.tsx')):
        from_path=Path(src)
        if not from_path.is_file(): raise RuntimeError('Missing authenticated app source '+src)
        paths[key].write_text(from_path.read_text())

    s=paths['about'].read_text()
    s=replace(s,"import { Ionicons } from '@expo/vector-icons';",
              "import { Ionicons } from '@expo/vector-icons';\nimport { router } from 'expo-router';",'about router import')
    s=replace(s,"import { ScrollView, StyleSheet, Text, View } from 'react-native';",
              "import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';",'about pressable')
    mark='        <Text style={styles.footer}>' if '        <Text style={styles.footer}>' in s else '      </ScrollView>'
    assert mark in s,'about screen structure changed'
    s=s.replace(mark,'''        <Pressable accessibilityRole="button" accessibilityLabel="الإدارة - تسجيل دخول مدير النظام"
          onPress={() => router.push('/admin')}
          style={{ backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 18, marginTop: 18 }}>
          <Ionicons name="lock-closed-outline" size={23} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.primary, fontSize: 17, fontWeight: '900', textAlign: 'right' }}>الإدارة</Text>
            <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12, textAlign: 'right' }}>تسجيل دخول المدير للاعتماد والتعديل</Text>
          </View>
          <Ionicons name="chevron-back" size={21} color={colors.primary} />
        </Pressable>
'''+mark,1)
    paths['about'].write_text(s)

    s=paths['personAdmin'].read_text()
    s=replace(s,"import { API_URL } from './api';",
              "import { API_URL } from './api';\nimport { adminHeaders } from './adminSession';",'personAdmin import')
    s=replace(s,"headers: { Accept: 'application/json', 'Content-Type': 'application/json' },",
              "headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...adminHeaders() },",'personAdmin auth header')
    s=replace(s,"headers: { Accept: 'application/json' },",
              "headers: { Accept: 'application/json', ...adminHeaders() },",'photo auth header')
    paths['personAdmin'].write_text(s)

    s=paths['supervisor'].read_text()
    s=replace(s,"import { API_URL } from './api';",
              "import { API_URL } from './api';\nimport { adminHeaders } from './adminSession';",'supervisor import')
    s=replace(s,"'Content-Type': 'application/json',",
              "'Content-Type': 'application/json',\n        ...adminHeaders(),",'supervisor auth header')
    paths['supervisor'].write_text(s)

    s=paths['profile'].read_text()
    s=replace(s,"import { updatePersonProfile, uploadPersonPhoto } from '../lib/personAdmin';",
              "import { updatePersonProfile, uploadPersonPhoto } from '../lib/personAdmin';\nimport { useAdminSession } from '../lib/adminSession';",'profile auth import')
    s=replace(s,"export function PersonProfileCard({ person, onUpdated }: Props) {",
              "export function PersonProfileCard({ person, onUpdated }: Props) {\n  const isAdmin = useAdminSession();",'profile hook')
    s=replace(s,"          <Pressable disabled={uploading} onPress={() => void choosePhoto()}",
              "          {isAdmin && <Pressable disabled={uploading} onPress={() => void choosePhoto()}",'photo button open')
    s=replace(s,"            <Text style={styles.photoButtonText}>{person.profile_photo_url ? 'تغيير الصورة' : 'رفع صورة شخصية'}</Text>\n          </Pressable>",
              "            <Text style={styles.photoButtonText}>{person.profile_photo_url ? 'تغيير الصورة' : 'رفع صورة شخصية'}</Text>\n          </Pressable>}",'photo button close')
    s=replace(s,"      {editing ? (","      {editing && isAdmin ? (",'profile edit gate')
    s=replace(s,"          <Pressable onPress={() => setEditing(true)} style={styles.editButton}>",
              "          {isAdmin && <Pressable onPress={() => setEditing(true)} style={styles.editButton}>",'profile edit button open')
    s=replace(s,"            <Text style={styles.editText}>تعديل الملف الشخصي</Text>\n          </Pressable>",
              "            <Text style={styles.editText}>تعديل الملف الشخصي</Text>\n          </Pressable>}",'profile edit button close')
    paths['profile'].write_text(s)

    s=paths['person'].read_text()
    s=replace(s,"import { PersonManagementCard } from '../../src/components/PersonManagementCard';",
              "import { PersonManagementCard } from '../../src/components/PersonManagementCard';\nimport { PersonProfileCard } from '../../src/components/PersonProfileCard';\nimport { useAdminSession } from '../../src/lib/adminSession';",'person auth import')
    s=replace(s,"  const { id } = useLocalSearchParams<{ id: string }>();",
              "  const { id } = useLocalSearchParams<{ id: string }>();\n  const isAdmin = useAdminSession();",'person hook')
    s=replace(s,"        <PersonManagementCard\n",
              "        {isAdmin ? (<PersonManagementCard\n",'person admin wrap start')
    s=replace(s,"          onReload={loadDetails}\n        />",
              "          onReload={loadDetails}\n        />) : (<PersonProfileCard person={person} onUpdated={() => {}} />)}",'person admin wrap end')
    s=replace(s,"        {pending && (","        {pending && isAdmin && (",'person decision gate')
    paths['person'].write_text(s)

    s=paths['review'].read_text()
    import re
    replacement, occurrences = re.subn(r'export default function\s+ReviewScreen\s*\(',
        'function ActualReviewScreen(', s, count=1)
    if occurrences != 1:
        raise RuntimeError('Review screen has no known default component to secure')
    s=replacement
    s="""import { router as adminRoute } from 'expo-router';
import { Pressable as AdminPressable, View as AdminView, Text as AdminText } from 'react-native';
import { useAdminSession } from '../../src/lib/adminSession';
""" + s
    s += """
export default function ReviewScreen() {
  const authenticated = useAdminSession();
  return authenticated ? <ActualReviewScreen /> : (
    <AdminView style={{ flex: 1, padding: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F8F3', gap: 18 }}>
      <AdminText style={{ fontSize: 21, fontWeight: '900', color: '#183F32', textAlign: 'center' }}>المراجعة والاعتماد للمدير فقط</AdminText>
      <AdminText style={{ textAlign: 'center', color: '#637568', lineHeight: 24 }}>
        يُسمح للجميع بمشاهدة الشجرة وإرسال مقترحات التصحيح. اعتماد البيانات أو تعديلها يتطلب دخول الإدارة.
      </AdminText>
      <AdminPressable accessibilityRole="button" onPress={() => adminRoute.push('/admin')}
        style={{ borderRadius: 14, backgroundColor: '#183F32', paddingHorizontal: 25, paddingVertical: 16 }}>
        <AdminText style={{ color: 'white', fontWeight: '900' }}>دخول الإدارة</AdminText>
      </AdminPressable>
    </AdminView>
  );
}
"""
    paths['review'].write_text(s)

    tsc=mobile/'node_modules/typescript/bin/tsc'
    if not tsc.exists(): raise RuntimeError('Missing live Expo58 TypeScript installation')
    result=subprocess.run(['node',str(tsc),'--noEmit','--pretty','false'],cwd=mobile,
                          stdout=subprocess.PIPE,stderr=subprocess.STDOUT,universal_newlines=True,timeout=180)
    if result.returncode:
        raise RuntimeError('Admin mobile TypeScript failed: '+result.stdout[-3600:])
except Exception:
    for key,file in paths.items():
        prior=backup/(key+'.original')
        if prior.exists():shutil.copy2(prior,file)
        elif key in ('auth','login') and file.exists():file.unlink()
    raise
print('SHAJARA_ADMIN_MOBILE_TYPESCRIPT_OK',str(backup),flush=True)
