<?php
// Run only on the authorized production server after the schema migration.
// Pass a bcrypt password HASH through a short-lived deployment environment variable.
require getcwd().'/vendor/autoload.php';
$app = require getcwd().'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$hash = (string) getenv('SHAJARA_ADMIN_BCRYPT_HASH');
if (! preg_match('/^\$2y\$12\$[.\/A-Za-z0-9]{53}$/D', $hash)) {
    fwrite(STDERR, "Missing or malformed protected admin hash.\n");
    exit(1);
}

$existing = \Illuminate\Support\Facades\DB::table('shajara_admin_accounts')
    ->where('username', 'admin')
    ->first();

if (! $existing) {
    \Illuminate\Support\Facades\DB::table('shajara_admin_accounts')->insert([
        'username' => 'admin',
        'password_hash' => $hash,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo "SHAJARA_ADMIN_CREATED\n";
} else {
    echo "SHAJARA_ADMIN_ALREADY_EXISTS_NO_PASSWORD_RESET\n";
}
