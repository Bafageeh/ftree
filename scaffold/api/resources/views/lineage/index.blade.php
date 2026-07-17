<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>شجرة النسب المتصلة بالنبي ﷺ</title>
    <style>
        :root {
            color-scheme: light;
            --bg: #f6f1e7;
            --surface: #ffffff;
            --primary: #173f3a;
            --primary-soft: #e7f0ed;
            --gold: #b7893d;
            --gold-soft: #f8efd9;
            --text: #2b2b2b;
            --muted: #6f746f;
            --success: #24734e;
            --success-soft: #e6f4ec;
            --warning: #956515;
            --warning-soft: #fff4d7;
            --line: #ded5c4;
            --shadow: 0 12px 30px rgba(38, 45, 41, .08);
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            background: linear-gradient(180deg, #f3eddf 0, var(--bg) 260px);
            color: var(--text);
            font-family: Tahoma, Arial, sans-serif;
        }
        a { color: inherit; text-decoration: none; }
        .page { width: min(1180px, calc(100% - 28px)); margin: 0 auto; padding: 24px 0 60px; }
        .hero {
            background: radial-gradient(circle at top left, rgba(183,137,61,.18), transparent 38%), var(--primary);
            border-radius: 28px;
            color: white;
            padding: 28px;
            box-shadow: var(--shadow);
        }
        .hero h1 { margin: 0; font-size: clamp(25px, 5vw, 42px); }
        .hero p { margin: 10px 0 0; line-height: 1.9; color: #dce9e5; max-width: 900px; }
        .policy {
            margin-top: 16px;
            padding: 14px 16px;
            border: 1px solid rgba(255,255,255,.2);
            border-radius: 16px;
            background: rgba(255,255,255,.08);
            line-height: 1.8;
        }
        .stats { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; margin: 18px 0; }
        .stat { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 17px; box-shadow: var(--shadow); }
        .stat strong { display: block; font-size: 27px; color: var(--primary); }
        .stat span { color: var(--muted); font-size: 13px; }
        .filters { background: var(--surface); border: 1px solid var(--line); border-radius: 20px; padding: 16px; box-shadow: var(--shadow); }
        .filter-grid { display: grid; grid-template-columns: 1fr 230px auto; gap: 10px; }
        input, select, button {
            min-height: 48px;
            border-radius: 13px;
            border: 1px solid var(--line);
            font: inherit;
        }
        input, select { width: 100%; background: white; padding: 0 13px; color: var(--text); }
        button { border: 0; background: var(--primary); color: white; padding: 0 22px; font-weight: 800; cursor: pointer; }
        .section-title { color: var(--primary); font-size: 22px; margin: 28px 0 13px; }
        .selected-panel { background: var(--surface); border: 1px solid var(--line); border-radius: 24px; padding: 22px; box-shadow: var(--shadow); }
        .selected-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
        .selected-head h2 { margin: 0; color: var(--primary); font-size: 28px; }
        .meta { color: var(--muted); font-size: 12px; line-height: 1.8; margin-top: 6px; }
        .badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 8px 12px; font-size: 12px; font-weight: 900; }
        .badge.confirmed { background: var(--success-soft); color: var(--success); }
        .badge.pending { background: var(--warning-soft); color: var(--warning); }
        .chain { margin-top: 22px; display: flex; flex-direction: column; align-items: stretch; }
        .node { width: min(620px,100%); margin: 0 auto; background: white; border: 1px solid var(--line); border-radius: 18px; padding: 15px 17px; text-align: center; }
        .node.prophet { background: var(--primary); border-color: var(--primary); color: white; }
        .node.pending { border-color: #e2c477; background: #fffaf0; }
        .node-name { font-size: 18px; font-weight: 900; }
        .node-code { margin-top: 4px; color: var(--muted); font-size: 10px; }
        .node.prophet .node-code { color: #d4e2df; }
        .node-status { margin-top: 7px; font-size: 11px; color: var(--muted); }
        .arrow { text-align: center; color: var(--gold); font-size: 27px; line-height: 36px; font-weight: 900; }
        .known-note { background: var(--gold-soft); border: 1px solid #dec58b; border-radius: 15px; margin-top: 18px; padding: 13px; color: #71531e; line-height: 1.8; }
        .records { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 13px; }
        .person-card { display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--line); border-radius: 19px; padding: 16px; min-height: 180px; box-shadow: 0 8px 20px rgba(38,45,41,.05); }
        .person-card h3 { margin: 0; color: var(--primary); font-size: 18px; }
        .person-card .status-line { margin: 10px 0; }
        .person-card .details { color: var(--muted); font-size: 11px; line-height: 1.8; flex: 1; }
        .open-link { display: flex; align-items: center; justify-content: center; min-height: 43px; margin-top: 12px; border-radius: 12px; background: var(--primary-soft); color: var(--primary); font-weight: 900; font-size: 13px; }
        .empty { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 28px; text-align: center; color: var(--muted); }
        .back-link { display: inline-flex; margin-bottom: 14px; color: var(--primary); font-weight: 800; }
        @media (max-width: 900px) {
            .records { grid-template-columns: repeat(2, minmax(0,1fr)); }
        }
        @media (max-width: 640px) {
            .page { width: min(100% - 18px,1180px); padding-top: 10px; }
            .hero { padding: 21px 17px; border-radius: 20px; }
            .stats { grid-template-columns: 1fr; gap: 8px; }
            .stat { padding: 13px; }
            .filter-grid, .records { grid-template-columns: 1fr; }
            .selected-panel { padding: 16px; }
            .selected-head h2 { font-size: 23px; }
        }
    </style>
</head>
<body>
<div class="page">
    <section class="hero">
        <h1>شجرة النسب المتصلة بسيد البشر محمد ﷺ</h1>
        <p>يعرض النظام فقط الأسماء التي يمتد مسار آبائها المسجل حتى محمد ﷺ، مع إظهار كل حلقة في سلسلة النسب من الجذر النبوي إلى الشخص المختار.</p>
        <div class="policy"><strong>سياسة العرض:</strong> أُلغي من الشجرة العامة كل اسم أو فرع لا يصل ترابطه إلى محمد ﷺ. ولا يعود إلى العرض إلا بعد إثبات العلاقة وربطه بالسلسلة النبوية.</div>
    </section>

    <section class="stats">
        <div class="stat"><strong>{{ number_format($counts['total']) }}</strong><span>إجمالي الأسماء المتصلة بالنبي ﷺ</span></div>
        <div class="stat"><strong>{{ number_format($counts['confirmed']) }}</strong><span>متصلون ومعتمدون بالكامل</span></div>
        <div class="stat"><strong>{{ number_format($counts['pending']) }}</strong><span>متصلون ويحتاجون مراجعة</span></div>
    </section>

    <form class="filters" method="get" action="{{ route('lineage.index') }}">
        <div class="filter-grid">
            <input type="search" name="search" value="{{ $search }}" placeholder="ابحث بالاسم أو الرمز أو موضعه في المشجرة">
            <select name="lineage_status">
                <option value="all" @selected($status === 'all' || $status === 'connected')>جميع المتصلين بالنبي ﷺ</option>
                <option value="confirmed" @selected($status === 'confirmed')>المتصلون المعتمدون</option>
                <option value="pending" @selected($status === 'pending')>المتصلون بانتظار المراجعة</option>
            </select>
            <button type="submit">تطبيق</button>
        </div>
    </form>

    @if($selected && $selectedTrace)
        <h2 class="section-title">مسار النسب الكامل حتى النبي ﷺ</h2>
        <section class="selected-panel">
            <a class="back-link" href="{{ route('lineage.index', ['search' => $search, 'lineage_status' => $status]) }}">← الرجوع إلى القائمة</a>
            <div class="selected-head">
                <div>
                    <h2>{{ $selected->full_name }}</h2>
                    <div class="meta">
                        {{ $selected->source_code ?: 'بلا رمز' }}
                        @if($selected->source_locator) · {{ $selected->source_locator }} @endif
                    </div>
                </div>
                @if($selectedTrace['fully_confirmed'])
                    <span class="badge confirmed">متصل بالنبي ﷺ ومعتمد</span>
                @else
                    <span class="badge pending">متصل بالنبي ﷺ ويحتاج مراجعة</span>
                @endif
            </div>

            <div class="chain">
                @foreach($selectedTrace['path'] as $node)
                    <div class="node {{ $node->source_code === 'CORE-001' ? 'prophet' : ($node->approval_status !== 'supervisor_confirmed' ? 'pending' : '') }}">
                        <div class="node-name">{{ $node->full_name }}</div>
                        <div class="node-code">{{ $node->source_code ?: 'بلا رمز' }}</div>
                        <div class="node-status">
                            {{ $node->approval_status === 'supervisor_confirmed' ? 'علاقة معتمدة' : 'تحتاج اعتماد المشرف' }}
                        </div>
                    </div>
                    @unless($loop->last)<div class="arrow">↓</div>@endunless
                @endforeach
            </div>

            @if(!$selectedTrace['fully_confirmed'])
                <div class="known-note">المسار يصل إلى محمد ﷺ، لكن توجد {{ number_format($selectedTrace['pending_review_count']) }} عقدة أو علاقة ما زالت بحاجة إلى اعتماد المشرف قبل وصف السلسلة بأنها موثقة بالكامل.</div>
            @endif
        </section>
    @endif

    <h2 class="section-title">الأسماء المتصلة بالنبي ﷺ</h2>
    @if($records->isEmpty())
        <div class="empty">لا توجد نتائج مطابقة ضمن الأنساب المتصلة بالنبي ﷺ.</div>
    @else
        <section class="records">
            @foreach($records as $record)
                @php($person = $record['person'])
                @php($trace = $record['trace'])
                <article class="person-card">
                    <h3>{{ $person->full_name }}</h3>
                    <div class="status-line">
                        @if($trace['fully_confirmed'])
                            <span class="badge confirmed">متصل ومعتمد</span>
                        @else
                            <span class="badge pending">متصل بانتظار المراجعة</span>
                        @endif
                    </div>
                    <div class="details">
                        الرمز: {{ $person->source_code ?: 'غير محدد' }}<br>
                        عدد روابط النسب حتى النبي ﷺ: {{ number_format($trace['relation_count']) }}<br>
                        @if($person->source_locator)الموضع: {{ $person->source_locator }}@endif
                    </div>
                    <a class="open-link" href="{{ route('lineage.show', $person) }}">عرض الترابط من محمد ﷺ</a>
                </article>
            @endforeach
        </section>
    @endif
</div>
</body>
</html>
