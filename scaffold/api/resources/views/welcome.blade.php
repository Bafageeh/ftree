<!doctype html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>شجرة النسب الشريف</title>
    <style>
        :root{color-scheme:light;--green:#173d2d;--gold:#c79842;--paper:#f6f2e8;--card:#fffdf8}
        *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at top right,#fff 0,var(--paper) 55%,#eee7d8 100%);font-family:Tahoma,Arial,sans-serif;color:var(--green)}
        main{width:min(900px,92vw);padding:44px;border:1px solid rgba(23,61,45,.13);border-radius:30px;background:rgba(255,253,248,.94);box-shadow:0 30px 90px rgba(23,61,45,.12)}
        .mark{display:grid;place-items:center;width:68px;height:68px;border-radius:24px;background:var(--green);color:white;font-size:30px;font-weight:800}.eyebrow{color:var(--gold);font-weight:800}.grid{display:grid;grid-template-columns:1.35fr .65fr;gap:28px;align-items:end}h1{font-size:clamp(38px,7vw,78px);line-height:1.08;margin:12px 0}p{color:#647269;line-height:2}.links{display:grid;gap:12px}.links a{display:block;padding:16px 18px;border-radius:16px;text-decoration:none;background:#e3eee7;color:var(--green);font-weight:800}.links a.primary{background:var(--green);color:white}.meta{margin-top:26px;padding-top:20px;border-top:1px solid #e4e0d6;font-size:14px;color:#758078}@media(max-width:720px){main{padding:26px}.grid{grid-template-columns:1fr}h1{font-size:46px}}
    </style>
</head>
<body>
<main>
    <div class="mark">ش</div>
    <div class="grid">
        <section>
            <p class="eyebrow">منصة رقمية موثّقة للنسب والتاريخ العائلي</p>
            <h1>شجرة النسب الشريف</h1>
            <p>تم تجهيز واجهة Laravel API لتغذية تطبيق الجوال، مع البحث في الأسماء وعرض مسار النسب وحالات التوثيق والمراجعة.</p>
        </section>
        <nav class="links">
            <a class="primary" href="/api/v1/health">فحص حالة API</a>
            <a href="/api/v1/people">عرض الأسماء</a>
            <a href="/api/v1/stats">عرض الإحصاءات</a>
        </nav>
    </div>
    <div class="meta">Laravel API · React Native / Expo · العربية RTL</div>
</main>
</body>
</html>
