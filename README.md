# شجرة النسب الشريف

منصة عربية لتوثيق شجرة النسب وعرضها بصورة تفاعلية، مع تطبيق جوال حديث وواجهة Laravel API.

## البنية التقنية

```text
/mnt/home-storage/home/pmsa/apps/shajara
├── shajara-api/       Laravel 13 API
├── shajara-mobile/    React Native + Expo SDK 57
├── scaffold/          ملفات المشروع المخصصة التي تطبقها مهمة التهيئة
├── scripts/           أدوات التهيئة والنشر
└── STACK_STATUS.txt   حالة البيئة بعد اكتمال التهيئة
```

## Laravel API

الروابط الأساسية:

```text
GET /api/v1/health
GET /api/v1/stats
GET /api/v1/people
GET /api/v1/people?search=أحمد
GET /api/v1/people?status=review
GET /api/v1/people?lineage_status=connected
GET /api/v1/people?lineage_status=disconnected
GET /api/v1/lineage-gaps
GET /api/v1/people/{id}
GET /api/v1/people/{id}/lineage
```

تعريف الاتصال في النظام:

- الجذر المرجعي هو `CORE-001`، وهو محمد ﷺ.
- النسب المتصل: سلسلة آباء معتمدة يمكن تتبعها دون انقطاع حتى محمد ﷺ.
- منقطعة النسب: سلسلة لا تصل بعلاقات آباء معتمدة حتى محمد ﷺ.
- مسار النسب يعاد مرتبًا من محمد ﷺ إلى الشخص.
- عند وجود انقطاع يظهر موضع الحلقة المفقودة وأعلى جد معروف، من غير اختلاق اسم أو علاقة غير موثقة.

تشمل النسخة الأولى:

- نموذج الأشخاص وعلاقة الأبناء بالآباء.
- حالات القراءة: واضح، يحتاج مراجعة، غير مقروء.
- البحث في الأسماء والألقاب.
- عرض مسار النسب كاملًا من محمد ﷺ إلى الشخص.
- إحصاء المتصلين والمنقطعين عن الجذر النبوي.
- بيانات تأسيسية للسلسلة الوسطى.
- قاعدة SQLite إنتاجية أولية يمكن نقلها لاحقًا إلى MySQL.

## تطبيق الجوال

التطبيق مبني بـ React Native وExpo Router وTypeScript، ويشمل:

- واجهة عربية RTL.
- تبويب رئيسي بالإحصاءات والبحث.
- تبويب الشجرة التفاعلية.
- شاشة الأسماء التي تحتاج إلى مراجعة.
- صفحة تفصيلية لكل شخص ومسار نسبه.
- أيقونات رسومية حقيقية من Ionicons.
- بيانات احتياطية محلية عند تعذر الاتصال المؤقت بالخادم.

لتشغيل Expo بعد اكتمال التهيئة:

```bash
cd /mnt/home-storage/home/pmsa/apps/shajara/shajara-mobile
npx expo start
```

## التهيئة التلقائية

مهمة GitHub Actions:

```text
Bootstrap Laravel and Mobile
```

تنشئ Laravel 13 وExpo SDK 57، تطبق ملفات المشروع، تشغل migrations وseeders، وتربط نطاق `shajara.pm.sa` بمجلد Laravel العام.

## تنبيه التوثيق

الأسماء الحالية بيانات تأسيسية فقط، ولا تُعد اعتمادًا نهائيًا للنسب. يجب ربط كل اسم وعلاقة بمصدر أو وثيقة قبل تحويلها إلى حالة موثقة.
