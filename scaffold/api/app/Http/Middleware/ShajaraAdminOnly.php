<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ShajaraAdminOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! is_string($token) || ! preg_match('/^[a-f0-9]{64}$/D', $token)) {
            return response()->json(['message' => 'تسجيل دخول الإدارة مطلوب.'], 401);
        }

        $session = DB::table('shajara_admin_tokens')
            ->join('shajara_admin_accounts', 'shajara_admin_accounts.id', '=', 'shajara_admin_tokens.admin_id')
            ->where('shajara_admin_tokens.token_hash', hash('sha256', $token))
            ->where('shajara_admin_accounts.username', 'admin')
            ->where('shajara_admin_tokens.expires_at', '>', now())
            ->select('shajara_admin_accounts.id as admin_id', 'shajara_admin_tokens.id as token_id')
            ->first();

        if (! $session) {
            return response()->json(['message' => 'انتهت جلسة الإدارة؛ سجّل الدخول مجددًا.'], 401);
        }

        $request->attributes->set('shajara_admin_id', (int) $session->admin_id);

        return $next($request);
    }
}
