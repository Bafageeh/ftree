<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ShajaraAdminAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:80'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        $admin = DB::table('shajara_admin_accounts')
            ->where('username', 'admin')
            ->first();

        if (! hash_equals('admin', (string) $data['username'])
            || ! $admin
            || ! Hash::check($data['password'], $admin->password_hash)) {
            // Uniform error response: no account existence information.
            throw ValidationException::withMessages(['username' => 'اسم المستخدم أو كلمة المرور غير صحيحة.']);
        }

        $token = bin2hex(random_bytes(32));
        $now = now();
        $expires = $now->copy()->addHours(12);

        DB::transaction(function () use ($admin, $token, $now, $expires): void {
            DB::table('shajara_admin_tokens')
                ->where('expires_at', '<', $now)
                ->delete();
            DB::table('shajara_admin_tokens')->insert([
                'admin_id' => $admin->id,
                'token_hash' => hash('sha256', $token),
                'expires_at' => $expires,
                'last_used_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        });

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'expires_at' => $expires->toIso8601String(),
            'username' => 'admin',
            'role' => 'admin',
        ])->header('Cache-Control', 'no-store');
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['username' => 'admin', 'role' => 'admin'])
            ->header('Cache-Control', 'no-store');
    }

    public function logout(Request $request): JsonResponse
    {
        DB::table('shajara_admin_tokens')
            ->where('admin_id', $request->attributes->get('shajara_admin_id'))
            ->where('token_hash', hash('sha256', (string) $request->bearerToken()))
            ->delete();

        return response()->json(['message' => 'تم تسجيل الخروج.']);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:12', 'max:255', 'different:current_password'],
        ]);

        $id = (int) $request->attributes->get('shajara_admin_id');
        $admin = DB::table('shajara_admin_accounts')->where('id', $id)->first();
        if (! $admin || ! Hash::check($data['current_password'], $admin->password_hash)) {
            throw ValidationException::withMessages(['current_password' => 'كلمة المرور الحالية غير صحيحة.']);
        }

        DB::transaction(function () use ($id, $data): void {
            DB::table('shajara_admin_accounts')->where('id', $id)->update([
                'password_hash' => Hash::make($data['new_password']),
                'updated_at' => now(),
            ]);
            // Require reauthentication on every previously issued device.
            DB::table('shajara_admin_tokens')->where('admin_id', $id)->delete();
        });

        return response()->json(['message' => 'تم تغيير كلمة المرور؛ سجّل الدخول مجددًا.']);
    }
}
