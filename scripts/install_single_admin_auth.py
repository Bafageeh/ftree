#!/usr/bin/env python3
"""Private production installer: server-authorized singleton Shajara admin, Expo 58 interface."""
from pathlib import Path
import os, subprocess, shutil, pwd, time, json, re

BASE = Path(os.environ.get('APP_PATH', '/mnt/home-storage/home/pmsa/apps/shajara')).resolve()
API = BASE/'shajara-api'
APP = BASE/'shajara-mobile'
OWNER = pwd.getpwnam('pmsa')
STAMP = time.strftime('%Y%m%d-%H%M%S')
BACKUP = API/'storage/app/private'/('before-single-admin-'+STAMP)
BACKUP.mkdir(parents=True, mode=0o700)
HASH = '$2y$12$HfshKw2GBXeORRpTFRaxP.xOaBu1ucxPBnuiei8Q.0XR51QFFpWz.'
assert HASH.startswith('$2y$12$') and len(HASH)==60
edited = []
created = []

def write_file(path, value):
    path = Path(path)
    if path.exists():
        bak = BACKUP/(('mobile' if str(path).startswith(str(APP)+'/') else 'api')+'-'+path.name)
        shutil.copy2(path,bak)
        edited.append((path,bak))
    else:
        created.append(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value)
    os.chown(path,OWNER.pw_uid, OWNER.pw_gid)
    os.chmod(path,0o644)

def change(path, old, new, label):
    src=Path(path).read_text()
    n=src.count(old)
    if n!=1:
        if new in src: return
        raise RuntimeError('Unexpected source at '+label+' ('+str(n)+')')
    write_file(path,src.replace(old,new,1))

def run(command,cwd,timeout=150,user=True):
    cmd=['su','-s','/bin/bash','pmsa','-c','cd '+str(cwd)+' && '+command] if user else ['/bin/bash','-lc','cd '+str(cwd)+' && '+command]
    p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,universal_newlines=True,timeout=timeout)
    if p.returncode!=0:raise RuntimeError('FAILED '+command+' '+p.stdout[-2000:])
    print('COMMAND_OK',command,flush=True)
    return p.stdout

# Auth store is distinct from public genealogy data, preserving all 517 names.
migration = '''<?php
use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;
use Illuminate\\Support\\Facades\\DB;
return new class extends Migration {
    public function up(): void {
        Schema::create('shajara_admin_credentials', function (Blueprint $table) {
            $table->id();
            $table->string('username', 60)->unique();
            $table->string('password_hash');
            $table->timestamps();
        });
        Schema::create('shajara_admin_sessions', function (Blueprint $table) {
            $table->id();
            $table->char('token_hash', 64)->unique();
            $table->timestamp('expires_at')->index();
            $table->timestamps();
        });
        // Single pre-provisioned admin only. No public registration endpoint.
        DB::table('shajara_admin_credentials')->insert([
            'username' => 'admin',
            'password_hash' => '__BCRYPT__',
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }
    public function down(): void {
        Schema::dropIfExists('shajara_admin_sessions');
        Schema::dropIfExists('shajara_admin_credentials');
    }
};
'''.replace('__BCRYPT__',HASH)
authController = '''<?php
namespace App\\Http\\Controllers\\Api;
use App\\Http\\Controllers\\Controller;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Facades\\Hash;
use Illuminate\\Support\\Str;
use Illuminate\\Validation\\ValidationException;
final class ShajaraAdminAuthController extends Controller {
    public function login(Request $request): JsonResponse {
        $input = $request->validate(['username'=>['required','string','max:60'],'password'=>['required','string','max:128']]);
        $account = DB::table('shajara_admin_credentials')->where('username','admin')->first();
        if (! $account || ! hash_equals('admin',$input['username']) || ! Hash::check($input['password'],$account->password_hash)) {
            throw ValidationException::withMessages(['password'=>['اسم المستخدم أو كلمة المرور غير صحيحة.']]);
        }
        // High-entropy opaque session; only its SHA-256 digest is stored.
        $plain = Str::random(96);
        $expires = now()->addHours(8);
        DB::table('shajara_admin_sessions')->insert([
            'token_hash'=>hash('sha256',$plain), 'expires_at'=>$expires,
            'created_at'=>now(), 'updated_at'=>now(),
        ]);
        DB::table('shajara_admin_sessions')->where('expires_at','<',now())->delete();
        return response()->json(['token'=>$plain,'role'=>'admin','expires_in'=>28800])->header('Cache-Control','no-store');
    }
    public function me(Request $request): JsonResponse {
        return response()->json(['authenticated'=>true,'username'=>'admin','role'=>'admin'])->header('Cache-Control','no-store');
    }
    public function logout(Request $request): JsonResponse {
        $token=$request->bearerToken();
        if ($token) DB::table('shajara_admin_sessions')->where('token_hash',hash('sha256',$token))->delete();
        return response()->json(['authenticated'=>false])->header('Cache-Control','no-store');
    }
}
'''
authMiddleware = '''<?php
namespace App\\Http\\Middleware;
use Closure;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;
use Symfony\\Component\\HttpFoundation\\Response;
final class RequireShajaraAdmin {
    public function handle(Request $request, Closure $next): Response {
        $token=$request->bearerToken();
        if (! $token || strlen($token)!==96 || ! DB::table('shajara_admin_sessions')
            ->where('token_hash',hash('sha256',$token))
            ->where('expires_at','>',now())->exists()) {
            return response()->json(['message'=>'يلزم تسجيل دخول المدير لإجراء هذا التعديل.'],401)->header('Cache-Control','no-store');
        }
        return $next($request);
    }
}
'''
adminSession = '''import { useSyncExternalStore } from 'react';
import { API_URL } from './api';
let authToken: string | null = null;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => authToken != null;
const notify = () => { listeners.forEach(listener => listener()); };
export const useAdminSession = () => useSyncExternalStore(subscribe, snapshot, () => false);
export const getAdminToken = () => authToken;
export function adminHeaders(): Record<string,string> {
  if (!authToken) throw new Error('يرجى تسجيل الدخول من «حول التطبيق ← الإدارة» أولًا.');
  return { Authorization: `Bearer ${authToken}` };
}
export async function loginAdmin(password: string): Promise<void> {
  const response = await fetch(`${API_URL}/admin/login`, {
    method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password }),
  });
  const data = await response.json().catch(() => null) as { token?: string; message?: string; errors?: Record<string,string[]> } | null;
  if (!response.ok || !data?.token) {
    throw new Error(data?.errors ? Object.values(data.errors).flat()[0] : data?.message || 'تعذر تسجيل الدخول للإدارة.');
  }
  authToken=data.token;
  notify();
}
export async function logoutAdmin(): Promise<void> {
  const old=authToken;
  authToken=null;
  notify();
  if (old) await fetch(`${API_URL}/admin/logout`,{method:'POST',headers:{Accept:'application/json',Authorization:`Bearer ${old}`}}).catch(()=>{});
}
'''
adminScreen = '''import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginAdmin, logoutAdmin, useAdminSession } from '../src/lib/adminSession';
import { colors, radius } from '../src/theme';
export default function AdminScreen() {
  const isAdmin = useAdminSession();
  const [password,setPassword]=useState('');
  const [show,setShow]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const signIn = async () => {
    if (busy || !password) return;
    setBusy(true); setError('');
    try { await loginAdmin(password); setPassword(''); }
    catch(e) { setError(e instanceof Error ? e.message : 'تعذر تسجيل الدخول.'); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.safe} edges={['top','bottom']}>
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={()=>router.back()} style={styles.back}><Ionicons name="arrow-forward" color={colors.primary} size={21}/><Text style={styles.backText}>حول التطبيق</Text></Pressable>
        <View style={styles.hero}><Ionicons name="shield-checkmark-outline" size={54} color="#D7C28E"/><Text style={styles.title}>إدارة شجرة النسب</Text><Text style={styles.subtitle}>صلاحيات الاعتماد والتعديل والحذف مخصصة للمدير فقط. ويمكن للجميع مشاهدة الشجرة وإرسال المقترحات.</Text></View>
        {isAdmin ? <View style={styles.card}>
          <Ionicons name="checkmark-circle" color="#317652" size={32}/>
          <Text style={styles.cardTitle}>تم تسجيل الدخول بصفة المدير</Text>
          <Text style={styles.info}>يمكنك الآن اعتماد الأسماء والعلاقات وتعديل البيانات من شاشة المراجعة أو ملف الشخص.</Text>
          <Pressable onPress={()=>router.push('/(tabs)/review')} style={styles.button}><Text style={styles.buttonText}>فتح شاشة المراجعة والاعتماد</Text></Pressable>
          <Pressable onPress={()=>{void logoutAdmin();}} style={styles.outline}><Ionicons name="log-out-outline" color={colors.primary} size={19}/><Text style={styles.outlineText}>تسجيل الخروج</Text></Pressable>
        </View> : <View style={styles.card}>
          <Text style={styles.label}>اسم المستخدم</Text><View style={styles.readonly}><Text style={styles.user}>admin</Text></View>
          <Text style={styles.label}>كلمة مرور الإدارة</Text>
          <View style={styles.passwordRow}><Pressable accessibilityLabel={show?'إخفاء كلمة المرور':'إظهار كلمة المرور'} onPress={()=>setShow(v=>!v)}><Ionicons name={show?'eye-off-outline':'eye-outline'} size={21} color={colors.muted}/></Pressable><TextInput value={password} onChangeText={setPassword} placeholder="كلمة المرور" secureTextEntry={!show} autoCapitalize="none" autoCorrect={false} textAlign="right" onSubmitEditing={()=>void signIn()} style={styles.input}/></View>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable disabled={busy || !password} onPress={()=>void signIn()} style={[styles.button,(busy || !password) && {opacity:.5}]}>{busy?<ActivityIndicator color="white"/>:<Text style={styles.buttonText}>دخول الإدارة</Text>}</Pressable>
          <Text style={styles.info}>لحماية النسب، لا يمكن تغيير أي سجل أو اعتماده دون تسجيل دخول معتمد من الخادم.</Text>
        </View>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.background},content:{padding:22,paddingBottom:90},
  back:{flexDirection:'row-reverse',alignItems:'center',gap:8,marginBottom:23},backText:{color:colors.primary,fontWeight:'700',fontSize:15},
  hero:{borderRadius:24,backgroundColor:colors.primary,padding:26,alignItems:'center',gap:13},title:{fontSize:25,fontWeight:'900',color:'#FFFFFF'},subtitle:{fontSize:13,color:'#DDE9E2',lineHeight:23,textAlign:'center'},
  card:{backgroundColor:colors.white,marginTop:20,borderRadius:radius.lg,padding:20,borderColor:colors.line,borderWidth:1,alignItems:'stretch',gap:12},
  cardTitle:{fontWeight:'800',color:colors.primary,fontSize:18,textAlign:'center'},label:{fontSize:13,fontWeight:'800',color:colors.primary,textAlign:'right'},
  readonly:{borderWidth:1,borderColor:colors.line,borderRadius:12,padding:13,backgroundColor:colors.background},user:{fontSize:18,color:colors.text,textAlign:'right'},
  passwordRow:{borderWidth:1,borderColor:colors.line,backgroundColor:colors.background,borderRadius:12,minHeight:55,paddingHorizontal:13,flexDirection:'row',alignItems:'center'},input:{flex:1,padding:10,fontSize:17,color:colors.text},
  button:{minHeight:52,borderRadius:14,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center',marginTop:8},buttonText:{color:'white',fontWeight:'900',fontSize:15},
  outline:{minHeight:52,borderRadius:14,borderColor:colors.primary,borderWidth:1,flexDirection:'row',alignItems:'center',gap:10,justifyContent:'center'},outlineText:{color:colors.primary,fontWeight:'800'},
  info:{color:colors.muted,textAlign:'right',fontSize:12,lineHeight:22},error:{color:colors.danger,textAlign:'right',fontSize:13,lineHeight:22}
});
'''

try:
    # 1. Deploy mandatory authorization *first*. Fail closed when tables missing.
    write_file(API/'database/migrations/2026_10_31_224500_create_shajara_admin_sessions.php',migration)
    write_file(API/'app/Http/Controllers/Api/ShajaraAdminAuthController.php',authController)
    write_file(API/'app/Http/Middleware/RequireShajaraAdmin.php',authMiddleware)
    bootstrap=API/'bootstrap/app.php'
    src=bootstrap.read_text()
    if "'shajara.admin'" not in src:
        change(bootstrap,'        //\n    })',"        $middleware->alias(['shajara.admin' => \\App\\Http\\Middleware\\RequireShajaraAdmin::class]);\n    })",'bootstrap middleware alias')
    routes=API/'routes/api.php'
    src=routes.read_text()
    if "'/admin/login'" not in src:
        change(routes,"Route::prefix('v1')->group(function () {", "Route::prefix('v1')->group(function () {\n    Route::post('/admin/login', [\\App\\Http\\Controllers\\Api\\ShajaraAdminAuthController::class, 'login'])->middleware('throttle:5,1');\n    Route::get('/admin/me', [\\App\\Http\\Controllers\\Api\\ShajaraAdminAuthController::class, 'me'])->middleware('shajara.admin');\n    Route::post('/admin/logout', [\\App\\Http\\Controllers\\Api\\ShajaraAdminAuthController::class, 'logout'])->middleware('shajara.admin');",'login routes')
    # Endpoint protections do not change public reading/listing and public review requests.
    for route in ('/people/{person}', '/people/{person}/profile', '/people/{person}/photo','/people/{person}/children','/people/{person}/review','/chart-edges/{chartEdge}/review'):
        src=routes.read_text()
        old_lines=[line for line in src.splitlines() if "'"+route+"'" in line and any(method in line for method in ('Route::patch(', 'Route::post(', 'Route::delete('))]
        assert len(old_lines)==1,(route,old_lines)
        original=old_lines[0]
        if "'shajara.admin'" not in original:
            replaced=re.sub(r"->middleware\('throttle:([^']+)'\)",r"->middleware(['shajara.admin', 'throttle:\1'])",original)
            assert replaced!=original,original
            change(routes,original,replaced,'protect '+route)
    # Route DELETE /people shares same pattern but endpoint substring; ensure all mutations have middleware.
    src=routes.read_text()
    for line in src.splitlines():
        if any(k in line for k in ('Route::patch(', 'Route::delete(', "Route::post('/people/", "Route::post('/chart-edges/")):
            assert 'shajara.admin' in line,'Unprotected API write '+line
    for path in (bootstrap,routes,API/'app/Http/Controllers/Api/ShajaraAdminAuthController.php',API/'app/Http/Middleware/RequireShajaraAdmin.php',API/'database/migrations/2026_10_31_224500_create_shajara_admin_sessions.php'):
        run('php -l '+str(path),API)
    run('php artisan optimize:clear',API)
    run('php artisan migrate --force',API,timeout=150)
    run('php artisan route:list --path=api/v1/admin',API)
    print('API_AUTHORIZATION_ENFORCED',flush=True)

    # 2. Expo login; no passwords or bearer tokens embedded in app or repo.
    write_file(APP/'src/lib/adminSession.ts',adminSession)
    write_file(APP/'app/admin.tsx',adminScreen)
    about=APP/'app/(tabs)/about.tsx'
    change(about, "import { Ionicons } from '@expo/vector-icons';", "import { Ionicons } from '@expo/vector-icons';\nimport { router } from 'expo-router';\nimport { Pressable } from 'react-native';\nimport { useAdminSession } from '../../src/lib/adminSession';",'about imports')
    change(about, 'export default function AboutScreen() {','export default function AboutScreen() {\n  const isAdmin = useAdminSession();','about status')
    change(about, '        <Text style={styles.footer}>', '''        <Pressable accessibilityRole="button" accessibilityLabel="الإدارة وتسجيل دخول المدير" onPress={() => router.push('/admin')} style={{backgroundColor:colors.white,borderWidth:1,borderColor:colors.line,borderRadius:16,padding:18,marginTop:18,flexDirection:'row-reverse',alignItems:'center',gap:13}}>
          <Ionicons name="lock-closed-outline" size={27} color={colors.primary}/>
          <View style={{flex:1}}><Text style={{fontSize:18,color:colors.primary,fontWeight:'900',textAlign:'right'}}>الإدارة</Text><Text style={{fontSize:12,color:colors.muted,textAlign:'right',marginTop:4}}>{isAdmin ? 'تم تسجيل الدخول — الاعتماد والتعديل' : 'دخول المدير للاعتماد والتعديل فقط'}</Text></View>
          <Ionicons name="chevron-back" size={21} color={colors.muted}/>
        </Pressable>
        <Text style={styles.footer}>''','about admin entry')
    adminlib=APP/'src/lib/personAdmin.ts'
    change(adminlib,"import { API_URL } from './api';", "import { API_URL } from './api';\nimport { adminHeaders } from './adminSession';",'admin fetch imports')
    change(adminlib,"headers: { Accept: 'application/json', 'Content-Type': 'application/json' },", "headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...adminHeaders() },",'admin json requests')
    change(adminlib,"headers: { Accept: 'application/json' },", "headers: { Accept: 'application/json', ...adminHeaders() },",'admin photo upload')
    supervisor=APP/'src/lib/supervisor.ts'
    change(supervisor,"import { API_URL } from './api';", "import { API_URL } from './api';\nimport { adminHeaders } from './adminSession';",'supervisor imports')
    change(supervisor,"        'Content-Type': 'application/json',", "        'Content-Type': 'application/json',\n        ...adminHeaders(),",'review authorization')

    profile=APP/'src/components/PersonProfileCard.tsx'
    change(profile,'  onUpdated: (person: Person) => void;','  onUpdated: (person: Person) => void;\n  canEdit?: boolean;','read-only profile prop')
    change(profile,'export function PersonProfileCard({ person, onUpdated }: Props) {','export function PersonProfileCard({ person, onUpdated, canEdit = true }: Props) {','profile role')
    change(profile,'<Pressable disabled={uploading} onPress={() => void choosePhoto()} style={styles.photoButton}>','{canEdit && <Pressable disabled={uploading} onPress={() => void choosePhoto()} style={styles.photoButton}>','profile upload guard open')
    change(profile,'</Text>\n          </Pressable>\n        </View>\n      </View>','</Text>\n          </Pressable>}\n        </View>\n      </View>','profile upload guard close')
    change(profile,'{editing ? (','{canEdit && editing ? (','profile editing check')
    change(profile,'<Pressable onPress={() => setEditing(true)} style={styles.editButton}>','{canEdit && <Pressable onPress={() => setEditing(true)} style={styles.editButton}>','profile edit guard open')
    change(profile,'<Text style={styles.editText}>تعديل الملف الشخصي</Text>\n          </Pressable>','<Text style={styles.editText}>تعديل الملف الشخصي</Text>\n          </Pressable>}','profile edit guard close')

    person=APP/'app/person/[id].tsx'
    change(person,"import { PersonManagementCard } from '../../src/components/PersonManagementCard';","import { PersonManagementCard } from '../../src/components/PersonManagementCard';\nimport { PersonProfileCard } from '../../src/components/PersonProfileCard';\nimport { useAdminSession } from '../../src/lib/adminSession';",'person auth imports')
    change(person,"  const { id } = useLocalSearchParams<{ id: string }>();", "  const { id } = useLocalSearchParams<{ id: string }>();\n  const isAdmin = useAdminSession();",'person admin hook')
    change(person,'        <PersonManagementCard','        {isAdmin ? <PersonManagementCard','person admin card begin')
    change(person,'          onReload={loadDetails}\n        />','          onReload={loadDetails}\n        /> : <PersonProfileCard person={person} onUpdated={() => {}} canEdit={false} />}','person admin card end')
    change(person,'        {pending && (','        {isAdmin && pending && (','person review guard')

    review=APP/'app/(tabs)/review.tsx'
    change(review,"import { StyleSheet, Text, View } from 'react-native';", "import { Pressable, StyleSheet, Text, View } from 'react-native';\nimport { router } from 'expo-router';\nimport { useAdminSession } from '../../src/lib/adminSession';",'review imports')
    change(review,'export default function ReviewScreen() {','export default function ReviewScreen() {\n  const isAdmin = useAdminSession();','review admin hook')
    change(review,'      <View style={styles.board}><SupervisorReviewBoard /></View>','''      <View style={styles.board}>{isAdmin ? <SupervisorReviewBoard /> :
        <View style={{padding:24,alignItems:'center',gap:16}}>
          <Text style={{textAlign:'center',fontSize:15,color:colors.primary,fontWeight:'900'}}>المراجعة والاعتماد للمدير فقط</Text>
          <Text style={{textAlign:'center',fontSize:12,color:colors.muted,lineHeight:22}}>يمكنك مشاهدة الشجرة وتقديم التصحيحات من تبويب المساهمة. للاعتماد أو التعديل استخدم دخول الإدارة.</Text>
          <Pressable onPress={()=>router.push('/admin')} style={{backgroundColor:colors.primary,borderRadius:14,padding:16}}><Text style={{color:'white',fontWeight:'800'}}>الانتقال إلى دخول الإدارة</Text></Pressable>
        </View>}
      </View>''','review gate')

    # Bump release; don't overwrite whatever version was actually deployed.
    appjson=APP/'app.json'
    cfg=json.loads(appjson.read_text())
    assert cfg['expo']['android']['package']=='sa.pm.shajara'
    old_version=int(cfg['expo']['android']['versionCode'])
    cfg['expo']['android']['versionCode']=old_version+1
    cfg['expo']['version']='1.2.0'
    write_file(appjson,json.dumps(cfg,ensure_ascii=False,indent=2)+'\n')
    print('ADMIN_MOBILE_VERSION',cfg['expo']['version'],cfg['expo']['android']['versionCode'],flush=True)
    run('node node_modules/typescript/bin/tsc --noEmit --pretty false',APP,timeout=180)
    print('ADMIN_LOGIN_UI_TYPESCRIPT_PASSED',flush=True)
except Exception:
    # Roll back source files. Database migration remains in place to protect
    # existing API if mobile build fails; never expose old unprotected endpoints.
    for p,bak in reversed(edited):
        if str(p).startswith(str(API)+'/') and p in (API/'routes/api.php',API/'bootstrap/app.php'):
            continue
        shutil.copy2(bak,p)
        os.chown(p,OWNER.pw_uid,OWNER.pw_gid)
    for p in created:
        if str(p).startswith(str(API)+'/'):continue
        try:p.unlink()
        except OSError:pass
    raise

print('SHAJARA_ADMIN_AUTH_INSTALLED',str(BACKUP),flush=True)