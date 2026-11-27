/* =====================================================================
   Operative System — الواجهة
   ===================================================================== */
(() => {
'use strict';

// ---------------- ثوابت ----------------
const STATUS = {
  new:              { label: 'جديد',            color: 'gray'   },
  processing:       { label: 'قيد التجهيز',     color: 'blue'   },
  shipped:          { label: 'سُلِّم لشركة الشحن', color: 'indigo' },
  out_for_delivery: { label: 'خرج للتوصيل',      color: 'amber'  },
  on_hold:          { label: 'هولد (معلّق)',      color: 'orange' },
  delivered:        { label: 'تم التسليم',       color: 'green'  },
  returned:         { label: 'مرتجع',            color: 'red'    },
  cancelled:        { label: 'ملغى',             color: 'muted'  },
};
const GOVS = ['القاهرة','الجيزة','الإسكندرية','القليوبية','الشرقية','الدقهلية','الغربية','المنوفية',
  'البحيرة','كفر الشيخ','دمياط','بورسعيد','الإسماعيلية','السويس','الفيوم','بني سويف','المنيا',
  'أسيوط','سوهاج','قنا','الأقصر','أسوان','البحر الأحمر','الوادي الجديد','مطروح','شمال سيناء','جنوب سيناء'];
const PAGE = 50;

// ---------------- أدوات ----------------
const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = v => (v ?? '').toString().replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const money = n => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const egp = n => `<span class="ltr">${money(n)}</span> ج`;
// التاريخ: 2026/11/27 — والوقت بنظام 12 ساعة بالثواني: 2026/11/27 03:05:09 م
const pad2 = n => String(n).padStart(2, '0');
const dt = d => {
  if (!d) return '';
  // تاريخ من غير وقت (زي تاريخ القيد): يتكتب زي ما هو من غير تحويل للمنطقة الزمنية
  const m = typeof d === 'string' && d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[1]}/${m[2]}/${m[3]}`;
  const x = new Date(d); if (isNaN(x)) return '';
  return `${x.getFullYear()}/${pad2(x.getMonth() + 1)}/${pad2(x.getDate())}`;
};
const dtt = d => {
  if (!d) return '';
  const x = new Date(d); if (isNaN(x)) return '';
  const h = x.getHours();
  return `${dt(x)} ${pad2(h % 12 || 12)}:${pad2(x.getMinutes())}:${pad2(x.getSeconds())} ${h < 12 ? L('ص', 'AM') : L('م', 'PM')}`;
};
const badge = s => { const x = STATUS[s] || { label: s, color: 'gray' }; return `<span class="badge b-${x.color}">${esc(x.label)}</span>`; };
const signed = n => `<span class="num ltr ${n > 0 ? 'pos' : n < 0 ? 'neg' : ''}">${money(n)}</span>`;
const opt = (v, l, sel) => `<option value="${esc(v)}" ${String(sel ?? '') === String(v) ? 'selected' : ''}>${esc(l)}</option>`;
const statusOptions = (sel, withAll) => (withAll ? opt('', 'كل الحالات', sel) : '') +
  Object.entries(STATUS).map(([k, v]) => opt(k, v.label, sel)).join('');
const govOptions = sel => opt('', '— اختر —', sel) + GOVS.map(g => opt(g, g, sel)).join('');
const orderNo = o => `#${o.order_no}`;

// =====================================================================
//  اللغة: عربي / English
//  الواجهة مكتوبة بالعربية؛ في وضع الإنجليزية تُترجم النصوص الظاهرة تلقائيًا من القاموس
// =====================================================================
const LANG = (() => { try { return localStorage.getItem('op-lang') === 'en' ? 'en' : 'ar'; } catch (e) { return 'ar'; } })();
const EN = LANG === 'en';
const L = (ar, en) => EN ? en : ar;
document.documentElement.lang = LANG;
document.documentElement.dir = EN ? 'ltr' : 'rtl';

const DICT = {
  // المبيعات (CRM)
  'المبيعات': 'Sales', 'قسم المبيعات: عملاؤه المحتملون ومتابعاتهم (أرقام عملائه فقط)': 'Sales: own leads and follow-ups (own numbers only)',
  'مدير مبيعات: عملاء فريقه والتوزيع والتفويض والتارجت والتحويل إلى عميل': 'Sales manager: team leads, assignment, delegation, targets and conversion to client',
  'رفع عملاء محتملين من ملف Excel': 'Import leads from an Excel file',
  // عام
  'ج': 'EGP', '/ طلب': '/ order', 'نعم': 'Yes', 'لا': 'No', 'حفظ': 'Save', 'عرض': 'View', 'رفض': 'Reject', 'رفع': 'Upload',
  'فشل': 'Failed', 'حذف': 'Delete', 'تعديل': 'Edit', 'تطبيق': 'Apply', 'تأكيد': 'Confirm', 'إغلاق': 'Close', 'رجوع': 'Back',
  'إرسال': 'Send', 'خروج': 'Log out', 'دخول': 'Log in', 'التالي': 'Next', 'السابق': 'Previous', 'موقوف': 'Suspended',
  'مفعّل': 'Active', 'لا يوجد': 'None', 'جارٍ التنفيذ...': 'Working...', 'جارٍ التحميل...': 'Loading...', 'جارٍ الإرسال...': 'Sending...',
  'في الانتظار...': 'Waiting...', 'لم يُرسل': 'Not sent', 'تم الحفظ': 'Saved', 'تم الحذف': 'Deleted', 'تم النسخ': 'Copied',
  'نسخ الرسالة': 'Copy message', 'تنبيه:': 'Warning:', 'ملاحظات:': 'Notes:', 'الخطوات:': 'Steps:', '— اختر —': '— Select —',
  '— اختر العميل —': '— Select client —', 'كلمة المرور': 'Password', 'كلمة المرور *': 'Password *', 'البريد الإلكتروني': 'Email',
  'العلامة التجارية': 'Brand', 'الرمز': 'Code', 'موظف': 'Staff member', 'بوت': 'Bot', 'النظام': 'System', 'مدير النظام': 'Administrator',
  'فريق Operative': 'Operative team', 'إيصال': 'Receipt', 'مرفق صورة التحويل': 'Transfer proof attached', 'الإجمالي': 'Total',
  'تسجيل الدخول إلى النظام': 'Sign in to the system', 'لم يُربط النظام بقاعدة البيانات بعد.': 'The system is not connected to the database yet.',
  'افتح ملف': 'Open the file', 'وأدخل فيه رابط مشروع Supabase ومفتاحه.': 'and enter the Supabase project URL and key.',
  // التنقل والصفحات
  'لوحة التحكم': 'Dashboard', 'الطلبات': 'Orders', 'طلباتي': 'My orders', 'العملاء': 'Clients', 'التسويات': 'Settlements',
  'الموظفين': 'Staff', 'لوحة إدارة الشركة': 'Company admin panel', 'الإشعارات': 'Notifications',
  // الحالات
  'جديد': 'New', 'قيد التجهيز': 'Processing', 'سُلِّم لشركة الشحن': 'Handed to courier', 'خرج للتوصيل': 'Out for delivery',
  'هولد (معلّق)': 'On hold', 'تم التسليم': 'Delivered', 'مرتجع': 'Returned', 'ملغى': 'Cancelled', 'كل الحالات': 'All statuses',
  'قيد المراجعة لدى شركة الشحن': 'Under review at the courier', 'تم التوصيل': 'Delivered', 'لم يتم التوصيل': 'Not delivered',
  'جارٍ الإرسال لشركة الشحن': 'Sending to the courier', 'قيد المراجعة لدى QP': 'Under review at QP',
  'رقم الطلب': 'Order no.', 'مرجع العميل': 'Client ref', 'هاتف آخر': 'Other phone', 'المنطقة': 'Area', 'القطع': 'Pieces',
  'متاح المعاينة': 'Inspection allowed', 'شركة الشحن': 'the courier', 'الشحن والتحصيل ': 'Shipping & collection',
  'مدفوعة': 'Paid', 'غير مدفوعة': 'Unpaid', 'تمت التسوية': 'Settled', 'لم تتم بعد': 'Not yet', 'غير مسوّاة': 'unsettled',
  // لوحة التحكم
  'اليوم': 'Today', 'آخر 7 أيام': 'Last 7 days', 'هذا الشهر': 'This month', 'الشهر الماضي': 'Last month', 'كل الفترات': 'All time', 'أمس': 'Yesterday', 'آخر 30 يوم': 'Last 30 days', 'هذه السنة': 'This year',
  'كل العملاء': 'All clients', 'إجمالي الطلبات': 'Total orders', 'في الطريق': 'In transit', 'منها هولد': 'Of which on hold',
  'نسبة التسليم': 'Delivery rate', 'تحصيل متوقع (طلبات مفتوحة)': 'Expected COD (open orders)', 'المحصّل': 'Collected',
  'إيرادات الشركة': 'Company revenue', 'رسوم الطلبات على العملاء': 'Order fees charged to clients', 'إجمالي التكلفة': 'Total cost', 'مستحقات العملاء غير المسوّاة': 'Unsettled client balances',
  'رصيدك المستحق غير المسوّى': 'Your unsettled balance', 'ملخص العملاء (كل الفترات)': 'Clients summary (all time)',
  'العميل': 'Client', 'مستحق غير مسوّى': 'Unsettled due', 'لا يوجد عملاء بعد، ابدأ من صفحة العملاء': 'No clients yet — start from the Clients page',
  'أسعار الخدمة الخاصة بك': 'Your service prices', 'التجهيز والتغليف': 'Fulfillment & packaging', 'المرتجع (أساسي)': 'Return (base)',
  'الشحن (أساسي)': 'Shipping (base)', 'الأسعار حسب المحافظة': 'Prices by governorate', 'المحافظة': 'Governorate', 'الشحن': 'Shipping',
  'المرتجع': 'Return', 'الطلب المسلَّم: الصافي = المبلغ المحصّل − (الشحن + التجهيز). الطلب المرتجع: الصافي = المبلغ المحصّل إن وُجد − (المرتجع + التجهيز).':
    'Delivered order: net = collected − (shipping + fulfillment). Returned order: net = amount collected, if any − (return + fulfillment).',
  // الطلبات
  'تحديث حالات QP': 'Update QP statuses', 'جلب آخر حالات الشحنات من QP': 'Fetch the latest shipment statuses from QP',
  'إعدادات QP': 'QP settings', 'تصدير إلى Excel': 'Export to Excel', 'رفع طلبات من Excel': 'Upload orders from Excel', '+ طلب جديد': '+ New order',
  'بحث: الاسم، الهاتف، رقم الطلب، رقم التتبع': 'Search: name, phone, order no., tracking no.', 'رقم': 'No.', 'المستلم': 'Recipient',
  'التحصيل': 'COD', 'الحالة': 'Status', 'رقم التتبع': 'Tracking no.', 'التاريخ': 'Date', 'لا توجد طلبات بعد': 'No orders yet',
  'لا توجد طلبات مطابقة للبحث': 'No orders match your search', 'إرسال إلى QP': 'Send to QP', 'تغيير الحالة إلى:': 'Change status to:',
  'إلغاء التحديد': 'Clear selection', 'طلب جديد': 'New order', 'اسم المستلم *': 'Recipient name *', 'رقم الطلب لديك': 'Your order no.', 'البراند (اختياري)': 'Brand (optional)', 'رقم طلب البراند': 'Brand order no.', 'ملخص حسب البراند': 'Summary by brand',
  'رقم الهاتف *': 'Phone *', 'رقم هاتف آخر': 'Other phone', 'المحافظة *': 'Governorate *', 'المنطقة / المدينة': 'Area / city',
  'العنوان بالتفصيل *': 'Full address *', 'المحتوى': 'Contents', 'عدد القطع': 'Pieces', 'المطلوب تحصيله *': 'Amount to collect *',
  'ملاحظات': 'Notes', 'متاح معاينة الشحنة': 'Allow shipment inspection',
  '(أزل العلامة إذا كنت لا تريد أن يفتح المستلم الشحنة قبل الاستلام)': '(untick if the recipient must not open the parcel before accepting it)',
  'الشحن والتحصيل': 'Shipping & collection', 'رقم التتبع (QP)': 'Tracking no. (QP)', 'حالة الشحنة عند QP': 'Shipment status at QP',
  'حسابات الطلب': 'Order accounts', '— تُحسب تلقائيًا من أسعار العميل، ويمكن تعديلها هنا': '— calculated from the client prices; you can adjust them here',
  'المبلغ المحصّل': 'Collected amount',
  'المبلغ المحصّل: للطلب المسلَّم إذا تُرك صفرًا = المطلوب تحصيله، وللمرتجع ما دفعه المستلم إن وُجد.':
    'Collected amount: for a delivered order, 0 means the full COD amount; for a returned order, whatever the recipient paid, if anything.',
  'متابعة الطلب': 'Order tracking', 'عند شركة الشحن': 'At the courier', 'التكلفة (المرتجع + التجهيز)': 'Cost (return + fulfillment)',
  'التكلفة (الشحن + التجهيز)': 'Cost (shipping + fulfillment)', 'الصافي': 'Net', 'التسوية': 'Settlement', 'إضافة الطلب': 'Add order',
  'إلغاء الطلب': 'Cancel order', 'هل تريد إلغاء هذا الطلب؟': 'Cancel this order?', 'تم إلغاء الطلب': 'Order cancelled',
  'رقم الهاتف غير صحيح': 'Invalid phone number', 'العميل *': 'Client *',
  'إرسال الطلبات إلى QP': 'Send orders to QP', 'جارٍ الاتصال بـ QP...': 'Connecting to QP...', 'الطلب': 'Order', 'النتيجة': 'Result',
  'تم ✓ رقم التتبع': 'Done ✓ tracking no.', '— باقي الردود ستُحدَّث تلقائيًا': '— remaining responses will update automatically',
  'لا توجد طلبات صالحة للإرسال — يُرسل فقط الطلب الجديد أو قيد التجهيز الذي ليس له رقم تتبع':
    'No orders can be sent — only new or processing orders without a tracking number are sent',
  'انتهت مهلة الاتصال بـ QP، حاول مرة أخرى': 'QP connection timed out, please try again',
  'لا توجد شحنات نشطة لتحديثها': 'No active shipments to update', 'إعدادات الربط مع QP': 'QP connection settings',
  'أدخل بيانات حساب الشركة على موقع QP Express. تُحفظ كلمة المرور مشفّرة ولا يمكن عرضها مرة أخرى.':
    'Enter the company account details on QP Express. The password is stored encrypted and cannot be shown again.',
  'اسم المستخدم / البريد في QP *': 'QP username / email *', '(محفوظة — اتركها فارغة إن لم تتغير)': '(saved — leave empty if unchanged)',
  'تحديث حالات الشحنات تلقائيًا كل ساعة': 'Update shipment statuses automatically every hour', 'رقم الحساب في QP': 'QP account no.',
  'آخر تحديث': 'Last update', 'حفظ واختبار الاتصال': 'Save & test connection',
  // رفع Excel
  'رفع طلبات من ملف Excel': 'Upload orders from an Excel file',
  '١) نزّل النموذج واملأه بالطلبات، صف لكل طلب. ٢) ارفع الملف. ٣) راجع الطلبات واضغط "إضافة".':
    '1) Download the template and fill it in, one row per order. 2) Upload the file. 3) Review the orders and press "Add".',
  'يمكنك أيضًا رفع ملف بأعمدة مختلفة؛ سيتعرّف النظام على الأعمدة المعروفة مثل الاسم والهاتف والعنوان والمحافظة والمبلغ.':
    'You can also upload a file with different columns; the system recognises known columns such as name, phone, address, governorate and amount.',
  'تنزيل النموذج': 'Download template', 'اختيار الملف': 'Choose file', 'إضافة الطلبات': 'Add orders', 'جارٍ قراءة الملف...': 'Reading file...',
  'لم يتم التعرّف على أعمدة الملف. استخدم النموذج، أو تأكد أن أول صف فيه عناوين الأعمدة (الاسم، الهاتف، العنوان، المحافظة، المبلغ).':
    'The file columns were not recognised. Use the template, or make sure the first row holds the column titles (name, phone, address, governorate, amount).',
  'الملف لا يحتوي على طلبات.': 'The file has no orders.', 'كل الصفوف سليمة ✓': 'All rows are valid ✓', 'الهاتف': 'Phone', 'العنوان': 'Address',
  'المبلغ': 'Amount', 'الاسم ناقص': 'name missing', 'العنوان ناقص': 'address missing', 'المبلغ غير صحيح': 'invalid amount',
  'اختر المحافظة': 'choose the governorate', 'المحافظة ناقصة': 'governorate missing', 'اختر العميل أولًا': 'Select the client first',
  'تعذّر تحميل مكتبة Excel، تحقق من الاتصال بالإنترنت': 'Could not load the Excel library, check your internet connection',
  // العملاء
  '+ عميل جديد': '+ New client', 'المسؤول': 'Contact', 'التجهيز': 'Fulfillment', 'المرتجع الأساسي': 'Base return', 'الشحن الأساسي': 'Base shipping',
  'حساب الدخول': 'Login account', 'إنشاء حساب': 'Create account', 'لا يوجد عملاء بعد، اضغط "عميل جديد"': 'No clients yet — press "New client"',
  'عميل جديد': 'New client', 'اسم العلامة التجارية *': 'Brand name *', 'اسم المسؤول': 'Contact name', 'رقم الهاتف': 'Phone number',
  'عنوان الاستلام': 'Pickup address', 'العميل نشط': 'Client is active', 'الأسعار الخاصة بالعميل (بالجنيه)': 'Client prices (EGP)',
  'التجهيز والتغليف / طلب': 'Fulfillment & packaging / order', 'سعر المرتجع الأساسي': 'Base return price', 'سعر الشحن الأساسي': 'Base shipping price',
  'الطلب المسلَّم: التكلفة = الشحن + التجهيز. الطلب المرتجع: التكلفة = المرتجع + التجهيز. الصافي للعميل = المبلغ المحصّل − التكلفة.':
    'Delivered order: cost = shipping + fulfillment. Returned order: cost = return + fulfillment. Client net = collected − cost.',
  'أسعار كل محافظة': 'Prices per governorate', '— الخانة الفارغة تأخذ السعر الأساسي': '— an empty cell uses the base price',
  'إضافة العميل': 'Add client', 'حذف العميل': 'Delete client', 'تمت إضافة العميل': 'Client added', 'هل تريد إنشاء حساب دخول لـ': 'Create a login account for',
  'الآن؟': 'now?', 'نعم، أنشئ الحساب': 'Yes, create it', 'للتأكيد اكتب اسم العميل كما هو:': 'To confirm, type the client name exactly:',
  'حذف نهائي': 'Delete permanently', 'تُحفظ نسخة كاملة من بيانات العميل في أرشيف قاعدة البيانات قبل الحذف.':
    'A full copy of the client data is kept in the database archive before deletion.',
  'سيدخل العميل بهذا البريد الإلكتروني وكلمة المرور، ولن يرى إلا طلباته وتسوياته.': 'The client signs in with this email and password and sees only their own orders and settlements.',
  'بريد الدخول *': 'Login email *', 'إنشاء الحساب': 'Create account', 'تم إنشاء الحساب ✓': 'Account created ✓',
  'يجب على العميل تفعيل الحساب من بريده الإلكتروني أولًا (أو أوقف تأكيد البريد من إعدادات Supabase).':
    'The client must confirm the account from their email first (or turn off email confirmation in Supabase).',
  'أرسل هذه الرسالة إلى العميل:': 'Send this message to the client:',
  // التسويات
  '+ تسوية جديدة': '+ New settlement', 'بحث برقم التتبع أو رقم الطلب أو اسم المستلم — يعرض التسوية التي تحتويه':
    'Search by tracking no., order no. or recipient — shows the settlement that contains it',
  'طلبات مطابقة لم تدخل أي تسوية بعد:': 'Matching orders not in any settlement yet:', 'لا توجد تسويات بعد': 'No settlements yet',
  'التكلفة': 'Cost', 'الصافي للعميل': 'Client net', 'تسوية جديدة': 'New settlement',
  'بحث برقم التتبع أو رقم الطلب أو الاسم': 'Search by tracking no., order no. or name',
  'اختر العميل لعرض الطلبات المسلّمة والمرتجعة التي لم تُسوَّ بعد.': 'Select a client to list delivered and returned orders not yet settled.',
  'تأكيد التسوية': 'Confirm settlement', 'عدد الطلبات': 'Orders', 'تاريخ الإقفال': 'Closed on', 'لا توجد طلبات جاهزة للتسوية لهذا العميل': 'No orders ready to settle for this client',
  'لا توجد طلبات جاهزة للتسوية': 'No orders ready to settle', 'تم إنشاء التسوية': 'Settlement created', 'كشف تسوية حساب': 'Account settlement statement',
  'رقم التسوية': 'Settlement no.', 'إجمالي المحصّل': 'Total collected', 'بحث داخل التسوية: رقم التتبع، رقم الطلب، الاسم':
    'Search this settlement: tracking no., order no., name', 'طباعة / حفظ PDF': 'Print / save PDF', 'تنزيل Excel': 'Download Excel', 'عرض صورة التحويل': 'View transfer proof',
  'تسجيل الدفع': 'Record payment', 'رفع صورة التحويل': 'Upload transfer proof', 'تغيير صورة التحويل': 'Change transfer proof',
  'إلغاء التسوية': 'Cancel settlement', 'طريقة / مرجع الدفع': 'Payment method / reference', 'مثال: إنستاباي، تحويل بنكي، نقدًا': 'e.g. InstaPay, bank transfer, cash',
  'صورة التحويل': 'Transfer proof', '(اختياري — صورة أو PDF)': '(optional — image or PDF)', 'تم تسجيل الدفع': 'Payment recorded',
  'سيؤدي إلغاء التسوية إلى إعادة طلباتها إلى حالة "غير مسوّاة". هل تريد المتابعة؟': 'Cancelling the settlement returns its orders to "unsettled". Continue?',
  'تم إلغاء التسوية': 'Settlement cancelled', 'صورة التحويل أو الإيصال (صورة أو PDF — حتى 10 ميجا)': 'Transfer proof or receipt (image or PDF — up to 10 MB)',
  'ستحل الصورة الجديدة محل الصورة الحالية في التسوية.': 'The new file replaces the current one on this settlement.',
  'اختر الملف أولًا': 'Choose the file first', 'تم رفع صورة التحويل': 'Transfer proof uploaded', 'حجم الملف أكبر من 10 ميجا': 'The file is larger than 10 MB',
  'فتح ملف التحويل (PDF)': 'Open transfer file (PDF)', 'فتح في نافذة جديدة': 'Open in a new window',
  // الموظفين
  '+ موظف جديد': '+ New staff member', 'الاسم': 'Name', 'البريد': 'Email', 'الصلاحيات': 'Permissions', 'بدون صلاحيات': 'No permissions',
  'لم يُنشأ الحساب': 'No account yet', 'لا يوجد موظفون بعد، اضغط "موظف جديد"': 'No staff yet — press "New staff member"',
  'الموظف يدخل على نفس الموقع ويرى فقط الصفحات والعمليات المسموح له بها. إعدادات الربط مع شركة الشحن، وحذف العملاء، وإدارة الموظفين متاحة لك وحدك.':
    'Staff use the same site and see only the pages and actions they are allowed. Courier settings, deleting clients and managing staff are yours only.',
  'موظف جديد': 'New staff member', 'اسم الموظف *': 'Staff name *', 'الحساب مفعّل': 'Account active', 'إضافة الموظف وإنشاء حسابه': 'Add staff member & create account',
  'حفظ وإنشاء الحساب': 'Save & create account', 'حذف الموظف': 'Delete staff member', 'تم حذف الموظف': 'Staff member deleted',
  'هل تريد حذف الموظف': 'Delete staff member', '؟ لن يستطيع الدخول إلى النظام بعد ذلك.': '? They will no longer be able to sign in.',
  'تم إنشاء حساب الموظف ✓': 'Staff account created ✓', 'يجب على الموظف تفعيل الحساب من بريده الإلكتروني أولًا.': 'The staff member must confirm the account from their email first.',
  'أرسل هذه الرسالة إلى الموظف:': 'Send this message to the staff member:', 'يوجد موظف بهذا البريد بالفعل': 'A staff member with this email already exists',
  'هذا البريد له حساب سابق وتم ربطه بالموظف — يدخل بكلمة المرور القديمة': 'This email already had an account; it is now linked — they sign in with the old password',
  'هذا البريد مسجّل بحساب آخر في النظام (عميل أو مدير)، استخدم بريدًا مختلفًا': 'This email belongs to another account (client or admin); use a different email',
  'لوحة التحكم والأرقام': 'Dashboard & figures', 'تحتاج أيضًا صلاحية عرض الطلبات': 'also needs "View orders"', 'عرض الطلبات': 'View orders',
  'إضافة الطلبات وتعديل بياناتها (بيانات المستلم والحالة)': 'Add orders and edit order data (recipient details and status)',
  'تعديل حسابات الطلب (الرسوم والمبلغ المحصّل) والرد على طلبات التعديل': 'Edit order accounts (fees and collected amount) and answer change requests',
  'حذف الطلبات': 'Delete orders', 'إرسال الطلبات لشركة الشحن وتحديث حالات الشحنات': 'Send orders to the courier and update shipment statuses',
  'عرض العملاء وأسعارهم': 'View clients and their prices', 'إضافة وتعديل العملاء وإنشاء حسابات دخولهم': 'Add/edit clients and create their logins',
  'عرض التسويات': 'View settlements', 'إنشاء التسويات وتسجيل الدفع ورفع صور التحويل': 'Create settlements, record payments and upload transfer proofs',
  // رسائل الدخول والأخطاء
  'البريد الإلكتروني أو كلمة المرور غير صحيحة': 'Incorrect email or password', 'يوجد حساب مسجّل بهذا البريد الإلكتروني': 'An account with this email already exists',
  'يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام': 'The password must be at least 6 characters', 'بريد الدخول هذا مستخدم لعميل آخر': 'This login email is used by another client',
  'تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت': 'Could not reach the server, check your internet connection',
  'محاولات كثيرة متتالية، انتظر دقيقة ثم أعد المحاولة': 'Too many attempts, wait a minute and try again',
  'هذا الحساب غير مرتبط بأي عميل بعد، يُرجى التواصل مع إدارة Operative': 'This account is not linked to any client yet, please contact Operative',
  'هذا الحساب موقوف، يُرجى التواصل مع إدارة Operative': 'This account is suspended, please contact Operative',
  'لم تُحدَّد لك أي صلاحيات بعد، تواصل مع مدير النظام.': 'No permissions have been assigned to you yet, contact the administrator.',
  'غير مسموح': 'Not allowed', 'الطلب غير موجود': 'Order not found', 'حذف العملاء متاح لمدير النظام فقط': 'Only the administrator can delete clients',
  'العميل غير موجود': 'Client not found', 'اسم العميل المكتوب للتأكيد غير مطابق': 'The confirmation name does not match',
  'تم إرساله من قبل': 'Already sent', 'الطلب قيد الإرسال بالفعل': 'The order is already being sent', 'حالة الطلب لا تسمح بالإرسال': 'The order status does not allow sending',
  'اكتب تفاصيل الطلب': 'Please describe the request', 'اكتب الرد': 'Write a reply', 'تغيير حالة الطلب لموظف الحسابات فقط': 'Only accounts staff can change the request status',
  'حالة غير صحيحة': 'Invalid status', 'لا توجد طلبات صالحة': 'No valid orders',
  // المحافظات
  'القاهرة': 'Cairo', 'الجيزة': 'Giza', 'الإسكندرية': 'Alexandria', 'القليوبية': 'Qalyubia', 'الشرقية': 'Sharqia', 'الدقهلية': 'Dakahlia',
  'الغربية': 'Gharbia', 'المنوفية': 'Monufia', 'البحيرة': 'Beheira', 'كفر الشيخ': 'Kafr El Sheikh', 'دمياط': 'Damietta', 'بورسعيد': 'Port Said',
  'الإسماعيلية': 'Ismailia', 'السويس': 'Suez', 'الفيوم': 'Faiyum', 'بني سويف': 'Beni Suef', 'المنيا': 'Minya', 'أسيوط': 'Assiut',
  'سوهاج': 'Sohag', 'قنا': 'Qena', 'الأقصر': 'Luxor', 'أسوان': 'Aswan', 'البحر الأحمر': 'Red Sea', 'الوادي الجديد': 'New Valley',
  'مطروح': 'Matrouh', 'شمال سيناء': 'North Sinai', 'جنوب سيناء': 'South Sinai',
  // الحسابات
  'الحسابات': 'Accounting', 'القيود': 'Journal', 'دليل الحسابات': 'Chart of accounts', 'كشف حساب': 'Account statement',
  'ميزان المراجعة': 'Trial balance', 'قائمة الدخل': 'Income statement', 'الميزانية العمومية': 'Balance sheet', 'أرصدة العملاء': 'Client balances',
  'فواتير شركة الشحن': 'Courier invoices', '+ قيد يومية': '+ Journal entry', '+ مصروف': '+ Expense', '+ إيراد': '+ Revenue',
  'تحويل بين الحسابات': 'Transfer between accounts', 'أرصدة افتتاحية': 'Opening balances', 'الأرصدة الافتتاحية': 'Opening balances',
  'من': 'From', 'إلى': 'To', 'في تاريخ': 'As of', 'كل القيود': 'All entries', 'بحث في البيان': 'Search description',
  'يدوي': 'Manual', 'افتتاحي': 'Opening', 'طلب': 'Order', 'تسوية': 'Settlement', 'فاتورة شركة الشحن': 'Courier invoice', 'تحويل شركة الشحن': 'Courier transfer',
  'رقم': 'No.', 'التاريخ': 'Date', 'البيان': 'Description', 'النوع': 'Type', 'المبلغ': 'Amount', 'لا توجد قيود في هذه الفترة': 'No entries in this period',
  'الحساب': 'Account', 'مدين': 'Debit', 'دائن': 'Credit', 'العميل / ملاحظة': 'Client / note', 'الإجمالي': 'Total', 'سجّله': 'Recorded by',
  'فتح المصدر': 'Open source', 'حذف القيد': 'Delete entry', 'تم حذف القيد': 'Entry deleted', 'تم حفظ القيد': 'Entry saved',
  'هل تريد حذف هذا القيد نهائيًا؟': 'Delete this entry permanently?', 'قيد يومية جديد': 'New journal entry', 'التاريخ *': 'Date *', 'البيان *': 'Description *',
  'قيد أرصدة افتتاحية': 'Opening balances entry', '+ سطر': '+ Line', '— حساب موازنة الفرق —': '— Balancing account —',
  'موازنة الفرق على هذا الحساب': 'Post the difference to this account', 'حفظ القيد': 'Save entry', '— اختر الحساب —': '— Select account —',
  '— العميل —': '— Client —', 'ملاحظة': 'Note', 'حذف السطر': 'Remove line', '(متوازن)': '(balanced)',
  'اختر الحساب في كل سطر': 'Select an account on every line', 'أدخل مبلغًا مدينًا أو دائنًا في كل سطر': 'Enter a debit or credit amount on every line',
  'القيد يحتاج سطرين على الأقل': 'An entry needs at least two lines', 'القيد غير متوازن: إجمالي المدين لا يساوي إجمالي الدائن': 'Entry is not balanced: total debit ≠ total credit',
  'القيد متوازن بالفعل': 'Entry is already balanced', 'اختر حساب موازنة الفرق': 'Select a balancing account',
  'تسجيل مصروف': 'Record expense', 'تسجيل إيراد': 'Record revenue', 'بند المصروف *': 'Expense account *', 'بند الإيراد *': 'Revenue account *',
  'دُفع من *': 'Paid from *', 'استُلم في *': 'Received into *', 'من حساب *': 'From account *', 'إلى حساب *': 'To account *', 'المبلغ *': 'Amount *',
  'اختر حسابين مختلفين': 'Choose two different accounts', 'صافي طلبات لم تُسوَّ قبل البداية': 'Net of orders not settled before the start date',
  'يوجد قيد أرصدة افتتاحية بالفعل — تم فتحه للتعديل': 'An opening balances entry already exists — opened for editing',
  '+ حساب جديد': '+ New account', 'الكود': 'Code', 'اسم الحساب': 'Account name', 'الرصيد': 'Balance', 'كشف': 'Statement',
  'خزنة': 'Cash', 'بنك': 'Bank', 'أساسي': 'System', 'عادي': 'Regular', 'حساب جديد': 'New account', 'الحساب الرئيسي *': 'Parent account *',
  'الكود *': 'Code *', 'اسم الحساب *': 'Account name *', 'نوع الحساب': 'Account kind', 'الحساب مفعّل': 'Account active',
  'هذا الكود مستخدم لحساب آخر': 'This code is used by another account', 'اختر الحساب لعرض كشفه': 'Select an account to view its statement',
  'كل العملاء': 'All clients', 'طباعة': 'Print', 'القيد': 'Entry', 'رصيد أول المدة': 'Opening balance', 'اختر الحساب أولًا': 'Select an account first',
  'الحركة': 'Movement', 'حركة الفترة': 'Period movement', 'الرصيد الختامي': 'Closing balance', 'لا توجد حركات': 'No movements',
  'متوازن': 'Balanced', 'غير متوازن': 'Not balanced', 'متوازنة': 'Balanced', 'غير متوازنة': 'Not balanced',
  'المستوى الأول': 'Level 1', 'المستوى الثاني': 'Level 2', 'المستوى الثالث (تفصيلي)': 'Level 3 (detailed)', 'مستوى العرض': 'Detail level',
  'الأصول': 'Assets', 'الخصوم': 'Liabilities', 'حقوق الملكية': 'Equity', 'الإيرادات': 'Revenue', 'المصروفات': 'Expenses',
  'إجمالي الإيرادات': 'Total revenue', 'إجمالي المصروفات': 'Total expenses', 'صافي الربح': 'Net profit', 'صافي الخسارة': 'Net loss',
  'إجمالي الأصول': 'Total assets', 'إجمالي الخصوم': 'Total liabilities', 'إجمالي حقوق الملكية': 'Total equity',
  'صافي الأرباح (الخسائر) غير المرحّلة': 'Unappropriated profit (loss)', 'إجمالي الخصوم وحقوق الملكية': 'Total liabilities and equity',
  'أموال العملاء المحصّلة (المستحق لكل عميل)': 'Collected client funds (due to each client)', 'لا توجد أرصدة': 'No balances',
  'الرصيد الموجب = مبلغ مستحق للعميل. السالب = مبلغ على العميل.': 'Positive = due to the client. Negative = owed by the client.',
  'تحصيلات براندات خارج النظام (حسب البراند)': 'Collections for brands outside the system (by brand)', 'البراند': 'Brand',
  'صافي ما حصّلته شركة الشحن لشحنات غير مسجّلة في النظام. يُسوّى بقيد يدوي عند الدفع للبراند.': 'Net collected by the courier for shipments not in the system. Settled with a manual entry when the brand is paid.',
  '+ رفع فواتير شركة الشحن': '+ Upload courier invoices', 'الملف': 'File', 'الشحنات': 'Shipments', 'الرسوم': 'Fees', 'الصافي': 'Net', 'التحويل': 'Transfer',
  'مستلم': 'Received', 'لم يُستلم': 'Not received', 'لم تُرفع فواتير بعد': 'No invoices uploaded yet', 'رفع فواتير شركة الشحن': 'Upload courier invoices',
  'رفع الفواتير': 'Upload invoices', 'تاريخ الفاتورة': 'Invoice date', 'النتيجة': 'Result', 'رفعها': 'Uploaded by', 'لم يُستلم بعد': 'Not received yet',
  'إجمالي المحصّل': 'Total collected', 'رسوم شركة الشحن': 'Courier fees', 'الصافي المستحق من شركة الشحن': 'Net due from courier',
  'شحنات غير مسجّلة في النظام (حسب البراند)': 'Shipments not in the system (by brand)', 'كل الشحنات': 'All shipments',
  'المسجّلة في النظام': 'In the system', 'فيها فرق': 'With difference', 'غير مسجّلة في النظام': 'Not in the system',
  'بحث برقم التتبع أو الاسم أو الملاحظات': 'Search by tracking no., name or notes', 'الاسم': 'Name', 'الطلب': 'Order',
  'المسجّل عندنا': 'Recorded by us', 'الفرق': 'Difference', 'تسجيل استلام التحويل': 'Record transfer received', 'إلغاء الاستلام': 'Cancel receipt',
  'إعادة المطابقة': 'Re-match', 'حذف الفاتورة': 'Delete invoice', 'تسجيل استلام تحويل شركة الشحن': 'Record courier transfer',
  'المبلغ المستلم *': 'Amount received *', 'تاريخ الاستلام *': 'Date received *', 'تم تسجيل الاستلام': 'Receipt recorded',
  'إلغاء تسجيل استلام التحويل وحذف قيده؟': 'Cancel the transfer receipt and delete its entry?', 'اعتماد': 'Adopt',
  'حذف الفاتورة وكل قيودها؟ (لا يؤثر على الطلبات)': 'Delete the invoice and all its entries? (orders are not affected)',
  'المحصّل حسب فواتير شركة الشحن': 'Collected per courier invoices', 'مطابق': 'Matched',
  'لم تظهر في فواتير شركة الشحن المرفوعة بعد': 'Not in uploaded courier invoices yet', 'اعتماد مبالغ شركة الشحن': 'Adopt courier amounts',
  'تم اعتماد مبالغ شركة الشحن': 'Courier amounts adopted', 'مقارنة مع فواتير شركة الشحن:': 'Comparison with courier invoices:',
  'دُفعت من *': 'Paid from *', '— اختر الخزنة أو البنك —': '— Select cash or bank —',
  'عرض الحسابات والتقارير المالية': 'View accounting and financial reports',
  'تسجيل القيود والمصروفات وإدارة دليل الحسابات وفواتير شركة الشحن': 'Record entries and expenses, manage the chart of accounts and courier invoices',
  'هذا قيد تلقائي، يتعدّل تلقائيًا عند تعديل مصدره (الطلب أو التسوية أو فاتورة شركة الشحن).': 'This is an automatic entry; it updates when its source (order, settlement or courier invoice) changes.',
  'حسابات «خزنة» و«بنك» تظهر في اختيار طريقة الدفع والاستلام.': '"Cash" and "Bank" accounts appear when choosing how money was paid or received.',
  'الطلب غير موجود': 'Order not found', 'التسوية غير موجودة': 'Settlement not found', 'الفاتورة غير موجودة': 'Invoice not found',
  'الملف ليس بصيغة Revenue Report (لم يُعثر على عمودي Serial و Total amount)': 'Not a Revenue Report file (Serial and Total amount columns not found)',
  'كل سطور الملف مرفوعة من قبل': 'All lines in this file were uploaded before',
  // أسماء دليل الحسابات الافتراضية
  'الأصول المتداولة': 'Current assets', 'الخزنة الرئيسية': 'Main cash', 'البنك': 'Bank', 'مستحقات لدى شركة الشحن': 'Due from courier',
  'عُهد وسلف': 'Advances', 'الأصول الثابتة': 'Fixed assets', 'أجهزة ومعدات': 'Equipment', 'أثاث وتجهيزات': 'Furniture & fittings',
  'الخصوم المتداولة': 'Current liabilities', 'أموال العملاء المحصّلة': 'Collected client funds', 'تحصيلات براندات خارج النظام': 'Collections for brands outside the system',
  'مصروفات مستحقة': 'Accrued expenses', 'رأس المال وجاري المالك': 'Capital & owner current', 'رأس المال': 'Capital', 'جاري المالك': 'Owner current account',
  'أرباح مُرحّلة': 'Retained earnings', 'إيرادات التشغيل': 'Operating revenue', 'إيراد الشحن': 'Shipping revenue', 'إيراد التجهيز والتغليف': 'Fulfillment revenue',
  'إيراد المرتجعات': 'Returns revenue', 'إيرادات أخرى': 'Other revenue', 'إيرادات متنوعة': 'Miscellaneous revenue', 'تكلفة الخدمة': 'Cost of service',
  'تكلفة الشحن (رسوم شركة الشحن)': 'Shipping cost (courier fees)', 'خامات التغليف': 'Packaging materials', 'مصروفات إدارية وعمومية': 'General & administrative expenses',
  'مرتبات وأجور': 'Salaries & wages', 'إيجار': 'Rent', 'كهرباء ومياه وإنترنت': 'Utilities & internet', 'تسويق وإعلانات': 'Marketing & ads',
  'مصروفات نثرية': 'Sundry expenses', 'مصاريف بنكية': 'Bank charges',
};
// نصوص فيها أرقام أو أسماء متغيرة
const PATTERNS = [
  [/^(\d+)–(\d+) من (\d+)$/, '$1–$2 of $3'],
  [/^تم تحديد (\d+) طلب$/, '$1 order(s) selected'],
  [/^تم تغيير حالة (\d+) طلب$/, 'Status changed for $1 order(s)'],
  [/^بانتظار رد QP\.\.\. \((\d+) \/ (\d+)\)$/, 'Waiting for QP... ($1 / $2)'],
  [/^تم إرسال (\d+) من (\d+) طلب$/, 'Sent $1 of $2 orders'],
  [/^تم تحديث حالات (\d+) شحنة من QP$/, 'Updated $1 shipments from QP'],
  [/^تم الاتصال بـ QP بنجاح \(رقم الحساب (\d+)\)$/, 'Connected to QP (account $1)'],
  [/^(\d+) جاهز$/, '$1 ready'], [/^(\d+) جاهز — (\d+) يحتاج تصحيح$/, '$1 ready — $2 need fixing'],
  [/^إضافة (\d+) طلب$/, 'Add $1 orders'],
  [/^يوجد (\d+) صف يحتاج تصحيحًا/, '$1 row(s) need fixing (in red). Only valid rows will be added — you can fix the file and upload it again.'],
  [/^في الملف: (.*)$/, 'In file: $1'],
  [/^تمت إضافة (\d+) طلب قبل حدوث الخطأ$/, '$1 orders were added before the error'],
  [/^جارٍ الإضافة\.\.\. (\d+)\/(\d+)$/, 'Adding... $1/$2'], [/^تمت إضافة (\d+) طلب$/, '$1 orders added'],
  [/^حذف العميل — (.*)$/, 'Delete client — $1'], [/^حساب دخول — (.*)$/, 'Login account — $1'],
  [/^تعديل — (.*)$/, 'Edit — $1'], [/^بيانات — (.*)$/, 'Details — $1'],
  [/^تم حذف العميل (.*) \((\d+) طلب، (\d+) تسوية\)$/, 'Client $1 deleted ($2 orders, $3 settlements)'],
  [/^لا توجد تسوية تحتوي على «(.*)»$/, 'No settlement contains "$1"'],
  [/^(\d+) نتيجة$/, '$1 result(s)'],
  [/^صورة التحويل — تسوية رقم (\d+)$/, 'Transfer proof — settlement $1'], [/^تسوية رقم (\d+)$/, 'Settlement $1'],
  [/^مدفوعة (?=\d)/, 'Paid '],
  [/^تعذّر الاتصال بـ QP: (.*)$/, (m, a) => 'Could not connect to QP: ' + tr(a)],
  [/^تعذّر التحديث: (.*)$/, (m, a) => 'Update failed: ' + tr(a)],
  [/^تم الحفظ، لكن (.*)$/, (m, a) => 'Saved, but ' + tr(a)],
  [/^تم إرساله من قبل — رقم التتبع (.*)$/, 'Already sent — tracking no. $1'],
  [/^المحافظة غير موجودة في QP: (.*)$/, (m, a) => 'Governorate not found in QP: ' + tr(a)],
  [/^تمت المزامنة: (\d+) شحنة من (\d+) نشطة$/, 'Synced: $1 of $2 active shipments'],
  [/^قيد رقم (\d+)$/, 'Entry $1'], [/^تعديل قيد رقم (\d+)$/, 'Edit entry $1'], [/^(\d+) قيد$/, '$1 entries'],
  [/^فاتورة شركة الشحن رقم (\d+)$/, 'Courier invoice $1'], [/^\((\d+) في النظام\)$/, '($1 in system)'],
  [/^\(فرق ([\d,.]+)\)$/, '(difference $1)'], [/^إجمالي (.*)$/, (m, a) => 'Total ' + tr(a)],
  [/^اعتماد مبالغ شركة الشحن \((\d+)\)$/, 'Adopt courier amounts ($1)'],
  [/^يوجد (\d+) طلب المبلغ المحصّل فيه عند شركة الشحن مختلف عن المسجّل في النظام\.$/, '$1 order(s) have a different collected amount at the courier than in the system.'],
  [/^تنبيه: (\d+) طلب في هذه التسوية المبلغ المحصّل فيه مختلف عن فاتورة شركة الشحن\.$/, 'Warning: $1 order(s) in this settlement differ from the courier invoice.'],
];
const MISSING = new Set();
const AR_RE = /[؀-ۿ]/;
function trCore(core) {
  if (core in DICT) return DICT[core];
  const star = core.match(/^(.*?)\s*\*$/);
  if (star && star[1] in DICT) return DICT[star[1]] + ' *';
  for (const [re, rep] of PATTERNS) if (re.test(core)) return core.replace(re, rep);
  // نص مركّب: نترجم الأجزاء المعروفة
  for (const sep of [' — ', '، ', ' | ']) {
    if (core.includes(sep)) {
      const parts = core.split(sep);
      const out = parts.map(p => { const t = p.trim(); return AR_RE.test(t) ? (trCore(t) ?? p) : p; });
      if (out.some((x, i) => x !== parts[i])) return out.join(sep === '، ' ? ', ' : sep);
    }
  }
  return null;
}
function tr(s) {
  if (!EN || s == null) return s;
  s = String(s);
  if (!AR_RE.test(s)) return s;
  const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const out = trCore(m[2]);
  if (out == null) { MISSING.add(m[2]); return s; }
  return m[1] + out + m[3];
}
function translateTree(root) {
  if (!EN || !root) return;
  if (root.nodeType === 3) {
    if (!root.parentElement || !root.parentElement.closest('.notr,script,style,textarea')) {
      const t = tr(root.nodeValue); if (t !== root.nodeValue) root.nodeValue = t;
    }
    return;
  }
  if (root.nodeType !== 1 || root.closest('.notr')) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n = root;
  while (n) {
    if (n.nodeType === 1) {
      if (n.matches('.notr,script,style,textarea')) { n = nextSkip(w); continue; }
      for (const a of ['placeholder', 'title', 'aria-label']) {
        const v = n.getAttribute(a); if (v && AR_RE.test(v)) { const t = tr(v); if (t !== v) n.setAttribute(a, t); }
      }
    } else {
      const t = tr(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t;
    }
    n = w.nextNode();
  }
  function nextSkip(walker) { // تخطّي عنصر وما بداخله
    let x = walker.currentNode;
    while (x) { if (x.nextSibling) { walker.currentNode = x.nextSibling; return x.nextSibling; } x = x.parentNode; if (x === root || !x) return null; }
    return null;
  }
}
if (EN) {
  new MutationObserver(muts => {
    for (const mu of muts) {
      if (mu.type === 'characterData') translateTree(mu.target);
      else mu.addedNodes.forEach(translateTree);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  window.__i18nMissing = MISSING;
}
const langButton = () => `<button type="button" class="btn sm ghost lang-btn notr" id="langBtn" title="${EN ? 'التبديل إلى العربية' : 'Switch to English'}">${EN ? 'العربية' : 'English'}</button>`;
function bindLangButton() {
  const b = $('#langBtn'); if (!b) return;
  b.onclick = () => { try { localStorage.setItem('op-lang', EN ? 'ar' : 'en'); } catch (e) { } location.reload(); };
}

function toast(msg, type = '') {
  const t = document.createElement('div');
  t.className = `toast ${type}`; t.textContent = msg;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3800);
}
function errMsg(e) {
  const m = (e && (e.message || e.error_description)) || String(e);
  if (/Invalid login credentials/i.test(m)) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  if (/already registered|already been registered/i.test(m)) return 'يوجد حساب مسجّل بهذا البريد الإلكتروني';
  if (/Password should be/i.test(m)) return 'يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام';
  if (/duplicate key.*login_email/i.test(m)) return 'بريد الدخول هذا مستخدم لعميل آخر';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت';
  if (/rate limit/i.test(m)) return 'محاولات كثيرة متتالية، انتظر دقيقة ثم أعد المحاولة';
  if (/مفيش أوردرات/.test(m)) return 'لا توجد طلبات جاهزة للتسوية';
  return m;
}
function fail(e) { console.error(e); toast(errMsg(e), 'err'); }
function formValues(form) {
  const o = {};
  $$('[name]', form).forEach(el => {
    if (el.type === 'checkbox') o[el.name] = el.checked;
    else o[el.name] = el.value.trim();
  });
  return o;
}
const nz = v => (v === '' || v == null) ? null : v;

function periodRange(p) {
  const now = new Date(); const y = now.getFullYear(), m = now.getMonth();
  switch (p) {
    case 'today': { const s = new Date(now); s.setHours(0, 0, 0, 0); return [s, null]; }
    case '7d':    return [new Date(Date.now() - 7 * 864e5), null];
    case 'month': return [new Date(y, m, 1), null];
    case 'last':  return [new Date(y, m - 1, 1), new Date(y, m, 1)];
    default:      return [null, null];
  }
}
const periodSelect = (id, sel = 'month') => `<select id="${id}">
  ${opt('today', 'اليوم', sel)}${opt('7d', 'آخر 7 أيام', sel)}${opt('month', 'هذا الشهر', sel)}
  ${opt('last', 'الشهر الماضي', sel)}${opt('all', 'كل الفترات', sel)}</select>`;

// ---------------- فلتر الفترة: زراير جاهزة + من تاريخ / إلى تاريخ ----------------
// القيم نصوص YYYY-MM-DD والنهاية داخلة في الفترة. rangeDates بيحوّلها لبداية يوم ونهاية حصرية (لفلترة التواريخ بالوقت)
const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const RANGE_PRESETS = [['today', 'اليوم'], ['yesterday', 'أمس'], ['7d', 'آخر 7 أيام'], ['30d', 'آخر 30 يوم'],
  ['month', 'هذا الشهر'], ['last', 'الشهر الماضي'], ['year', 'هذه السنة'], ['all', 'كل الفترات']];
function presetRange(p) {
  const n = new Date(), y = n.getFullYear(), m = n.getMonth(), d = n.getDate();
  const day = off => ymd(new Date(y, m, d + off));
  switch (p) {
    case 'today': return [day(0), day(0)];
    case 'yesterday': return [day(-1), day(-1)];
    case '7d': return [day(-6), day(0)];
    case '30d': return [day(-29), day(0)];
    case 'month': return [ymd(new Date(y, m, 1)), day(0)];
    case 'last': return [ymd(new Date(y, m - 1, 1)), ymd(new Date(y, m, 0))];
    case 'year': return [ymd(new Date(y, 0, 1)), day(0)];
    default: return ['', ''];
  }
}
const presetOf = (f, t) => (RANGE_PRESETS.find(([k]) => { const [a, b] = presetRange(k); return a === (f || '') && b === (t || ''); }) || [''])[0];
// presets: أسماء الزراير اللي تظهر (افتراضي الكل)
function rangePicker(id, from = '', to = '', presets = null) {
  const cur = presetOf(from, to);
  const list = presets ? RANGE_PRESETS.filter(([k]) => presets.includes(k)) : RANGE_PRESETS;
  return `<div class="rng" id="${id}">
    <span class="rng-btns">${list.map(([k, l]) => `<button type="button" class="btn sm ${k === cur ? 'active' : ''}" data-p="${k}">${l}</button>`).join('')}</span>
    <span class="rng-dates"><label class="inl">${L('من', 'From')} <input type="date" data-r="from" value="${esc(from)}"></label>
    <label class="inl">${L('إلى', 'To')} <input type="date" data-r="to" value="${esc(to)}"></label></span></div>`;
}
const rangeVal = id => { const el = $('#' + id); return el ? [$('[data-r=from]', el).value, $('[data-r=to]', el).value] : ['', '']; };
function bindRange(id, onChange) {
  const el = $('#' + id); if (!el) return;
  const mark = () => { const [f, t] = rangeVal(id); const p = presetOf(f, t); $$('[data-p]', el).forEach(b => b.classList.toggle('active', b.dataset.p === p)); };
  $$('[data-p]', el).forEach(b => b.onclick = () => {
    const [f, t] = presetRange(b.dataset.p);
    $('[data-r=from]', el).value = f; $('[data-r=to]', el).value = t; mark(); onChange(f, t);
  });
  $$('input[type=date]', el).forEach(i => i.onchange = () => {
    let [f, t] = rangeVal(id);
    if (f && t && f > t) { $('[data-r=to]', el).value = f; t = f; }   // من بعد إلى؟ نخلّيهم نفس اليوم
    mark(); onChange(f, t);
  });
}
// للفلترة على أعمدة فيها وقت: [بداية اليوم الأول، بداية اليوم بعد الأخير]
const dayStart = (s, add = 0) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d + add); };
const rangeDates = (f, t) => [f ? dayStart(f) : null, t ? dayStart(t, 1) : null];

// ---------------- Modal ----------------
function modal({ title, body, footer = '', wide = false }) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog">
    <div class="modal-h"><h3>${title}</h3><button class="x" aria-label="إغلاق">&times;</button></div>
    <div class="modal-b">${body}</div>${footer ? `<div class="modal-f">${footer}</div>` : ''}</div>`;
  const close = () => bg.remove();
  $('.x', bg).onclick = close;  // تُغلق النافذة بزر × فقط (لا تُغلق بالضغط خارجها)
  $('#modals').appendChild(bg);
  const first = $('input:not([type=checkbox]):not(:disabled),select:not(:disabled)', bg);
  if (first) setTimeout(() => first.focus(), 30);
  return { el: bg, close };
}
function confirmBox(text, okLabel = 'تأكيد', danger = false) {
  return new Promise(res => {
    const m = modal({ title: 'تأكيد', body: `<p style="margin:0">${text}</p>`,
      footer: `<button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${okLabel}</button><button class="btn" data-no>رجوع</button>` });
    $('[data-ok]', m.el).onclick = () => { m.close(); res(true); };
    $('[data-no]', m.el).onclick = () => { m.close(); res(false); };
  });
}
async function busy(btn, fn) {
  const t = btn.innerHTML; btn.disabled = true; btn.innerHTML = 'جارٍ التنفيذ...';
  try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = t; }
}

// ---------------- Supabase ----------------
const cfg = window.OPERATIVE_CONFIG || {};
const configured = cfg.SUPABASE_URL && !/YOUR-PROJECT/.test(cfg.SUPABASE_URL) && cfg.SUPABASE_ANON_KEY && !/YOUR-ANON/.test(cfg.SUPABASE_ANON_KEY);
const sb = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
// isAdmin = واجهة الشركة (مدير النظام أو موظف) — isOwner = مدير النظام فقط
const S = { user: null, profile: null, isAdmin: false, isOwner: false, isStaff: false, perms: new Set(), staffName: '', clients: [], myClient: null };
const can = p => S.isOwner || S.perms.has(p);

// صلاحيات الموظفين
const PERMS = [
  ['dashboard', 'لوحة التحكم والأرقام', 'تحتاج أيضًا صلاحية عرض الطلبات'],
  ['orders_view', 'عرض الطلبات'],
  ['orders_edit', 'إضافة الطلبات وتعديل بياناتها (بيانات المستلم والحالة)'],
  ['orders_finance', 'تعديل حسابات الطلب (الرسوم والمبلغ المحصّل) والرد على طلبات التعديل'],
  ['orders_delete', 'حذف الطلبات'],
  ['qp', 'إرسال الطلبات لشركة الشحن وتحديث حالات الشحنات'],
  ['returns', 'المرتجعات: تأكيد استلامها وحالتها وتسليمها للعملاء'],
  ['clients_view', 'عرض العملاء وأسعارهم'],
  ['clients_edit', 'إضافة وتعديل العملاء وإنشاء حسابات دخولهم'],
  ['settlements_view', 'عرض التسويات'],
  ['settlements_edit', 'إنشاء التسويات وتسجيل الدفع ورفع صور التحويل'],
  ['accounting_view', 'عرض الحسابات والتقارير المالية'],
  ['accounting_edit', 'تسجيل القيود والمصروفات وإدارة دليل الحسابات وفواتير شركة الشحن'],
  ['crm_access', 'قسم المبيعات: عملاؤه المحتملون ومتابعاتهم (أرقام عملائه فقط)'],
  ['crm_manager', 'مدير مبيعات: عملاء فريقه والتوزيع والتفويض والتارجت والتحويل إلى عميل'],
  ['crm_import', 'رفع عملاء محتملين من ملف Excel'],
];
// الصلاحية ← ما تحتاجه لتعمل
const PERM_NEEDS = { orders_edit: ['orders_view'], orders_finance: ['orders_view'], orders_delete: ['orders_view'], qp: ['orders_view'], returns: ['orders_view'],
  dashboard: ['orders_view'], clients_edit: ['clients_view'], settlements_edit: ['settlements_view'], accounting_edit: ['accounting_view'],
  crm_manager: ['crm_access'], crm_import: ['crm_access'] };
// العملاء لا يرون اسم شركة الشحن
const courierText = t => !t ? '' : S.isAdmin ? t
  : String(t).replace(/qp\s*express|qpxpress|\bqp\b|كيو\s*بي/gi, 'شركة الشحن');
const clientName = id => (S.clients.find(c => c.id === id) || {}).name || '';
const clientSelect = (id, allLabel, sel = '') =>
  `<select id="${id}">${allLabel ? opt('', allLabel, sel) : ''}${S.clients.map(c => opt(c.id, c.name, sel)).join('')}</select>`;

// ---------------- Icons ----------------
const ICON = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
  clients: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M16 4a4 4 0 010 8M22 21c0-3-2-5-4-5.6"/></svg>',
  settlements: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>',
  accounting: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h2M14 10h2M8 14h2M14 14h2M8 18h2M14 18h2"/></svg>',
  crm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20h18"/><path d="M6 20v-6M11 20V9M16 20v-9"/><path d="M4 9l5-4 4 3 7-5"/><path d="M16 3h4v4"/></svg>',
  staff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/><path d="M17 3.5l1.5 1.5L21 2.5"/></svg>',
  returns: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M9 13l-3-3 3-3"/><path d="M6 10h7a3 3 0 010 6h-1"/></svg>',
};

// =====================================================================
//  الدخول
// =====================================================================
function renderSetupNeeded() {
  $('#root').innerHTML = `<div class="login"><div class="box"><h2>Operative</h2>
    <p>لم يُربط النظام بقاعدة البيانات بعد.</p>
    <div class="alert">افتح ملف <b class="ltr">config.js</b> وأدخل فيه رابط مشروع Supabase ومفتاحه.</div></div></div>`;
}

function renderLogin(msg = '') {
  $('#modals').innerHTML = '';
  $('#root').innerHTML = `<div class="login"><form class="box" id="loginForm">
    <div class="login-top"><h2>Operative</h2>${langButton()}</div><p>تسجيل الدخول إلى النظام</p>
    <div class="grid">
      <label class="f"><span>البريد الإلكتروني</span><input name="email" type="email" required autocomplete="username" dir="ltr"></label>
      <label class="f"><span>كلمة المرور</span><input name="password" type="password" required autocomplete="current-password" dir="ltr"></label>
      <div class="err" id="loginErr">${esc(msg)}</div>
      <button class="btn primary" style="justify-content:center;padding:10px">دخول</button>
    </div></form></div>`;
  bindLangButton();
  $('#loginForm').onsubmit = async e => {
    e.preventDefault();
    const f = formValues(e.target); const btn = $('button', e.target);
    await busy(btn, async () => {
      const { data, error } = await sb.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) { $('#loginErr').textContent = errMsg(error); return; }
      await start(data.user);
    });
  };
}

async function logout() { clearInterval(bellTimer); await sb.auth.signOut(); S.user = null; location.hash = ''; renderLogin(); }

async function start(user) {
  S.user = user;
  const { data: p, error } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) return renderLogin(errMsg(error));
  if (!p || (p.role === 'client' && !p.client_id)) {
    await sb.auth.signOut();
    return renderLogin('هذا الحساب غير مرتبط بأي عميل بعد، يُرجى التواصل مع إدارة Operative');
  }
  S.perms = new Set(); S.staffName = '';
  if (p.role === 'staff') {
    const { data: acc, error: e2 } = await sb.rpc('my_access');
    if (e2) return renderLogin(errMsg(e2));
    if (!acc || !acc.active) {
      await sb.auth.signOut();
      return renderLogin('هذا الحساب موقوف، يُرجى التواصل مع إدارة Operative');
    }
    S.perms = new Set(acc.permissions || []); S.staffName = acc.name || '';
  }
  S.profile = p; S.isOwner = p.role === 'admin'; S.isStaff = p.role === 'staff'; S.isAdmin = S.isOwner || S.isStaff;
  if (S.isAdmin) await loadClients();
  else {
    const { data } = await sb.from('clients').select('*').eq('id', p.client_id).single();
    S.myClient = data; S.clients = data ? [data] : [];
  }
  renderShell(); route();
}

async function loadClients() {
  const { data, error } = await sb.from('clients').select('*').order('name');
  if (error) return fail(error);
  S.clients = data || [];
}

// =====================================================================
//  الهيكل والتنقل
// =====================================================================
const NAV_ADMIN = [['dashboard', 'لوحة التحكم', () => can('dashboard')], ['orders', 'الطلبات', () => can('orders_view')],
  ['returns', 'المرتجعات', () => can('returns')],
  ['clients', 'العملاء', () => can('clients_view') || can('clients_edit') || canCommView()], ['settlements', 'التسويات', () => can('settlements_view')],
  ['accounting', 'الحسابات', () => can('accounting_view') || can('accounting_edit')], ['crm', 'المبيعات', () => can('crm_access')],
  ['staff', 'الموظفين', () => S.isOwner]];
const NAV_CLIENT = [['dashboard', 'لوحة التحكم'], ['orders', 'طلباتي'], ['settlements', 'التسويات']];
const navItems = () => S.isAdmin ? NAV_ADMIN.filter(n => n[2]()) : NAV_CLIENT;

function renderShell() {
  const nav = navItems();
  $('#root').innerHTML = `<div class="shell">
    <aside class="sidebar">
      <div class="brand"><b>Operative</b><div>${S.isOwner ? 'لوحة إدارة الشركة' : S.isStaff ? esc(S.staffName || 'موظف') : esc(S.myClient?.name || '')}</div></div>
      <nav class="nav">${nav.map(([k, l]) => `<a href="#/${k}" data-k="${k}">${ICON[k]}<span>${l}</span></a>`).join('')}</nav>
      <div class="userbox"><div class="who ltr">${esc(S.user.email)}</div><button id="logoutBtn">خروج</button></div>
    </aside>
    <div class="main"><div class="topbar"><div class="tb-title"><h1 id="pageTitle"></h1>
        <span class="tb-tools">${S.isAdmin ? `<button class="btn sm ghost bell" id="bellBtn" title="${L('الإشعارات', 'Notifications')}">${ICON.bell}<span class="bell-n" id="bellN" style="display:none"></span></button>` : ''}
        ${langButton()}</span></div>
      <div id="pageActions" style="display:flex;gap:8px;flex-wrap:wrap"></div></div>
    <section class="view" id="view"></section></div></div>`;
  $('#logoutBtn').onclick = logout;
  bindLangButton();
  if ($('#bellBtn')) $('#bellBtn').onclick = openNotifications;
  startBell();
}

function route() {
  if (!S.user) return;
  const nav = navItems();
  let page = (location.hash.match(/^#\/(\w+)/) || [])[1];
  $('#pageActions').innerHTML = '';
  if (!nav.length) {
    setTitle('Operative');
    $('#view').innerHTML = '<div class="empty">لم تُحدَّد لك أي صلاحيات بعد، تواصل مع مدير النظام.</div>';
    return;
  }
  if (!nav.some(([k]) => k === page)) page = nav[0][0];
  $$('.nav a').forEach(a => a.classList.toggle('active', a.dataset.k === page));
  $('#view').innerHTML = '<div class="empty">جارٍ التحميل...</div>';
  ({ dashboard: viewDashboard, orders: viewOrders, returns: viewReturns, clients: viewClients, settlements: viewSettlements, accounting: viewAccounting, crm: viewCrm, staff: viewStaff })[page]();
}
window.addEventListener('hashchange', route);
const setTitle = t => { $('#pageTitle').textContent = t; document.title = `${tr(t)} — Operative`; };

// =====================================================================
//  لوحة التحكم
// =====================================================================
async function viewDashboard() {
  setTitle('لوحة التحكم');
  const fin = S.isAdmin && (can('accounting_view') || can('accounting_edit'));
  const [df, dtTo] = presetRange('month');
  $('#view').innerHTML = `<div class="toolbar">${rangePicker('dRange', df, dtTo)}
    ${S.isAdmin ? clientSelect('dClient', 'كل العملاء') : ''}</div>
    ${fin ? `<div class="dash-sec">${L('الأرباح والحسابات', 'Profit & accounts')}</div><div id="dFin"><div class="empty">جارٍ التحميل...</div></div>` : ''}
    ${fin ? `<div class="dash-sec">${L('الطلبات والشحنات', 'Orders & shipments')}</div>` : ''}
    <div class="cards" id="dCards"></div>
    ${fin ? '<div id="dProfit"></div>' : ''}<div id="dExtra"></div>`;
  let PD = null; // بيانات الربح (تُحمَّل مرة واحدة)
  const load = async () => {
    const [from, to] = rangeDates(...rangeVal('dRange'));
    const client = S.isAdmin ? nz($('#dClient').value) : S.profile.client_id;
    const [a, b] = await Promise.all([
      sb.rpc('dashboard_stats', { p_from: from, p_to: to, p_client: client }),
      sb.rpc('dashboard_stats', { p_client: client }),
    ]);
    if (a.error) return fail(a.error);
    const s = a.data, all = b.data || {};
    const closed = s.delivered + s.returned;
    const rate = closed ? Math.round(s.delivered * 100 / closed) : 0;
    const cards = [
      ['إجمالي الطلبات', s.total], ['قيد التجهيز', s.new], ['في الطريق', s.in_transit, 'indigo'], ['منها هولد', s.on_hold ?? 0, 'orange'],
      ['تم التسليم', s.delivered, 'green'], ['مرتجع', s.returned, 'red'], ['نسبة التسليم', `${rate}%`],
      ['تحصيل متوقع (طلبات مفتوحة)', egp(s.cod_pending)], ['المحصّل', egp(s.collected), 'green'],
      [S.isAdmin ? 'رسوم الطلبات على العملاء' : 'إجمالي التكلفة', egp(s.fees)],
      [S.isAdmin ? 'مستحقات العملاء غير المسوّاة' : 'رصيدك المستحق غير المسوّى', egp(all.unsettled_net), 'primary'],
    ];
    $('#dCards').innerHTML = cards.map(([l, v, c]) =>
      `<div class="card ${c || ''}"><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('');
    if (fin) {
      try {
        if (!PD) PD = await loadProfitData();
        await renderFinance(PD, from, to);
        renderProfit(PD, from, to, client);
      } catch (e) { fail(e); }
    }
  };
  bindRange('dRange', load);
  if (S.isAdmin) $('#dClient').onchange = load;
  await load();

  if (S.isAdmin) {
    const { data, error } = await sb.rpc('clients_summary');
    if (error) return fail(error);
    $('#dExtra').innerHTML = `<div class="panel"><div class="panel-h">ملخص العملاء (كل الفترات)</div><div class="table-wrap">
      <table class="t"><thead><tr><th>العميل</th><th>الطلبات</th><th>في الطريق</th><th>تم التسليم</th><th>مرتجع</th>
      <th class="hide-sm">نسبة التسليم</th><th class="hide-sm">المحصّل</th><th>مستحق غير مسوّى</th></tr></thead><tbody>
      ${(data || []).map(r => { const c = +r.delivered + +r.returned;
        return `<tr><td><b>${esc(r.name)}</b></td><td class="num">${r.total}</td><td class="num">${r.in_transit}</td>
        <td class="num">${r.delivered}</td><td class="num">${r.returned}</td><td class="num hide-sm">${c ? Math.round(r.delivered * 100 / c) : 0}%</td>
        <td class="num hide-sm">${money(r.collected)}</td><td>${signed(r.unsettled_net)}</td></tr>`; }).join('')
        || '<tr><td colspan="8" class="empty">لا يوجد عملاء بعد، ابدأ من صفحة العملاء</td></tr>'}
      </tbody></table></div></div>`;
  } else {
    const c = S.myClient || {};
    // الأسعار الفعلية (من الباقة لو العميل عليه باقة، وأسعاره الخاصة بتغلب)
    let P = null;
    const { data: cp, error: cpe } = await sb.rpc('client_prices', { p_client: c.id });
    if (!cpe && cp) P = { f: cp.fulfillment, r: cp.return, s: cp.shipping, rates: cp.rates || [] };
    else {   // قبل migration-022
      const { data: rates } = await sb.from('client_shipping_rates').select('*').eq('client_id', c.id).order('governorate');
      P = { f: c.fulfillment_fee, r: c.return_fee, s: c.default_shipping_fee,
        rates: (rates || []).map(x => ({ governorate: x.governorate, price: x.price ?? c.default_shipping_fee, return_price: x.return_price ?? c.return_fee })) };
    }
    $('#dExtra').innerHTML = `<div class="panel"><div class="panel-h">أسعار الخدمة الخاصة بك</div><div class="panel-b">
      <dl class="kv"><dt>التجهيز والتغليف</dt><dd>${egp(P.f)} / طلب</dd>
      <dt>المرتجع (أساسي)</dt><dd>${egp(P.r)}</dd>
      <dt>الشحن (أساسي)</dt><dd>${egp(P.s)}</dd></dl>
      <p class="hint" style="margin:10px 0 0">الطلب المسلَّم: الصافي = المبلغ المحصّل − (الشحن + التجهيز). الطلب المرتجع: الصافي = المبلغ المحصّل إن وُجد − (المرتجع + التجهيز).</p>
      ${P.rates.length ? `<div class="section-title">الأسعار حسب المحافظة</div>
        <div class="table-wrap"><table class="t"><thead><tr><th>المحافظة</th><th>الشحن</th><th>المرتجع</th></tr></thead><tbody>
        ${P.rates.map(r => `<tr><td>${esc(r.governorate)}</td><td>${egp(r.price)}</td><td>${egp(r.return_price)}</td></tr>`).join('')}
        </tbody></table></div>` : ''}
    </div></div>`;
  }
}

// ---------------- لوحة التحكم: الأرباح ----------------
// جلب كل الصفوف على دفعات (Supabase بيرجّع 1000 صف بحد أقصى في الطلب الواحد)
async function fetchAllRows(build) {
  const out = []; const N = 1000;
  for (let i = 0; ; i += N) {
    const { data, error } = await build().range(i, i + N - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < N) return out;
  }
}
// توحيد أسماء البراندات (نفس البراند بيتكتب عربي وإنجليزي)
const BRAND_ALIAS = { 'كيزك': 'Caseq', 'كيس كيو': 'Caseq', 'بامبي': 'Bambie', 'بامبي ستوديو': 'Bambie', 'bambie studio': 'Bambie',
  'جراباتي': 'Grabatty', 'كليوري': 'Cleory', 'كوزي': 'Cozy', 'كارتال': 'Kartall',
  'اليزيه سيلفر': 'اليزيه سيلڤر', 'ايليزيه سيلفر': 'اليزيه سيلڤر', 'eleze silver': 'اليزيه سيلڤر' };
const brandKey = b => String(b || '').trim().toLowerCase().replace(/\s+/g, ' ')
  .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ڤ/g, 'ف');
const BRAND_NORM = Object.fromEntries(Object.entries(BRAND_ALIAS).map(([k, v]) => [brandKey(k), v]));
const brandName = b => { const k = brandKey(b); if (!k) return ''; if (BRAND_NORM[k]) return BRAND_NORM[k];
  const t = String(b).trim().replace(/\s+/g, ' '); return /^[a-z]/.test(t) ? t[0].toUpperCase() + t.slice(1) : t; };

async function loadProfitData() {
  await loadAccounts();
  const [orders, lines, trialAll, inv] = await Promise.all([
    fetchAllRows(() => sb.from('orders').select('id,client_id,brand,status,governorate,shipping_fee,fulfillment_fee,return_fee,closed_at')
      .in('status', ['delivered', 'returned']).not('closed_at', 'is', null).order('closed_at').order('id')),
    fetchAllRows(() => sb.from('qp_invoice_lines').select('order_id,total_fees').not('order_id', 'is', null).order('id')),
    sb.rpc('acc_trial', { p_from: null, p_to: null }),
    sb.from('qp_invoices').select('id,total_cod,received').eq('received', false),
  ]);
  if (trialAll.error) throw trialAll.error;
  // تكلفة شركة الشحن الفعلية لكل طلب من الفواتير
  const actual = {};
  lines.forEach(l => { actual[l.order_id] = (actual[l.order_id] || 0) + +l.total_fees; });
  // متوسط رسوم شركة الشحن حسب الحالة والمحافظة (للطلبات اللي فاتورتها لسه ما اترفعتش) — من غير المرتجعات المجانية عشان التقدير ما يبقاش متفائل
  const acc = {};
  const add = (k, v) => { const x = acc[k] || (acc[k] = [0, 0]); x[0] += v; x[1]++; };
  orders.forEach(o => { const c = actual[o.id]; if (c == null || c <= 0) return; add(o.status + '|' + o.governorate, c); add(o.status, c); });
  const avg = k => acc[k] ? Math.round(acc[k][0] / acc[k][1]) : null;
  const rows = orders.map(o => {
    const rev = +o.fulfillment_fee + (o.status === 'delivered' ? +o.shipping_fee : +o.return_fee);
    const has = actual[o.id] != null;
    const cost = has ? actual[o.id]
      : (avg(o.status + '|' + o.governorate) ?? avg(o.status) ?? (o.status === 'delivered' ? +o.shipping_fee : +o.return_fee));
    return { client: o.client_id, brand: brandName(o.brand), status: o.status, at: new Date(o.closed_at), rev, cost, est: !has };
  });
  return { rows, trialAll: trialAll.data || [], unpaidInv: inv.data || [] };
}

// إجماليات الحسابات من ميزان المراجعة
function accTotals(trial) {
  const t = { rev: 0, exp: 0, ship: 0, bal: {} };
  trial.forEach(r => {
    const a = A.byId[r.account_id]; if (!a) return;
    const mv = +r.debit - +r.credit;
    t.bal[a.id] = (t.bal[a.id] || 0) + +r.opening + mv;
    if (a.type === 'revenue') t.rev -= mv;
    if (a.type === 'expense') { t.exp += mv; if (a.system_key === 'ship_cost') t.ship += mv; }
  });
  return t;
}
const pct = (a, b) => b ? `${Math.round(a * 100 / b)}%` : '—';
const fcard = (l, v, c = '', sub = '', href = '') =>
  `<${href ? `a href="${href}"` : 'div'} class="card ${c} ${href ? 'link' : ''}"><div class="lbl">${l}</div><div class="val">${v}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</${href ? 'a' : 'div'}>`;

async function renderFinance(PD, from, to) {
  const el = $('#dFin'); if (!el) return;
  const start = A.start ? new Date(A.start + 'T00:00:00') : null;
  // الفترة بتاريخ القاهرة؛ نهاية الفترة في periodRange مش داخلة فيها
  let f = from ? isoDay(from) : null; const t = to ? isoDay(new Date(to.getTime() - 864e5)) : null;
  const clipped = start && (!from || from < start);
  if (clipped) f = A.start;
  let P = null;
  if (!(t && A.start && t < A.start)) {
    const { data, error } = await sb.rpc('acc_trial', { p_from: f, p_to: t });
    if (error) return fail(error);
    P = accTotals(data || []);
  }
  const N = accTotals(PD.trialAll);
  const balOf = filt => A.list.filter(a => a.level === 3 && filt(a)).reduce((s, a) => s + (N.bal[a.id] || 0), 0);
  const cash = balOf(a => a.kind === 'cash' || a.kind === 'bank');
  const qp = balOf(a => a.system_key === 'qp_receivable');
  const owed = -balOf(a => a.system_key === 'client_funds');
  const outside = -balOf(a => a.system_key === 'outside_collections');
  const unpaid = PD.unpaidInv.reduce((s, i) => s + +i.total_cod, 0);
  const net = P ? P.rev - P.exp : 0;
  const sinceTxt = clipped ? L(`من بداية الحسابات ${dt(A.start)}`, `since accounts start ${dt(A.start)}`) : '';
  el.innerHTML = `<div class="cards">
      ${fcard(net >= 0 ? L('صافي الربح', 'Net profit') : L('صافي الخسارة', 'Net loss'), P ? egp(net) : '—', 'primary',
        P ? (sinceTxt || L('الإيرادات − كل المصروفات', 'Revenue − all expenses')) : L('الفترة قبل بداية الحسابات', 'Period is before accounts start'), '#/accounting/income')}
      ${fcard(L('إيرادات Operative', 'Operative revenue'), P ? egp(P.rev) : '—', 'green', L('شحن + تجهيز + مرتجعات', 'Shipping + fulfillment + returns'))}
      ${fcard(L('تكلفة الشحن', 'Shipping cost'), P ? egp(P.ship) : '—', 'red', L('رسوم شركة الشحن', 'Courier fees'))}
      ${fcard(L('مصروفات التشغيل', 'Operating expenses'), P ? egp(P.exp - P.ship) : '—', 'red', L('مرتبات، إيجار، وغيرها', 'Salaries, rent, etc.'))}
      ${fcard(L('هامش الربح', 'Profit margin'), P ? pct(net, P.rev) : '—', '', L('صافي الربح ÷ الإيرادات', 'Net profit ÷ revenue'))}
    </div>
    <div class="cards">
      ${fcard(L('النقدية (الخزنة + البنك)', 'Cash (safe + bank)'), egp(cash), '', L('الرصيد الحالي', 'Current balance'), '#/accounting/balance')}
      ${fcard(L('فلوس عند شركة الشحن', 'Held by courier'), egp(qp), 'indigo', L('تحصيلات لسه ما اتحوّلتش', 'Collections not yet transferred'), '#/accounting/qp')}
      ${fcard(L('فواتير شحن لم تُحوَّل', 'Courier invoices not received'), egp(unpaid), 'orange', L(`${PD.unpaidInv.length} فاتورة`, `${PD.unpaidInv.length} invoice(s)`), '#/accounting/qp')}
      ${fcard(L('مستحق للعملاء', 'Owed to clients'), egp(owed), 'red', L('أموال العملاء المحصّلة', 'Collected client funds'), '#/accounting/clients')}
      ${Math.abs(outside) >= 0.005 ? fcard(L('تحصيلات براندات خارج النظام', 'Outside-system brand collections'), egp(outside), '', L('حسب البراند', 'By brand'), '#/accounting/clients') : ''}
    </div>
    <div class="quick-links">${[['income', 'قائمة الدخل'], ['balance', 'الميزانية العمومية'], ['trial', 'ميزان المراجعة'],
      ['clients', 'أرصدة العملاء'], ['qp', 'فواتير شركة الشحن'], ['journal', 'القيود']]
      .map(([k, l]) => `<a class="btn sm" href="#/accounting/${k}">${l}</a>`).join('')}</div>`;
}

function renderProfit(PD, from, to, client) {
  const el = $('#dProfit'); if (!el) return;
  const inP = r => (!from || r.at >= from) && (!to || r.at < to);
  const mine = PD.rows.filter(r => !client || r.client === client);
  const rows = mine.filter(inP);
  // تجميع: عميل ← براند
  const G = {};
  rows.forEach(r => {
    const c = G[r.client] || (G[r.client] = { n: 0, d: 0, ret: 0, rev: 0, cost: 0, est: 0, brands: {} });
    const b = c.brands[r.brand] || (c.brands[r.brand] = { n: 0, d: 0, ret: 0, rev: 0, cost: 0, est: 0 });
    [c, b].forEach(x => { x.n++; x[r.status === 'delivered' ? 'd' : 'ret']++; x.rev += r.rev; x.cost += r.cost; if (r.est) x.est++; });
  });
  const T = Object.values(G).reduce((t, c) => { t.n += c.n; t.rev += c.rev; t.cost += c.cost; t.est += c.est; return t; }, { n: 0, rev: 0, cost: 0, est: 0 });
  const tp = T.rev - T.cost;
  const cells = x => { const p = x.rev - x.cost;
    return `<td class="num">${x.n} <span class="muted small hide-sm">(${x.d}/${x.ret})</span></td><td class="hide-sm">${amt(x.rev)}</td>
      <td class="hide-sm">${amt(x.cost)}${x.est ? ` <span class="badge b-amber ltr" title="${L('طلبات تكلفتها تقديرية لأن فاتورة شركة الشحن بتاعتها لسه ما اترفعتش', 'Orders with estimated cost (courier invoice not uploaded yet)')}">~${x.est}</span>` : ''}</td>
      <td>${signed(p)}</td><td class="num hide-sm">${pct(p, x.rev)}</td><td class="num">${tp > 0 ? pct(p, tp) : '—'}</td>`; };
  const body = Object.entries(G).sort((a, b) => (b[1].rev - b[1].cost) - (a[1].rev - a[1].cost)).map(([cid, c]) => {
    const bl = Object.entries(c.brands).sort((a, b) => (b[1].rev - b[1].cost) - (a[1].rev - a[1].cost));
    const showBrands = bl.filter(([b]) => b).length > 1; // التفصيل لما العميل يكون تحته أكتر من براند
    return `<tr class="${showBrands ? 'grp' : ''}"><td><b>${esc(clientName(cid) || '—')}</b></td>${cells(c)}</tr>` +
      (showBrands ? bl.map(([b, x]) => `<tr class="sub-row"><td class="ind2">${b ? esc(b) : `<span class="muted">${L('بدون براند', 'No brand')}</span>`}</td>${cells(x)}</tr>`).join('') : '');
  }).join('');

  // آخر 6 شهور (مجمل الربح من الطلبات)
  const now = new Date(); const months = [];
  for (let i = 5; i >= 0; i--) {
    const s = new Date(now.getFullYear(), now.getMonth() - i, 1), e = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const m = mine.filter(r => r.at >= s && r.at < e);
    const rev = m.reduce((a, r) => a + r.rev, 0), cost = m.reduce((a, r) => a + r.cost, 0);
    months.push({ s, n: m.length, rev, cost, p: rev - cost });
  }
  const mx = Math.max(1, ...months.map(m => Math.abs(m.p)));
  const hasNeg = months.some(m => m.p < 0);
  const monthName = d => d.toLocaleDateString(EN ? 'en-GB' : 'ar-EG-u-nu-latn', { month: 'short', year: '2-digit' });
  const chart = `<div class="mchart ${hasNeg ? 'has-neg' : ''}">${months.map(m => {
    const h = Math.round(Math.abs(m.p) * 100 / mx);
    const tip = `${monthName(m.s)} — ${L('الطلبات', 'Orders')}: ${m.n} · ${L('الإيراد', 'Revenue')}: ${money(m.rev)} · ${L('تكلفة الشحن', 'Shipping cost')}: ${money(m.cost)} · ${L('مجمل الربح', 'Gross profit')}: ${money(m.p)}`;
    return `<div class="mcol" title="${esc(tip)}" tabindex="0"><div class="mval ltr">${m.n ? money(m.p) : ''}</div>
      <div class="mplot"><div class="mbar ${m.p < 0 ? 'neg' : ''}" style="height:${m.n ? Math.max(h, 2) : 0}%"></div></div>
      <div class="mlbl">${esc(monthName(m.s))}</div></div>`; }).join('')}</div>`;

  el.innerHTML = `<div class="dash-grid">
    <div class="panel"><div class="panel-h"><span>${L('الربح حسب العميل والبراند', 'Profit by client & brand')}</span>
      <span class="muted small">${L('الطلبات المقفولة في الفترة', 'Orders closed in period')}</span></div><div class="table-wrap">
      <table class="t profit"><thead><tr><th>${L('العميل / البراند', 'Client / brand')}</th><th>${L('الطلبات', 'Orders')} <span class="muted small hide-sm">(${L('مسلّم/مرتجع', 'del./ret.')})</span></th>
        <th class="hide-sm">${L('إيرادنا', 'Our revenue')}</th><th class="hide-sm">${L('تكلفة الشحن', 'Shipping cost')}</th><th>${L('مجمل الربح', 'Gross profit')}</th>
        <th class="hide-sm">${L('الهامش', 'Margin')}</th><th>${L('من الربح', 'Share')}</th></tr></thead>
      <tbody>${body || `<tr><td colspan="7" class="empty">${L('لا توجد طلبات مسلّمة أو مرتجعة في الفترة', 'No delivered or returned orders in this period')}</td></tr>`}</tbody>
      ${body ? `<tfoot><tr><td>${L('الإجمالي', 'Total')}</td><td class="num">${T.n}</td><td class="hide-sm">${amt(T.rev)}</td><td class="hide-sm">${amt(T.cost)}</td>
        <td>${signed(tp)}</td><td class="num hide-sm">${pct(tp, T.rev)}</td><td class="num">100%</td></tr></tfoot>` : ''}</table></div>
      <p class="hint" style="padding:0 16px">${L(`مجمل الربح = رسومنا على العميل (شحن أو مرتجع + تجهيز) − رسوم شركة الشحن، قبل المصروفات العامة (مرتبات، إيجار…). التكلفة من فواتير شركة الشحن المرفوعة؛ والطلبات اللي فاتورتها لسه ما اترفعتش (عليها <span class="badge b-amber">~</span>) تكلفتها تقديرية بمتوسط رسوم شركة الشحن لنفس المحافظة.${T.est ? ` في الفترة دي ${T.est} طلب من ${T.n} تكلفتهم تقديرية.` : ''}`,
        `Gross profit = our fees to the client (shipping or return + fulfillment) − courier fees, before overheads (salaries, rent…). Cost comes from uploaded courier invoices; orders whose invoice isn't uploaded yet (marked <span class="badge b-amber">~</span>) use the courier's average fee for the same governorate.${T.est ? ` ${T.est} of ${T.n} orders in this period are estimated.` : ''}`)}</p></div>
    <div class="panel"><div class="panel-h"><span>${L('مجمل الربح — آخر 6 شهور', 'Gross profit — last 6 months')}</span>
      <span class="muted small">${client ? esc(clientName(client)) : L('كل العملاء', 'All clients')}</span></div>
      <div class="panel-b">${chart}<p class="hint" style="margin:8px 0 0">${L('مرّر على أي شهر لعرض التفاصيل.', 'Hover a month for details.')}</p></div></div>
  </div>`;
}

// =====================================================================
//  الأوردرات
// =====================================================================
// from/to: فلتر الفترة (YYYY-MM-DD)، df: على تاريخ الطلب (created_at) أو تاريخ الإقفال (closed_at)
const OF = { q: '', status: '', client: '', page: 0, from: '', to: '', df: 'created_at' };
let selected = new Set();

function ordersQuery(select = '*', withCount = true) {
  // رقم الطلب كترتيب ثانٍ: الطلبات المرفوعة من Excel لها نفس created_at، وبدونه تتكرر أو تختفي صفوف بين الصفحات
  let q = sb.from('orders').select(select, withCount ? { count: 'exact' } : undefined)
    .order('created_at', { ascending: false }).order('order_no', { ascending: false });
  if (OF.status) q = q.eq('status', OF.status);
  if (OF.client) q = q.eq('client_id', OF.client);
  const [rf, rt] = rangeDates(OF.from, OF.to);
  if (rf) q = q.gte(OF.df, rf.toISOString());
  if (rt) q = q.lt(OF.df, rt.toISOString());
  const t = OF.q.replace(/[,()*%"\\]/g, ' ').trim();
  if (t) {
    const parts = ['customer_name', 'customer_phone', 'qp_tracking', 'client_ref', 'brand'].map(c => `${c}.ilike."*${t}*"`);
    const n = t.replace(/^#/, '');
    if (/^\d+$/.test(n) && n.length < 10) parts.push(`order_no.eq.${n}`);
    q = q.or(parts.join(','));
  }
  return q;
}

async function viewOrders() {
  setTitle(S.isAdmin ? 'الطلبات' : 'طلباتي');
  const canAdd = !S.isAdmin || can('orders_edit');
  $('#pageActions').innerHTML = `${S.isAdmin && can('qp') ? `<button class="btn" id="qpSyncBtn" title="جلب آخر حالات الشحنات من QP">تحديث حالات QP</button>` : ''}
    ${S.isOwner ? `<button class="btn ghost" id="qpSetBtn">إعدادات QP</button>` : ''}
    <button class="btn" id="exportBtn">تصدير إلى Excel</button>
    ${canAdd ? `<button class="btn" id="importBtn">رفع طلبات من Excel</button>
    <button class="btn primary" id="addOrderBtn">+ طلب جديد</button>` : ''}`;
  if ($('#qpSyncBtn')) $('#qpSyncBtn').onclick = e => busy(e.currentTarget, qpSyncNow);
  if ($('#qpSetBtn')) $('#qpSetBtn').onclick = openQpSettings;
  if (canAdd) {
    $('#addOrderBtn').onclick = () => openOrder(null);
    $('#importBtn').onclick = openImport;
  }
  $('#exportBtn').onclick = e => busy(e.currentTarget, exportOrders);
  selected = new Set();
  $('#view').innerHTML = `<div class="toolbar">
      <input class="grow" id="oQ" placeholder="بحث: الاسم، الهاتف، رقم الطلب، رقم التتبع" value="${esc(OF.q)}">
      <select id="oStatus">${statusOptions(OF.status, true)}</select>
      ${S.isAdmin ? clientSelect('oClient', 'كل العملاء', OF.client) : ''}
    </div>
    <div class="toolbar"><select id="oDf" title="${L('الفترة على أي تاريخ', 'Which date the period uses')}">${opt('created_at', L('تاريخ الطلب', 'Order date'), OF.df)}${opt('closed_at', L('تاريخ التسليم / الإرجاع', 'Delivery / return date'), OF.df)}</select>
      ${rangePicker('oRange', OF.from, OF.to)}</div>
    <div id="bulk"></div><div class="panel" id="oPanel"></div>`;
  let timer;
  $('#oQ').oninput = e => { clearTimeout(timer); timer = setTimeout(() => { OF.q = e.target.value; OF.page = 0; loadOrders(); }, 350); };
  $('#oStatus').onchange = e => { OF.status = e.target.value; OF.page = 0; loadOrders(); };
  if (S.isAdmin) $('#oClient').onchange = e => { OF.client = e.target.value; OF.page = 0; loadOrders(); };
  bindRange('oRange', (f, t) => { OF.from = f; OF.to = t; OF.page = 0; loadOrders(); });
  $('#oDf').onchange = e => { OF.df = e.target.value; OF.page = 0; if (OF.from || OF.to) loadOrders(); };
  await loadOrders();
}

async function loadOrders() {
  const from = OF.page * PAGE;
  const { data, count, error } = await ordersQuery().range(from, from + PAGE - 1);
  if (error) {
    // الصفحة المطلوبة بعد آخر صف (بعد حذف مثلًا): نرجع لأول صفحة بدل رسالة خطأ
    if (OF.page > 0 && (error.code === 'PGRST103' || /range/i.test(error.message || ''))) { OF.page = 0; return loadOrders(); }
    return fail(error);
  }
  const rows = data || [];
  // الصفحة فضيت (بعد حذف أو تغيير حالة مثلًا)؟ نرجع للصفحة السابقة
  if (!rows.length && OF.page > 0) { OF.page = count ? Math.min(OF.page - 1, Math.floor((count - 1) / PAGE)) : 0; return loadOrders(); }
  const A = S.isAdmin;
  const SEL = A && (can('qp') || can('orders_edit'));  // عمود التحديد للعمليات الجماعية
  $('#oPanel').innerHTML = `<div class="table-wrap"><table class="t"><thead><tr>
    ${SEL ? '<th class="w1"><input type="checkbox" id="selAll"></th>' : ''}
    <th>رقم</th>${A ? '<th class="hide-sm">العميل</th>' : ''}<th>المستلم</th><th class="hide-sm">المحافظة</th><th>التحصيل</th><th>الحالة</th>
    <th class="hide-sm">رقم التتبع</th><th class="hide-sm">التاريخ</th></tr></thead><tbody>
    ${rows.map(o => `<tr class="click ${selected.has(o.id) ? 'selected' : ''}" data-id="${o.id}">
      ${SEL ? `<td><input type="checkbox" class="sel" ${selected.has(o.id) ? 'checked' : ''}></td>` : ''}
      <td class="num"><b>${orderNo(o)}</b> ${kindBadge(o.kind)}${o.brand || o.client_ref ? `<div class="muted small">${esc([o.brand, o.client_ref].filter(Boolean).join(' · '))}</div>` : ''}</td>
      ${A ? `<td class="hide-sm">${esc(clientName(o.client_id))}</td>` : ''}
      <td>${esc(o.customer_name)}<div class="muted small"><span class="ltr">${esc(o.customer_phone)}</span></div></td>
      <td class="hide-sm">${esc(o.governorate)}<div class="muted small">${esc(o.city || '')}</div></td>
      <td class="num">${money(o.cod_amount)}</td><td>${badge(o.status)}</td>
      <td class="small hide-sm"><span class="ltr">${esc(o.qp_tracking || '')}</span>${o.qp_status ? `<div class="muted small">${esc(courierText(o.qp_status))}</div>` : ''}</td><td class="num small hide-sm">${dt(o.created_at)}</td></tr>`).join('')
      || `<tr><td colspan="9" class="empty">لا توجد طلبات${OF.q || OF.status || OF.client || OF.from || OF.to ? ' مطابقة للبحث' : ' بعد'}</td></tr>`}
    </tbody></table></div>
    <div class="pager"><span>${count ? `${from + 1}–${from + rows.length} من ${count}` : ''}</span>
      <span><button class="btn sm" id="pgPrev" ${OF.page === 0 ? 'disabled' : ''}>السابق</button>
      <button class="btn sm" id="pgNext" ${from + rows.length >= (count || 0) ? 'disabled' : ''}>التالي</button></span></div>`;
  $('#pgPrev').onclick = () => { OF.page--; loadOrders(); };
  $('#pgNext').onclick = () => { OF.page++; loadOrders(); };
  $$('#oPanel tbody tr[data-id]').forEach(tr => {
    tr.onclick = e => {
      if (e.target.closest('.sel')) return;
      const o = rows.find(r => r.id === tr.dataset.id); openOrder(o);
    };
    const cb = $('.sel', tr);
    if (cb) cb.onchange = () => { cb.checked ? selected.add(tr.dataset.id) : selected.delete(tr.dataset.id); tr.classList.toggle('selected', cb.checked); renderBulk(); };
  });
  const all = $('#selAll');
  if (all) all.onchange = () => { $$('#oPanel .sel').forEach(cb => { cb.checked = all.checked; cb.onchange(); }); };
  renderBulk();
}

function renderBulk() {
  const el = $('#bulk'); if (!el) return;
  if (!S.isAdmin || !selected.size) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="bulkbar"><b>تم تحديد ${selected.size} طلب</b>
    ${can('qp') ? '<button class="btn primary sm" id="bulkQp">إرسال إلى QP</button>' : ''}
    ${can('orders_edit') ? `<span class="sep"></span>
    <span>تغيير الحالة إلى:</span><select id="bulkStatus">${statusOptions('shipped')}</select>
    <button class="btn sm" id="bulkApply">تطبيق</button>` : ''}
    <button class="btn ghost sm" id="bulkClear">إلغاء التحديد</button></div>`;
  $('#bulkClear').onclick = () => { selected.clear(); loadOrders(); };
  if ($('#bulkQp')) $('#bulkQp').onclick = sendToQp;
  if ($('#bulkApply')) $('#bulkApply').onclick = e => busy(e.currentTarget, async () => {
    const st = $('#bulkStatus').value;
    const ids = [...selected];
    // على دفعات: قائمة طويلة من المعرّفات في طلب واحد بتعدّي حد طول الرابط
    for (let i = 0; i < ids.length; i += 100) {
      const { error } = await sb.from('orders').update({ status: st }).in('id', ids.slice(i, i + 100));
      if (error) { fail(error); selected.clear(); return loadOrders(); }
    }
    toast(`تم تغيير حالة ${ids.length} طلب`, 'ok'); selected.clear(); loadOrders();
  });
}

// =====================================================================
//  الربط مع QP Express
// =====================================================================
const sleep = ms => new Promise(r => setTimeout(r, ms));

// تجهيز جلسة QP (تسجيل الدخول يتم في الخلفية، نكرر السؤال حتى يجهز)
async function qpEnsureLogin() {
  for (let i = 0; i < 40; i++) {
    const { data, error } = await sb.rpc('qp_login');
    if (error) throw error;
    if (data.state === 'ready') return data;
    if (data.state === 'error') throw new Error(data.msg);
    await sleep(i < 5 ? 600 : 1200);
  }
  throw new Error('انتهت مهلة الاتصال بـ QP، حاول مرة أخرى');
}

async function sendToQp() {
  const ids = [...selected];
  const data = [];
  for (let i = 0; i < ids.length; i += 100) {
    const { data: part, error } = await sb.from('orders').select('id, order_no, status, qp_tracking, customer_name, governorate')
      .in('id', ids.slice(i, i + 100));
    if (error) return fail(error);
    data.push(...(part || []));
  }
  data.sort((a, b) => a.order_no - b.order_no);
  const ok = data.filter(o => ['new', 'processing'].includes(o.status) && !o.qp_tracking);
  const skip = data.length - ok.length;
  if (!ok.length) return toast('لا توجد طلبات صالحة للإرسال — يُرسل فقط الطلب الجديد أو قيد التجهيز الذي ليس له رقم تتبع', 'err');
  if (!await confirmBox(L(`سيتم إرسال <b>${ok.length}</b> طلب إلى QP${skip ? ` (وسيتم تخطي ${skip} طلب سبق إرساله أو حالته لا تسمح)` : ''}. هل تريد المتابعة؟`,
    `<b>${ok.length}</b> order(s) will be sent to QP${skip ? ` (${skip} already sent or not eligible will be skipped)` : ''}. Continue?`), 'إرسال')) return;

  const m = modal({ title: 'إرسال الطلبات إلى QP', wide: true,
    body: `<div class="qp-prog"><div class="bar"><i id="qpBar"></i></div><div id="qpCount" class="muted small">جارٍ الاتصال بـ QP...</div></div>
      <div class="table-wrap"><table class="t"><thead><tr><th>الطلب</th><th>المستلم</th><th>النتيجة</th></tr></thead>
      <tbody id="qpRes">${ok.map(o => `<tr data-id="${o.id}"><td class="num"><b>${orderNo(o)}</b></td><td>${esc(o.customer_name)}
        <div class="muted small">${esc(o.governorate)}</div></td><td class="r muted">في الانتظار...</td></tr>`).join('')}</tbody></table></div>`,
    footer: `<button class="btn primary" id="qpDone" disabled>إغلاق</button>` });
  const cell = id => $(`#qpRes tr[data-id="${id}"] .r`, m.el);
  const setCell = (id, cls, html) => { const c = cell(id); if (c) { c.className = 'r ' + cls; c.innerHTML = html; } };
  const progress = (n, label) => { $('#qpBar', m.el).style.width = `${Math.round(n * 100 / ok.length)}%`; $('#qpCount', m.el).innerHTML = label; };
  const finish = () => {
    const btn = $('#qpDone', m.el); btn.disabled = false;
    btn.onclick = () => { m.close(); selected.clear(); loadOrders(); };
    $('.x', m.el).onclick = btn.onclick;
  };

  try { await qpEnsureLogin(); }
  catch (e) {
    $$('#qpRes .r', m.el).forEach(c => { c.className = 'r err-txt'; c.textContent = 'لم يُرسل'; });
    progress(0, `<span class="err-txt">${esc(errMsg(e))}</span>`); return finish();
  }

  // 1) إرسال الطلبات (تُرسل في الخلفية)
  const queued = [];
  for (const o of ok) {
    setCell(o.id, 'muted', 'جارٍ الإرسال...');
    try {
      const { data: r, error: e } = await sb.rpc('qp_send_order', { p_id: o.id });
      if (e) throw e;
      if (r && r.ok) queued.push(o.id); else setCell(o.id, 'err-txt', esc((r && r.msg) || 'فشل'));
    } catch (e) { setCell(o.id, 'err-txt', esc(errMsg(e))); }
  }
  progress(0, `بانتظار رد QP... (0 / ${queued.length})`);

  // 2) متابعة الردود حتى تكتمل
  let good = 0, done = 0;
  for (let i = 0; i < 60 && queued.length; i++) {
    await sleep(i < 3 ? 800 : 1500);
    const { data: rs, error: e } = await sb.rpc('qp_send_results', { p_ids: queued });
    if (e) { fail(e); break; }
    good = 0; done = 0;
    rs.forEach(r => {
      if (r.pending) return;
      done++;
      if (r.ok) { good++; setCell(r.id, 'ok-txt', `تم ✓ رقم التتبع <span class="ltr"><b>${esc(r.serial)}</b></span>`); }
      else setCell(r.id, 'err-txt', esc(r.msg || 'فشل'));
    });
    progress(done, `بانتظار رد QP... (${done} / ${queued.length})`);
    if (done >= queued.length) break;
  }
  progress(ok.length, `<b>تم إرسال ${good} من ${ok.length} طلب</b>${done < queued.length ? ' — باقي الردود ستُحدَّث تلقائيًا' : ''}`);
  finish();
}

async function qpSyncNow() {
  try { await qpEnsureLogin(); } catch (e) { return toast('تعذّر الاتصال بـ QP: ' + errMsg(e), 'err'); }
  const { data, error } = await sb.rpc('qp_sync_now');
  if (error) return fail(error);
  if (!data.ok) return toast('تعذّر التحديث: ' + data.msg, 'err');
  toast(data.active ? `تم تحديث حالات ${data.found} شحنة من QP` : 'لا توجد شحنات نشطة لتحديثها', 'ok');
  loadOrders();
}

async function openQpSettings() {
  const { data: s, error } = await sb.rpc('qp_get_settings');
  if (error) return fail(error);
  const m = modal({ title: 'إعدادات الربط مع QP',
    body: `<form id="qpForm" class="grid">
      <p class="hint" style="margin:0">أدخل بيانات حساب الشركة على موقع QP Express. تُحفظ كلمة المرور مشفّرة ولا يمكن عرضها مرة أخرى.</p>
      <label class="f"><span>اسم المستخدم / البريد في QP *</span><input name="username" dir="ltr" required autocomplete="off" value="${esc(s.username || '')}"></label>
      <label class="f"><span>كلمة المرور ${s.has_password ? '<span class="hint">(محفوظة — اتركها فارغة إن لم تتغير)</span>' : '*'}</span>
        <input name="password" type="password" dir="ltr" autocomplete="new-password" ${s.has_password ? '' : 'required'}></label>
      <label class="chk"><input type="checkbox" name="auto_sync" ${s.auto_sync !== false ? 'checked' : ''}> تحديث حالات الشحنات تلقائيًا كل ساعة</label>
      <dl class="kv small"><dt>رقم الحساب في QP</dt><dd class="ltr">${esc(s.customer_id || '—')}</dd>
        <dt>آخر تحديث</dt><dd>${s.last_sync_at ? dtt(s.last_sync_at) : '—'}</dd>
        <dt>النتيجة</dt><dd>${esc(s.last_sync_msg || '—')}</dd></dl>
    </form>`,
    footer: `<button class="btn primary" id="qpSave">حفظ واختبار الاتصال</button><button class="btn" id="qpClose">إغلاق</button>` });
  $('#qpClose', m.el).onclick = m.close;
  $('#qpSave', m.el).onclick = e => {
    const form = $('#qpForm', m.el);
    if (!form.reportValidity()) return;
    const f = formValues(form);
    busy(e.currentTarget, async () => {
      const { error: e1 } = await sb.rpc('qp_save_settings', { p_username: f.username.trim(), p_password: form.elements.password.value || null, p_auto_sync: f.auto_sync });
      if (e1) return fail(e1);
      try {
        const t = await qpEnsureLogin();
        toast(`تم الاتصال بـ QP بنجاح (رقم الحساب ${t.customer_id})`, 'ok'); m.close();
      } catch (e2) { toast('تم الحفظ، لكن ' + errMsg(e2), 'err'); }
    });
  };
}

async function exportOrders() {
  // كل الطلبات المطابقة للبحث على دفعات (الطلب الواحد بيرجّع 1000 صف بحد أقصى)
  let data;
  try { data = await fetchAllRows(() => ordersQuery('*', false)); } catch (e) { return fail(e); }
  const cols = [['order_no', 'رقم الطلب'], ['client', 'العميل'], ['brand', 'البراند'], ['client_ref', 'مرجع العميل'], ['customer_name', 'المستلم'],
    ['customer_phone', 'الهاتف'], ['customer_phone2', 'هاتف آخر'], ['governorate', 'المحافظة'], ['city', 'المنطقة'],
    ['address', 'العنوان'], ['items', 'المحتوى'], ['pieces', 'القطع'], ['cod_amount', 'التحصيل'], ['allow_open', 'متاح المعاينة'],
    ['notes', 'ملاحظات'], ['status', 'الحالة'], ['qp_tracking', 'رقم التتبع'], ['collected_amount', 'المحصّل'],
    ['shipping_fee', 'الشحن'], ['fulfillment_fee', 'التجهيز'], ['return_fee', 'المرتجع'],
    ['net_amount', 'الصافي'], ['created_at', 'التاريخ'], ['closed_at', 'تاريخ الإقفال']];
  const NUM = new Set(['order_no', 'pieces', 'cod_amount', 'collected_amount', 'shipping_fee', 'fulfillment_fee', 'return_fee', 'net_amount']);
  const val = (o, k) => k === 'client' ? clientName(o.client_id) : k === 'status' ? tr(STATUS[o.status]?.label)
    : k === 'allow_open' ? tr(o.allow_open ? 'نعم' : 'لا') : k === 'created_at' || k === 'closed_at' ? dtt(o[k]) : k === 'governorate' ? tr(o.governorate) : o[k];
  const head = cols.map(c => tr(c[1]));
  const name = `orders-${isoDay()}`;
  try {
    // ملف Excel حقيقي: الهاتف ورقم التتبع نصوص (CSV كان بيضيّع الصفر اللي في أول رقم الهاتف لما يتفتح في Excel)
    await loadXLSX();
    const body = data.map(o => cols.map(([k]) => { const v = val(o, k);
      return NUM.has(k) ? (v === null || v === undefined || v === '' ? '' : +v) : String(v ?? ''); }));
    const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
    ws['!cols'] = cols.map(([k]) => ({ wch: k === 'address' ? 40 : ['notes', 'items', 'customer_name'].includes(k) ? 24 : 15 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, L('الطلبات', 'Orders'));
    if (!EN) wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.writeFile(wb, `${name}.xlsx`);
    return;
  } catch (e) { console.error(e); }
  // تعذّر تحميل مكتبة Excel: نصدّر CSV كبديل
  const csv = [head, ...data.map(o => cols.map(([k]) => val(o, k)))]
    .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `${name}.csv`; a.click();
}

// ---------- سجل الطلب ----------
const FIELD_LABELS = {
  client_id: ['العميل', 'Client'], client_ref: ['رقم الطلب لدى العميل', 'Client ref'], brand: ['البراند', 'Brand'], customer_name: ['اسم المستلم', 'Recipient'],
  customer_phone: ['الهاتف', 'Phone'], customer_phone2: ['هاتف آخر', 'Other phone'], governorate: ['المحافظة', 'Governorate'],
  city: ['المنطقة', 'Area'], address: ['العنوان', 'Address'], items: ['المحتوى', 'Contents'], pieces: ['عدد القطع', 'Pieces'],
  cod_amount: ['المطلوب تحصيله', 'COD amount'], allow_open: ['المعاينة', 'Inspection'], notes: ['الملاحظات', 'Notes'],
  status: ['الحالة', 'Status'], qp_tracking: ['رقم التتبع', 'Tracking no.'], qp_status: ['حالة الشحنة', 'Shipment status'],
  shipping_fee: ['الشحن', 'Shipping'], fulfillment_fee: ['التجهيز', 'Fulfillment'], return_fee: ['المرتجع', 'Return fee'],
  collected_amount: ['المحصّل', 'Collected'], settlement_id: ['التسوية', 'Settlement'],
};
const FIN_FIELDS = ['shipping_fee', 'fulfillment_fee', 'return_fee', 'collected_amount'];
const fieldLabel = k => (FIELD_LABELS[k] ? L(...FIELD_LABELS[k]) : k);
function fmtField(k, v) {
  if (v === null || v === undefined || v === '') return '—';
  if (k === 'status') return STATUS[v] ? tr(STATUS[v].label) : v;
  if (k === 'allow_open') return v ? L('متاحة', 'allowed') : L('غير متاحة', 'not allowed');
  if (k === 'client_id') return clientName(v) || '—';
  if (k === 'settlement_id') return `#${v}`;
  if (k === 'qp_status') return courierText(v);
  if (['cod_amount', ...FIN_FIELDS].includes(k)) return money(v);
  return String(v);
}
function actorLabel(e) {
  switch (e.actor_type) {
    case 'bot': return L('بوت', 'Bot');
    case 'system': return L('النظام', 'System');
    case 'admin': return S.isAdmin ? L('مدير النظام', 'Administrator') : 'Operative';
    case 'staff': return S.isAdmin ? (e.actor_name || '') : L('فريق Operative', 'Operative team');
    case 'client': return e.actor_name || L('العميل', 'Client');
    default: return '';
  }
}
function renderEvents(list) {
  if (!list.length) return '<li class="muted">—</li>';
  return list.map(e => {
    const ch = e.changes || {};
    const keys = Object.keys(ch).filter(k => k !== 'status' && (S.isAdmin || k !== 'client_id'));
    const who = actorLabel(e);
    const head = e.note === 'created' ? `<b>${L('إنشاء الطلب', 'Order created')}</b> ${badge(e.status)}`
      : (!e.changes || 'status' in ch) ? badge(e.status) : '';
    const lines = keys.map(k => `<div class="ev-ch">${esc(fieldLabel(k))}: <span class="muted">${esc(fmtField(k, ch[k][0]))}</span>
      ${L('←', '→')} <b>${esc(fmtField(k, ch[k][1]))}</b></div>`).join('');
    return `<li class="ev"><div class="ev-h">${head}${who ? `<span class="ev-who ${e.actor_type === 'bot' ? 'bot' : ''}">${esc(who)}</span>` : ''}
      <span class="muted num small">${dtt(e.created_at)}</span></div>${lines}</li>`;
  }).join('');
}

// ---------- نافذة الطلب ----------
async function openOrder(o, onDone) {
  const isNew = !o; o = o || { pieces: 1, allow_open: true, status: 'new' };
  const A = S.isAdmin;
  const E = A ? can('orders_edit') : (isNew || o.status === 'new');   // بيانات الطلب
  const F = A && !isNew && can('orders_finance');                     // حسابات الطلب
  const dis = E ? '' : 'disabled', disF = F ? '' : 'disabled';
  // طلب اتشحن خلاص (مسجَّل بسيريال من Excel أو من فاتورة شركة الشحن): الهاتف والعنوان ممكن يكونوا فاضيين، فمش إجباريين عند التعديل
  const shipped = !isNew && !!o.qp_tracking;
  const reqC = shipped ? '' : 'required';
  const after = () => { if (onDone) onDone(); else if ($('#oPanel')) loadOrders(); };
  const isRet = !isNew && (o.status === 'returned' || (o.kind && o.kind !== 'normal' && o.status === 'delivered'));
  const canConfirm = A && (can('settlements_edit') || can('orders_finance'));
  // حالة التحصيل والمرتجع (من migration-021)
  const collHtml = o.status !== 'delivered' || o.kind === 'return_pickup' ? '' : o.collection_confirmed_at
    ? `<dt>${L('التحصيل', 'Collection')}</dt><dd><span class="badge b-green">${L('الفلوس دخلت', 'Money received')}</span> ${esc(L(...(COLL_SRC[o.collection_source] || ['', ''])))}
        <div class="muted small">${esc(o.collection_confirmed_by_name || '')} · <span class="num">${dtt(o.collection_confirmed_at)}</span></div></dd>`
    : `<dt>${L('التحصيل', 'Collection')}</dt><dd><span class="badge b-amber">${L('لسه ما اتأكدش', 'Not confirmed yet')}</span></dd>`;
  const retHtml = !isRet ? '' : o.return_received_at
    ? `<dt>${L('المرتجع', 'Return')}</dt><dd>${L('وصل عندنا', 'Arrived')} ${condBadge(o.return_condition)}${o.return_notes ? `<div class="small">${esc(o.return_notes)}</div>` : ''}
        <div class="muted small">${esc(A ? o.return_received_by_name || '' : L('فريق Operative', 'Operative team'))} · <span class="num">${dtt(o.return_received_at)}</span></div>
        ${o.return_handover_id ? `<div class="small">${L('اتسلّم للعميل — كشف رقم', 'Handed to client — sheet no.')} <a href="#" class="olink" id="oHo">${o.return_handover_id}</a></div>` : ''}</dd>`
    : `<dt>${L('المرتجع', 'Return')}</dt><dd><span class="badge b-amber">${L('لسه ما وصلش عندنا', 'Not arrived yet')}</span></dd>`;
  const kindHtml = !o.kind || o.kind === 'normal' ? '' : `<div class="alert info span-all small" id="oKind">${kindBadge(o.kind)}
      ${L('للطلب', 'for order')} <a href="#" class="olink" id="oParent">…</a>
      ${+o.refund_amount ? ` — ${L('المندوب يدفع للعميل', 'Courier pays the customer')} <b>${egp(o.refund_amount)}</b>` : ''}
      ${A && !o.qp_tracking ? `<div style="margin-top:6px">${L('بيتبلّغ لشركة الشحن على الواتساب (مش من زرار الإرسال). لما يبعتوا السيريال اكتبه في «رقم التتبع» تحت.', 'Report it to the courier on WhatsApp (not the send button). When they send the serial, write it in "Tracking no." below.')}
        <button type="button" class="btn sm" id="oWa">${L('نسخ رسالة الواتساب', 'Copy WhatsApp message')}</button></div>` : ''}</div>`;
  const body = `<form id="orderForm" class="grid g2">${kindHtml}
    ${A ? `<label class="f span-all"><span>العميل *</span><select name="client_id" required ${isNew ? '' : 'disabled'}>
      ${opt('', '— اختر العميل —', o.client_id)}${S.clients.filter(c => c.active || c.id === o.client_id).map(c => opt(c.id, c.name, o.client_id)).join('')}</select></label>` : ''}
    <label class="f"><span>اسم المستلم *</span><input name="customer_name" required value="${esc(o.customer_name)}" ${dis}></label>
    <label class="f"><span>رقم الطلب لديك</span><input name="client_ref" value="${esc(o.client_ref)}" ${dis}></label>
    <label class="f"><span>البراند (اختياري)</span><input name="brand" value="${esc(o.brand)}" ${dis}></label>
    <label class="f"><span>رقم الهاتف *</span><input name="customer_phone" ${reqC} inputmode="tel" dir="ltr" value="${esc(o.customer_phone)}" ${dis}></label>
    <label class="f"><span>رقم هاتف آخر</span><input name="customer_phone2" inputmode="tel" dir="ltr" value="${esc(o.customer_phone2)}" ${dis}></label>
    <label class="f"><span>المحافظة *</span><select name="governorate" required ${dis}>${govOptions(o.governorate)}</select></label>
    <label class="f"><span>المنطقة / المدينة</span><input name="city" value="${esc(o.city)}" ${dis}></label>
    <label class="f span-all"><span>العنوان بالتفصيل *</span><input name="address" ${reqC} value="${esc(o.address)}" ${dis}></label>
    <label class="f"><span>المحتوى</span><input name="items" value="${esc(o.items)}" ${dis}></label>
    <div class="grid g2"><label class="f"><span>عدد القطع</span><input name="pieces" type="number" min="1" value="${esc(o.pieces)}" ${dis}></label>
      <label class="f"><span>المطلوب تحصيله *</span><input name="cod_amount" type="number" min="0" step="0.01" required value="${esc(o.cod_amount)}" ${dis}></label></div>
    <label class="f span-all"><span>ملاحظات</span><input name="notes" value="${esc(o.notes)}" ${dis}></label>
    <label class="chk span-all"><input type="checkbox" name="allow_open" ${o.allow_open ? 'checked' : ''} ${dis}> متاح معاينة الشحنة <span class="hint">(أزل العلامة إذا كنت لا تريد أن يفتح المستلم الشحنة قبل الاستلام)</span></label>
    ${A && !isNew ? `<div class="section-title span-all">الشحن</div>
      <label class="f"><span>الحالة</span><select name="status" ${dis}>${statusOptions(o.status)}</select></label>
      <label class="f"><span>رقم التتبع (QP)</span><input name="qp_tracking" dir="ltr" value="${esc(o.qp_tracking)}" ${dis}></label>
      <label class="f span-all"><span>حالة الشحنة عند QP</span><input name="qp_status" value="${esc(o.qp_status)}" ${dis}></label>
      <div class="section-title span-all">حسابات الطلب ${F ? '<span class="hint">— تُحسب تلقائيًا من أسعار العميل، ويمكن تعديلها هنا</span>'
        : `<span class="hint">— ${L('للعرض فقط؛ التعديل لموظف الحسابات', 'read-only; editable by accounts staff')}</span>`}</div>
      <div class="grid g4 span-all">
        <label class="f"><span>الشحن</span><input name="shipping_fee" type="number" step="0.01" value="${esc(o.shipping_fee)}" ${disF}></label>
        <label class="f"><span>التجهيز والتغليف</span><input name="fulfillment_fee" type="number" step="0.01" value="${esc(o.fulfillment_fee)}" ${disF}></label>
        <label class="f"><span>المرتجع</span><input name="return_fee" type="number" step="0.01" value="${esc(o.return_fee)}" ${disF}></label>
        <label class="f"><span>المبلغ المحصّل</span><input name="collected_amount" type="number" step="0.01" value="${esc(o.collected_amount)}" ${disF}></label>
      </div>
      ${F ? '<p class="hint span-all" style="margin:0">المبلغ المحصّل: للطلب المسلَّم إذا تُرك صفرًا = المطلوب تحصيله، وللمرتجع ما دفعه المستلم إن وُجد.</p>' : ''}` : ''}
    ${!isNew ? `<div class="section-title span-all">متابعة الطلب</div>
      <div class="span-all grid g2 order-follow"><div><ul class="timeline" id="oEvents"><li class="muted">...</li></ul></div>
      <dl class="kv small"><dt>الحالة</dt><dd>${badge(o.status)}</dd>
        ${o.qp_tracking ? `<dt>رقم التتبع</dt><dd><span class="ltr">${esc(o.qp_tracking)}</span></dd>` : ''}
        ${o.qp_status ? `<dt>عند شركة الشحن</dt><dd>${esc(courierText(o.qp_status))}</dd>` : ''}
        ${o.status === 'returned' ? `<dt>التكلفة (المرتجع + التجهيز)</dt><dd>${egp(+o.return_fee + +o.fulfillment_fee)}</dd>`
          : `<dt>التكلفة (الشحن + التجهيز)</dt><dd>${egp(+o.shipping_fee + +o.fulfillment_fee)}</dd>`}
        ${['delivered', 'returned'].includes(o.status) ? `<dt>المحصّل</dt><dd>${egp(o.collected_amount)}</dd>` : ''}
        ${['delivered', 'returned'].includes(o.status) ? `<dt>الصافي</dt><dd>${signed(o.net_amount)} ج</dd>` : ''}
        ${collHtml}${retHtml}
        <dt>التسوية</dt><dd id="oSettle">${o.settlement_id ? L('تمت التسوية', 'Settled') : 'لم تتم بعد'}</dd></dl></div>
      <div class="span-all" id="oKids"></div>
      ${A ? `<div class="section-title span-all">${L('طلبات تعديل الحسابات', 'Account change requests')}
          <button type="button" class="btn sm" id="oReqBtn">${L('+ طلب تعديل في الحسابات', '+ Request an accounts change')}</button></div>
        <div class="span-all" id="oReqs"></div>` : ''}` : ''}
  </form>`;
  const footer = `${E || F ? `<button class="btn primary" id="oSave">${isNew ? 'إضافة الطلب' : 'حفظ'}</button>` : ''}
    <span class="spacer"></span>
    ${!isNew && o.status === 'delivered' && (!o.kind || o.kind === 'normal') && (!A || can('orders_edit')) ? `<button class="btn" id="oRetReq">${L('طلب استرجاع / استبدال', 'Return / exchange request')}</button>` : ''}
    ${isRet && !o.return_received_at && can('returns') ? `<button class="btn" id="oRecv">${L('استلام المرتجع', 'Receive return')}</button>` : ''}
    ${!isNew && o.status === 'delivered' && !o.collection_confirmed_at && !o.settlement_id && canConfirm && o.kind !== 'return_pickup' ? `<button class="btn" id="oColl">${L('تأكيد التحصيل', 'Confirm collection')}</button>` : ''}
    ${!isNew && !A && o.status === 'new' ? '<button class="btn danger" id="oCancel">إلغاء الطلب</button>' : ''}
    ${!isNew && A && can('orders_delete') && !o.settlement_id ? '<button class="btn danger" id="oDelete">حذف</button>' : ''}`;
  const m = modal({ title: isNew ? 'طلب جديد' : `${L('الطلب', 'Order')} ${orderNo(o)}${A ? ' — ' + esc(clientName(o.client_id)) : ''}`, body, footer, wide: true });

  if (!isNew) {
    sb.from('order_events').select('*').eq('order_id', o.id).order('created_at', { ascending: false }).order('id', { ascending: false }).then(({ data }) => {
      const el = $('#oEvents', m.el); if (el) el.innerHTML = renderEvents(data || []);
    });
    if (o.settlement_id) {
      sb.from('settlements').select('*').eq('id', o.settlement_id).maybeSingle().then(({ data: st }) => {
        const el = $('#oSettle', m.el); if (!el || !st) return;
        el.innerHTML = `<a href="#" class="olink">${L('تمت التسوية — رقم', 'Settled — no.')} ${st.settlement_no}</a>${st.status === 'paid' ? ` <span class="badge b-green">${L('مدفوعة', 'Paid')}</span>` : ''}`;
        $('a', el).onclick = ev => { ev.preventDefault(); openSettlement(st, async () => { if ($('#sPanel')) await viewSettlements(); }); };
        // تسوية مدفوعة: الحالة والحسابات مقفولة (قاعدة البيانات بترفض أي تغيير فيهم)
        if (st.status === 'paid') {
          $$('[name=status],[name=shipping_fee],[name=fulfillment_fee],[name=return_fee],[name=collected_amount]', m.el).forEach(i => i.disabled = true);
          const t = $('[name=shipping_fee]', m.el)?.closest('.grid.g4');
          if (t && !$('#oPaidLock', m.el)) t.insertAdjacentHTML('beforebegin', `<div class="alert small span-all" id="oPaidLock">${L(`الطلب ده في تسوية مدفوعة (رقم ${st.settlement_no}) — حالته وحساباته مقفولة.`, `This order is in a paid settlement (no. ${st.settlement_no}) — its status and accounts are locked.`)}</div>`);
        }
      });
    }
    // استرجاع / استبدال: الطلب الأصلي، والطلبات اللي اتعملت عليه
    if (o.parent_order_id) {
      sb.from('orders').select('*').eq('id', o.parent_order_id).maybeSingle().then(({ data: p }) => {
        const a = $('#oParent', m.el); if (!a) return;
        if (!p) { a.textContent = '—'; return; }
        a.textContent = orderNo(p) + (p.qp_tracking ? ` (${p.qp_tracking})` : '');
        a.onclick = ev => { ev.preventDefault(); openOrder(p); };
        const wa = $('#oWa', m.el);
        if (wa) wa.onclick = () => navigator.clipboard.writeText(returnWaText(o, p)).then(() => toast('تم النسخ', 'ok'));
      });
    }
    sb.from('orders').select('id, order_no, kind, status, qp_tracking, created_at').eq('parent_order_id', o.id).order('created_at').then(({ data: kids, error: ke }) => {
      const el = $('#oKids', m.el); if (!el || ke || !(kids || []).length) return;
      el.innerHTML = `<div class="alert info small">${L('طلبات استرجاع / استبدال على الطلب ده:', 'Return / exchange requests on this order:')}
        ${kids.map(k => `${kindBadge(k.kind)} <a href="#" class="olink" data-kid="${k.id}">${orderNo(k)}</a> ${badge(k.status)}`).join(' · ')}</div>`;
      $$('[data-kid]', el).forEach(a => a.onclick = async ev => { ev.preventDefault();
        const { data: k } = await sb.from('orders').select('*').eq('id', a.dataset.kid).maybeSingle(); if (k) openOrder(k); });
    });
    if ($('#oHo', m.el)) $('#oHo', m.el).onclick = ev => { ev.preventDefault(); openHandover(o.return_handover_id); };
    if ($('#oRetReq', m.el)) $('#oRetReq', m.el).onclick = () => returnRequestDialog(o, () => { m.close(); after(); });
    if ($('#oRecv', m.el)) $('#oRecv', m.el).onclick = () => receiveDialog([o], () => { m.close(); after(); });
    if ($('#oColl', m.el)) $('#oColl', m.el).onclick = () => confirmCollectionDialog([o.id], () => { m.close(); after(); });
    if (A) {
      const loadReqs = () => loadOrderRequests(o, $('#oReqs', m.el));
      loadReqs();
      $('#oReqBtn', m.el).onclick = () => newAccountRequest(o, loadReqs);
    }
  }

  const save = $('#oSave', m.el);
  if (save) save.onclick = () => {
    const form = $('#orderForm', m.el);
    if (E && !form.reportValidity()) return;
    const f = formValues(form);
    const rec = {};
    if (E) {
      const phone = f.customer_phone.replace(/\s|-/g, '');
      if (!(shipped && !phone) && !/^\+?\d{10,13}$/.test(phone)) return toast('رقم الهاتف غير صحيح', 'err');
      Object.assign(rec, {
        client_ref: nz(f.client_ref), brand: nz(f.brand), customer_name: f.customer_name, customer_phone: phone,
        customer_phone2: nz(f.customer_phone2.replace(/\s|-/g, '')), governorate: f.governorate, city: nz(f.city),
        address: f.address, items: nz(f.items), pieces: parseInt(f.pieces) || 1, cod_amount: num(f.cod_amount),
        allow_open: f.allow_open, notes: nz(f.notes),
      });
      if (A && !isNew) Object.assign(rec, { status: f.status, qp_tracking: nz(f.qp_tracking), qp_status: nz(f.qp_status) });
    }
    if (F) Object.assign(rec, { collected_amount: num(f.collected_amount), shipping_fee: num(f.shipping_fee),
      fulfillment_fee: num(f.fulfillment_fee), return_fee: num(f.return_fee) });
    if (isNew) rec.client_id = A ? f.client_id : S.profile.client_id;
    busy(save, async () => {
      const { data, error } = isNew
        ? await sb.from('orders').insert(rec).select().single()
        : await sb.from('orders').update(rec).eq('id', o.id).select().single();
      if (error) return fail(error);
      toast(isNew ? `${L('تمت إضافة الطلب', 'Order added')} ${orderNo(data)}` : 'تم الحفظ', 'ok'); m.close(); after();
    });
  };
  const cancel = $('#oCancel', m.el);
  if (cancel) cancel.onclick = async () => {
    if (!await confirmBox('هل تريد إلغاء هذا الطلب؟', 'إلغاء الطلب', true)) return;
    const { error } = await sb.from('orders').update({ status: 'cancelled' }).eq('id', o.id);
    if (error) return fail(error);
    toast('تم إلغاء الطلب', 'ok'); m.close(); after();
  };
  const del = $('#oDelete', m.el);
  if (del) del.onclick = async () => {
    if (!await confirmBox(L(`هل تريد حذف الطلب ${orderNo(o)} نهائيًا؟`, `Delete order ${orderNo(o)} permanently?`), 'حذف', true)) return;
    const { error } = await sb.from('orders').delete().eq('id', o.id);
    if (error) return fail(error);
    toast('تم الحذف', 'ok'); m.close(); after();
  };
}

// =====================================================================
//  طلبات تعديل الحسابات والإشعارات
// =====================================================================
const REQ_STATUS = { open: ['مفتوح', 'Open', 'amber'], done: ['تم التنفيذ', 'Done', 'green'], rejected: ['مرفوض', 'Rejected', 'red'] };
const reqBadge = s => { const x = REQ_STATUS[s] || [s, s, 'gray']; return `<span class="badge b-${x[2]}">${esc(L(x[0], x[1]))}</span>`; };

async function loadOrderRequests(o, el) {
  if (!el) return;
  const { data, error } = await sb.from('account_requests').select('*').eq('order_id', o.id).order('created_at', { ascending: false });
  if (error) { el.innerHTML = ''; return; }
  el.innerHTML = (data || []).length ? `<div class="req-list">${data.map(r => `<a href="#" class="req-item" data-id="${r.id}">
      ${reqBadge(r.status)} <b>${esc(r.created_by_name || '')}</b> <span class="muted small num">${dtt(r.created_at)}</span>
      <div class="small">${esc(r.body.slice(0, 160))}</div></a>`).join('')}</div>`
    : `<p class="muted small" style="margin:0">${L('لا توجد طلبات تعديل على حسابات هذا الطلب.', 'No account change requests for this order.')}</p>`;
  $$('.req-item', el).forEach(a => a.onclick = ev => { ev.preventDefault(); openRequest(+a.dataset.id, () => loadOrderRequests(o, el)); });
}

function newAccountRequest(o, done) {
  const m = modal({ title: `${L('طلب تعديل في حسابات الطلب', 'Accounts change request — order')} ${orderNo(o)}`,
    body: `<p class="hint" style="margin-top:0">${L('سيصل الطلب إلى موظفي الحسابات في الإشعارات، ويمكنهم الرد عليك.', 'Accounts staff will get it in their notifications and can reply to you.')}</p>
      <label class="f"><span>${L('المطلوب تعديله وسببه *', 'What should change, and why *')}</span><textarea id="reqBody" rows="4"
        placeholder="${L('مثال: المستلم دفع 50 جنيهًا شحن عند الرفض، برجاء تعديل المبلغ المحصّل', 'e.g. the recipient paid 50 EGP shipping on refusal; please update the collected amount')}"></textarea></label>`,
    footer: `<button class="btn primary" id="reqSend">${L('إرسال الطلب', 'Send request')}</button>` });
  $('#reqSend', m.el).onclick = e => {
    const body = $('#reqBody', m.el).value.trim();
    if (!body) return toast(L('اكتب تفاصيل الطلب', 'Please describe the request'), 'err');
    busy(e.currentTarget, async () => {
      const { error } = await sb.rpc('account_request_create', { p_order: o.id, p_body: body });
      if (error) return fail(error);
      toast(L('تم إرسال الطلب لموظفي الحسابات', 'Request sent to accounts staff'), 'ok'); m.close(); if (done) done();
    });
  };
}

async function openRequest(id, done) {
  const [{ data: r, error }, { data: msgs }] = await Promise.all([
    sb.from('account_requests').select('*').eq('id', id).maybeSingle(),
    sb.from('account_request_messages').select('*').eq('request_id', id).order('created_at'),
  ]);
  if (error) return fail(error);
  if (!r) return toast(L('الطلب غير متاح', 'Request not available'), 'err');
  const { data: o } = await sb.from('orders').select('*').eq('id', r.order_id).maybeSingle();
  const FIN = can('orders_finance');
  const mine = r.created_by === S.user.id;
  const m = modal({ title: `${L('طلب تعديل حسابات — الطلب', 'Accounts change request — order')} ${o ? orderNo(o) : ''}`, wide: true,
    body: `<div class="req-head">${reqBadge(r.status)} <span>${L('من', 'From')}: <b>${esc(r.created_by_name || '')}</b></span>
        <span class="muted small num">${dtt(r.created_at)}</span>
        ${o ? `<span class="muted small">${esc(clientName(o.client_id))} — ${esc(o.customer_name)}</span>` : ''}</div>
      ${o ? `<div class="stmt-totals req-fin"><div><span class="muted small">${L('الحالة', 'Status')}</span><b>${badge(o.status)}</b></div>
        <div><span class="muted small">${L('المحصّل', 'Collected')}</span><b>${egp(o.collected_amount)}</b></div>
        <div><span class="muted small">${L('الشحن / المرتجع', 'Shipping / return')}</span><b><span class="ltr">${money(o.shipping_fee)} / ${money(o.return_fee)}</span></b></div>
        <div><span class="muted small">${L('التجهيز', 'Fulfillment')}</span><b>${egp(o.fulfillment_fee)}</b></div></div>` : ''}
      <div class="thread">${(msgs || []).map(x => `<div class="msg ${x.author_id === S.user.id ? 'me' : ''}">
          <div class="msg-h"><b>${esc(x.author_name || '')}</b> <span class="muted small num">${dtt(x.created_at)}</span>
            ${x.new_status ? ` ${reqBadge(x.new_status)}` : ''}</div>
          ${x.body ? `<div class="msg-b">${esc(x.body)}</div>` : ''}</div>`).join('')}</div>
      ${mine || FIN ? `<label class="f"><span>${L('ردّك', 'Your reply')}</span><textarea id="rqReply" rows="3"></textarea></label>` : ''}`,
    footer: `${mine || FIN ? `<button class="btn primary" id="rqSend">${L('إرسال الرد', 'Send reply')}</button>` : ''}
      ${FIN && r.status === 'open' ? `<button class="btn" id="rqDone">${L('تم التنفيذ', 'Mark done')}</button>
        <button class="btn danger" id="rqReject">${L('رفض', 'Reject')}</button>` : ''}
      ${FIN && r.status !== 'open' ? `<button class="btn" id="rqReopen">${L('إعادة فتح', 'Reopen')}</button>` : ''}
      <span class="spacer"></span>${o ? `<button class="btn" id="rqOrder">${L('فتح الطلب', 'Open order')}</button>` : ''}` });
  sb.rpc('notifications_mark_read', { p_request: id }).then(() => refreshBell());
  const send = (status, btn) => {
    const body = ($('#rqReply', m.el)?.value || '').trim();
    if (!body && !status) return toast(L('اكتب الرد', 'Write a reply'), 'err');
    busy(btn, async () => {
      const { error: e } = await sb.rpc('account_request_reply', { p_id: id, p_body: body || null, p_status: status || null });
      if (e) return fail(e);
      toast(L('تم الإرسال', 'Sent'), 'ok'); m.close(); if (done) done(); openRequest(id, done);
    });
  };
  if ($('#rqSend', m.el)) $('#rqSend', m.el).onclick = e => send(null, e.currentTarget);
  if ($('#rqDone', m.el)) $('#rqDone', m.el).onclick = e => send('done', e.currentTarget);
  if ($('#rqReject', m.el)) $('#rqReject', m.el).onclick = e => send('rejected', e.currentTarget);
  if ($('#rqReopen', m.el)) $('#rqReopen', m.el).onclick = e => send('open', e.currentTarget);
  if ($('#rqOrder', m.el)) $('#rqOrder', m.el).onclick = () => openOrder(o);
}

// جرس الإشعارات
let bellTimer = null;
async function refreshBell() {
  const el = $('#bellN'); if (!el) return;
  const { count } = await sb.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
  el.textContent = count ? (count > 99 ? '99+' : count) : '';
  el.style.display = count ? '' : 'none';
}
function startBell() {
  clearInterval(bellTimer);
  if (!S.isAdmin) return;
  refreshBell(); bellTimer = setInterval(refreshBell, 60000);
}
function crmNotifText(n) {
  const who = n.actor_name || '';
  switch (n.kind) {
    case 'crm_assigned': return L(`أسند إليك ${who} عملاء محتملين`, `${who} assigned leads to you`);
    case 'crm_shared': return L(`فوّضك ${who} على عميل محتمل`, `${who} delegated a lead to you`);
    case 'crm_task': return L('حان موعد متابعة عميل', 'A lead follow-up is due');
    case 'crm_reveal_limit': return L(`${who} وصل للحد اليومي لإظهار أرقام العملاء`, `${who} reached the daily number-reveal limit`);
    case 'crm_stale': return L('ملخص المبيعات اليومي', 'Daily sales digest');
    case 'crm_dup': return L(`عميل محتمل مشتبه في تكراره (أضافه ${who})`, `Possible duplicate lead (added by ${who})`);
    case 'crm_convert': return L(`${who} يطلب تحويل عميل محتمل إلى عميل`, `${who} requests converting a lead to a client`);
    case 'crm_won': return L('تم التعاقد مع عميلك وتحويله إلى عميل', 'Your lead was converted to a client');
    default: return L('إشعار من المبيعات', 'Sales notification');
  }
}
const KIND_AR = s => /^استبدال/.test(s || '') ? 'استبدال' : 'استرجاع';
function notifText(n) {
  if (n.kind && n.kind.startsWith('crm_')) return crmNotifText(n);
  const no = n.order_no ? `#${n.order_no}` : '';
  if (n.kind === 'return_request') return L(`طلب ${KIND_AR(n.snippet)} جديد ${no} من ${n.actor_name} — محتاج يتبلّغ لشركة الشحن`, `New return/exchange request ${no} from ${n.actor_name} — report it to the courier`);
  if (n.kind === 'qp_conflict') return L(`الطلب ${no} حالته اتغيّرت عند شركة الشحن وهو داخل تسوية — راجعه`, `Order ${no} changed status at the courier while in a settlement — review it`);
  if (n.kind === 'request') return L(`طلب تعديل حسابات جديد على الطلب ${no} من ${n.actor_name}`, `New accounts change request on order ${no} from ${n.actor_name}`);
  if (n.kind === 'status') {
    const st = REQ_STATUS[n.new_status] || [n.new_status, n.new_status];
    return L(`${n.actor_name} غيّر حالة طلبك على الطلب ${no} إلى «${st[0]}»`, `${n.actor_name} marked your request on order ${no} as "${st[1]}"`);
  }
  return L(`ردّ ${n.actor_name} على طلب تعديل الطلب ${no}`, `${n.actor_name} replied on the request for order ${no}`);
}
async function openNotifications() {
  const FIN = can('orders_finance');
  const [{ data: list, error }, openReqs] = await Promise.all([
    sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
    FIN ? sb.from('account_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(100) : Promise.resolve({ data: null }),
  ]);
  if (error) return fail(error);
  const ordersMap = {};
  if (openReqs.data && openReqs.data.length) {
    const { data: os } = await sb.from('orders').select('id, order_no, client_id').in('id', [...new Set(openReqs.data.map(r => r.order_id))]);
    (os || []).forEach(x => ordersMap[x.id] = x);
  }
  const m = modal({ title: L('الإشعارات', 'Notifications'), wide: true, body: `
    ${FIN ? `<div class="section-title" style="margin-top:0">${L('طلبات تعديل مفتوحة', 'Open change requests')} (${(openReqs.data || []).length})</div>
      <div class="req-list">${(openReqs.data || []).map(r => { const x = ordersMap[r.order_id] || {};
        return `<a href="#" class="req-item" data-id="${r.id}"><b>${x.order_no ? '#' + x.order_no : ''}</b> ${esc(clientName(x.client_id))}
          — ${esc(r.created_by_name || '')} <span class="muted small num">${dtt(r.created_at)}</span><div class="small">${esc(r.body.slice(0, 160))}</div></a>`; }).join('')
        || `<p class="muted small">${L('لا توجد طلبات مفتوحة.', 'No open requests.')}</p>`}</div>` : ''}
    <div class="section-title">${L('آخر الإشعارات', 'Latest notifications')}</div>
    <div class="req-list">${(list || []).map(n => `<a href="#" class="req-item ${n.read_at ? '' : 'unread'}" data-id="${n.request_id || ''}" data-lead="${n.lead_id || ''}" data-crm="${/^crm_/.test(n.kind || '') ? n.kind : ''}" data-order="${['qp_conflict', 'return_request'].includes(n.kind) ? n.order_id || '' : ''}" data-nid="${n.id}">
        ${esc(notifText(n))} <span class="muted small num">${dtt(n.created_at)}</span>
        ${n.snippet ? `<div class="small muted">${esc(n.snippet)}</div>` : ''}</a>`).join('')
      || `<p class="muted small">${L('لا توجد إشعارات.', 'No notifications.')}</p>`}</div>`,
    footer: `<button class="btn" id="ntAll">${L('تعليم الكل كمقروء', 'Mark all as read')}</button>` });
  $$('.req-item', m.el).forEach(a => a.onclick = ev => { ev.preventDefault();
    if (a.dataset.id) { m.close(); openRequest(+a.dataset.id); }
    else if (a.dataset.order) {
      // إشعار تعارض شركة الشحن: نعلّمه مقروء ونفتح الطلب
      sb.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', +a.dataset.nid).then(() => refreshBell());
      sb.from('orders').select('*').eq('id', a.dataset.order).maybeSingle().then(({ data: o }) => { if (o) { m.close(); openOrder(o); } else toast('الطلب غير موجود', 'err'); });
    }
    else if (a.dataset.lead) { m.close(); openCrmLead(a.dataset.lead); }
    else if (a.dataset.crm) { m.close(); location.hash = a.dataset.crm === 'crm_reveal_limit' ? '#/crm/security' : '#/crm/today'; } });
  $('#ntAll', m.el).onclick = async () => { await sb.rpc('notifications_mark_read', {}); refreshBell(); $$('.unread', m.el).forEach(x => x.classList.remove('unread')); };
}

// =====================================================================
//  رفع الطلبات من Excel
// =====================================================================
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
let xlsxReady = null;
function loadXLSX() {
  if (window.XLSX) return Promise.resolve();
  return xlsxReady || (xlsxReady = new Promise((res, rej) => {
    const sc = document.createElement('script'); sc.src = XLSX_URL;
    sc.onload = () => res();
    sc.onerror = () => { xlsxReady = null; rej(new Error('تعذّر تحميل مكتبة Excel، تحقق من الاتصال بالإنترنت')); };
    document.head.appendChild(sc);
  }));
}
const toLatinDigits = v => String(v ?? '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
const normAr = v => toLatinDigits(v).trim().toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[ً-ْـ]/g, '').replace(/[_\-–—:\.\*\(\)"']/g, ' ').replace(/\s+/g, ' ').trim();
const IMPORT_COLS = [
  { key: 'customer_name', label: 'اسم المستلم', req: true, alias: ['اسم المستلم', 'الاسم', 'اسم العميل', 'المستلم', 'الاسم بالكامل', 'full name', 'name', 'customer name', 'receiver name', 'consignee'] },
  { key: 'customer_phone', label: 'رقم الهاتف', req: true, alias: ['رقم الهاتف', 'الهاتف', 'الموبايل', 'موبايل', 'التليفون', 'رقم الموبايل', 'رقم التليفون', 'phone', 'mobile', 'phone number', 'mobile number'] },
  { key: 'customer_phone2', label: 'رقم هاتف آخر', alias: ['رقم هاتف آخر', 'هاتف آخر', 'موبايل 2', 'هاتف 2', 'رقم هاتف اخر', 'هاتف اخر', 'phone2', 'phone 2', 'second phone', 'other phone'] },
  { key: 'governorate', label: 'المحافظة', req: true, alias: ['المحافظة', 'محافظة', 'المدينة', 'city', 'governorate', 'state', 'province'] },
  { key: 'city', label: 'المنطقة', alias: ['المنطقة', 'منطقة', 'الحي', 'area', 'district', 'zone', 'region'] },
  { key: 'address', label: 'العنوان', req: true, alias: ['العنوان', 'العنوان بالتفصيل', 'عنوان', 'address', 'full address'] },
  { key: 'items', label: 'المحتوى', alias: ['المحتوى', 'محتوى الشحنة', 'المنتج', 'المنتجات', 'الصنف', 'shipment contents', 'contents', 'items', 'product', 'products', 'description'] },
  { key: 'pieces', label: 'عدد القطع', alias: ['عدد القطع', 'الكمية', 'القطع', 'عدد', 'pieces', 'quantity', 'qty'] },
  { key: 'cod_amount', label: 'المبلغ المطلوب تحصيله', req: true, alias: ['المبلغ المطلوب تحصيله', 'المطلوب تحصيله', 'المبلغ', 'مبلغ التحصيل', 'التحصيل', 'الاجمالي', 'السعر', 'total amount', 'cod amount', 'amount', 'total', 'price'] },
  { key: 'qp_tracking', label: 'سيريال شركة الشحن', alias: ['سيريال شركة الشحن', 'سيريال الشحن', 'السيريال', 'سيريال', 'رقم التتبع', 'رقم البوليصة', 'البوليصة', 'serial', 'tracking', 'tracking number', 'tracking no', 'awb'] },
  { key: 'brand', label: 'البراند', alias: ['البراند', 'براند', 'اسم البراند', 'الماركه', 'الماركة', 'المتجر', 'brand', 'brand name', 'store', 'shop'] },
  { key: 'client_ref', label: 'رقم الطلب لديك', alias:['رقم الطلب لديك', 'رقم الطلب', 'رقم الاوردر', 'مرجع', 'reference id', 'reference', 'order id', 'order number', 'order no'] },
  { key: 'notes', label: 'ملاحظات', alias: ['ملاحظات', 'ملاحظه', 'notes', 'note', 'comments', 'comment'] },
  { key: 'allow_open', label: 'متاح المعاينة', alias: ['متاح المعاينة', 'المعاينة', 'معاينة', 'يسمح بالمعاينة', 'مسموح بالمعاينة', 'يسمح بالفتح', 'مسموح بالفتح', 'فتح الشحنه', 'السماح بالفتح', 'allow open', 'open package'] },
];
const GOV_ALIAS = {
  'cairo': 'القاهرة', 'giza': 'الجيزة', 'alexandria': 'الإسكندرية', 'alex': 'الإسكندرية', 'qalyubia': 'القليوبية', 'qalubia': 'القليوبية',
  'sharqia': 'الشرقية', 'sharkia': 'الشرقية', 'dakahlia': 'الدقهلية', 'gharbia': 'الغربية', 'monufia': 'المنوفية', 'menoufia': 'المنوفية',
  'beheira': 'البحيرة', 'kafr el sheikh': 'كفر الشيخ', 'damietta': 'دمياط', 'port said': 'بورسعيد', 'ismailia': 'الإسماعيلية',
  'suez': 'السويس', 'fayoum': 'الفيوم', 'faiyum': 'الفيوم', 'beni suef': 'بني سويف', 'minya': 'المنيا', 'assiut': 'أسيوط', 'asyut': 'أسيوط',
  'sohag': 'سوهاج', 'qena': 'قنا', 'luxor': 'الأقصر', 'aswan': 'أسوان', 'red sea': 'البحر الأحمر', 'new valley': 'الوادي الجديد',
  'matrouh': 'مطروح', 'north sinai': 'شمال سيناء', 'south sinai': 'جنوب سيناء',
  'اكتوبر': 'الجيزة', '6 اكتوبر': 'الجيزة', 'السادس من اكتوبر': 'الجيزة', 'الشيخ زايد': 'الجيزة', 'شرم الشيخ': 'جنوب سيناء', 'الغردقه': 'البحر الأحمر',
};
const govKey = v => normAr(v).replace(/^محافظه\s*/, '').split(' ').map(w => w.replace(/^ال/, '')).join('');
const GOV_INDEX = (() => {
  const m = {};
  GOVS.forEach(g => { m[govKey(g)] = g; });
  Object.entries(GOV_ALIAS).forEach(([k, g]) => { m[govKey(k)] = g; m[normAr(k)] = g; });
  return m;
})();
const matchGov = v => GOV_INDEX[normAr(v)] || GOV_INDEX[govKey(v)] || null;
const normPhone = v => {
  let p = toLatinDigits(v).replace(/[^\d+]/g, '');
  if (p.startsWith('+20')) p = '0' + p.slice(3);
  else if (p.startsWith('0020')) p = '0' + p.slice(4);
  else if (p.startsWith('20') && p.length === 12) p = '0' + p.slice(2);
  if (/^1\d{9}$/.test(p)) p = '0' + p;
  return p;
};
const parseAmount = v => { const n = parseFloat(toLatinDigits(v).replace(/[^\d.\-]/g, '')); return isNaN(n) ? null : n; };
const parseYes = v => /^(نعم|ايوه|اه|yes|y|true|1|مسموح|يسمح)$/.test(normAr(v));
// المعاينة متاحة افتراضيًا، ولا تُغلق إلا بقيمة صريحة مثل «لا»
const parseOpen = v => !/^(لا|لأ|no|n|false|0|ممنوع|غير مسموح|غير متاح|بدون|بدون معاينه|لا يسمح)$/.test(normAr(v));

// عمود السيريال للشركة بس (قاعدة البيانات بتشيل رقم التتبع من طلبات العميل)
const importCols = () => IMPORT_COLS.filter(c => c.key !== 'qp_tracking' || can('orders_edit'));
function downloadTemplate(preset, fileName) {
  const cols = importCols();
  const head = cols.map(c => c.label);
  const ex = { customer_name: 'محمد أحمد', customer_phone: '01012345678', governorate: 'القاهرة', city: 'مدينة نصر',
    address: '10 شارع عباس العقاد، الدور الثالث', items: 'سلسلة فضة', pieces: 1, cod_amount: 450, client_ref: '1001', notes: 'الاتصال قبل التوصيل' };
  const body = (preset || [ex]).map(r => cols.map(c => c.key === 'governorate' ? (r.governorate || r.govRaw || '')
    : c.key === 'allow_open' ? (r.allow_open === false ? 'لا' : 'نعم') : (r[c.key] ?? '')));
  const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
  ws['!cols'] = cols.map(c => ({ wch: c.key === 'address' ? 40 : Math.max(14, c.label.length + 4) }));
  const gs = XLSX.utils.aoa_to_sheet([['المحافظات المتاحة'], ...GOVS.map(g => [g])]);
  gs['!cols'] = [{ wch: 22 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'الطلبات');
  XLSX.utils.book_append_sheet(wb, gs, 'المحافظات');
  wb.Workbook = { Views: [{ RTL: true }] };
  XLSX.writeFile(wb, fileName || 'operative-orders-template.xlsx');
}

function readSheetRows(buf) {
  const wb = XLSX.read(buf, { type: 'array' });
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: '' });
    for (let h = 0; h < Math.min(rows.length, 6); h++) {
      const map = {};
      rows[h].forEach((cell, i) => {
        const n = normAr(cell); if (!n) return;
        const col = IMPORT_COLS.find(c => !(c.key in map) && c.alias.some(a => normAr(a) === n));
        if (col) map[col.key] = i;
      });
      if (Object.keys(map).length >= 3) return { map, rows: rows.slice(h + 1).filter(r => r.some(x => String(x).trim() !== '')) };
    }
  }
  return null;
}

function buildImportRows(sheet) {
  const { map, rows } = sheet;
  const get = (r, k) => map[k] === undefined ? '' : String(r[map[k]] ?? '').trim();
  return rows.map((r, i) => {
    const o = {
      line: i + 1,
      customer_name: get(r, 'customer_name'),
      customer_phone: normPhone(get(r, 'customer_phone')),
      customer_phone2: normPhone(get(r, 'customer_phone2')) || null,
      govRaw: get(r, 'governorate'),
      governorate: matchGov(get(r, 'governorate')),
      city: get(r, 'city') || null,
      address: get(r, 'address').replace(/\s+/g, ' ').replace(/^["'«]+|["'»]+$/g, '').trim(),
      items: get(r, 'items') || null,
      pieces: parseInt(toLatinDigits(get(r, 'pieces'))) || 1,
      cod_amount: parseAmount(get(r, 'cod_amount')),
      qp_tracking: can('orders_edit') ? toLatinDigits(get(r, 'qp_tracking')).replace(/\s+/g, '') || null : null,
      client_ref: get(r, 'client_ref') || null,
      brand: get(r, 'brand') || null,
      notes: get(r, 'notes') || null,
      allow_open: parseOpen(get(r, 'allow_open')),
    };
    validateImportRow(o);
    return o;
  });
}
function validateImportRow(o) {
  const e = [];
  // الطلب اللي معاه سيريال اتشحن خلاص، فالهاتف والعنوان مش إجباريين فيه
  const shipped = !!o.qp_tracking;
  if (!o.customer_name) e.push('الاسم ناقص');
  if (!(shipped && !o.customer_phone) && !/^0\d{9,10}$/.test(o.customer_phone)) e.push('رقم الهاتف غير صحيح');
  if (!o.address && !shipped) e.push('العنوان ناقص');
  if (o.cod_amount === null) e.push('المبلغ غير صحيح');
  if (!o.governorate) e.push(o.govRaw ? 'اختر المحافظة' : 'المحافظة ناقصة');
  if (o.dupOf) e.push(o.dupOf);
  o.errors = e;
}
// السيريال: المكرر داخل الملف أو المسجّل على طلب موجود، وحالة الشحنة من فواتير شركة الشحن المرفوعة
async function checkSerials(rows) {
  const seen = {};
  rows.forEach(r => { r.dupOf = null; if (!r.qp_tracking) return;
    if (seen[r.qp_tracking]) r.dupOf = L(`السيريال مكرر في الملف (صف ${seen[r.qp_tracking]})`, `Serial repeated in file (row ${seen[r.qp_tracking]})`);
    else seen[r.qp_tracking] = r.line; });
  const serials = Object.keys(seen);
  for (let i = 0; i < serials.length; i += 150) {
    const { data } = await sb.from('orders').select('order_no, qp_tracking').in('qp_tracking', serials.slice(i, i + 150));
    (data || []).forEach(o => rows.filter(r => r.qp_tracking === o.qp_tracking && !r.dupOf)
      .forEach(r => { r.dupOf = L(`السيريال مسجّل على الطلب #${o.order_no}`, `Serial already on order #${o.order_no}`); }));
  }
  await invoiceStatus(rows.filter(r => r.qp_tracking && !r.dupOf));
  rows.forEach(validateImportRow);
}
// لو الشحنة موجودة في فاتورة شركة الشحن: الطلب يتسجل مسلَّم/مرتجع بالمبلغ المحصّل وتاريخ التحصيل.
// التاريخ اللي قبل بداية الحسابات بياخد تاريخ الفاتورة، عشان قيد الطلب يقابل قيد الفاتورة في «مستحقات لدى شركة الشحن».
async function invoiceStatus(rows) {
  rows.forEach(r => { r.inv = null; });
  if (!rows.length) return;
  const serials = rows.map(r => r.qp_tracking), byS = {};
  for (let i = 0; i < serials.length; i += 150) {
    const { data, error } = await sb.from('qp_invoice_lines').select('id, invoice_id, serial, type, collect_date, return_date, total_amount')
      .in('serial', serials.slice(i, i + 150));
    if (error) return;
    (data || []).forEach(l => { if (!byS[l.serial] || l.id > byS[l.serial].id) byS[l.serial] = l; });
  }
  const invIds = [...new Set(Object.values(byS).map(l => l.invoice_id))];
  const invDate = {};
  for (let i = 0; i < invIds.length; i += 150) {
    const { data } = await sb.from('qp_invoices').select('id, invoice_date').in('id', invIds.slice(i, i + 150));
    (data || []).forEach(v => { invDate[v.id] = v.invoice_date; });
  }
  const { data: st } = await sb.from('acc_settings').select('start_date').eq('id', 1).maybeSingle();
  const start = st && st.start_date;
  rows.forEach(r => {
    const l = byS[r.qp_tracking]; if (!l) return;
    const ret = l.type === 'return' || (!!l.return_date && !l.collect_date);
    let d = (ret ? l.return_date || l.collect_date : l.collect_date || l.return_date) || invDate[l.invoice_id] || isoDay();
    if (start && d < start && invDate[l.invoice_id] && invDate[l.invoice_id] >= start) d = invDate[l.invoice_id];
    r.inv = { status: ret ? 'returned' : 'delivered', collected: +l.total_amount || 0, date: d, invoice: l.invoice_id };
  });
}
// بعد إضافة طلبات بسيريال: إعادة مطابقة فواتير شركة الشحن اللي فيها السيريالات دي
async function rematchSerials(serials) {
  if (!serials.length || !can('accounting_edit')) return 0;
  const inv = new Set();
  for (let i = 0; i < serials.length; i += 150) {
    const { data } = await sb.from('qp_invoice_lines').select('invoice_id').is('order_id', null).in('serial', serials.slice(i, i + 150));
    (data || []).forEach(l => inv.add(l.invoice_id));
  }
  let n = 0;
  for (const id of inv) { const { data } = await sb.rpc('qp_invoice_rematch', { p_id: id }); n += +data || 0; }
  return n;
}

function openImport(preset) {
  if (!preset || !Array.isArray(preset.rows)) preset = null;   // الزرار بيبعت event
  const A = S.isAdmin;
  const m = modal({ title: preset ? preset.title : 'رفع طلبات من ملف Excel', wide: true, body: `
    <div class="import-steps">
      ${preset ? `<div class="alert info">${L('الشحنات دي موجودة في فاتورة شركة الشحن ومش متسجّلة في النظام. اختر العميل واضغط «إضافة» — أو نزّلها كملف Excel، كمّل بياناتها (الهاتف والعنوان)، وارفعها من «رفع Excel» في صفحة الطلبات. السيريال بيتسجّل كرقم تتبع، والطلب ما بيتبعتش لشركة الشحن تاني، وبعد الإضافة الفاتورة بتتطابق تلقائيًا.',
        'These shipments are in the courier invoice but not in the system. Choose the client and press "Add" — or download them as Excel, complete the phone and address, and upload from "Upload Excel" on the orders page. The serial is saved as the tracking number, the order is not sent to the courier again, and the invoice is re-matched automatically.')}</div>` : `<div class="alert info">
        <b>الخطوات:</b> ١) نزّل النموذج واملأه بالطلبات، صف لكل طلب. ٢) ارفع الملف. ٣) راجع الطلبات واضغط "إضافة".
        <div class="small" style="margin-top:6px">يمكنك أيضًا رفع ملف بأعمدة مختلفة؛ سيتعرّف النظام على الأعمدة المعروفة مثل الاسم والهاتف والعنوان والمحافظة والمبلغ.</div>
        ${can('orders_edit') ? `<div class="small" style="margin-top:6px">${L('عمود «سيريال شركة الشحن» اختياري: لو الطلب اتشحن خلاص اكتب السيريال فيه، فيتسجّل كرقم تتبع وما يتبعتش لشركة الشحن تاني (والهاتف والعنوان بيبقوا اختياريين).',
          'The "Courier serial" column is optional: if the order was already shipped, write its serial so it is saved as the tracking number and not sent to the courier again (phone and address become optional).')}
          ${L('ولو الشحنة موجودة في فاتورة شركة الشحن المرفوعة، الطلب بيتسجل مسلَّم أو مرتجع بالمبلغ المحصّل على طول.', 'If the shipment is in an uploaded courier invoice, the order is recorded as delivered or returned with the collected amount right away.')}</div>` : ''}
      </div>`}
      <div class="toolbar">
        ${A ? clientSelect('impClient', '— اختر العميل —', OF.client) : ''}
        ${preset ? `<button class="btn" id="impDl">${L('تنزيل كملف Excel', 'Download as Excel')}</button>` : `<button class="btn" id="impTpl">تنزيل النموذج</button>
        <label class="btn primary" style="cursor:pointer">اختيار الملف<input type="file" id="impFile" accept=".xlsx,.xls,.csv" hidden></label>`}
        <span class="muted small" id="impName"></span>
      </div>
      <div id="impBody"></div>
    </div>`,
    footer: '<button class="btn primary" id="impSave" disabled>إضافة الطلبات</button><span class="spacer"></span><span class="muted small" id="impCount"></span>' });
  let rows = [];
  const render = () => {
    const ok = rows.filter(r => !r.errors.length), bad = rows.length - ok.length;
    $('#impCount', m.el).textContent = rows.length ? `${ok.length} جاهز${bad ? ` — ${bad} يحتاج تصحيح` : ''}` : '';
    $('#impSave', m.el).disabled = !ok.length;
    $('#impSave', m.el).textContent = ok.length ? `إضافة ${ok.length} طلب` : 'إضافة الطلبات';
    if (!rows.length) return;
    $('#impBody', m.el).innerHTML = `
      ${bad ? `<div class="alert">يوجد ${bad} صف يحتاج تصحيحًا (باللون الأحمر). الصفوف الصحيحة فقط هي التي ستُضاف — يمكنك تصحيح الملف ورفعه من جديد.</div>` : '<div class="alert ok">كل الصفوف سليمة ✓</div>'}
      <div class="table-wrap" style="max-height:52vh;overflow:auto;border:1px solid var(--border);border-radius:8px">
      <table class="t"><thead><tr><th>#</th><th>المستلم</th><th>الهاتف</th><th>المحافظة</th><th class="hide-sm">العنوان</th><th>المبلغ</th><th class="hide-sm">${L('السيريال', 'Serial')}</th><th>الحالة</th></tr></thead><tbody>
      ${rows.map((r, i) => `<tr class="${r.errors.length ? 'row-err' : ''}">
        <td class="num muted">${r.line}</td><td>${esc(r.customer_name)}${r.brand || r.client_ref ? `<div class="muted small">${esc([r.brand, r.client_ref].filter(Boolean).join(' · '))}</div>` : ''}</td><td><span class="ltr">${esc(r.customer_phone)}</span></td>
        <td>${r.governorate && !r.govFixed ? esc(r.governorate)
          : `<select class="impGov" data-i="${i}" style="min-width:120px">${govOptions(r.governorate)}</select>${r.govRaw ? `<div class="muted small">في الملف: ${esc(r.govRaw)}</div>` : ''}`}</td>
        <td class="hide-sm small">${esc((r.address || '').slice(0, 60))}</td><td class="num">${r.cod_amount ?? ''}</td>
        <td class="hide-sm small"><span class="ltr">${esc(r.qp_tracking || '')}</span>${r.inv ? `<div>${badge(r.inv.status)} <span class="muted">${L(`فاتورة ${r.inv.invoice}`, `Invoice ${r.inv.invoice}`)}</span></div>` : ''}${r.qpNote ? `<div class="muted notr">${esc(r.qpNote)}</div>` : ''}</td>
        <td>${r.errors.length ? `<span class="neg small">${r.errors.join('، ')}</span>` : '<span class="pos">✓</span>'}</td></tr>`).join('')}
      </tbody></table></div>`;
    $$('.impGov', m.el).forEach(sel => sel.onchange = () => {
      const r = rows[+sel.dataset.i]; r.governorate = sel.value || null; r.govFixed = true; validateImportRow(r); render();
    });
  };
  if (preset) {
    $('#impDl', m.el).onclick = e => busy(e.currentTarget, async () => { try { await loadXLSX(); downloadTemplate(rows, preset.fileName); } catch (err) { fail(err); } });
    rows = preset.rows;
    rows.forEach(r => { if (!r.governorate) r.govFixed = true; });
    $('#impBody', m.el).innerHTML = '<div class="empty">جارٍ قراءة الملف...</div>';
    checkSerials(rows).then(render);
  } else $('#impTpl', m.el).onclick = e => busy(e.currentTarget, async () => { try { await loadXLSX(); downloadTemplate(); } catch (err) { fail(err); } });
  if (!preset) $('#impFile', m.el).onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    $('#impName', m.el).textContent = file.name;
    $('#impBody', m.el).innerHTML = '<div class="empty">جارٍ قراءة الملف...</div>';
    try {
      await loadXLSX();
      const sheet = readSheetRows(await file.arrayBuffer());
      if (!sheet) { rows = []; render(); $('#impBody', m.el).innerHTML = '<div class="alert">لم يتم التعرّف على أعمدة الملف. استخدم النموذج، أو تأكد أن أول صف فيه عناوين الأعمدة (الاسم، الهاتف، العنوان، المحافظة، المبلغ).</div>'; return; }
      rows = buildImportRows(sheet);
      rows.forEach(r => { if (!r.governorate) r.govFixed = true; });
      await checkSerials(rows);
      if (!rows.length) { $('#impBody', m.el).innerHTML = '<div class="alert">الملف لا يحتوي على طلبات.</div>'; }
      render();
    } catch (err) { fail(err); $('#impBody', m.el).innerHTML = ''; }
    e.target.value = '';
  };
  $('#impSave', m.el).onclick = e => {
    const clientId = A ? $('#impClient', m.el).value : S.profile.client_id;
    if (!clientId) return toast('اختر العميل أولًا', 'err');
    const ok = rows.filter(r => !r.errors.length);
    const btn = e.currentTarget;
    busy(btn, async () => {
      let done = 0;
      for (let i = 0; i < ok.length; i += 100) {
        const chunk = ok.slice(i, i + 100).map(r => ({
          client_id: clientId, customer_name: r.customer_name, customer_phone: r.customer_phone, customer_phone2: r.customer_phone2,
          governorate: r.governorate, city: r.city, address: r.address, items: r.items, pieces: r.pieces,
          cod_amount: r.cod_amount, client_ref: r.client_ref, brand: r.brand || null, notes: r.notes, allow_open: r.allow_open,
          ...(!r.qp_tracking ? {} : r.inv ? { qp_tracking: r.qp_tracking, status: r.inv.status, collected_amount: r.inv.collected,
            closed_at: `${r.inv.date}T12:00:00+02:00`, shipped_at: `${r.inv.date}T12:00:00+02:00` }
            : { qp_tracking: r.qp_tracking, status: 'shipped' }) }));
        const { error } = await sb.from('orders').insert(chunk);
        if (error) { fail(error); if (done) toast(`تمت إضافة ${done} طلب قبل حدوث الخطأ`, 'ok'); if (preset) preset.done && preset.done(); else loadOrders(); return; }
        done += chunk.length; btn.textContent = `جارٍ الإضافة... ${done}/${ok.length}`;
      }
      const matched = await rematchSerials(ok.map(r => r.qp_tracking).filter(Boolean));
      toast(L(`تمت إضافة ${done} طلب${matched ? ` — وتمت مطابقة ${matched} شحنة في فواتير شركة الشحن` : ''}`,
        `${done} order(s) added${matched ? ` — ${matched} shipment(s) matched in courier invoices` : ''}`), 'ok');
      m.close(); if (preset && preset.done) preset.done(); else loadOrders();
    });
  };
}

// =====================================================================
//  العملاء (للأدمن)
// =====================================================================
// صفحة العملاء: العملاء | باقات الأسعار | عمولات المبيعات
const salesMgr = () => S.isOwner || can('crm_manager');
const canCommView = () => salesMgr() || can('accounting_view');
let PKGS = [];   // باقات الأسعار (بتتحمّل مع صفحة العملاء)
async function loadPackages() {
  const { data, error } = await sb.from('price_packages').select('*, price_package_rates(*)').order('name');
  PKGS = error ? [] : (data || []);   // قبل migration-022 الجدول مش موجود
  return !error;
}
async function viewClients() {
  setTitle('العملاء');
  const showList = can('clients_view') || can('clients_edit');
  const TABS = [showList && ['list', L('العملاء', 'Clients')], showList && ['packages', L('باقات الأسعار', 'Price packages')],
    canCommView() && ['commission', L('عمولات المبيعات', 'Sales commission')]].filter(Boolean);
  let tab = (location.hash.match(/^#\/clients\/(\w+)/) || [])[1] || TABS[0][0];
  if (!TABS.some(t => t[0] === tab)) tab = TABS[0][0];
  $('#view').innerHTML = `${TABS.length > 1 ? `<div class="tabs">${TABS.map(([k, l]) => `<a href="#/clients/${k}" class="${k === tab ? 'active' : ''}">${l}</a>`).join('')}</div>` : ''}
    <div id="cBodyX"><div class="empty">جارٍ التحميل...</div></div>`;
  try { await ({ list: clientsList, packages: packagesView, commission: commissionView })[tab](); } catch (e) { fail(e); }
}

async function clientsList() {
  const E = can('clients_edit');
  if (E) {
    $('#pageActions').innerHTML = '<button class="btn primary" id="addClientBtn">+ عميل جديد</button>';
    $('#addClientBtn').onclick = () => openClient(null);
  }
  await Promise.all([loadClients(), loadPackages()]);
  const { data: profs } = await sb.from('profiles').select('client_id,email').eq('role', 'client');
  const hasLogin = new Set((profs || []).map(p => p.client_id).filter(Boolean));
  const pk = c => PKGS.find(p => p.id === c.package_id);
  // الأسعار الأساسية: من الباقة لو العميل عليه باقة
  const base = c => { const p = pk(c); return p ? [p.fulfillment_fee, p.return_fee, p.default_shipping_fee] : [c.fulfillment_fee, c.return_fee, c.default_shipping_fee]; };
  $('#cBodyX').innerHTML = `<div class="panel"><div class="table-wrap"><table class="t"><thead><tr>
    <th class="hide-sm">الرمز</th><th>العلامة التجارية</th><th class="hide-sm">المسؤول</th><th class="hide-sm">الهاتف</th><th>${L('الباقة', 'Package')}</th><th class="hide-sm">التجهيز</th>
    <th class="hide-sm">المرتجع الأساسي</th><th class="hide-sm">الشحن الأساسي</th><th>حساب الدخول</th><th></th></tr></thead><tbody>
    ${S.clients.map(c => { const b = base(c); return `<tr data-id="${c.id}">
      <td class="num muted hide-sm">${c.code}</td>
      <td><b>${esc(c.name)}</b>${c.active ? '' : ' <span class="badge b-muted">موقوف</span>'}</td>
      <td class="hide-sm">${esc(c.contact_name || '')}</td><td class="hide-sm"><span class="ltr">${esc(c.phone || '')}</span></td>
      <td>${pk(c) ? `<span class="badge b-indigo">${esc(pk(c).name)}</span>` : `<span class="muted small">${L('أسعار خاصة', 'Custom prices')}</span>`}</td>
      <td class="num hide-sm">${money(b[0])}</td>
      <td class="num hide-sm">${money(b[1])}</td><td class="num hide-sm">${money(b[2])}</td>
      <td>${hasLogin.has(c.id) ? `<span class="badge b-green">مفعّل</span> <span class="muted small ltr">${esc(c.login_email)}</span>`
        : E ? `<button class="btn sm" data-login>إنشاء حساب</button>` : '<span class="muted small">لا يوجد</span>'}</td>
      <td><button class="btn sm" data-edit>${E ? 'تعديل' : 'عرض'}</button></td></tr>`; }).join('')
      || '<tr><td colspan="10" class="empty">لا يوجد عملاء بعد، اضغط "عميل جديد"</td></tr>'}
    </tbody></table></div></div>`;
  $$('#cBodyX tr[data-id]').forEach(tr => {
    const c = S.clients.find(x => x.id === tr.dataset.id);
    $('[data-edit]', tr).onclick = () => openClient(c);
    const l = $('[data-login]', tr); if (l) l.onclick = () => openLogin(c);
  });
}

// ---------- باقات الأسعار (بند 8) ----------
async function packagesView() {
  const E = can('clients_edit');
  if (E) {
    $('#pageActions').innerHTML = `<button class="btn primary" id="addPkgBtn">${L('+ باقة جديدة', '+ New package')}</button>`;
    $('#addPkgBtn').onclick = () => openPackage(null);
  }
  await loadClients();
  if (!await loadPackages()) { $('#cBodyX').innerHTML = `<div class="empty">${L('باقات الأسعار محتاجة تشغيل migration-022', 'Price packages need migration-022')}</div>`; return; }
  const used = id => S.clients.filter(c => c.package_id === id);
  $('#cBodyX').innerHTML = `<div class="alert info small">${L('الباقة فيها التجهيز والشحن والمرتجع وأسعار المحافظات. العميل اللي عليه باقة بياخد أسعارها، ولو له سعر خاص لمحافظة في صفحته بيغلب الباقة. تغيير الباقة بيأثر على الطلبات الجديدة بس.',
      'A package holds fulfillment, shipping, return and per-governorate prices. A client on a package uses them; a special governorate price on the client beats the package. Changing a package affects new orders only.')}</div>
    <div class="panel"><div class="table-wrap"><table class="t"><thead><tr><th>${L('الباقة', 'Package')}</th><th>التجهيز</th><th>الشحن الأساسي</th><th>المرتجع الأساسي</th>
      <th class="hide-sm">${L('أسعار محافظات', 'Governorate prices')}</th><th>${L('العملاء', 'Clients')}</th><th></th></tr></thead><tbody>
    ${PKGS.map(p => `<tr data-id="${p.id}"><td><b>${esc(p.name)}</b>${p.active ? '' : ' <span class="badge b-muted">موقوف</span>'}${p.notes ? `<div class="muted small">${esc(p.notes)}</div>` : ''}</td>
      <td class="num">${money(p.fulfillment_fee)}</td><td class="num">${money(p.default_shipping_fee)}</td><td class="num">${money(p.return_fee)}</td>
      <td class="num hide-sm">${(p.price_package_rates || []).length}</td>
      <td class="small">${used(p.id).map(c => esc(c.name)).join('، ') || '<span class="muted">—</span>'}</td>
      <td><button class="btn sm" data-edit>${E ? 'تعديل' : 'عرض'}</button></td></tr>`).join('')
      || `<tr><td colspan="7" class="empty">${L('مفيش باقات لسه', 'No packages yet')}</td></tr>`}</tbody></table></div></div>`;
  $$('#cBodyX tr[data-id]').forEach(tr => $('[data-edit]', tr).onclick = () => openPackage(PKGS.find(p => p.id === +tr.dataset.id)));
}

function openPackage(p) {
  const isNew = !p; p = p || { active: true, fulfillment_fee: 0, default_shipping_fee: 0, return_fee: 0, price_package_rates: [] };
  const E = can('clients_edit');
  const rates = {}; (p.price_package_rates || []).forEach(r => rates[r.governorate] = r);
  const usedBy = S.clients.filter(c => c.package_id === p.id);
  const m = modal({ title: isNew ? L('باقة جديدة', 'New package') : `${L('الباقة', 'Package')} — ${esc(p.name)}`, wide: true, body: `<form id="pkF">
    <div class="grid g2"><label class="f"><span>${L('اسم الباقة *', 'Package name *')}</span><input name="name" required value="${esc(p.name)}"></label>
      <label class="f"><span>ملاحظات</span><input name="notes" value="${esc(p.notes)}"></label>
      <label class="chk"><input type="checkbox" name="active" ${p.active ? 'checked' : ''}> ${L('الباقة متاحة للاختيار', 'Package available to choose')}</label></div>
    <div class="grid g3">
      <label class="f"><span>التجهيز والتغليف / طلب</span><input name="fulfillment_fee" type="number" step="0.01" min="0" value="${esc(p.fulfillment_fee)}"></label>
      <label class="f"><span>سعر الشحن الأساسي</span><input name="default_shipping_fee" type="number" step="0.01" min="0" value="${esc(p.default_shipping_fee)}"></label>
      <label class="f"><span>سعر المرتجع الأساسي</span><input name="return_fee" type="number" step="0.01" min="0" value="${esc(p.return_fee)}"></label></div>
    ${usedBy.length ? `<p class="hint">${L(`مستخدمة عند: ${usedBy.map(c => esc(c.name)).join('، ')} — التعديل بيأثر على طلباتهم الجديدة بس.`, `Used by: ${usedBy.map(c => esc(c.name)).join(', ')} — changes affect their new orders only.`)}</p>` : ''}
    <div class="section-title">أسعار كل محافظة <span class="hint">— الخانة الفارغة تأخذ السعر الأساسي</span></div>
    <div class="table-wrap" style="max-height:46vh;overflow:auto;border:1px solid var(--border);border-radius:8px">
    <table class="t rates"><thead><tr><th>المحافظة</th><th>الشحن</th><th>المرتجع</th></tr></thead><tbody>
    ${GOVS.map(g => `<tr data-gov="${esc(g)}"><td>${g}</td>
      <td><input type="number" step="0.01" min="0" class="r-ship" value="${rates[g]?.price ?? ''}" placeholder="${esc(p.default_shipping_fee)}"></td>
      <td><input type="number" step="0.01" min="0" class="r-ret" value="${rates[g]?.return_price ?? ''}" placeholder="${esc(p.return_fee)}"></td></tr>`).join('')}
    </tbody></table></div></form>`,
    footer: `${E ? `<button class="btn primary" id="pkSave">${isNew ? L('إضافة الباقة', 'Add package') : 'حفظ'}</button>` : ''}<span class="spacer"></span>
      ${E && !isNew && !usedBy.length ? `<button class="btn danger" id="pkDel">${L('حذف الباقة', 'Delete package')}</button>` : ''}` });
  if (!E) { $$('#pkF input', m.el).forEach(i => i.disabled = true); return; }
  $('[name=default_shipping_fee]', m.el).oninput = e => $$('.r-ship', m.el).forEach(i => i.placeholder = e.target.value);
  $('[name=return_fee]', m.el).oninput = e => $$('.r-ret', m.el).forEach(i => i.placeholder = e.target.value);
  $('#pkSave', m.el).onclick = e => {
    const form = $('#pkF', m.el); if (!form.reportValidity()) return;
    const f = formValues(form);
    const rec = { name: f.name, notes: nz(f.notes), active: f.active, fulfillment_fee: num(f.fulfillment_fee),
      default_shipping_fee: num(f.default_shipping_fee), return_fee: num(f.return_fee), updated_at: new Date().toISOString() };
    busy(e.currentTarget, async () => {
      const res = isNew ? await sb.from('price_packages').insert(rec).select().single() : await sb.from('price_packages').update(rec).eq('id', p.id).select().single();
      if (res.error) return fail(/duplicate|unique/i.test(res.error.message) ? new Error(L('فيه باقة بنفس الاسم', 'A package with this name exists')) : res.error);
      const id = res.data.id;
      const newRates = $$('tr[data-gov]', m.el).map(tr => { const sp = $('.r-ship', tr).value, rp = $('.r-ret', tr).value;
        return (sp === '' && rp === '') ? null : { package_id: id, governorate: tr.dataset.gov, price: sp === '' ? null : num(sp), return_price: rp === '' ? null : num(rp) }; }).filter(Boolean);
      const d = await sb.from('price_package_rates').delete().eq('package_id', id);
      if (d.error) return fail(d.error);
      if (newRates.length) { const r = await sb.from('price_package_rates').insert(newRates); if (r.error) return fail(r.error); }
      toast(isNew ? L('تمت إضافة الباقة', 'Package added') : 'تم الحفظ', 'ok'); m.close(); packagesView();
    });
  };
  if ($('#pkDel', m.el)) $('#pkDel', m.el).onclick = async () => {
    if (!await confirmBox(L(`حذف الباقة «${esc(p.name)}»؟`, `Delete package "${esc(p.name)}"?`), 'حذف', true)) return;
    const { error } = await sb.from('price_packages').delete().eq('id', p.id);
    if (error) return fail(error);
    toast('تم الحذف', 'ok'); m.close(); packagesView();
  };
}

// ---------- عمولات المبيعات (بند 6) ----------
const REP_ROLE = { acquirer: ['جاب العميل', 'Acquired the client'], follower: ['بيتابع العميل', 'Follows the client'] };
async function commissionView() {
  const [f0, t0] = presetRange('month');
  $('#cBodyX').innerHTML = `<div class="alert info small">${L('لكل عميل موظف جابه وموظف بيتابعه، ولكل واحد مبلغ ثابت لكل طلب مسلَّم في المدة اللي المدير حددها (من صفحة العميل). الطلب بيتحسب بتاريخ تسليمه، والمرتجع والملغي والاسترجاع ما بيتحسبوش.',
      'Each client has a staff member who acquired it and one who follows it, each with a fixed amount per delivered order for the period set by the manager (on the client page). Orders count by delivery date; returns, cancellations and return pickups do not count.')}</div>
    <div class="toolbar">${rangePicker('cmR', f0, t0, ['month', 'last', '30d', 'year'])}<button class="btn" id="cmXlsx">تصدير إلى Excel</button></div><div id="cmBody"></div>`;
  let rows = [];
  const load = async () => {
    const [f, t] = rangeVal('cmR');
    if (!f || !t) { $('#cmBody').innerHTML = `<div class="empty">${L('اختار الفترة (من / إلى)', 'Pick the period (from / to)')}</div>`; return; }
    const { data, error } = await sb.rpc('sales_commission_report', { p_from: f, p_to: t });
    if (error) { $('#cmBody').innerHTML = `<div class="empty">${/Could not find the function|does not exist/i.test(error.message || '') ? L('عمولات المبيعات محتاجة تشغيل migration-022', 'Sales commission needs migration-022') : esc(errMsg(error))}</div>`; return; }
    rows = data || [];
    const g = {};
    rows.forEach(r => { const k = r.staff_id || r.staff_name; const x = g[k] || (g[k] = { name: r.staff_name, n: 0, total: 0, rows: [] }); x.n += +r.orders; x.total += +r.total; x.rows.push(r); });
    const list = Object.values(g).sort((a, b) => b.total - a.total);
    $('#cmBody').innerHTML = list.length ? `<div class="panel"><div class="table-wrap"><table class="t"><thead><tr><th>${L('الموظف', 'Staff')}</th><th>العميل</th><th>${L('الدور', 'Role')}</th>
      <th>${L('لكل طلب', 'Per order')}</th><th class="hide-sm">${L('المدة المحسوبة', 'Counted period')}</th><th>${L('طلبات مسلّمة', 'Delivered')}</th><th>${L('العمولة', 'Commission')}</th></tr></thead><tbody>
      ${list.map(x => x.rows.map((r, i) => `<tr${i === 0 ? ' class="grp"' : ''}><td>${i === 0 ? `<b>${esc(x.name || '—')}</b>` : ''}</td><td>${esc(r.client_name)}</td>
        <td class="small">${esc(L(...REP_ROLE[r.role]))}</td><td class="num">${money(r.amount_per_order)}</td>
        <td class="num small hide-sm">${dt(r.period_from)} ← ${dt(r.period_to)}</td><td class="num">${r.orders}</td><td>${amt(r.total)}</td></tr>`).join('')
        + (x.rows.length > 1 ? `<tr class="sub"><td></td><td colspan="4">${L('إجمالي', 'Total')} ${esc(x.name || '')}</td><td class="num">${x.n}</td><td><b>${amt(x.total)}</b></td></tr>` : '')).join('')}</tbody>
      <tfoot><tr><td colspan="5">الإجمالي</td><td class="num">${list.reduce((s, x) => s + x.n, 0)}</td><td>${amt(list.reduce((s, x) => s + x.total, 0))}</td></tr></tfoot></table></div></div>`
      : `<div class="empty">${L('مفيش موظفين مبيعات متعيّنين على عملاء في الفترة دي — بيتعيّنوا من صفحة العميل.', 'No sales staff assigned to clients in this period — assign them on the client page.')}</div>`;
  };
  bindRange('cmR', load);
  $('#cmXlsx').onclick = e => busy(e.currentTarget, async () => {
    if (!rows.length) return toast(L('مفيش بيانات', 'No data'), 'err');
    await loadXLSX();
    const ws = XLSX.utils.aoa_to_sheet([[L('الموظف', 'Staff'), 'العميل', L('الدور', 'Role'), L('لكل طلب', 'Per order'), 'من', 'إلى', L('طلبات مسلّمة', 'Delivered'), L('العمولة', 'Commission')],
      ...rows.map(r => [r.staff_name || '', r.client_name, L(...REP_ROLE[r.role]), +r.amount_per_order, dt(r.period_from), dt(r.period_to), +r.orders, +r.total])]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, L('العمولات', 'Commission'));
    if (!EN) wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.writeFile(wb, `commission-${rangeVal('cmR').join('_')}.xlsx`);
  });
  await load();
}

// موظفين المبيعات على العميل (جوه نافذة العميل)
async function loadClientReps(c, el) {
  if (!el) return;
  const [{ data: reps, error }, { data: staff }] = await Promise.all([
    sb.from('client_sales_reps').select('*').eq('client_id', c.id).order('start_date', { ascending: false }),
    salesMgr() ? sb.from('staff_members').select('id, name, active').order('name') : Promise.resolve({ data: [] })]);
  if (error) { el.innerHTML = ''; return; }
  const M = salesMgr();
  el.innerHTML = `<div class="section-title">${L('موظفين المبيعات والعمولة', 'Sales staff & commission')} ${M ? `<button type="button" class="btn sm" id="repAdd">${L('+ إضافة', '+ Add')}</button>` : ''}</div>
    ${(reps || []).length ? `<div class="table-wrap"><table class="t"><thead><tr><th>${L('الموظف', 'Staff')}</th><th>${L('الدور', 'Role')}</th><th>${L('لكل طلب مسلَّم', 'Per delivered order')}</th><th>من</th><th>إلى</th>${M ? '<th class="w1"></th>' : ''}</tr></thead><tbody>
      ${reps.map(r => `<tr><td>${esc(r.staff_name || '')}${r.notes ? `<div class="muted small">${esc(r.notes)}</div>` : ''}</td><td class="small">${esc(L(...REP_ROLE[r.role]))}</td>
        <td class="num">${money(r.amount_per_order)}</td><td class="num small">${dt(r.start_date)}</td><td class="num small">${r.end_date ? dt(r.end_date) : `<span class="muted">${L('مستمر', 'Ongoing')}</span>`}</td>
        ${M ? `<td><button type="button" class="btn sm" data-rep="${r.id}">تعديل</button></td>` : ''}</tr>`).join('')}</tbody></table></div>`
      : `<p class="muted small" style="margin:0">${L('مفيش موظف مبيعات متعيّن على العميل ده.', 'No sales staff assigned to this client.')}</p>`}`;
  if (!M) return;
  const form = r => {
    r = r || { role: 'follower', start_date: isoDay() };
    const rm = modal({ title: r.id ? L('تعديل موظف المبيعات', 'Edit sales staff') : L('إضافة موظف مبيعات للعميل', 'Add sales staff to client'), body: `<form id="repF" class="grid g2">
        <label class="f"><span>${L('الموظف *', 'Staff *')}</span><select name="staff" required>${opt('', '— اختر —', r.staff_id)}${(staff || []).filter(s => s.active || s.id === r.staff_id).map(s => opt(s.id, s.name, r.staff_id)).join('')}</select></label>
        <label class="f"><span>${L('الدور *', 'Role *')}</span><select name="role">${Object.entries(REP_ROLE).map(([k, x]) => opt(k, L(x[0], x[1]), r.role)).join('')}</select></label>
        <label class="f"><span>${L('المبلغ لكل طلب مسلَّم (ج) *', 'Amount per delivered order (EGP) *')}</span><input name="amount" type="number" step="0.01" min="0" required dir="ltr" value="${esc(r.amount_per_order ?? '')}"></label>
        <span></span>
        <label class="f"><span>${L('من تاريخ *', 'From *')}</span><input name="start" type="date" required value="${esc(r.start_date)}"></label>
        <label class="f"><span>${L('إلى تاريخ (فاضي = مستمر)', 'To (empty = ongoing)')}</span><input name="end" type="date" value="${esc(r.end_date || '')}"></label>
        <label class="f span-all"><span>ملاحظات</span><input name="notes" value="${esc(r.notes || '')}"></label></form>`,
      footer: `<button class="btn primary" id="repOk">حفظ</button><span class="spacer"></span>${r.id ? `<button class="btn danger" id="repDel">${L('حذف', 'Delete')}</button>` : ''}` });
    $('#repOk', rm.el).onclick = e => {
      const fm = $('#repF', rm.el); if (!fm.reportValidity()) return;
      const f = formValues(fm);
      busy(e.currentTarget, async () => {
        const { error: e2 } = await sb.rpc('sales_rep_save', { p_id: r.id || null, p_client: c.id, p_staff: f.staff, p_role: f.role, p_amount: num(f.amount),
          p_start: f.start, p_end: f.end || null, p_notes: f.notes || null });
        if (e2) return fail(e2);
        toast('تم الحفظ', 'ok'); rm.close(); loadClientReps(c, el);
      });
    };
    if ($('#repDel', rm.el)) $('#repDel', rm.el).onclick = async () => {
      if (!await confirmBox(L('حذف السطر ده؟ (لو الموظف ساب المتابعة، الأفضل تحط «إلى تاريخ» بدل الحذف عشان العمولة القديمة تفضل محسوبة)', 'Delete this line? (If the staff member stopped, set an end date instead so past commission is kept.)'), 'حذف', true)) return;
      const { error: e3 } = await sb.rpc('sales_rep_delete', { p_id: r.id });
      if (e3) return fail(e3);
      rm.close(); loadClientReps(c, el);
    };
  };
  $('#repAdd', el).onclick = () => form(null);
  $$('[data-rep]', el).forEach(b => b.onclick = () => form(reps.find(x => x.id === +b.dataset.rep)));
}

async function openClient(c) {
  const isNew = !c; c = c || { active: true, fulfillment_fee: 0, return_fee: 0, default_shipping_fee: 0 };
  const E = can('clients_edit');
  let rates = {};
  await loadPackages();
  if (!isNew) {
    const { data } = await sb.from('client_shipping_rates').select('*').eq('client_id', c.id);
    (data || []).forEach(r => rates[r.governorate] = r);
  }
  const pkgOpts = PKGS.filter(p => p.active || p.id === c.package_id);
  const body = `<form id="clientForm">
    <div class="grid g2">
      <label class="f"><span>اسم العلامة التجارية *</span><input name="name" required value="${esc(c.name)}"></label>
      <label class="f"><span>اسم المسؤول</span><input name="contact_name" value="${esc(c.contact_name)}"></label>
      <label class="f"><span>رقم الهاتف</span><input name="phone" dir="ltr" value="${esc(c.phone)}"></label>
      <label class="f"><span>عنوان الاستلام</span><input name="pickup_address" value="${esc(c.pickup_address)}"></label>
      <label class="f span-all"><span>ملاحظات</span><input name="notes" value="${esc(c.notes)}"></label>
      <label class="chk"><input type="checkbox" name="active" ${c.active ? 'checked' : ''}> العميل نشط</label>
    </div>
    <div class="section-title">الأسعار الخاصة بالعميل (بالجنيه)</div>
    ${PKGS.length || c.package_id ? `<div class="grid g2"><label class="f"><span>${L('باقة الأسعار', 'Price package')}</span><select name="package_id">
      ${opt('', L('بدون باقة — أسعار خاصة بالعميل', 'No package — custom client prices'), c.package_id || '')}${pkgOpts.map(p => opt(p.id, p.name, c.package_id || '')).join('')}</select></label>
      <p class="hint" id="pkgHint" style="align-self:end"></p></div>` : ''}
    <div class="grid g3">
      <label class="f"><span>التجهيز والتغليف / طلب</span><input name="fulfillment_fee" type="number" step="0.01" min="0" value="${esc(c.fulfillment_fee)}"></label>
      <label class="f"><span>سعر المرتجع الأساسي</span><input name="return_fee" type="number" step="0.01" min="0" value="${esc(c.return_fee)}"></label>
      <label class="f"><span>سعر الشحن الأساسي</span><input name="default_shipping_fee" type="number" step="0.01" min="0" value="${esc(c.default_shipping_fee)}"></label>
    </div>
    <p class="hint">الطلب المسلَّم: التكلفة = الشحن + التجهيز. الطلب المرتجع: التكلفة = المرتجع + التجهيز. الصافي للعميل = المبلغ المحصّل − التكلفة.</p>
    <div class="section-title">أسعار كل محافظة <span class="hint">— الخانة الفارغة تأخذ السعر الأساسي</span></div>
    <div class="table-wrap" style="max-height:46vh;overflow:auto;border:1px solid var(--border);border-radius:8px">
    <table class="t rates"><thead><tr><th>المحافظة</th><th>الشحن</th><th>المرتجع</th></tr></thead><tbody>
    ${GOVS.map(g => `<tr data-gov="${esc(g)}"><td>${g}</td>
      <td><input type="number" step="0.01" min="0" class="r-ship" value="${rates[g]?.price ?? ''}" placeholder="${esc(c.default_shipping_fee)}"></td>
      <td><input type="number" step="0.01" min="0" class="r-ret" value="${rates[g]?.return_price ?? ''}" placeholder="${esc(c.return_fee)}"></td></tr>`).join('')}
    </tbody></table></div>
  </form>${!isNew && (salesMgr() || can('accounting_view')) ? '<div id="cReps"></div>' : ''}`;
  const m = modal({ title: isNew ? 'عميل جديد' : `${E ? 'تعديل' : 'بيانات'} — ${esc(c.name)}`, body, wide: true,
    footer: `${E ? `<button class="btn primary" id="cSave">${isNew ? 'إضافة العميل' : 'حفظ'}</button>` : ''}
      <span class="spacer"></span>${!isNew && S.isOwner ? '<button class="btn danger" id="cDelete">حذف العميل</button>' : ''}` });
  if (!isNew) loadClientReps(c, $('#cReps', m.el));
  // الباقة: الأسعار الأساسية بتيجي منها (والخانات بتتقفل)، وأسعار المحافظات اللي هنا بتغلبها
  const pkgSel = $('[name=package_id]', m.el);
  const applyPkg = () => {
    const p = pkgSel && PKGS.find(x => x.id === +pkgSel.value);
    const pr = {}; (p ? p.price_package_rates || [] : []).forEach(r => pr[r.governorate] = r);
    [['fulfillment_fee', p && p.fulfillment_fee], ['return_fee', p && p.return_fee], ['default_shipping_fee', p && p.default_shipping_fee]].forEach(([n, v]) => {
      const i = $(`[name=${n}]`, m.el); if (!i) return;
      if (p) { i.dataset.own = i.dataset.own ?? i.value; i.value = v; i.disabled = true; }
      else { if (i.dataset.own !== undefined) { i.value = i.dataset.own; delete i.dataset.own; } i.disabled = !E; }
    });
    const bs = $('[name=default_shipping_fee]', m.el).value, br = $('[name=return_fee]', m.el).value;
    $$('tr[data-gov]', m.el).forEach(tr => { const g = tr.dataset.gov;
      $('.r-ship', tr).placeholder = p && pr[g]?.price != null ? pr[g].price : bs;
      $('.r-ret', tr).placeholder = p && pr[g]?.return_price != null ? pr[g].return_price : br; });
    if ($('#pkgHint', m.el)) $('#pkgHint', m.el).textContent = p ? L('الأسعار الأساسية من الباقة. اكتب سعر في محافظة تحت لو العميل له سعر خاص فيها.', 'Base prices come from the package. Enter a governorate price below only if this client has a special price there.')
      : L('أسعار العميل نفسه.', 'The client\'s own prices.');
  };
  if (pkgSel) { pkgSel.onchange = applyPkg; applyPkg(); }
  if (!E) $$('#clientForm input, #clientForm select', m.el).forEach(i => i.disabled = true);
  if ($('#cDelete', m.el)) $('#cDelete', m.el).onclick = () => deleteClient(c, m);
  if (!E) return;
  $('[name=default_shipping_fee]', m.el).oninput = () => applyPkg();
  $('[name=return_fee]', m.el).oninput = () => applyPkg();
  $('#cSave', m.el).onclick = e => {
    const form = $('#clientForm', m.el);
    if (!form.reportValidity()) return;
    const f = formValues(form);
    // لو على باقة، أسعار العميل الأساسية القديمة بتفضل محفوظة زي ما هي (بترجع لو اتشالت الباقة)
    const own = n => { const i = $(`[name=${n}]`, m.el); return num(i.dataset.own !== undefined ? i.dataset.own : i.value); };
    const rec = { name: f.name, contact_name: nz(f.contact_name), phone: nz(f.phone), pickup_address: nz(f.pickup_address),
      notes: nz(f.notes), active: f.active, fulfillment_fee: own('fulfillment_fee'),
      return_fee: own('return_fee'), default_shipping_fee: own('default_shipping_fee') };
    if (pkgSel) rec.package_id = pkgSel.value ? +pkgSel.value : null;
    busy(e.currentTarget, async () => {
      const res = isNew ? await sb.from('clients').insert(rec).select().single()
                        : await sb.from('clients').update(rec).eq('id', c.id).select().single();
      if (res.error) return fail(res.error);
      const id = res.data.id;
      const newRates = $$('tr[data-gov]', m.el).map(tr => {
        const sp = $('.r-ship', tr).value, rp = $('.r-ret', tr).value;
        return (sp === '' && rp === '') ? null : { client_id: id, governorate: tr.dataset.gov,
          price: sp === '' ? null : num(sp), return_price: rp === '' ? null : num(rp) };
      }).filter(Boolean);
      const d = await sb.from('client_shipping_rates').delete().eq('client_id', id);
      if (d.error) return fail(d.error);
      if (newRates.length) { const r = await sb.from('client_shipping_rates').insert(newRates); if (r.error) return fail(r.error); }
      toast(isNew ? 'تمت إضافة العميل' : 'تم الحفظ', 'ok'); m.close();
      await viewClients();
      if (isNew && await confirmBox(`هل تريد إنشاء حساب دخول لـ <b>${esc(res.data.name)}</b> الآن؟`, 'نعم، أنشئ الحساب')) openLogin(res.data);
    });
  };
}

// حذف عميل — لمدير النظام فقط. تُحفظ نسخة كاملة من بياناته في الأرشيف قبل الحذف
async function deleteClient(c, parent) {
  const [all, open, unsettled] = await Promise.all([
    sb.from('orders').select('id', { count: 'exact', head: true }).eq('client_id', c.id),
    sb.from('orders').select('id', { count: 'exact', head: true }).eq('client_id', c.id).in('status', ['new', 'processing', 'shipped', 'out_for_delivery', 'on_hold']),
    sb.from('orders').select('id', { count: 'exact', head: true }).eq('client_id', c.id).is('settlement_id', null).in('status', ['delivered', 'returned']),
  ]);
  const m = modal({ title: `حذف العميل — ${esc(c.name)}`, body: `
    <div class="alert">${L(`سيتم حذف العميل <b>${esc(c.name)}</b> نهائيًا مع كل طلباته (<b>${all.count || 0}</b> طلب) وتسوياته وأسعاره، ولن يستطيع حسابه الدخول بعد ذلك.`,
        `Client <b>${esc(c.name)}</b> will be deleted permanently with all orders (<b>${all.count || 0}</b>), settlements and prices, and their login will stop working.`)}
      ${open.count ? `<div style="margin-top:6px"><b>تنبيه:</b> ${L(`لديه ${open.count} طلب لم يُقفل بعد (جديد أو في الطريق).`, `${open.count} order(s) are still open (new or in transit).`)}</div>` : ''}
      ${unsettled.count ? `<div style="margin-top:6px"><b>تنبيه:</b> ${L(`لديه ${unsettled.count} طلب مسلَّم أو مرتجع لم تتم تسويته.`, `${unsettled.count} delivered/returned order(s) are not settled yet.`)}</div>` : ''}</div>
    <p class="small muted">تُحفظ نسخة كاملة من بيانات العميل في أرشيف قاعدة البيانات قبل الحذف.</p>
    <label class="f"><span>للتأكيد اكتب اسم العميل كما هو: <b>${esc(c.name)}</b></span><input id="delName" autocomplete="off"></label>`,
    footer: '<button class="btn danger" id="delOk" disabled>حذف نهائي</button><button class="btn" id="delNo">رجوع</button>' });
  const inp = $('#delName', m.el), ok = $('#delOk', m.el);
  inp.oninput = () => ok.disabled = inp.value.trim() !== c.name.trim();
  $('#delNo', m.el).onclick = m.close;
  ok.onclick = e => busy(e.currentTarget, async () => {
    const { data, error } = await sb.rpc('delete_client', { p_id: c.id, p_confirm_name: inp.value });
    if (error) return fail(error);
    toast(`تم حذف العميل ${c.name} (${data.orders} طلب، ${data.settlements} تسوية)`, 'ok');
    m.close(); parent.close();
    if (OF.client === c.id) OF.client = '';
    await viewClients();
  });
}

function genPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let p = ''; const a = crypto.getRandomValues(new Uint32Array(10));
  a.forEach(x => p += chars[x % chars.length]); return p;
}

function openLogin(c) {
  const body = `<div class="alert info">سيدخل العميل بهذا البريد الإلكتروني وكلمة المرور، ولن يرى إلا طلباته وتسوياته.</div>
    <form id="loginMk" class="grid">
      <label class="f"><span>بريد الدخول *</span><input name="email" type="email" required dir="ltr" value="${esc(c.login_email)}"></label>
      <label class="f"><span>كلمة المرور *</span><input name="password" required minlength="6" dir="ltr" value="${genPassword()}"></label>
    </form><div id="loginDone"></div>`;
  const m = modal({ title: `حساب دخول — ${esc(c.name)}`, body, footer: '<button class="btn primary" id="mkBtn">إنشاء الحساب</button>' });
  $('#mkBtn', m.el).onclick = e => {
    const form = $('#loginMk', m.el);
    if (!form.reportValidity()) return;
    const f = formValues(form); const btn = e.currentTarget;
    busy(btn, async () => {
      // 1) ربط البريد بالعميل أولًا  2) إنشاء الحساب — الخادم يربطهما تلقائيًا
      const u = await sb.from('clients').update({ login_email: f.email.toLowerCase() }).eq('id', c.id);
      if (u.error) return fail(u.error);
      const tmp = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'op-tmp' } });
      const { data, error } = await tmp.auth.signUp({ email: f.email.toLowerCase(), password: f.password });
      if (error) return fail(error);
      const needsConfirm = data.user && !data.session;
      const link = location.origin + location.pathname;
      const msg = `مرحبًا ${c.contact_name || c.name}،\nهذه بيانات حسابك على نظام Operative:\nالرابط: ${link}\nالبريد الإلكتروني: ${f.email.toLowerCase()}\nكلمة المرور: ${f.password}`;
      form.remove(); setTimeout(() => btn.closest('.modal-f')?.remove());
      $('#loginDone', m.el).innerHTML = `<div class="alert ok">تم إنشاء الحساب ✓</div>
        ${needsConfirm ? '<div class="alert">يجب على العميل تفعيل الحساب من بريده الإلكتروني أولًا (أو أوقف تأكيد البريد من إعدادات Supabase).</div>' : ''}
        <p class="small muted">أرسل هذه الرسالة إلى العميل:</p><div class="copybox" id="cpy">${esc(msg)}</div>
        <p><button class="btn sm" id="cpyBtn">نسخ الرسالة</button></p>`;
      $('#cpyBtn', m.el).onclick = () => navigator.clipboard.writeText(msg).then(() => toast('تم النسخ', 'ok'));
      viewClients();
    });
  };
}

// =====================================================================
//  التسويات
// =====================================================================
const PROOF_BUCKET = 'settlement-proofs';

async function viewSettlements() {
  setTitle('التسويات');
  const E = S.isAdmin && can('settlements_edit');
  if (E) {
    $('#pageActions').innerHTML = '<button class="btn primary" id="newSetBtn">+ تسوية جديدة</button>';
    $('#newSetBtn').onclick = newSettlement;
  }
  $('#view').innerHTML = `<div class="toolbar">
      <input class="grow" id="sQ" placeholder="بحث برقم التتبع أو رقم الطلب أو اسم المستلم — يعرض التسوية التي تحتويه">
      ${S.isAdmin ? clientSelect('sClient', 'كل العملاء') : ''}</div>
    <div class="toolbar">${rangePicker('sRange')}</div>
    <div id="sHits"></div><div class="panel" id="sPanel"></div>`;
  const load = async () => {
    const t = $('#sQ').value.replace(/[,()*%"\\]/g, ' ').trim();
    let ids = null;
    $('#sHits').innerHTML = '';
    if (t) {
      const parts = ['qp_tracking', 'customer_name', 'customer_phone', 'client_ref', 'brand'].map(c => `${c}.ilike."*${t}*"`);
      const n = t.replace(/^#/, '');
      if (/^\d+$/.test(n) && n.length < 10) parts.push(`order_no.eq.${n}`);
      const { data: hits, error: he } = await sb.from('orders').select('id, order_no, customer_name, qp_tracking, status, settlement_id')
        .or(parts.join(',')).limit(50);
      if (he) return fail(he);
      ids = [...new Set((hits || []).map(o => o.settlement_id).filter(Boolean))];
      const free = (hits || []).filter(o => !o.settlement_id);
      if (free.length) $('#sHits').innerHTML = `<div class="alert info small">طلبات مطابقة لم تدخل أي تسوية بعد:
        ${free.slice(0, 10).map(o => `${orderNo(o)} ${o.qp_tracking ? `(<span class="ltr">${esc(o.qp_tracking)}</span>)` : ''} ${badge(o.status)}`).join('، ')}</div>`;
      if (!ids.length) {
        $('#sPanel').innerHTML = `<div class="empty">لا توجد تسوية تحتوي على «${esc(t)}»</div>`;
        return;
      }
    }
    let q = sb.from('settlements').select('*').order('created_at', { ascending: false }).limit(300);
    if (S.isAdmin && $('#sClient').value) q = q.eq('client_id', $('#sClient').value);
    const [rf, rt] = rangeDates(...rangeVal('sRange'));
    if (rf) q = q.gte('created_at', rf.toISOString());
    if (rt) q = q.lt('created_at', rt.toISOString());
    if (ids) q = q.in('id', ids);
    const { data, error } = await q;
    if (error) return fail(error);
    $('#sPanel').innerHTML = `<div class="table-wrap"><table class="t"><thead><tr><th>رقم</th>${S.isAdmin ? '<th>العميل</th>' : ''}
      <th class="hide-sm">التاريخ</th><th class="hide-sm">الطلبات</th><th class="hide-sm">المحصّل</th><th class="hide-sm">التكلفة</th><th>الصافي للعميل</th><th>الحالة</th></tr></thead><tbody>
      ${(data || []).map(s => `<tr class="click" data-id="${s.id}"><td class="num"><b>${s.settlement_no}</b></td>
        ${S.isAdmin ? `<td>${esc(clientName(s.client_id))}</td>` : ''}<td class="num hide-sm">${dt(s.created_at)}</td>
        <td class="num hide-sm">${s.orders_count}</td><td class="num hide-sm">${money(s.total_collected)}</td><td class="num hide-sm">${money(s.total_fees)}</td>
        <td>${signed(s.net_amount)}</td>
        <td>${s.status === 'paid' ? `<span class="badge b-green">مدفوعة</span> <span class="muted small">${dt(s.paid_at)}</span>` : '<span class="badge b-amber">غير مدفوعة</span>'}
          ${s.proof_path ? '<span class="badge b-blue" title="مرفق صورة التحويل">إيصال</span>' : ''}</td></tr>`).join('')
        || `<tr><td colspan="8" class="empty">لا توجد تسويات بعد</td></tr>`}</tbody></table></div>
      ${(data || []).length >= 300 ? `<p class="hint" style="padding:0 16px">${L('يُعرض أحدث 300 تسوية فقط — للوصول إلى تسوية أقدم استخدم البحث أو اختر العميل.', 'Only the latest 300 settlements are shown — use search or pick a client to reach older ones.')}</p>` : ''}`;
    $$('#sPanel tr[data-id]').forEach(tr => tr.onclick = () => openSettlement((data || []).find(s => s.id === tr.dataset.id), load, t));
  };
  let timer;
  $('#sQ').oninput = () => { clearTimeout(timer); timer = setTimeout(load, 350); };
  if (S.isAdmin) $('#sClient').onchange = load;
  bindRange('sRange', load);
  await load();
}

const orderCost = o => o.status === 'returned' ? +o.return_fee + +o.fulfillment_fee : +o.shipping_fee + +o.fulfillment_fee;
const feeRow = o => `<td class="num">${money(o.collected_amount)}</td>
  <td class="num">${o.status === 'delivered' ? money(o.shipping_fee) : '—'}</td>
  <td class="num">${o.status === 'returned' ? money(o.return_fee) : '—'}</td>
  <td class="num">${money(o.fulfillment_fee)}</td>
  <td class="num">${money(orderCost(o))}</td><td>${signed(o.net_amount)}</td>`;
const feeHead = '<th>المحصّل</th><th>الشحن</th><th>المرتجع</th><th>التجهيز</th><th>التكلفة</th><th>الصافي</th>';
const trackCell = o => `<td class="num small">${o.qp_tracking ? `<span class="ltr">${esc(o.qp_tracking)}</span>` : '<span class="muted">—</span>'}</td>`;
// نص البحث داخل جدول التسوية
const orderSearchText = o => normAr([o.order_no, '#' + o.order_no, o.qp_tracking, o.customer_name, o.customer_phone, o.client_ref, o.brand].join(' '));

// فلترة صفوف جدول حسب مربع البحث
function bindRowFilter(input, rowsSel, countEl) {
  const run = () => {
    const t = normAr(input.value);
    let shown = 0;
    $$(rowsSel).forEach(tr => {
      const ok = !t || (tr.dataset.s || '').includes(t);
      tr.style.display = ok ? '' : 'none'; if (ok) shown++;
    });
    if (countEl) countEl.textContent = t ? `${shown} نتيجة` : '';
  };
  input.oninput = run; run();
}

function newSettlement() {
  const m = modal({ title: 'تسوية جديدة', wide: true,
    body: `<div class="toolbar">${clientSelect('nsClient', '— اختر العميل —')}
      <input class="grow" id="nsQ" placeholder="بحث برقم التتبع أو رقم الطلب أو الاسم"><span class="muted small" id="nsQn"></span></div>
      <div id="nsBody"><p class="muted">اختر العميل لعرض الطلبات المسلّمة والمرتجعة التي لم تُسوَّ بعد.</p></div>`,
    footer: '<button class="btn primary" id="nsSave" disabled>تأكيد التسوية</button>' });
  let rows = [];
  // ملخص: كل عميل عنده طلبات جاهزة للتسوية وصافيها، والضغط على العميل يفتح طلباته
  const summary = async () => {
    $('#nsBody', m.el).innerHTML = '<div class="empty">جارٍ التحميل...</div>';
    let all;
    try { all = await fetchAllRows(() => sb.from('orders').select('id, client_id, status, collected_amount, net_amount, collection_confirmed_at, return_received_at')
      .is('settlement_id', null).in('status', ['delivered', 'returned']).order('id')); }
    catch (err) { return fail(err); }
    if ($('#nsClient', m.el).value) return;   // اختار عميل أثناء التحميل
    const g = {};
    all.forEach(o => { const x = g[o.client_id] || (g[o.client_id] = { n: 0, d: 0, r: 0, col: 0, net: 0, wm: 0, wmAmt: 0, wr: 0 });
      const ready = o.status === 'delivered' ? !!o.collection_confirmed_at : !!o.return_received_at;
      if (ready) { x.n++; x[o.status === 'delivered' ? 'd' : 'r']++; x.col += +o.collected_amount; x.net += +o.net_amount; }
      else if (o.status === 'delivered') { x.wm++; x.wmAmt += +o.net_amount; } else x.wr++; });
    const list = Object.entries(g).sort((a, b) => b[1].net - a[1].net);
    const T = list.reduce((t, [, x]) => (t.n += x.n, t.net += x.net, t.wm += x.wm, t.wmAmt += x.wmAmt, t.wr += x.wr, t), { n: 0, net: 0, wm: 0, wmAmt: 0, wr: 0 });
    $('#nsBody', m.el).innerHTML = list.length ? `<div class="section-title" style="margin-top:0">${L('الجاهز للتسوية حسب العميل', 'Ready to settle by client')}</div>
      <p class="hint" style="margin-top:0">${L('الجاهز = مسلَّم فلوسه دخلت لينا فعلًا (فاتورة شركة الشحن مستلمة أو تأكيد يدوي) + مرتجع اتأكد استلامه.', 'Ready = delivered with money actually received (courier invoice received or confirmed manually) + returns confirmed received.')}</p>
      <div class="table-wrap"><table class="t"><thead><tr><th>${L('العميل', 'Client')}</th><th>${L('جاهز', 'Ready')} <span class="muted small">(${L('مسلّم/مرتجع', 'del./ret.')})</span></th>
        <th>${L('الصافي الجاهز', 'Ready net')}</th><th class="hide-sm">${L('مسلَّم فلوسه لسه ما اتأكدتش', 'Delivered, money not confirmed')}</th>
        <th class="hide-sm">${L('مرتجع لسه ما وصلش', 'Return not arrived')}</th><th class="w1"></th></tr></thead><tbody>
      ${list.map(([cid, x]) => `<tr class="click nsPick" data-c="${cid}"><td><b>${esc(clientName(cid) || '—')}</b></td>
        <td class="num">${x.n} <span class="muted small">(${x.d}/${x.r})</span></td><td>${signed(x.net)}</td>
        <td class="hide-sm">${x.wm ? `<span class="num">${x.wm}</span> <span class="muted small">(${amt(x.wmAmt)})</span>` : '<span class="muted">—</span>'}</td>
        <td class="num hide-sm">${x.wr || '<span class="muted">—</span>'}</td>
        <td><button type="button" class="btn sm">${L('عرض الطلبات', 'Show orders')}</button></td></tr>`).join('')}</tbody>
      <tfoot><tr><td>${L('الإجمالي', 'Total')}</td><td class="num">${T.n}</td><td>${signed(T.net)}</td><td class="hide-sm num">${T.wm}</td><td class="hide-sm num">${T.wr}</td><td></td></tr></tfoot></table></div>`
      : '<div class="empty">لا توجد طلبات جاهزة للتسوية</div>';
    $$('.nsPick', m.el).forEach(tr => tr.onclick = () => { const s = $('#nsClient', m.el); s.value = tr.dataset.c; s.dispatchEvent(new Event('change')); });
  };
  const recalc = () => {
    const ids = $$('.nsSel:checked', m.el).map(c => c.value);
    const sel = rows.filter(r => ids.includes(r.id));
    const col = sel.reduce((a, o) => a + +o.collected_amount, 0);
    const net = sel.reduce((a, o) => a + +o.net_amount, 0);
    $('#nsTot', m.el).innerHTML = `<div><span class="muted small">عدد الطلبات</span><b>${sel.length}</b></div>
      <div><span class="muted small">المحصّل</span><b>${egp(col)}</b></div><div><span class="muted small">التكلفة</span><b>${egp(col - net)}</b></div>
      <div><span class="muted small">الصافي للعميل</span><b>${egp(net)}</b></div>`;
    $('#nsSave', m.el).disabled = !sel.length;
  };
  $('#nsClient', m.el).onchange = async e => {
    const cid = e.target.value; $('#nsSave', m.el).disabled = true;
    if (!cid) { rows = []; return summary(); }
    // على دفعات: العميل ممكن يكون عنده أكتر من 1000 طلب جاهز للتسوية
    let wait;
    try {
      [rows, wait] = await Promise.all([
        fetchAllRows(() => readyForSettlement(sb.from('orders').select('*').eq('client_id', cid)).order('closed_at').order('order_no')),
        fetchAllRows(() => waitingForSettlement(sb.from('orders').select('*').eq('client_id', cid)).order('closed_at').order('order_no'))]);
    } catch (err) { return fail(err); }
    if ($('#nsClient', m.el).value !== cid) return;   // العميل اتغيّر أثناء التحميل
    const reload = () => $('#nsClient', m.el).dispatchEvent(new Event('change'));
    function bindWait() {
      bindOrderLinks($('#nsBody', m.el), id => rows.find(x => x.id === id) || wait.find(x => x.id === id), reload);
      const btn = $('#nsConf', m.el); if (!btn) return;
      const upd = () => { const n = $$('.nsW:checked', m.el).length; btn.disabled = !n; btn.textContent = n ? L(`تأكيد تحصيل ${n}…`, `Confirm collection of ${n}…`) : L('تأكيد تحصيل المحدد…', 'Confirm collection of selected…'); };
      $$('.nsW', m.el).forEach(c => c.onchange = upd);
      $('#nsWAll', m.el).onchange = ev => { $$('.nsW', m.el).forEach(c => c.checked = ev.target.checked); upd(); };
      btn.onclick = () => confirmCollectionDialog($$('.nsW:checked', m.el).map(c => c.value), reload);
    }
    // مستني: مسلَّم فلوسه ما اتأكدتش (يتأكد من هنا) + مرتجعات لسه ما وصلتش (بتتأكد من صفحة المرتجعات)
    const wm = wait.filter(o => o.status === 'delivered'), wr = wait.filter(o => o.status === 'returned');
    const canConfirm = can('settlements_edit') || can('orders_finance');
    const waitHtml = wait.length ? `<details class="ns-wait" ${rows.length ? '' : 'open'}><summary>${L(`مستني قبل ما يدخل التسوية: ${wm.length} مسلَّم فلوسه لسه ما اتأكدتش، ${wr.length} مرتجع لسه ما وصلش`,
        `Waiting: ${wm.length} delivered with money not confirmed, ${wr.length} returns not arrived`)}</summary>
      ${wm.length ? `<div class="toolbar">${canConfirm ? `<button type="button" class="btn sm primary" id="nsConf" disabled>${L('تأكيد تحصيل المحدد…', 'Confirm collection of selected…')}</button>` : ''}
        <span class="muted small">${L('فواتير شركة الشحن لما تتسجّل مستلمة بتأكد طلباتها لوحدها.', 'Received courier invoices confirm their orders automatically.')}</span></div>
      <div class="table-wrap" style="max-height:30vh;overflow:auto"><table class="t"><thead><tr>${canConfirm ? '<th class="w1"><input type="checkbox" id="nsWAll"></th>' : ''}<th>رقم</th><th>رقم التتبع</th><th>المستلم</th><th>${L('تاريخ التسليم', 'Delivered on')}</th><th>المحصّل</th><th>الصافي</th></tr></thead><tbody>
        ${wm.map(o => `<tr>${canConfirm ? `<td><input type="checkbox" class="nsW" value="${o.id}"></td>` : ''}<td class="num">${orderLink(o)}</td>${trackCell(o)}<td>${esc(o.customer_name)}</td>
          <td class="num small">${dt(o.closed_at)}</td><td class="num">${money(o.collected_amount)}</td><td>${signed(o.net_amount)}</td></tr>`).join('')}</tbody></table></div>` : ''}
      ${wr.length ? `<p class="small">${L('مرتجعات لسه ما اتأكدش وصولها:', 'Returns not confirmed received:')} <span class="olinks">${wr.map(o => orderLink(o)).join('')}</span>
        ${can('returns') ? ` <a href="#/returns/pending" class="small">${L('← صفحة المرتجعات', '→ Returns page')}</a>` : ''}</p>` : ''}</details>` : '';
    if (!rows.length) {
      $('#nsBody', m.el).innerHTML = `<div class="empty">لا توجد طلبات جاهزة للتسوية لهذا العميل</div>${waitHtml}`;
      bindWait(); return;
    }
    const cmp = await qpCompareIds(rows.map(o => o.id));
    const qb = qpBlock(rows, cmp);
    $('#nsBody', m.el).innerHTML = `${waitHtml}${qb.html}<div class="stmt-totals" id="nsTot"></div><div class="table-wrap" style="max-height:50vh;overflow:auto">
      <table class="t"><thead><tr><th class="w1"><input type="checkbox" id="nsAll" checked></th><th>رقم</th><th>رقم التتبع</th><th>المستلم</th><th>الحالة</th><th>تاريخ الإقفال</th>${feeHead}${qpHead(cmp)}</tr></thead>
      <tbody>${rows.map(o => `<tr class="nsRow" data-s="${esc(orderSearchText(o))}"><td><input type="checkbox" class="nsSel" value="${o.id}" checked></td><td class="num">${orderLink(o)}</td>
        ${trackCell(o)}<td>${esc(o.customer_name)}</td><td>${badge(o.status)}</td><td class="num small">${dt(o.closed_at)}</td>${feeRow(o)}${qpCell(o, cmp)}</tr>`).join('')}</tbody></table></div>`;
    if ($('#qpAdoptBtn', m.el)) $('#qpAdoptBtn', m.el).onclick = ev => busy(ev.currentTarget, async () => {
      const { error } = await sb.rpc('qp_adopt_amount', { p_order_ids: qb.diffIds });
      if (error) return fail(error);
      toast('تم اعتماد مبالغ شركة الشحن', 'ok'); $('#nsClient', m.el).dispatchEvent(new Event('change'));
    });
    bindWait();
    $$('.nsSel', m.el).forEach(c => c.onchange = recalc);
    // «تحديد الكل» يطبَّق على الصفوف الظاهرة فقط (بعد البحث)
    $('#nsAll', m.el).onchange = ev => { $$('.nsRow', m.el).filter(tr => tr.style.display !== 'none').forEach(tr => $('.nsSel', tr).checked = ev.target.checked); recalc(); };
    bindRowFilter($('#nsQ', m.el), '#modals .nsRow', $('#nsQn', m.el));
    recalc();
  };
  $('#nsSave', m.el).onclick = e => busy(e.currentTarget, async () => {
    const ids = $$('.nsSel:checked', m.el).map(c => c.value);
    const { data, error } = await sb.rpc('create_settlement', { p_client: $('#nsClient', m.el).value, p_order_ids: ids });
    if (error) return fail(error);
    toast('تم إنشاء التسوية', 'ok'); m.close();
    await viewSettlements();
    const { data: s } = await sb.from('settlements').select('*').eq('id', data).single();
    if (s) openSettlement(s, viewSettlements);
  });
  summary();
}
// الطلبات الجاهزة للتسوية: المسلَّم اللي فلوسه اتأكدت، والمرتجع اللي اتأكد استلامه (نفس شرط create_settlement)
const readyForSettlement = q => q.is('settlement_id', null)
  .or('and(status.eq.delivered,collection_confirmed_at.not.is.null),and(status.eq.returned,return_received_at.not.is.null)');
// مقفول بس لسه مستني: مسلَّم فلوسه ما اتأكدتش، أو مرتجع لسه ما وصلش
const waitingForSettlement = q => q.is('settlement_id', null)
  .or('and(status.eq.delivered,collection_confirmed_at.is.null),and(status.eq.returned,return_received_at.is.null)');

// تأكيد التحصيل يدوي لطلبات مسلّمة (مندوب خاص، العميل مباشرة، …)
function confirmCollectionDialog(ids, done) {
  const m = modal({ title: L(`تأكيد تحصيل ${ids.length} طلب`, `Confirm collection for ${ids.length} order(s)`), body: `<form id="ccF" class="grid">
      <p class="hint" style="margin:0">${L('الفلوس دخلت لينا فعلًا؟ اختار جت منين. الطلب المسلَّم ما بيدخلش التسوية غير بعد التأكيد. (فواتير شركة الشحن المستلمة بتأكد طلباتها لوحدها.)',
        'Did the money actually reach us? Choose where it came from. A delivered order enters a settlement only after this. (Received courier invoices confirm their orders automatically.)')}</p>
      <label class="f"><span>${L('مصدر التحصيل *', 'Collected via *')}</span><select name="src" required>${opt('', '— اختر —')}${Object.entries(COLL_SRC).map(([k, x]) => opt(k, L(x[0], x[1]))).join('')}</select></label>
      <label class="f"><span>${L('ملاحظة (مثال: إنستاباي، اسم المندوب)', 'Note (e.g. InstaPay, courier name)')}</span><input name="note"></label></form>`,
    footer: `<button class="btn primary" id="ccOk">${L('تأكيد', 'Confirm')}</button>` });
  $('#ccOk', m.el).onclick = e => {
    const form = $('#ccF', m.el); if (!form.reportValidity()) return;
    const f = formValues(form);
    busy(e.currentTarget, async () => {
      const { data, error } = await sb.rpc('orders_confirm_collection', { p_ids: ids, p_source: f.src, p_note: f.note || null });
      if (error) return fail(error);
      toast(L(`تم تأكيد تحصيل ${data} طلب`, `Collection confirmed for ${data} order(s)`), 'ok'); m.close(); done && done();
    });
  };
}

// ---------- صورة التحويل ----------
async function uploadProof(s, file) {
  if (!file) return null;
  if (file.size > 10 * 1024 * 1024) throw new Error('حجم الملف أكبر من 10 ميجا');
  const ext = ((file.name.match(/\.(\w+)$/) || [])[1] || (file.type.split('/')[1] || 'jpg')).toLowerCase();
  const path = `${s.client_id}/${s.settlement_no}-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from(PROOF_BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw error;
  const { error: e2 } = await sb.from('settlements').update({ proof_path: path }).eq('id', s.id);
  if (e2) throw e2;
  s.proof_path = path;
  return path;
}

async function showProof(s) {
  const { data, error } = await sb.storage.from(PROOF_BUCKET).createSignedUrl(s.proof_path, 3600);
  if (error) return fail(error);
  const url = data.signedUrl;
  const isPdf = /\.pdf$/i.test(s.proof_path);
  modal({ title: `صورة التحويل — تسوية رقم ${s.settlement_no}`, wide: true,
    body: isPdf ? `<p><a class="btn primary" href="${esc(url)}" target="_blank" rel="noopener">فتح ملف التحويل (PDF)</a></p>`
      : `<div class="proof-view"><img src="${esc(url)}" alt="صورة التحويل"></div>`,
    footer: `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">فتح في نافذة جديدة</a>` });
}

function openProofUpload(s, done) {
  const m = modal({ title: s.proof_path ? 'تغيير صورة التحويل' : 'رفع صورة التحويل', body: `<form class="grid" id="prF">
      <label class="f"><span>صورة التحويل أو الإيصال (صورة أو PDF — حتى 10 ميجا)</span>
        <input type="file" name="proof" accept="image/*,application/pdf" required></label>
      ${s.proof_path ? '<p class="hint" style="margin:0">ستحل الصورة الجديدة محل الصورة الحالية في التسوية.</p>' : ''}</form>`,
    footer: '<button class="btn primary" id="prOk">رفع</button>' });
  $('#prOk', m.el).onclick = e => {
    const inp = $('[name=proof]', m.el);
    if (!inp.files[0]) return toast('اختر الملف أولًا', 'err');
    busy(e.currentTarget, async () => {
      try { await uploadProof(s, inp.files[0]); } catch (err) { return fail(err); }
      toast('تم رفع صورة التحويل', 'ok'); m.close(); done();
    });
  };
}

// كشف التسوية كملف Excel: ورقة ملخص للعميل نفسه + ورقة بكل تفاصيل الطلبات (فيها البراند ورقم طلب البراند عشان العميل يفصل حساباته)
async function exportSettlementXlsx(s, orders, client) {
  await loadXLSX();
  const n = v => Math.round(+v * 100) / 100;
  const del = orders.filter(o => o.status === 'delivered'), ret = orders.filter(o => o.status === 'returned');
  const sum = (list, f) => n(list.reduce((t, o) => t + +f(o), 0));
  const status = s.status === 'paid' ? `مدفوعة ${dt(s.paid_at)}` : 'غير مدفوعة';
  const summary = [
    ['Operative — كشف تسوية حساب'], [],
    ['رقم التسوية', s.settlement_no], ['العميل', client.name || ''], ['تاريخ التسوية', dt(s.created_at)], ['الحالة', status],
    ...(s.status === 'paid' && s.payment_ref ? [['مرجع الدفع', s.payment_ref]] : []), [],
    ['عدد الطلبات', orders.length], ['منها تم التسليم', del.length], ['منها مرتجع', ret.length], [],
    ['إجمالي المحصّل', n(s.total_collected)],
    ['رسوم الشحن', sum(del, o => o.shipping_fee)], ['رسوم المرتجعات', sum(ret, o => o.return_fee)], ['رسوم التجهيز والتغليف', sum(orders, o => o.fulfillment_fee)],
    ['إجمالي التكلفة', n(s.total_fees)], ['الصافي المستحق لكم', n(s.net_amount)],
    ...(s.notes ? [[], ['ملاحظات', s.notes]] : []),
  ];
  const cols = [
    ['رقم الطلب', o => o.order_no], ['رقم الطلب لديكم', o => o.client_ref || ''], ['البراند', o => o.brand || ''],
    ['رقم التتبع', o => o.qp_tracking || ''], ['تاريخ الطلب', o => dt(o.created_at)], ['تاريخ التسليم / الإرجاع', o => dt(o.closed_at)],
    ['اسم المستلم', o => o.customer_name], ['الهاتف', o => o.customer_phone || ''], ['المحافظة', o => o.governorate], ['المنطقة', o => o.city || ''],
    ['العنوان', o => o.address], ['المحتوى', o => o.items || ''], ['عدد القطع', o => o.pieces], ['الحالة', o => STATUS[o.status]?.label || o.status],
    ['المطلوب تحصيله', o => n(o.cod_amount)], ['المحصّل', o => n(o.collected_amount)],
    ['رسوم الشحن', o => o.status === 'delivered' ? n(o.shipping_fee) : 0], ['رسوم المرتجع', o => o.status === 'returned' ? n(o.return_fee) : 0],
    ['التجهيز والتغليف', o => n(o.fulfillment_fee)], ['إجمالي التكلفة', o => n(orderCost(o))], ['الصافي', o => n(o.net_amount)], ['ملاحظات', o => o.notes || ''],
  ];
  // عمود البراند يظهر بس لو فيه طلبات عليها براند (العميل اللي مالوش براندات ما يتلخبطش)
  if (!orders.some(o => o.brand)) cols.splice(cols.findIndex(c => c[0] === 'البراند'), 1);
  const rows = orders.map(o => cols.map(([, f]) => f(o)));
  const ws = XLSX.utils.aoa_to_sheet([cols.map(c => c[0]), ...rows]);
  // صف الإجمالي بمعادلات (بيفضل صح لو العميل رتّب الصفوف)
  const last = rows.length + 1, tot = last + 1;
  const sumCols = ['المطلوب تحصيله', 'المحصّل', 'رسوم الشحن', 'رسوم المرتجع', 'التجهيز والتغليف', 'إجمالي التكلفة', 'الصافي'];
  XLSX.utils.sheet_add_aoa(ws, [['الإجمالي']], { origin: `A${tot}` });
  cols.forEach(([h], i) => {
    if (!sumCols.includes(h)) return;
    const c = XLSX.utils.encode_col(i);
    ws[`${c}${tot}`] = { t: 'n', f: `SUM(${c}2:${c}${last})`, v: sum(orders, o => rows[orders.indexOf(o)][i]) };
  });
  ws['!ref'] = `A1:${XLSX.utils.encode_col(cols.length - 1)}${tot}`;
  ws['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(cols.length - 1)}${last}` };
  ws['!cols'] = cols.map(([h]) => ({ wch: ({ 'العنوان': 40, 'اسم المستلم': 22, 'المحتوى': 24, 'ملاحظات': 28, 'رقم التتبع': 14, 'الهاتف': 26, 'تاريخ التسليم / الإرجاع': 12 })[h] || Math.max(10, h.length + 2) }));
  const ss = XLSX.utils.aoa_to_sheet(summary);
  ss['!cols'] = [{ wch: 26 }, { wch: 22 }];
  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(wb, ss, 'التسوية');
  XLSX.utils.book_append_sheet(wb, ws, 'الطلبات');
  const safe = String(client.name || 'client').replace(/[\\/:*?"<>|]/g, '').trim();
  XLSX.writeFile(wb, `تسوية-${s.settlement_no}-${safe}.xlsx`);
}

async function openSettlement(s, reload, q = '') {
  let orders;
  try { orders = await fetchAllRows(() => sb.from('orders').select('*').eq('settlement_id', s.id).order('order_no')); }
  catch (err) { return fail(err); }
  const client = S.clients.find(c => c.id === s.client_id) || {};
  const cmp = S.isAdmin ? await qpCompareIds((orders || []).map(o => o.id)) : null;
  const qb = qpBlock(orders || [], cmp);
  const head = `<div class="stmt-head"><div><div class="logo">Operative</div><div class="muted small">كشف تسوية حساب</div></div>
      <dl class="kv small"><dt>رقم التسوية</dt><dd>${s.settlement_no}</dd><dt>العميل</dt><dd>${esc(client.name || '')}</dd>
      <dt>التاريخ</dt><dd>${dt(s.created_at)}</dd><dt>الحالة</dt><dd>${s.status === 'paid' ? `مدفوعة ${dt(s.paid_at)}${s.payment_ref ? ' — ' + esc(s.payment_ref) : ''}` : 'غير مدفوعة'}</dd></dl></div>
    <div class="stmt-totals"><div><span class="muted small">عدد الطلبات</span><b>${s.orders_count}</b></div>
      <div><span class="muted small">إجمالي المحصّل</span><b>${egp(s.total_collected)}</b></div>
      <div><span class="muted small">إجمالي التكلفة</span><b>${egp(s.total_fees)}</b></div>
      <div><span class="muted small">الصافي للعميل</span><b>${egp(s.net_amount)}</b></div></div>`;
  const table = `<table class="t"><thead><tr><th>رقم</th><th>رقم التتبع</th><th>المستلم</th><th>المحافظة</th><th>الحالة</th>${feeHead}${qpHead(cmp)}</tr></thead>
    <tbody>${(orders || []).map(o => `<tr class="stRow" data-s="${esc(orderSearchText(o))}"><td class="num"><a href="#" class="olink" data-oid="${o.id}">${orderNo(o)}</a>${o.client_ref ? ` <span class="muted small">(${esc(o.client_ref)})</span>` : ''}</td>
      ${trackCell(o)}<td>${esc(o.customer_name)}</td><td>${esc(o.governorate)}</td><td>${badge(o.status)}</td>${feeRow(o)}${qpCell(o, cmp)}</tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="5">الإجمالي</td><td class="num">${money(s.total_collected)}</td><td colspan="4"></td><td>${signed(s.net_amount)}</td>${cmp ? '<td class="qpcol"></td>' : ''}</tr></tfoot></table>
    ${s.notes ? `<p class="small"><b>ملاحظات:</b> ${esc(s.notes)}</p>` : ''}`;
  const E = S.isAdmin && can('settlements_edit');
  const m = modal({ title: `تسوية رقم ${s.settlement_no}`, wide: true,
    body: `${head}${qb.html}<div class="toolbar"><input class="grow" id="stQ" placeholder="بحث داخل التسوية: رقم التتبع، رقم الطلب، الاسم" value="${esc(q)}">
      <span class="muted small" id="stQn"></span></div><div class="table-wrap">${table}</div>`,
    footer: `<button class="btn primary" id="stXlsx">تنزيل Excel</button>
      ${s.proof_path ? '<button class="btn" id="stProof">عرض صورة التحويل</button>' : ''}
      ${E && s.status !== 'paid' ? '<button class="btn" id="stPaid">تسجيل الدفع</button>' : ''}
      ${E ? `<button class="btn" id="stUpload">${s.proof_path ? 'تغيير صورة التحويل' : 'رفع صورة التحويل'}</button>` : ''}
      <span class="spacer"></span>
      ${E && s.status !== 'paid' ? '<button class="btn danger" id="stDel">إلغاء التسوية</button>' : ''}` });
  bindRowFilter($('#stQ', m.el), '#modals .stRow', $('#stQn', m.el));
  bindOrderLinks(m.el, id => (orders || []).find(x => x.id === id), () => refresh());
  const refresh = async () => {
    m.close(); await reload();
    const { data: s2 } = await sb.from('settlements').select('*').eq('id', s.id).maybeSingle();
    if (s2) openSettlement(s2, reload, $('#stQ', m.el)?.value || '');
  };
  // الضغط على رقم الطلب يفتحه للتعديل، وبعد الحفظ تتحدث التسوية
  $$('.olink', m.el).forEach(a => a.onclick = ev => {
    ev.preventDefault();
    const o = (orders || []).find(x => x.id === a.dataset.oid);
    if (o) openOrder(o, refresh);
  });
  $('#stXlsx', m.el).onclick = e => busy(e.currentTarget, () => exportSettlementXlsx(s, orders || [], client).catch(fail));
  if ($('#stProof', m.el)) $('#stProof', m.el).onclick = () => showProof(s);
  if ($('#qpAdoptBtn', m.el)) $('#qpAdoptBtn', m.el).onclick = e => busy(e.currentTarget, async () => {
    const { error } = await sb.rpc('qp_adopt_amount', { p_order_ids: qb.diffIds });
    if (error) return fail(error);
    toast('تم اعتماد مبالغ شركة الشحن', 'ok'); refresh();
  });
  if ($('#stUpload', m.el)) $('#stUpload', m.el).onclick = () => openProofUpload(s, refresh);
  const paid = $('#stPaid', m.el);
  if (paid) paid.onclick = async () => {
    const { data: payAccs } = await sb.from('acc_accounts').select('id, code, name, kind').not('kind', 'is', null).eq('active', true).order('code');
    const pm = modal({ title: 'تسجيل الدفع', body: `<form class="grid" id="payF">
      ${qb.diffIds.length ? `<div class="alert">تنبيه: ${qb.diffIds.length} طلب في هذه التسوية المبلغ المحصّل فيه مختلف عن فاتورة شركة الشحن.</div>` : ''}
      ${payAccs && payAccs.length ? `<label class="f"><span>دُفعت من *</span><select name="paid_account_id" required>${opt('', '— اختر الخزنة أو البنك —')}${payAccs.map(a => opt(a.id, `${a.code} — ${a.name}`)).join('')}</select></label>` : ''}
      <label class="f"><span>طريقة / مرجع الدفع</span><input name="payment_ref" placeholder="مثال: إنستاباي، تحويل بنكي، نقدًا"></label>
      <label class="f"><span>صورة التحويل <span class="hint">(اختياري — صورة أو PDF)</span></span><input type="file" id="payProof" accept="image/*,application/pdf"></label>
      <label class="f"><span>ملاحظات</span><input name="notes" value="${esc(s.notes)}"></label></form>`,
      footer: '<button class="btn primary" id="payOk">تأكيد</button>' });
    $('#payOk', pm.el).onclick = e => busy(e.currentTarget, async () => {
      if (!$('#payF', pm.el).reportValidity()) return;
      const f = formValues($('#payF', pm.el));
      const file = $('#payProof', pm.el).files[0];
      if (file) { try { await uploadProof(s, file); } catch (err) { return fail(err); } }
      const upd = { status: 'paid', paid_at: new Date().toISOString(), payment_ref: nz(f.payment_ref), notes: nz(f.notes) };
      if (f.paid_account_id) upd.paid_account_id = +f.paid_account_id;
      const { error } = await sb.from('settlements').update(upd).eq('id', s.id);
      if (error) return fail(error);
      toast('تم تسجيل الدفع', 'ok'); pm.close(); refresh();
    });
  };
  const del = $('#stDel', m.el);
  if (del) del.onclick = async () => {
    if (!await confirmBox('سيؤدي إلغاء التسوية إلى إعادة طلباتها إلى حالة "غير مسوّاة". هل تريد المتابعة؟', 'إلغاء التسوية', true)) return;
    const { error } = await sb.from('settlements').delete().eq('id', s.id);
    if (error) return fail(error);
    toast('تم إلغاء التسوية', 'ok'); m.close(); reload();
  };
}

// =====================================================================
//  الحسابات
// =====================================================================
const isoDay = d => (d ? new Date(d) : new Date()).toLocaleDateString('en-CA');
const monthStart = () => { const n = new Date(); return isoDay(new Date(n.getFullYear(), n.getMonth(), 1)); };
const yearStart = () => isoDay(new Date(new Date().getFullYear(), 0, 1));
const A = { list: [], byId: {}, key: {}, start: null };
async function loadAccounts() {
  const [a, s] = await Promise.all([sb.from('acc_accounts').select('*').order('code'), sb.from('acc_settings').select('*').maybeSingle()]);
  if (a.error) throw a.error;
  A.list = a.data || []; A.byId = {}; A.key = {};
  A.list.forEach(x => { A.byId[x.id] = x; if (x.system_key) A.key[x.system_key] = x; });
  A.start = (s.data && s.data.start_date) || null;
}
const accLabel = a => a ? `${a.code} — ${a.name}` : '';
const leafAccounts = (f, withInactive = false) => A.list.filter(a => a.level === 3 && (withInactive || a.active) && (!f || f(a)));
const accOptions = (sel, f, empty = '— اختر الحساب —', withInactive = false) =>
  opt('', empty, sel) + leafAccounts(f, withInactive).map(a => opt(a.id, accLabel(a) + (a.active ? '' : L(' (موقوف)', ' (suspended)')), sel)).join('');
const cashFilter = a => a.kind === 'cash' || a.kind === 'bank';
const ACC_TYPE = { asset: 'الأصول', liability: 'الخصوم', equity: 'حقوق الملكية', revenue: 'الإيرادات', expense: 'المصروفات' };
// الرصيد الطبيعي: الأصول والمصروفات مدينة، والباقي دائن
const natural = (a, dr) => (a.type === 'asset' || a.type === 'expense') ? dr : -dr;
const SRC = { manual: ['يدوي', 'gray'], opening: ['افتتاحي', 'indigo'], order: ['طلب', 'blue'], settlement: ['تسوية', 'green'],
  qp_invoice: ['فاتورة شركة الشحن', 'amber'], qp_receipt: ['تحويل شركة الشحن', 'orange'] };
const srcBadge = s => { const x = SRC[s] || [s, 'gray']; return `<span class="badge b-${x[1]}">${esc(x[0])}</span>`; };
const ACC_TABS = [['journal', 'القيود'], ['chart', 'دليل الحسابات'], ['ledger', 'كشف حساب'], ['trial', 'ميزان المراجعة'],
  ['income', 'قائمة الدخل'], ['balance', 'الميزانية العمومية'], ['clients', 'أرصدة العملاء'], ['qp', 'فواتير شركة الشحن']];
const accE = () => can('accounting_edit');
const hashParam = k => new URLSearchParams((location.hash.split('?')[1]) || '').get(k);
const dateInput = (id, v, label) => `<label class="inl">${label} <input type="date" id="${id}" value="${esc(v || '')}"></label>`;
const levelSelect = (id, sel = '3') => `<select id="${id}" title="مستوى العرض">${opt('1', 'المستوى الأول', sel)}${opt('2', 'المستوى الثاني', sel)}${opt('3', 'المستوى الثالث (تفصيلي)', sel)}</select>`;
const ancestorAt = (a, level) => { while (a && a.level > level) a = A.byId[a.parent_id]; return a; };
const amt = n => `<span class="num ltr">${money(n)}</span>`;
const amtOrDash = n => Math.abs(+n) < 0.005 ? '<span class="muted">—</span>' : amt(n);

// الطباعة: التنظيف بعد انتهاء الطباعة فعلًا (afterprint). على الموبايل window.print() بيرجع فورًا،
// والتنظيف بعد 300ms كان بيفضّي الصفحة قبل ما المعاينة تتعمل.
let printSeq = 0;
function printHtml(html, prep) {
  const area = $('#printArea'), seq = ++printSeq;
  area.innerHTML = html; if (prep) prep(area);
  document.body.classList.add('printing');
  const clean = () => {
    window.removeEventListener('afterprint', clean);
    if (seq !== printSeq) return;   // بدأت طباعة أحدث
    document.body.classList.remove('printing'); area.innerHTML = '';
  };
  window.addEventListener('afterprint', clean);
  window.print();
  setTimeout(clean, 60000);   // احتياطي لو المتصفح ما بعتش afterprint
}
const rangeTxt = (f, t) => `${f ? L('من ', 'From ') + dt(f) + ' ' : ''}${t ? L('إلى ', 'to ') + dt(t) : ''}`;
const reportHead = (title, sub) => `<div class="stmt-head"><div><div class="logo">Operative</div><div class="muted small">${esc(title)}</div></div>
  <div class="small muted">${sub}</div></div>`;

async function viewAccounting() {
  setTitle('الحسابات');
  let tab = (location.hash.match(/^#\/accounting\/(\w+)/) || [])[1] || 'journal';
  if (!ACC_TABS.some(t => t[0] === tab)) tab = 'journal';
  $('#view').innerHTML = `<div class="tabs">${ACC_TABS.map(([k, l]) => `<a href="#/accounting/${k}" class="${k === tab ? 'active' : ''}">${l}</a>`).join('')}</div>
    <div id="accBody"><div class="empty">جارٍ التحميل...</div></div>`;
  try { await loadAccounts(); } catch (e) { return fail(e); }
  try {
    await ({ journal: accJournal, chart: accChart, ledger: accLedger, trial: accTrial, income: accIncome,
      balance: accBalance, clients: accClients, qp: accQp })[tab]();
  } catch (e) { fail(e); }
}

// ---------------- القيود ----------------
async function accJournal() {
  const B = $('#accBody');
  if (accE()) {
    $('#pageActions').innerHTML = `<button class="btn primary" id="aNew">+ قيد يومية</button><button class="btn" id="aExp">+ مصروف</button>
      <button class="btn" id="aRev">+ إيراد</button><button class="btn" id="aTr">تحويل بين الحسابات</button><button class="btn" id="aOpen">أرصدة افتتاحية</button>`;
  }
  $('#pageActions').insertAdjacentHTML('beforeend', `<button class="btn ghost" id="aLog">${L('سجل التعديلات', 'Change log')}</button>`);
  B.innerHTML = `<div class="alert info small">${L(`القيود التلقائية (الطلبات المسلّمة والمرتجعة، ودفع التسويات، وفواتير شركة الشحن وتحويلاتها) تُسجَّل من <b class="ltr">${dt(A.start)}</b>. المصروفات والإيرادات الأخرى تُسجَّل يدويًا من الأزرار بالأعلى.`,
      `Automatic entries (delivered and returned orders, settlement payments, courier invoices and transfers) are recorded from <b class="ltr">${dt(A.start)}</b>. Other expenses and revenue are recorded manually with the buttons above.`)}</div>
    <div class="toolbar">${rangePicker('jR', monthStart(), isoDay())}
      <select id="jSrc">${opt('', 'كل القيود')}${Object.entries(SRC).map(([k, v]) => opt(k, v[0])).join('')}</select>
      <input class="grow" id="jQ" placeholder="بحث في البيان"></div><div class="panel" id="jList"></div>`;
  const load = async () => {
    let q = sb.from('acc_entries').select('*, acc_lines(*)')
      .gte('entry_date', rangeVal('jR')[0] || '1900-01-01').lte('entry_date', rangeVal('jR')[1] || '2999-12-31')
      .order('entry_date', { ascending: false }).order('id', { ascending: false }).limit(500);
    if ($('#jSrc').value) q = q.eq('source', $('#jSrc').value);
    const t = $('#jQ').value.replace(/[%,()]/g, ' ').trim();
    if (t) q = q.ilike('description', `%${t}%`);
    const { data, error } = await q;
    if (error) return fail(error);
    const rows = data || [];
    const tot = rows.reduce((s, e) => s + e.acc_lines.reduce((x, l) => x + +l.debit, 0), 0);
    $('#jList').innerHTML = `<div class="table-wrap"><table class="t"><thead><tr><th>رقم</th><th>التاريخ</th><th>البيان</th><th class="hide-sm">النوع</th><th>المبلغ</th></tr></thead><tbody>
      ${rows.map(e => `<tr class="click" data-id="${e.id}"><td class="num">${e.id}</td><td class="num">${dt(e.entry_date)}</td><td>${esc(e.description)}</td>
        <td class="hide-sm">${srcBadge(e.source)}</td><td>${amt(e.acc_lines.reduce((x, l) => x + +l.debit, 0))}</td></tr>`).join('')
        || '<tr><td colspan="5" class="empty">لا توجد قيود في هذه الفترة</td></tr>'}</tbody>
      ${rows.length ? `<tfoot><tr><td colspan="4">${rows.length} قيد</td><td>${amt(tot)}</td></tr></tfoot>` : ''}</table></div>
      ${rows.length >= 500 ? `<p class="hint" style="padding:0 16px">${L('يُعرض أحدث 500 قيد فقط في هذه الفترة — صغّر الفترة أو استخدم البحث لعرض الباقي.', 'Only the latest 500 entries in this period are shown — narrow the period or use search to see the rest.')}</p>` : ''}`;
    $$('#jList tr[data-id]').forEach(tr => tr.onclick = () => openEntry(rows.find(e => e.id === +tr.dataset.id), load));
  };
  let timer;
  $('#jSrc').onchange = load; bindRange('jR', load);
  $('#jQ').oninput = () => { clearTimeout(timer); timer = setTimeout(load, 350); };
  if (accE()) {
    $('#aNew').onclick = () => openEntryForm({}, load);
    $('#aExp').onclick = () => openQuick('expense', load);
    $('#aRev').onclick = () => openQuick('revenue', load);
    $('#aTr').onclick = () => openQuick('transfer', load);
    $('#aOpen').onclick = () => openOpening(load);
  }
  $('#aLog').onclick = () => openEntryLogAll(load);
  await load();
}

async function fetchEntry(id) {
  const { data, error } = await sb.from('acc_entries').select('*, acc_lines(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

// ---------------- سجل تعديلات القيود ----------------
// كل سطر: إنشاء / تعديل / حذف، مين وإمتى، والقيد قبل وبعد
const LOG_ACT = { create: ['إنشاء', 'Created', 'green'], update: ['تعديل', 'Edited', 'amber'], delete: ['حذف', 'Deleted', 'red'] };
function snapLines(sn) {
  if (!sn) return '<span class="muted">—</span>';
  const ls = (sn.lines || []).map(l => {
    const a = A.byId[l.a];
    return `<div>${esc(a ? accLabel(a) : '#' + l.a)}: ${+l.d ? `${L('مدين', 'Dr')} ${amt(l.d)}` : `${L('دائن', 'Cr')} ${amt(l.c)}`}${l.client ? ` <span class="muted">(${esc(clientName(l.client))})</span>` : ''}${l.memo ? ` <span class="muted">— ${esc(l.memo)}</span>` : ''}</div>`;
  }).join('');
  return `<div class="small"><b>${dt(sn.date)}</b> — ${esc(sn.desc || '')}</div><div class="small">${ls}</div>`;
}
function renderEntryLog(list, withEntry) {
  if (!list.length) return `<p class="muted small" style="margin:0">${L('لا توجد تعديلات مسجّلة (السجل بيبدأ من تشغيل migration-020).', 'No changes logged (logging starts with migration-020).')}</p>`;
  return `<div class="table-wrap"><table class="t"><thead><tr>${withEntry ? `<th>${L('القيد', 'Entry')}</th>` : ''}<th>${L('العملية', 'Action')}</th><th>${L('بواسطة', 'By')}</th><th>${L('الوقت', 'Time')}</th>
      <th>${L('قبل', 'Before')}</th><th>${L('بعد', 'After')}</th></tr></thead><tbody>
    ${list.map(r => { const x = LOG_ACT[r.action] || [r.action, r.action, 'gray'];
      return `<tr>${withEntry ? `<td class="num">${r.action === 'delete' ? r.entry_id : `<a href="#" class="enLogOpen" data-e="${r.entry_id}">${r.entry_id}</a>`}<div>${srcBadge(r.source)}</div></td>` : ''}
        <td><span class="badge b-${x[2]}">${esc(L(x[0], x[1]))}</span></td><td class="notr">${esc(r.actor_name || '')}</td><td class="num small">${dtt(r.created_at)}</td>
        <td>${r.action === 'create' ? '<span class="muted">—</span>' : snapLines(r.before)}</td><td>${r.action === 'delete' ? '<span class="muted">—</span>' : snapLines(r.after)}</td></tr>`; }).join('')}
    </tbody></table></div>`;
}
async function openEntryLogAll(reload) {
  const { data, error } = await sb.from('acc_entry_log').select('*').order('id', { ascending: false }).limit(300);
  if (error) return toast(L('سجل التعديلات محتاج تشغيل migration-020 الأول', 'The change log needs migration-020 to be run first'), 'err');
  const m = modal({ title: L('سجل تعديلات القيود (آخر 300)', 'Journal change log (latest 300)'), wide: true, body: renderEntryLog(data || [], true) });
  $$('.enLogOpen', m.el).forEach(a => a.onclick = async ev => { ev.preventDefault();
    try { const en = await fetchEntry(+a.dataset.e); if (en) openEntry(en, reload); else toast(L('القيد غير موجود', 'Entry not found'), 'err'); } catch (err) { fail(err); } });
}

function openEntry(e, reload) {
  const lines = (e.acc_lines || []).slice().sort((a, b) => a.id - b.id);
  const manual = e.source === 'manual' || e.source === 'opening';
  const sd = lines.reduce((s, l) => s + +l.debit, 0), sc = lines.reduce((s, l) => s + +l.credit, 0);
  const m = modal({ title: `قيد رقم ${e.id}`, wide: true,
    body: `<dl class="kv small"><dt>التاريخ</dt><dd>${dt(e.entry_date)}</dd><dt>البيان</dt><dd>${esc(e.description)}</dd>
        <dt>النوع</dt><dd>${srcBadge(e.source)}</dd><dt>سجّله</dt><dd>${esc(e.created_by_name || '')} <span class="muted small">${dtt(e.created_at)}</span></dd></dl>
      <div class="table-wrap" style="margin-top:12px"><table class="t"><thead><tr><th>الحساب</th><th>مدين</th><th>دائن</th><th>العميل / ملاحظة</th></tr></thead><tbody>
      ${lines.map(l => `<tr><td>${esc(accLabel(A.byId[l.account_id]))}</td><td>${amtOrDash(l.debit)}</td><td>${amtOrDash(l.credit)}</td>
        <td class="small">${l.client_id ? `<b>${esc(clientName(l.client_id))}</b> ` : ''}${esc(l.memo || '')}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>الإجمالي</td><td>${amt(sd)}</td><td>${amt(sc)}</td><td></td></tr></tfoot></table></div>
      ${manual ? '' : '<p class="hint">هذا قيد تلقائي، يتعدّل تلقائيًا عند تعديل مصدره (الطلب أو التسوية أو فاتورة شركة الشحن).</p>'}
      <div class="section-title">${L('سجل التعديلات', 'Change log')}</div><div id="enLog"><p class="muted small">...</p></div>`,
    footer: `${manual && accE() ? '<button class="btn primary" id="enEdit">تعديل</button>' : ''}
      ${!manual ? '<button class="btn" id="enSrc">فتح المصدر</button>' : ''}<span class="spacer"></span>
      ${manual && accE() ? '<button class="btn danger" id="enDel">حذف القيد</button>' : ''}` });
  sb.from('acc_entry_log').select('*').eq('entry_id', e.id).order('id', { ascending: false }).limit(100).then(({ data, error }) => {
    const el = $('#enLog', m.el); if (!el) return;
    // قبل تشغيل migration-020 الجدول مش موجود: نخفي القسم
    if (error) { el.previousElementSibling?.remove(); el.remove(); return; }
    el.innerHTML = renderEntryLog(data || [], false);
  });
  if ($('#enEdit', m.el)) $('#enEdit', m.el).onclick = () => { m.close(); openEntryForm({ entry: e }, reload); };
  if ($('#enDel', m.el)) $('#enDel', m.el).onclick = async () => {
    if (!await confirmBox('هل تريد حذف هذا القيد نهائيًا؟', 'حذف', true)) return;
    const { error } = await sb.rpc('acc_entry_delete', { p_id: e.id });
    if (error) return fail(error);
    toast('تم حذف القيد', 'ok'); m.close(); reload();
  };
  if ($('#enSrc', m.el)) $('#enSrc', m.el).onclick = async () => {
    try {
      if (e.source === 'order') {
        const { data: o, error } = await sb.from('orders').select('*').eq('id', e.source_id).maybeSingle();
        if (error) throw error;
        if (!o) return toast('الطلب غير موجود', 'err');
        m.close(); openOrder(o, reload);
      } else if (e.source === 'settlement') {
        const { data: s, error } = await sb.from('settlements').select('*').eq('id', e.source_id).maybeSingle();
        if (error) throw error;
        if (!s) return toast('التسوية غير موجودة', 'err');
        m.close(); openSettlement(s, reload);
      } else { m.close(); openQpInvoice(+e.source_id, reload); }
    } catch (err) { fail(err); }
  };
}

// نموذج القيد اليومي (عام)
function openEntryForm({ entry = null, lines = null, desc = '', date = null, kind = 'manual', title = '', note = '' } = {}, done) {
  const cf = A.key.client_funds && A.key.client_funds.id;
  const init = entry ? entry.acc_lines.slice().sort((a, b) => a.id - b.id).map(l => ({ a: l.account_id, d: +l.debit || '', c: +l.credit || '', memo: l.memo || '', client: l.client_id || '' }))
    : (lines || [{}, {}]);
  const isOpening = (entry ? entry.source : kind) === 'opening';
  const m = modal({ title: title || (entry ? `تعديل قيد رقم ${entry.id}` : 'قيد يومية جديد'), wide: true,
    body: `${note ? `<div class="alert info small">${note}</div>` : ''}<form id="eF" class="grid g3">
      <label class="f"><span>التاريخ *</span><input type="date" name="date" required value="${esc(entry ? entry.entry_date : (date || isoDay()))}"></label>
      <label class="f span2"><span>البيان *</span><input name="desc" required value="${esc(entry ? entry.description : desc)}"></label>
      <label class="chk span-all"><input type="checkbox" name="opening" ${isOpening ? 'checked' : ''}> قيد أرصدة افتتاحية</label></form>
      <div class="table-wrap"><table class="t elines"><thead><tr><th>الحساب</th><th>مدين</th><th>دائن</th><th>العميل / ملاحظة</th><th class="w1"></th></tr></thead>
      <tbody id="eRows"></tbody><tfoot><tr><td>الإجمالي <span id="eDiff" class="small"></span></td><td id="eDr"></td><td id="eCr"></td><td colspan="2"></td></tr></tfoot></table></div>
      <div class="toolbar" style="margin-top:10px"><button class="btn sm" id="eAdd" type="button">+ سطر</button>
        <select id="eBalAcc" style="max-width:280px">${accOptions(isOpening && A.key.capital ? A.key.capital.id : '', null, '— حساب موازنة الفرق —')}</select>
        <button class="btn sm" id="eBal" type="button">موازنة الفرق على هذا الحساب</button></div>`,
    footer: '<button class="btn primary" id="eSave">حفظ القيد</button>' });
  const rowHtml = l => `<tr class="eRow"><td><select class="eA">${accOptions(l.a, null)}</select></td>
      <td><input class="eD" type="number" step="0.01" min="0" value="${l.d ?? ''}" dir="ltr"></td>
      <td><input class="eC" type="number" step="0.01" min="0" value="${l.c ?? ''}" dir="ltr"></td>
      <td><div class="ecell"><select class="eCl" ${+l.a === cf ? '' : 'style="display:none"'}>${opt('', '— العميل —', l.client)}${S.clients.map(c => opt(c.id, c.name, l.client)).join('')}</select>
        <input class="eM" placeholder="ملاحظة" value="${esc(l.memo || '')}"></div></td>
      <td><button type="button" class="btn sm ghost eX" title="حذف السطر">&times;</button></td></tr>`;
  const tb = $('#eRows', m.el);
  const totals = () => {
    let d = 0, c = 0;
    $$('.eRow', m.el).forEach(r => { d += num($('.eD', r).value); c += num($('.eC', r).value); });
    $('#eDr', m.el).innerHTML = amt(d); $('#eCr', m.el).innerHTML = amt(c);
    const diff = Math.round((d - c) * 100) / 100;
    $('#eDiff', m.el).innerHTML = diff ? `<span class="err-txt">(فرق ${money(Math.abs(diff))})</span>` : (d ? '<span class="ok-txt">(متوازن)</span>' : '');
    return { d, c, diff };
  };
  const bindRow = r => {
    $('.eA', r).onchange = () => { $('.eCl', r).style.display = +$('.eA', r).value === cf ? '' : 'none'; };
    $('.eD', r).oninput = () => { if (num($('.eD', r).value)) $('.eC', r).value = ''; totals(); };
    $('.eC', r).oninput = () => { if (num($('.eC', r).value)) $('.eD', r).value = ''; totals(); };
    $('.eX', r).onclick = () => { r.remove(); totals(); };
  };
  const addRow = l => { tb.insertAdjacentHTML('beforeend', rowHtml(l)); bindRow(tb.lastElementChild); };
  init.forEach(addRow); totals();
  $('#eAdd', m.el).onclick = () => addRow({});
  $('#eBal', m.el).onclick = () => {
    const { diff } = totals(); const acc = $('#eBalAcc', m.el).value;
    if (!diff) return toast('القيد متوازن بالفعل');
    if (!acc) return toast('اختر حساب موازنة الفرق', 'err');
    addRow({ a: acc, d: diff < 0 ? -diff : '', c: diff > 0 ? diff : '', memo: '' }); totals();
  };
  $('#eSave', m.el).onclick = e => {
    const form = $('#eF', m.el); if (!form.reportValidity()) return;
    const f = formValues(form);
    const ls = $$('.eRow', m.el).map(r => ({ a: $('.eA', r).value, d: num($('.eD', r).value), c: num($('.eC', r).value),
      memo: $('.eM', r).value.trim(), client: $('.eCl', r).style.display === 'none' ? '' : $('.eCl', r).value }))
      .filter(l => l.a || l.d || l.c);
    if (ls.some(l => !l.a)) return toast('اختر الحساب في كل سطر', 'err');
    if (ls.some(l => !l.d && !l.c)) return toast('أدخل مبلغًا مدينًا أو دائنًا في كل سطر', 'err');
    if (ls.length < 2) return toast('القيد يحتاج سطرين على الأقل', 'err');
    if (totals().diff) return toast('القيد غير متوازن: إجمالي المدين لا يساوي إجمالي الدائن', 'err');
    busy(e.currentTarget, async () => {
      const { error } = await sb.rpc('acc_entry_save', { p_id: entry ? entry.id : null, p_date: f.date, p_desc: f.desc,
        p_lines: ls.map(l => ({ a: +l.a, d: l.d, c: l.c, memo: l.memo, client: l.client })), p_kind: f.opening ? 'opening' : 'manual' });
      if (error) return fail(error);
      toast('تم حفظ القيد', 'ok'); m.close(); done && done();
    });
  };
}

// مصروف / إيراد / تحويل — نماذج مبسطة
function openQuick(type, done) {
  const T = {
    expense: { title: 'تسجيل مصروف', a1: 'بند المصروف *', f1: a => a.type === 'expense', a2: 'دُفع من *', ph: L('مثال: إيجار المخزن عن شهر ديسمبر', 'e.g. Warehouse rent for December') },
    revenue: { title: 'تسجيل إيراد', a1: 'بند الإيراد *', f1: a => a.type === 'revenue', a2: 'استُلم في *', ph: L('مثال: إيراد خدمة تغليف إضافية', 'e.g. Extra packaging service') },
    transfer: { title: 'تحويل بين الحسابات', a1: 'من حساب *', f1: cashFilter, a2: 'إلى حساب *', ph: L('مثال: إيداع نقدية في البنك', 'e.g. Cash deposit to bank') },
  }[type];
  const m = modal({ title: T.title, body: `<form id="qF" class="grid g2">
      <label class="f"><span>التاريخ *</span><input type="date" name="date" required value="${isoDay()}"></label>
      <label class="f"><span>المبلغ *</span><input type="number" name="amount" step="0.01" min="0.01" required dir="ltr"></label>
      <label class="f"><span>${T.a1}</span><select name="a1" required>${accOptions('', T.f1)}</select></label>
      <label class="f"><span>${T.a2}</span><select name="a2" required>${accOptions('', cashFilter)}</select></label>
      <label class="f span-all"><span>البيان *</span><input name="desc" required placeholder="${esc(T.ph)}"></label></form>`,
    footer: '<button class="btn primary" id="qSave">حفظ</button>' });
  $('#qSave', m.el).onclick = e => {
    const form = $('#qF', m.el); if (!form.reportValidity()) return;
    const f = formValues(form); const v = num(f.amount);
    if (f.a1 === f.a2) return toast('اختر حسابين مختلفين', 'err');
    const lines = type === 'expense' ? [{ a: +f.a1, d: v }, { a: +f.a2, c: v }]
      : type === 'revenue' ? [{ a: +f.a2, d: v }, { a: +f.a1, c: v }]
      : [{ a: +f.a2, d: v }, { a: +f.a1, c: v }];
    busy(e.currentTarget, async () => {
      const { error } = await sb.rpc('acc_entry_save', { p_id: null, p_date: f.date, p_desc: f.desc, p_lines: lines, p_kind: 'manual' });
      if (error) return fail(error);
      toast('تم الحفظ', 'ok'); m.close(); done && done();
    });
  };
}

async function openOpening(done) {
  const { data: exist } = await sb.from('acc_entries').select('*, acc_lines(*)').eq('source', 'opening').order('id').limit(1);
  if (exist && exist.length) {
    toast('يوجد قيد أرصدة افتتاحية بالفعل — تم فتحه للتعديل');
    return openEntryForm({ entry: exist[0], title: 'الأرصدة الافتتاحية' }, done);
  }
  const { data: sug, error } = await sb.rpc('acc_opening_suggestion');
  if (error) return fail(error);
  const k = A.key; const lines = [];
  [k.cash_main, k.bank_main, k.qp_receivable].forEach(a => a && lines.push({ a: a.id, d: '', memo: '' }));
  (sug || []).forEach(r => lines.push({ a: k.client_funds.id, c: r.amount > 0 ? +r.amount : '', d: r.amount < 0 ? -r.amount : '', client: r.client_id, memo: 'صافي طلبات لم تُسوَّ قبل البداية' }));
  openEntryForm({ lines, kind: 'opening', date: A.start, desc: 'أرصدة افتتاحية', title: 'الأرصدة الافتتاحية',
    note: L(`أدخل أرصدة الخزنة والبنك، وإجمالي المبالغ المحصّلة عند شركة الشحن التي لم تُحوَّل بعد (قبل ${dt(A.start)}). مستحقات العملاء محسوبة تلقائيًا من الطلبات غير المسوّاة. بعد الإدخال اضغط «موازنة الفرق» ليُسجَّل الفرق على رأس المال.`,
      `Enter cash and bank balances, and the total collected by the courier but not yet transferred (before ${dt(A.start)}). Client balances are calculated from unsettled orders. Then press "Post the difference" to put the difference on capital.`) }, done);
}

// ---------------- دليل الحسابات ----------------
async function accChart() {
  if (accE()) {
    $('#pageActions').innerHTML = '<button class="btn primary" id="aAdd">+ حساب جديد</button>';
    $('#aAdd').onclick = () => openAccountForm(null, viewAccounting);
  }
  const { data, error } = await sb.rpc('acc_trial', { p_from: null, p_to: null });
  if (error) return fail(error);
  const bal = {};
  (data || []).forEach(r => { bal[r.account_id] = +r.debit - +r.credit; });
  const roll = {};
  A.list.filter(a => a.level === 3).forEach(a => {
    const v = bal[a.id] || 0; roll[a.id] = v;
    const p2 = A.byId[a.parent_id]; if (p2) { roll[p2.id] = (roll[p2.id] || 0) + v; const p1 = A.byId[p2.parent_id]; if (p1) roll[p1.id] = (roll[p1.id] || 0) + v; }
  });
  $('#accBody').innerHTML = `<div class="panel"><div class="table-wrap"><table class="t tree"><thead><tr><th>الكود</th><th>اسم الحساب</th><th class="hide-sm">النوع</th><th>الرصيد</th><th class="w1"></th></tr></thead><tbody>
    ${A.list.map(a => `<tr class="lvl${a.level} ${a.active ? '' : 'inactive'}"><td class="num">${esc(a.code)}</td>
      <td class="ind${a.level}">${esc(a.name)} ${a.kind === 'cash' ? '<span class="badge b-green">خزنة</span>' : a.kind === 'bank' ? '<span class="badge b-blue">بنك</span>' : ''}
        ${a.system_key ? `<span class="badge b-gray" title="${L('يستخدمه النظام في القيود التلقائية', 'Used by automatic entries')}">أساسي</span>` : ''}${a.active ? '' : ' <span class="badge b-muted">موقوف</span>'}</td>
      <td class="hide-sm small">${ACC_TYPE[a.type]}</td><td>${amtOrDash(natural(a, roll[a.id] || 0))}</td>
      <td>${a.level === 3 ? `<button class="btn sm" data-led="${a.id}">كشف</button>${accE() ? ` <button class="btn sm" data-ed="${a.id}">تعديل</button>` : ''}` : ''}</td></tr>`).join('')}
    </tbody></table></div></div>`;
  $$('[data-led]').forEach(b => b.onclick = () => { location.hash = `#/accounting/ledger?acc=${b.dataset.led}`; });
  $$('[data-ed]').forEach(b => b.onclick = () => openAccountForm(A.byId[b.dataset.ed], viewAccounting));
}

function openAccountForm(a, done) {
  const isNew = !a;
  const parents = A.list.filter(x => x.level === 2);
  const nextCode = pid => {
    const p = A.byId[pid]; if (!p) return '';
    const kids = A.list.filter(x => x.parent_id === p.id).map(x => parseInt(x.code, 10)).filter(n => !isNaN(n));
    return String(kids.length ? Math.max(...kids) + 1 : parseInt(p.code + '01', 10));
  };
  const kindSel = sel => `<select name="kind">${opt('', 'عادي', sel)}${opt('cash', 'خزنة', sel)}${opt('bank', 'بنك', sel)}</select>`;
  const m = modal({ title: isNew ? 'حساب جديد' : `تعديل — ${esc(a.name)}`, body: `<form id="acF" class="grid g2">
      ${isNew ? `<label class="f span-all"><span>الحساب الرئيسي *</span><select name="parent" required>${opt('', '— اختر —')}${parents.map(p => opt(p.id, `${p.code} — ${p.name} (${ACC_TYPE[p.type]})`)).join('')}</select></label>` : ''}
      <label class="f"><span>الكود *</span><input name="code" required dir="ltr" value="${esc(a ? a.code : '')}"></label>
      <label class="f"><span>اسم الحساب *</span><input name="name" required value="${esc(a ? a.name : '')}"></label>
      <label class="f" id="acKind" ${isNew || (a.type === 'asset' && a.system_key !== 'qp_receivable') ? '' : 'style="display:none"'}><span>نوع الحساب</span>${kindSel(a ? a.kind : '')}</label>
      ${isNew ? '' : `<label class="chk" style="align-self:end"><input type="checkbox" name="active" ${a.active ? 'checked' : ''} ${a.system_key ? 'disabled' : ''}> الحساب مفعّل</label>`}
      <p class="hint span-all">حسابات «خزنة» و«بنك» تظهر في اختيار طريقة الدفع والاستلام.</p></form>`,
    footer: `<button class="btn primary" id="acSave">حفظ</button><span class="spacer"></span>${!isNew && !a.system_key ? '<button class="btn danger" id="acDel">حذف</button>' : ''}` });
  if (isNew) $('[name=parent]', m.el).onchange = ev => {
    $('[name=code]', m.el).value = nextCode(ev.target.value);
    const p = A.byId[ev.target.value]; $('#acKind', m.el).style.display = p && p.type === 'asset' ? '' : 'none';
  };
  $('#acSave', m.el).onclick = e => {
    const form = $('#acF', m.el); if (!form.reportValidity()) return;
    const f = formValues(form);
    busy(e.currentTarget, async () => {
      const { error } = await sb.rpc('acc_account_save', { p_id: a ? a.id : null, p_parent: isNew ? +f.parent : null,
        p_code: f.code, p_name: f.name, p_kind: nz(f.kind), p_active: isNew ? true : (a.system_key ? true : f.active) });
      if (error) return fail(/duplicate|unique/i.test(error.message) ? new Error('هذا الكود مستخدم لحساب آخر') : error);
      toast('تم الحفظ', 'ok'); m.close(); done && done();
    });
  };
  if ($('#acDel', m.el)) $('#acDel', m.el).onclick = async () => {
    if (!await confirmBox(L(`حذف الحساب <b>${esc(a.name)}</b>؟`, `Delete account <b>${esc(a.name)}</b>?`), 'حذف', true)) return;
    const { error } = await sb.rpc('acc_account_delete', { p_id: a.id });
    if (error) return fail(error);
    toast('تم الحذف', 'ok'); m.close(); done && done();
  };
}

// ---------------- كشف حساب ----------------
async function accLedger() {
  const pre = hashParam('acc'), preClient = hashParam('client') || '';
  const cf = A.key.client_funds && A.key.client_funds.id;
  $('#accBody').innerHTML = `<div class="toolbar"><select id="lAcc" style="min-width:240px">${accOptions(pre || '', null, '— اختر الحساب —', true)}</select>
      <select id="lClient" style="display:none">${opt('', 'كل العملاء', preClient)}${S.clients.map(c => opt(c.id, c.name, preClient)).join('')}</select>
      ${rangePicker('lR', yearStart(), isoDay())}<button class="btn" id="lPrint">طباعة</button></div>
    <div class="panel" id="lBody"><div class="empty">اختر الحساب لعرض كشفه</div></div>`;
  let last = '';
  const load = async () => {
    const acc = A.byId[$('#lAcc').value];
    $('#lClient').style.display = acc && acc.id === cf ? '' : 'none';
    if (!acc) { $('#lBody').innerHTML = '<div class="empty">اختر الحساب لعرض كشفه</div>'; return; }
    const client = acc.id === cf ? nz($('#lClient').value) : null;
    const { data, error } = await sb.rpc('acc_ledger', { p_account: acc.id, p_from: nz(rangeVal('lR')[0]), p_to: nz(rangeVal('lR')[1]), p_client: client });
    if (error) return fail(error);
    let run = natural(acc, +data.opening), td = 0, tc = 0;
    const rows = (data.lines || []).map(l => {
      run += natural(acc, +l.debit - +l.credit); td += +l.debit; tc += +l.credit;
      return `<tr class="click" data-e="${l.entry_id}"><td class="num">${dt(l.date)}</td><td class="num">${l.entry_id}</td>
        <td>${esc(l.description)}${l.memo ? `<div class="muted small">${esc(l.memo)}</div>` : ''}${!client && l.client_id ? `<div class="small"><b>${esc(clientName(l.client_id))}</b></div>` : ''}</td>
        <td>${amtOrDash(l.debit)}</td><td>${amtOrDash(l.credit)}</td><td>${signed(run)}</td></tr>`;
    }).join('');
    const title = accLabel(acc) + (client ? ' — ' + clientName(client) : '');
    last = reportHead('كشف حساب', `${esc(title)}<br>${rangeTxt(...rangeVal('lR'))}`);
    const table = `<table class="t"><thead><tr><th>التاريخ</th><th>القيد</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead><tbody>
      <tr class="lvl2"><td colspan="5">رصيد أول المدة</td><td>${signed(natural(acc, +data.opening))}</td></tr>${rows}</tbody>
      <tfoot><tr><td colspan="3">الإجمالي</td><td>${amt(td)}</td><td>${amt(tc)}</td><td>${signed(run)}</td></tr></tfoot></table>`;
    last += table;
    $('#lBody').innerHTML = `<div class="table-wrap">${table}</div>`;
    $$('#lBody tr[data-e]').forEach(tr => tr.onclick = async () => { try { openEntry(await fetchEntry(+tr.dataset.e), load); } catch (e) { fail(e); } });
  };
  ['lAcc', 'lClient'].forEach(id => $('#' + id).onchange = load); bindRange('lR', load);
  $('#lPrint').onclick = () => last ? printHtml(last) : toast('اختر الحساب أولًا', 'err');
  if (pre) await load();
}

// ---------------- ميزان المراجعة ----------------
async function accTrial() {
  $('#accBody').innerHTML = `<div class="toolbar">${rangePicker('tR', yearStart(), isoDay())}${levelSelect('tLvl')}
    <button class="btn" id="tPrint">طباعة</button></div><div class="panel" id="tBody"></div>`;
  let last = '';
  const load = async () => {
    const [from, to] = rangeVal('tR').map(nz), lvl = +$('#tLvl').value;
    const { data, error } = await sb.rpc('acc_trial', { p_from: from, p_to: to });
    if (error) return fail(error);
    const agg = {};
    (data || []).forEach(r => {
      const a = ancestorAt(A.byId[r.account_id], lvl); if (!a) return;
      const x = agg[a.id] || (agg[a.id] = { a, open: 0, d: 0, c: 0 });
      x.open += +r.opening; x.d += +r.debit; x.c += +r.credit;
    });
    const list = Object.values(agg).sort((p, q) => p.a.code.localeCompare(q.a.code));
    const T = { od: 0, oc: 0, d: 0, c: 0, cd: 0, cc: 0 };
    const rows = list.map(x => {
      const close = x.open + x.d - x.c;
      T.od += Math.max(x.open, 0); T.oc += Math.max(-x.open, 0); T.d += x.d; T.c += x.c; T.cd += Math.max(close, 0); T.cc += Math.max(-close, 0);
      return `<tr><td class="num">${esc(x.a.code)}</td><td>${esc(x.a.name)}</td><td>${amtOrDash(Math.max(x.open, 0))}</td><td>${amtOrDash(Math.max(-x.open, 0))}</td>
        <td>${amtOrDash(x.d)}</td><td>${amtOrDash(x.c)}</td><td>${amtOrDash(Math.max(close, 0))}</td><td>${amtOrDash(Math.max(-close, 0))}</td></tr>`;
    }).join('');
    const ok = Math.abs(T.cd - T.cc) < 0.01;
    const table = `<table class="t"><thead><tr><th rowspan="2">الكود</th><th rowspan="2">الحساب</th><th colspan="2">رصيد أول المدة</th><th colspan="2">حركة الفترة</th><th colspan="2">الرصيد الختامي</th></tr>
      <tr><th>مدين</th><th>دائن</th><th>مدين</th><th>دائن</th><th>مدين</th><th>دائن</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="8" class="empty">لا توجد حركات</td></tr>'}</tbody>
      <tfoot><tr><td colspan="2">الإجمالي ${ok ? '<span class="badge b-green">متوازن</span>' : '<span class="badge b-red">غير متوازن</span>'}</td>
      <td>${amt(T.od)}</td><td>${amt(T.oc)}</td><td>${amt(T.d)}</td><td>${amt(T.c)}</td><td>${amt(T.cd)}</td><td>${amt(T.cc)}</td></tr></tfoot></table>`;
    last = reportHead('ميزان المراجعة', `${rangeTxt(from, to)}`) + table;
    $('#tBody').innerHTML = `<div class="table-wrap">${table}</div>`;
  };
  $('#tLvl').onchange = load; bindRange('tR', load);
  $('#tPrint').onclick = () => printHtml(last);
  await load();
}

// صفوف قائمة متدرجة (للدخل والميزانية): ترجع html والإجمالي
function treeRows(type, valOf, lvl, sign = 1) {
  const roots = A.list.filter(a => a.level === 1 && a.type === type);
  let out = '', total = 0;
  const kids = a => A.list.filter(x => x.parent_id === a.id);
  const sumOf = a => a.level === 3 ? sign * (valOf[a.id] || 0) : kids(a).reduce((s, k) => s + sumOf(k), 0);
  roots.forEach(r => {
    const rt = sumOf(r); total += rt;
    if (lvl >= 2) kids(r).forEach(g => {
      const gt = sumOf(g);
      const leaves = kids(g).filter(l => Math.abs(sumOf(l)) >= 0.005);
      if (Math.abs(gt) < 0.005 && !leaves.length) return;
      out += `<tr class="lvl2"><td class="ind2">${esc(g.name)}</td><td>${lvl === 2 ? signed(gt) : ''}</td></tr>`;
      if (lvl >= 3) {
        leaves.forEach(l => { out += `<tr><td class="ind3">${esc(l.name)}</td><td>${signed(sumOf(l))}</td></tr>`; });
        out += `<tr class="sub"><td class="ind2">إجمالي ${esc(g.name)}</td><td>${signed(gt)}</td></tr>`;
      }
    });
  });
  return { html: out, total };
}

// ---------------- قائمة الدخل ----------------
async function accIncome() {
  $('#accBody').innerHTML = `<div class="toolbar">${rangePicker('iR', monthStart(), isoDay())}${levelSelect('iLvl')}
    <button class="btn" id="iPrint">طباعة</button></div><div class="panel" id="iBody"></div>`;
  let last = '';
  const load = async () => {
    const [from, to] = rangeVal('iR').map(nz), lvl = +$('#iLvl').value;
    const { data, error } = await sb.rpc('acc_trial', { p_from: from, p_to: to });
    if (error) return fail(error);
    const v = {}; (data || []).forEach(r => { v[r.account_id] = +r.debit - +r.credit; });
    const rev = treeRows('revenue', v, lvl, -1), exp = treeRows('expense', v, lvl, 1);
    const net = rev.total - exp.total;
    const table = `<table class="t fin"><tbody>
      <tr class="lvl1"><td>الإيرادات</td><td>${lvl === 1 ? signed(rev.total) : ''}</td></tr>${rev.html}
      ${lvl > 1 ? `<tr class="tot"><td>إجمالي الإيرادات</td><td>${signed(rev.total)}</td></tr>` : ''}
      <tr class="lvl1"><td>المصروفات</td><td>${lvl === 1 ? signed(exp.total) : ''}</td></tr>${exp.html}
      ${lvl > 1 ? `<tr class="tot"><td>إجمالي المصروفات</td><td>${signed(exp.total)}</td></tr>` : ''}
      <tr class="grand"><td>${net >= 0 ? 'صافي الربح' : 'صافي الخسارة'}</td><td>${signed(net)}</td></tr></tbody></table>`;
    last = reportHead('قائمة الدخل', `${rangeTxt(from, to)}`) + table;
    $('#iBody').innerHTML = `<div class="table-wrap">${table}</div>`;
  };
  $('#iLvl').onchange = load; bindRange('iR', load);
  $('#iPrint').onclick = () => printHtml(last);
  await load();
}

// ---------------- الميزانية العمومية ----------------
async function accBalance() {
  $('#accBody').innerHTML = `<div class="toolbar">${dateInput('bTo', isoDay(), 'في تاريخ')}${levelSelect('bLvl')}
    <button class="btn" id="bPrint">طباعة</button></div><div class="panel" id="bBody"></div>`;
  let last = '';
  const load = async () => {
    const to = nz($('#bTo').value), lvl = +$('#bLvl').value;
    const { data, error } = await sb.rpc('acc_trial', { p_from: null, p_to: to });
    if (error) return fail(error);
    const v = {}; (data || []).forEach(r => { v[r.account_id] = +r.debit - +r.credit; });
    const as = treeRows('asset', v, lvl, 1), li = treeRows('liability', v, lvl, -1), eq = treeRows('equity', v, lvl, -1);
    const rev = treeRows('revenue', v, 3, -1).total, exp = treeRows('expense', v, 3, 1).total;
    const profit = rev - exp, right = li.total + eq.total + profit;
    const ok = Math.abs(as.total - right) < 0.01;
    const table = `<table class="t fin"><tbody>
      <tr class="lvl1"><td>الأصول</td><td>${lvl === 1 ? signed(as.total) : ''}</td></tr>${as.html}
      <tr class="grand"><td>إجمالي الأصول</td><td>${signed(as.total)}</td></tr>
      <tr class="lvl1"><td>الخصوم</td><td>${lvl === 1 ? signed(li.total) : ''}</td></tr>${li.html}
      ${lvl > 1 ? `<tr class="tot"><td>إجمالي الخصوم</td><td>${signed(li.total)}</td></tr>` : ''}
      <tr class="lvl1"><td>حقوق الملكية</td><td>${lvl === 1 ? signed(eq.total + profit) : ''}</td></tr>${eq.html}
      ${lvl > 1 ? `<tr${lvl >= 3 ? '' : ' class="lvl2"'}><td class="ind${lvl >= 3 ? 3 : 2}">صافي الأرباح (الخسائر) غير المرحّلة</td><td>${signed(profit)}</td></tr>
        <tr class="tot"><td>إجمالي حقوق الملكية</td><td>${signed(eq.total + profit)}</td></tr>` : ''}
      <tr class="grand"><td>إجمالي الخصوم وحقوق الملكية ${ok ? '<span class="badge b-green">متوازنة</span>' : '<span class="badge b-red">غير متوازنة</span>'}</td><td>${signed(right)}</td></tr></tbody></table>`;
    last = reportHead('الميزانية العمومية', to ? L('في ', 'As of ') + dt(to) : '') + table;
    $('#bBody').innerHTML = `<div class="table-wrap">${table}</div>`;
  };
  ['bTo', 'bLvl'].forEach(id => $('#' + id).onchange = load);
  $('#bPrint').onclick = () => printHtml(last);
  await load();
}

// ---------------- أرصدة العملاء ----------------
async function accClients() {
  $('#accBody').innerHTML = `<div class="toolbar">${dateInput('cTo', isoDay(), 'في تاريخ')}</div><div id="cBody"></div>`;
  const load = async () => {
    const to = nz($('#cTo').value);
    const out = A.key.outside_collections;
    const [cb, ob] = await Promise.all([sb.rpc('acc_client_balances', { p_to: to }),
      out ? sb.rpc('acc_ledger', { p_account: out.id, p_from: null, p_to: to, p_client: null }) : Promise.resolve({ data: null })]);
    if (cb.error) return fail(cb.error);
    const rows = (cb.data || []).filter(r => Math.abs(+r.balance) >= 0.005).sort((a, b) => b.balance - a.balance);
    const brands = {};
    ((ob.data && ob.data.lines) || []).forEach(l => { const k = l.memo || 'أخرى'; brands[k] = (brands[k] || 0) + (+l.credit - +l.debit); });
    const bl = Object.entries(brands).filter(([, v]) => Math.abs(v) >= 0.005).sort((a, b) => b[1] - a[1]);
    $('#cBody').innerHTML = `<div class="panel"><div class="panel-h">أموال العملاء المحصّلة (المستحق لكل عميل)</div><div class="table-wrap">
      <table class="t"><thead><tr><th>العميل</th><th>الرصيد</th><th class="w1"></th></tr></thead><tbody>
      ${rows.map(r => `<tr><td><b>${esc(clientName(r.client_id))}</b></td><td>${signed(r.balance)}</td>
        <td><button class="btn sm" data-c="${r.client_id}">كشف</button></td></tr>`).join('') || '<tr><td colspan="3" class="empty">لا توجد أرصدة</td></tr>'}</tbody>
      ${rows.length ? `<tfoot><tr><td>الإجمالي</td><td>${signed(rows.reduce((s, r) => s + +r.balance, 0))}</td><td></td></tr></tfoot>` : ''}</table></div>
      <p class="hint" style="padding:0 16px">الرصيد الموجب = مبلغ مستحق للعميل. السالب = مبلغ على العميل.</p></div>
      ${out ? `<div class="panel" style="margin-top:16px"><div class="panel-h">تحصيلات براندات خارج النظام (حسب البراند)</div><div class="table-wrap">
      <table class="t"><thead><tr><th>البراند</th><th>الرصيد</th></tr></thead><tbody>
      ${bl.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${signed(v)}</td></tr>`).join('') || '<tr><td colspan="2" class="empty">لا توجد أرصدة</td></tr>'}</tbody></table></div>
      <p class="hint" style="padding:0 16px">صافي ما حصّلته شركة الشحن لشحنات غير مسجّلة في النظام. يُسوّى بقيد يدوي عند الدفع للبراند.</p></div>` : ''}`;
    $$('#cBody [data-c]').forEach(b => b.onclick = () => { location.hash = `#/accounting/ledger?acc=${A.key.client_funds.id}&client=${b.dataset.c}`; });
  };
  $('#cTo').onchange = load;
  await load();
}

// ---------------- فواتير شركة الشحن ----------------
async function accQp() {
  if (accE()) {
    $('#pageActions').innerHTML = '<button class="btn primary" id="qpUp">+ رفع فواتير شركة الشحن</button>';
    $('#qpUp').onclick = () => openQpUpload(load);
  }
  $('#accBody').innerHTML = `<div class="alert info small">${L('ارفع ملفات «Revenue Report» كما تنزل من شركة الشحن. يطابق النظام كل شحنة برقم التتبع، ويسجّل رسوم شركة الشحن كتكلفة، ويُظهر الفروق في التسويات قبل تأكيدها. الشحنات غير المسجّلة في النظام تُسجَّل حسب البراند.',
      'Upload "Revenue Report" files as downloaded from the courier. Each shipment is matched by tracking number, courier fees are recorded as cost, and differences show in settlements before confirmation. Shipments not in the system are recorded by brand.')}</div>
    <div class="panel" id="qpList"></div>`;
  async function load() {
    const { data, error } = await sb.from('qp_invoices').select('*').order('id', { ascending: false }).limit(300);
    if (error) return fail(error);
    $('#qpList').innerHTML = `<div class="table-wrap"><table class="t"><thead><tr><th>رقم</th><th>التاريخ</th><th class="hide-sm">الملف</th><th>الشحنات</th>
      <th class="hide-sm">المحصّل</th><th class="hide-sm">الرسوم</th><th>الصافي</th><th>التحويل</th></tr></thead><tbody>
      ${(data || []).map(i => `<tr class="click" data-id="${i.id}"><td class="num">${i.id}</td><td class="num">${dt(i.invoice_date)}</td>
        <td class="hide-sm small">${esc(i.file_name || '')}</td><td class="num">${i.lines_count} <span class="muted small">(${i.matched_count} في النظام)</span></td>
        <td class="hide-sm">${amt(i.total_amount)}</td><td class="hide-sm">${amt(i.total_fees)}</td><td>${signed(i.total_cod)}</td>
        <td>${i.received ? `<span class="badge b-green">مستلم</span> <span class="muted small">${dt(i.received_date)}</span>` : '<span class="badge b-amber">لم يُستلم</span>'}</td></tr>`).join('')
        || '<tr><td colspan="8" class="empty">لم تُرفع فواتير بعد</td></tr>'}</tbody></table></div>`;
    $$('#qpList tr[data-id]').forEach(tr => tr.onclick = () => openQpInvoice(+tr.dataset.id, load));
  }
  await load();
}

// خانة الهاتف في تقرير شركة الشحن ممكن يكون فيها رقمين لازقين في بعض
const splitPhones = v => { const d = toLatinDigits(v).replace(/[^\d+]/g, ' ');
  const m = d.replace(/\s+/g, '').match(/(?:\+?20|0)?1[0125]\d{8}/g) || [];
  const out = [...new Set(m.map(normPhone))]; return out.length ? out : [normPhone(v)].filter(Boolean); };
// رقم طلب البراند من ملاحظات الشحنة: «Caseq #1234» أو «Caseq - 1234»
const brandRef = notes => { const m = String(notes || '').match(/^\s*[A-Za-z][A-Za-z0-9 ]{0,20}?\s*[-.#]\s*#?\s*([A-Za-z]{0,4}\d[\w-]{0,19})/); return m ? m[1] : null; };
// قراءة ملف Revenue Report
const QP_COLS = { serial: ['serial'], status: ['order delivery status'], status_note: ['statusnote', 'status note'], notes: ['notes'],
  full_name: ['full name'], phone: ['phone'], address: ['address'], governorate: ['governorate'], type: ['type'], total_amount: ['total amount'], total_fees: ['total fees'],
  cod: ['cod'], order_date: ['order date'], collect_date: ['collect date'], return_date: ['return date'] };
function qpDate(v) {
  if (v instanceof Date) return isNaN(v) ? '' : isoDay(new Date(v.getTime() + 12 * 3600e3));
  const s = String(v ?? '').trim(); if (!s) return '';
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  const d = new Date(s); return isNaN(d) ? '' : isoDay(d);
}
function readQpFile(buf) {
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '' });
    for (let h = 0; h < Math.min(rows.length, 6); h++) {
      const map = {};
      rows[h].forEach((cell, i) => {
        const n = String(cell).trim().toLowerCase().replace(/\s+/g, ' ');
        Object.entries(QP_COLS).forEach(([k, al]) => { if (!(k in map) && al.includes(n)) map[k] = i; });
      });
      if ('serial' in map && 'total_amount' in map) {
        return rows.slice(h + 1).filter(r => String(r[map.serial] ?? '').trim()).map(r => {
          const g = k => map[k] === undefined ? '' : r[map[k]];
          return { serial: String(g('serial')).trim(), status: String(g('status')).trim(), status_note: String(g('status_note') || '').trim(),
            notes: String(g('notes') || '').trim(), full_name: String(g('full_name') || '').trim(), governorate: String(g('governorate') || '').trim(),
            phone: toLatinDigits(g('phone')).trim(), address: String(g('address') || '').replace(/\s+/g, ' ').trim(),
            type: String(g('type') || '').trim().toLowerCase(), total_amount: parseAmount(g('total_amount')) || 0, total_fees: parseAmount(g('total_fees')) || 0,
            cod: parseAmount(g('cod')) || 0, order_date: qpDate(g('order_date')), collect_date: qpDate(g('collect_date')), return_date: qpDate(g('return_date')) };
        });
      }
    }
  }
  return null;
}

function openQpUpload(done) {
  const m = modal({ title: 'رفع فواتير شركة الشحن', wide: true, body: `<div class="grid">
      <label class="f"><span>${L('ملفات Revenue Report (يمكن اختيار أكثر من ملف — كل ملف يُسجَّل فاتورة مستقلة)', 'Revenue Report files (you can pick several — each file is recorded as a separate invoice)')}</span>
        <input type="file" id="qpFiles" accept=".xlsx,.xls" multiple></label><div id="qpPrev"></div></div>`,
    footer: '<button class="btn primary" id="qpGo" disabled>رفع الفواتير</button>' });
  let files = [];
  $('#qpFiles', m.el).onchange = async ev => {
    files = []; $('#qpGo', m.el).disabled = true;
    try { await loadXLSX(); } catch (e) { return fail(e); }
    for (const f of ev.target.files) {
      const lines = readQpFile(await f.arrayBuffer());
      const dates = (lines || []).map(l => l.collect_date || l.return_date).filter(Boolean).sort();
      files.push({ name: f.name, lines, date: dates.length ? dates[dates.length - 1] : isoDay() });
    }
    const sum = (ls, k) => (ls || []).reduce((s, l) => s + +l[k], 0);
    $('#qpPrev', m.el).innerHTML = `<div class="table-wrap"><table class="t"><thead><tr><th>الملف</th><th>تاريخ الفاتورة</th><th>الشحنات</th><th>المحصّل</th><th>الرسوم</th><th>الصافي</th></tr></thead><tbody>
      ${files.map((f, i) => f.lines ? `<tr><td class="small">${esc(f.name)}</td><td><input type="date" class="qpD" data-i="${i}" value="${f.date}"></td><td class="num">${f.lines.length}</td>
        <td>${amt(sum(f.lines, 'total_amount'))}</td><td>${amt(sum(f.lines, 'total_fees'))}</td><td>${signed(sum(f.lines, 'cod'))}</td></tr>`
        : `<tr class="row-err"><td class="small">${esc(f.name)}</td><td colspan="5">الملف ليس بصيغة Revenue Report (لم يُعثر على عمودي Serial و Total amount)</td></tr>`).join('')}</tbody></table></div>`;
    $$('.qpD', m.el).forEach(inp => inp.onchange = () => { files[+inp.dataset.i].date = inp.value; });
    $('#qpGo', m.el).disabled = !files.some(f => f.lines && f.lines.length);
  };
  $('#qpGo', m.el).onclick = e => busy(e.currentTarget, async () => {
    const res = [];
    for (const f of files.filter(x => x.lines && x.lines.length)) {
      const { data, error } = await sb.rpc('qp_invoice_import', { p_file: f.name, p_date: f.date || isoDay(), p_lines: f.lines });
      res.push({ f, data, error });
    }
    $('#qpPrev', m.el).innerHTML = `<div class="table-wrap"><table class="t"><thead><tr><th>الملف</th><th>النتيجة</th></tr></thead><tbody>
      ${res.map(r => `<tr><td class="small">${esc(r.f.name)}</td><td>${r.error ? `<span class="err-txt">${esc(errMsg(r.error))}</span>`
        : r.data.ok ? `<span class="ok-txt">✓</span> <a href="#" class="qpOpenInv" data-id="${r.data.id}">${L('فتح الفاتورة', 'Open invoice')}</a> — ${L(`فاتورة رقم ${r.data.id}: ${r.data.lines} شحنة، منها ${r.data.matched} مسجّلة في النظام${r.data.duplicates ? ` — تم تجاهل ${r.data.duplicates} سطر مرفوع من قبل` : ''}`,
          `Invoice ${r.data.id}: ${r.data.lines} shipments, ${r.data.matched} in the system${r.data.duplicates ? ` — ${r.data.duplicates} duplicate line(s) skipped` : ''}`)}`
        : `<span class="err-txt">${esc(tr(r.data.msg))}</span>`}</td></tr>`).join('')}</tbody></table></div>`;
    $('#qpGo', m.el).remove();
    $$('.qpOpenInv', m.el).forEach(a => a.onclick = ev => { ev.preventDefault(); m.close(); openQpInvoice(+a.dataset.id, done); });
    done && done();
  });
}

async function openQpInvoice(id, reload) {
  let iv, lines;
  try {
    // السطور على دفعات: الفاتورة ممكن يكون فيها أكتر من 1000 شحنة
    [iv, lines] = await Promise.all([sb.from('qp_invoices').select('*').eq('id', id).maybeSingle(),
      fetchAllRows(() => sb.from('qp_invoice_lines').select('*').eq('invoice_id', id).order('id'))]);
  } catch (err) { return fail(err); }
  if (iv.error) return fail(iv.error);
  const inv = iv.data; if (!inv) return toast('الفاتورة غير موجودة', 'err');
  const oids = [...new Set(lines.filter(l => l.order_id).map(l => l.order_id))];
  const cmp = await qpCompareIds(oids);
  const orders = {};
  for (let i = 0; i < oids.length; i += 150) {
    const { data } = await sb.from('orders').select('id, order_no, status, collected_amount, client_id, settlement_id').in('id', oids.slice(i, i + 150));
    (data || []).forEach(o => { orders[o.id] = o; });
  }
  const diffOf = l => { const o = orders[l.order_id]; const c = cmp && cmp[l.order_id]; return o && c ? Math.round((c.qp - +o.collected_amount) * 100) / 100 : 0; };
  const diffIds = oids.filter(oid => { const o = orders[oid], c = cmp && cmp[oid]; return o && c && ['delivered', 'returned'].includes(o.status) && Math.abs(c.qp - +o.collected_amount) >= 0.01; });
  const brands = {};
  lines.filter(l => !l.order_id).forEach(l => { const b = brands[l.brand || 'أخرى'] || (brands[l.brand || 'أخرى'] = { n: 0, t: 0, f: 0, c: 0 }); b.n++; b.t += +l.total_amount; b.f += +l.total_fees; b.c += +l.cod; });
  const acc = inv.received_account_id && A.byId[inv.received_account_id];
  const regE = S.isAdmin && can('orders_edit');
  // تعديل براند الشحنات غير المسجّلة سطر سطر (لو الملاحظات مافيهاش البراند)
  const brE = accE(), outLines = lines.filter(l => !l.order_id).length;
  const brandChoices = [...new Set([...lines.map(l => l.brand), ...Object.values(BRAND_ALIAS)].filter(b => b && !['أخرى', 'Operative'].includes(b)))].sort();
  const m = modal({ title: `فاتورة شركة الشحن رقم ${inv.id}`, wide: true, body: `
    <dl class="kv small"><dt>الملف</dt><dd>${esc(inv.file_name || '')}</dd><dt>تاريخ الفاتورة</dt><dd>${dt(inv.invoice_date)}</dd>
      <dt>رفعها</dt><dd>${esc(inv.uploaded_by_name || '')} <span class="muted">${dtt(inv.created_at)}</span></dd>
      <dt>التحويل</dt><dd>${inv.received ? L(`مستلم ${dt(inv.received_date)} — ${amt(inv.received_amount)} ج في ${esc(acc ? acc.name : '')}`,
        `Received ${dt(inv.received_date)} — ${amt(inv.received_amount)} EGP into ${esc(tr(acc ? acc.name : ''))}`) : 'لم يُستلم بعد'}</dd></dl>
    <div class="stmt-totals"><div><span class="muted small">الشحنات</span><b>${inv.lines_count}</b></div>
      <div><span class="muted small">إجمالي المحصّل</span><b>${egp(inv.total_amount)}</b></div>
      <div><span class="muted small">رسوم شركة الشحن</span><b>${egp(inv.total_fees)}</b></div>
      <div><span class="muted small">الصافي المستحق من شركة الشحن</span><b>${egp(inv.total_cod)}</b></div></div>
    ${(() => { const outN = lines.filter(l => !l.order_id).length, matchedN = lines.length - outN;
      const f = (k, n, t) => n ? `<a href="#" class="qvJump" data-f="${k}">${n} ${t}</a>` : `0 ${t}`;
      const diffs = diffIds.map(oid => { const o = orders[oid]; const d = Math.round((cmp[oid].qp - +o.collected_amount) * 100) / 100;
        return orderLink(o, ` <span class="small ltr">(${d > 0 ? '+' : ''}${money(d)})</span>`); });
      return `<div class="${diffIds.length ? 'alert' : outN ? 'alert info' : 'alert ok'} small"><b>${L('المطابقة:', 'Matching:')}</b>
        ${f('matched', matchedN, L('مسجّلة في النظام', 'in the system'))}، ${f('diff', diffIds.length, L('فيها فرق في المبلغ', 'with amount difference'))}، ${f('out', outN, L('غير مسجّلة في النظام', 'not in the system'))}.
        ${diffs.length ? `<div class="olinks-row"><span>${L('الطلبات اللي فيها فرق (الفرق = شركة الشحن − المسجّل عندنا):', 'Orders with difference (courier − ours):')}</span><span class="olinks">${diffs.join('')}</span></div>` : ''}</div>`; })()}
    ${Object.keys(brands).length ? `<div class="section-title">شحنات غير مسجّلة في النظام (حسب البراند)</div><div class="table-wrap"><table class="t">
      <thead><tr><th>البراند</th><th>الشحنات</th><th>المحصّل</th><th>الرسوم</th><th>الصافي</th>${regE ? '<th></th>' : ''}</tr></thead><tbody>
      ${Object.entries(brands).sort((a, b) => b[1].n - a[1].n).map(([k, b]) => `<tr><td>${esc(k)}</td><td class="num">${b.n}</td><td>${amt(b.t)}</td><td>${amt(b.f)}</td><td>${signed(b.c)}</td>
        ${regE ? `<td><button class="btn sm qvReg" data-b="${esc(k)}">${L('تسجيلها كطلبات', 'Register as orders')}</button></td>` : ''}</tr>`).join('')}
      </tbody></table></div>
      ${regE ? `<div class="toolbar"><button class="btn" id="qvRegAll">${L('تسجيل كل الشحنات غير المسجّلة كطلبات', 'Register all unregistered shipments as orders')}</button></div>` : ''}` : ''}
    <div class="section-title">الشحنات</div>
    <div class="toolbar"><select id="qvF">${opt('', 'كل الشحنات')}${opt('matched', 'المسجّلة في النظام')}${opt('diff', 'فيها فرق')}${opt('out', 'غير مسجّلة في النظام')}</select>
      <input class="grow" id="qvQ" placeholder="بحث برقم التتبع أو الاسم أو الملاحظات"><span class="muted small" id="qvN"></span></div>
    ${brE && outLines ? `<div class="toolbar qv-brand"><span class="small">${L('البراند للشحنات المحددة (غير المسجّلة):', 'Brand for the selected (unregistered) shipments:')}</span>
      <input id="qvBrand" list="qvBrandList" style="max-width:200px" placeholder="${L('اسم البراند', 'Brand name')}">
      <datalist id="qvBrandList">${brandChoices.map(b => `<option value="${esc(b)}">`).join('')}</datalist>
      <button class="btn sm primary" id="qvBrandSet" disabled>${L('تعيين', 'Apply')}</button><span class="muted small" id="qvBrandN"></span></div>` : ''}
    <div class="table-wrap" style="max-height:55vh;overflow:auto"><table class="t"><thead><tr>${brE && outLines ? `<th class="w1"><input type="checkbox" id="qvSelAll" title="${L('تحديد الشحنات غير المسجّلة الظاهرة', 'Select visible unregistered shipments')}"></th>` : ''}<th>رقم التتبع</th><th>الاسم</th><th class="hide-sm">الحالة</th>
      <th>المحصّل</th><th class="hide-sm">الرسوم</th><th class="hide-sm">الصافي</th><th>الطلب</th><th>المسجّل عندنا</th><th>الفرق</th></tr></thead><tbody>
      ${lines.map(l => { const o = orders[l.order_id]; const d = diffOf(l);
        return `<tr class="qvRow" data-k="${l.order_id ? (d ? 'matched diff' : 'matched') : 'out'}" data-s="${esc(normAr([l.serial, l.full_name, l.notes, l.brand, o ? '#' + o.order_no : ''].join(' ')))}">
        ${brE && outLines ? `<td>${l.order_id ? '' : `<input type="checkbox" class="qvSel" value="${l.id}">`}</td>` : ''}<td class="num"><span class="ltr">${esc(l.serial)}</span></td><td class="notr">${esc(l.full_name || '')}<div class="muted small">${esc(l.notes || '')}</div></td>
        <td class="hide-sm small">${esc(l.delivery_status || '')} ${l.type === 'return' ? '<span class="badge b-red">return</span>' : ''}</td>
        <td>${amt(l.total_amount)}</td><td class="hide-sm">${amt(l.total_fees)}</td><td class="hide-sm">${signed(l.cod)}</td>
        <td>${o ? `<a href="#" class="olink" data-oid="${o.id}">#${o.order_no}</a>` : `<span class="muted small">${esc(l.brand || '')}</span>`}</td>
        <td>${o ? amt(o.collected_amount) : ''}</td><td>${o ? (d ? signed(d) : '<span class="ok-txt">✓</span>') : ''}</td></tr>`; }).join('')}</tbody></table></div>`,
    footer: `${accE() && !inv.received ? '<button class="btn primary" id="qvRcv">تسجيل استلام التحويل</button>' : ''}
      ${accE() && inv.received ? '<button class="btn" id="qvUnrcv">إلغاء الاستلام</button>' : ''}
      ${diffIds.length && can('orders_finance') ? `<button class="btn" id="qvAdopt">اعتماد مبالغ شركة الشحن (${diffIds.length})</button>` : ''}
      ${accE() ? '<button class="btn" id="qvRem">إعادة المطابقة</button>' : ''}<span class="spacer"></span>
      ${accE() ? '<button class="btn danger" id="qvDel">حذف الفاتورة</button>' : ''}` });
  const filt = () => {
    const k = $('#qvF', m.el).value, t = normAr($('#qvQ', m.el).value); let n = 0;
    $$('.qvRow', m.el).forEach(r => { const ok = (!k || r.dataset.k.split(' ').includes(k)) && (!t || r.dataset.s.includes(t)); r.style.display = ok ? '' : 'none'; if (ok) n++; });
    $('#qvN', m.el).textContent = (k || t) ? `${n} نتيجة` : '';
  };
  $('#qvF', m.el).onchange = filt; $('#qvQ', m.el).oninput = filt;
  if ($('#qvBrandSet', m.el)) {
    const selN = () => { const n = $$('.qvSel:checked', m.el).length; $('#qvBrandN', m.el).textContent = n ? L(`${n} محددة`, `${n} selected`) : '';
      $('#qvBrandSet', m.el).disabled = !n || !$('#qvBrand', m.el).value.trim(); };
    $$('.qvSel', m.el).forEach(c => c.onchange = selN);
    $('#qvBrand', m.el).oninput = selN;
    $('#qvSelAll', m.el).onchange = ev => { $$('.qvRow', m.el).filter(r => r.style.display !== 'none').forEach(r => { const c = $('.qvSel', r); if (c) c.checked = ev.target.checked; }); selN(); };
    $('#qvBrandSet', m.el).onclick = e => busy(e.currentTarget, async () => {
      const ids = $$('.qvSel:checked', m.el).map(c => +c.value), b = $('#qvBrand', m.el).value.trim();
      const { data, error } = await sb.rpc('qp_invoice_set_brand', { p_line_ids: ids, p_brand: b });
      if (error) return fail(error);
      toast(L(`تم تعيين البراند «${b}» لـ ${data} شحنة`, `Brand "${b}" set on ${data} shipment(s)`), 'ok'); refresh();
    });
  }
  // الضغط على رقم في سطر المطابقة يفلتر جدول الشحنات وينزل له
  $$('.qvJump', m.el).forEach(a => a.onclick = ev => { ev.preventDefault(); $('#qvF', m.el).value = a.dataset.f; $('#qvQ', m.el).value = ''; filt();
    $('#qvF', m.el).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  const refresh = () => { m.close(); reload && reload(); openQpInvoice(id, reload); };
  // تسجيل الشحنات غير المسجّلة كطلبات (من بيانات الفاتورة: الاسم، المحافظة، المبلغ، السيريال، البراند ورقم طلبه)
  const regOpen = brand => {
    const sel = lines.filter(l => !l.order_id && (brand === null || (l.brand || 'أخرى') === brand));
    const seen = new Set();
    const rows = sel.filter(l => !seen.has(l.serial) && seen.add(l.serial)).map((l, i) => ({
      line: i + 1, customer_name: l.full_name || '', customer_phone: splitPhones(l.phone)[0] || '', customer_phone2: splitPhones(l.phone)[1] || null,
      govRaw: l.governorate || '', governorate: matchGov(l.governorate || ''), city: null, address: l.address || '', items: null, pieces: 1,
      qpNote: [l.type === 'return' ? 'return' : '', l.status_note || ''].filter(Boolean).join(' — '),
      cod_amount: +l.total_amount || 0, qp_tracking: String(l.serial), allow_open: true, notes: null,
      brand: l.brand && !['أخرى', 'Operative'].includes(l.brand) ? l.brand : null, client_ref: brandRef(l.notes) }));
    const b = brand === null ? '' : brand;
    openImport({ rows, title: L(`تسجيل شحنات غير مسجّلة كطلبات${b ? ` — ${esc(b)}` : ''}`, `Register unregistered shipments as orders${b ? ` — ${esc(b)}` : ''}`),
      fileName: `qp-invoice-${inv.id}${b ? '-' + b.replace(/[^\w\u0600-\u06FF-]+/g, '_') : ''}.xlsx`, done: refresh });
  };
  $$('.qvReg', m.el).forEach(btn => btn.onclick = () => regOpen(btn.dataset.b));
  bindOrderLinks(m.el, null, refresh);
  if ($('#qvRegAll', m.el)) $('#qvRegAll', m.el).onclick = () => regOpen(null);
  $$('.olink', m.el).forEach(a => a.onclick = async ev => {
    ev.preventDefault();
    const { data: o } = await sb.from('orders').select('*').eq('id', a.dataset.oid).maybeSingle();
    if (o) openOrder(o, refresh);
  });
  if ($('#qvRcv', m.el)) $('#qvRcv', m.el).onclick = () => {
    const pm = modal({ title: 'تسجيل استلام تحويل شركة الشحن', body: `<form id="rcF" class="grid g2">
        <label class="f"><span>استُلم في *</span><select name="acc" required>${accOptions(A.key.bank_main ? A.key.bank_main.id : '', cashFilter)}</select></label>
        <label class="f"><span>المبلغ المستلم *</span><input type="number" step="0.01" name="amount" required dir="ltr" value="${+inv.total_cod}"></label>
        <label class="f"><span>تاريخ الاستلام *</span><input type="date" name="date" required value="${isoDay()}"></label>
        <label class="f"><span>ملاحظات</span><input name="notes"></label>
        <p class="hint span-all">${L(`الصافي المستحق حسب الفاتورة: ${egp(inv.total_cod)}. لو المبلغ المستلم مختلف، يظل الفرق في حساب «مستحقات لدى شركة الشحن».`,
          `Net due per the invoice: ${egp(inv.total_cod)}. If the amount received differs, the difference stays in the "Due from courier" account.`)}</p></form>`,
      footer: '<button class="btn primary" id="rcOk">تأكيد</button>' });
    $('#rcOk', pm.el).onclick = e => {
      const form = $('#rcF', pm.el); if (!form.reportValidity()) return;
      const f = formValues(form);
      busy(e.currentTarget, async () => {
        const { error } = await sb.rpc('qp_invoice_receive', { p_id: inv.id, p_account: +f.acc, p_amount: num(f.amount), p_date: f.date, p_notes: nz(f.notes) });
        if (error) return fail(error);
        toast('تم تسجيل الاستلام', 'ok'); pm.close(); refresh();
      });
    };
  };
  if ($('#qvUnrcv', m.el)) $('#qvUnrcv', m.el).onclick = async () => {
    if (!await confirmBox('إلغاء تسجيل استلام التحويل وحذف قيده؟', 'إلغاء الاستلام', true)) return;
    const { error } = await sb.rpc('qp_invoice_unreceive', { p_id: inv.id });
    if (error) return fail(error);
    refresh();
  };
  if ($('#qvAdopt', m.el)) $('#qvAdopt', m.el).onclick = e => busy(e.currentTarget, async () => {
    if (!await confirmBox(L(`سيتم تعديل المبلغ المحصّل في ${diffIds.length} طلب ليطابق ما حصّلته شركة الشحن، وتُحدَّث التسويات والقيود تلقائيًا. متابعة؟`,
      `The collected amount of ${diffIds.length} order(s) will be changed to match what the courier collected; settlements and entries update automatically. Continue?`), 'اعتماد')) return;
    const { data, error } = await sb.rpc('qp_adopt_amount', { p_order_ids: diffIds });
    if (error) return fail(error);
    toast(L(`تم تعديل ${data} طلب`, `${data} order(s) updated`), 'ok'); refresh();
  });
  if ($('#qvRem', m.el)) $('#qvRem', m.el).onclick = e => busy(e.currentTarget, async () => {
    const { data, error } = await sb.rpc('qp_invoice_rematch', { p_id: inv.id });
    if (error) return fail(error);
    toast(L(`تمت مطابقة ${data} شحنة جديدة`, `${data} new shipment(s) matched`), 'ok'); refresh();
  });
  if ($('#qvDel', m.el)) $('#qvDel', m.el).onclick = async () => {
    if (!await confirmBox('حذف الفاتورة وكل قيودها؟ (لا يؤثر على الطلبات)', 'حذف', true)) return;
    const { error } = await sb.rpc('qp_invoice_delete', { p_id: inv.id });
    if (error) return fail(error);
    toast('تم الحذف', 'ok'); m.close(); reload && reload();
  };
}

// ---------------- مقارنة شركة الشحن داخل التسوية ----------------
async function qpCompareIds(ids) {
  if (!S.isAdmin || !ids.length) return null;
  const map = {};
  for (let i = 0; i < ids.length; i += 150) {
    const { data, error } = await sb.from('qp_invoice_lines').select('order_id, total_amount, total_fees').in('order_id', ids.slice(i, i + 150));
    if (error) return null;
    (data || []).forEach(l => { const x = map[l.order_id] || (map[l.order_id] = { qp: 0, fees: 0, n: 0 }); x.qp += +l.total_amount; x.fees += +l.total_fees; x.n++; });
  }
  return map;
}
const qpDiff = (o, cmp) => { const c = cmp && cmp[o.id]; return c ? Math.round((c.qp - +o.collected_amount) * 100) / 100 : null; };
const qpCell = (o, cmp) => {
  if (!cmp) return '';
  const d = qpDiff(o, cmp);
  return `<td class="qpcol">${d === null ? '<span class="muted small" title="لم تظهر في فواتير شركة الشحن المرفوعة بعد">—</span>'
    : d ? `${amt(cmp[o.id].qp)} <span class="small">(${signed(d)})</span>` : `<span class="ok-txt" title="مطابق">✓</span>`}</td>`;
};
const qpHead = cmp => cmp ? '<th class="qpcol" title="المحصّل حسب فواتير شركة الشحن">شركة الشحن</th>' : '';
// لينك لطلب (يفتح الطلب بالضغط عليه — اربطه بـ bindOrderLinks)
const orderLink = (o, extra = '') => `<a href="#" class="olink-q" data-oid="${o.id}"><span class="ltr">#${o.order_no}</span>${extra}</a>`;
function bindOrderLinks(root, findOrder, onDone) {
  $$('.olink-q', root).forEach(a => a.onclick = async ev => {
    ev.preventDefault();
    let o = findOrder ? findOrder(a.dataset.oid) : null;
    if (!o) { const { data } = await sb.from('orders').select('*').eq('id', a.dataset.oid).maybeSingle(); o = data; }
    if (o) openOrder(o, onDone);
  });
}
function qpBlock(orders, cmp) {
  if (!cmp) return { html: '', diffIds: [] };
  let ok = 0, sum = 0; const diffIds = [], diffs = [], missing = [];
  orders.forEach(o => { const d = qpDiff(o, cmp); if (d === null) missing.push(o); else if (d) { diffIds.push(o.id); diffs.push([o, d]); sum += d; } else ok++; });
  const cls = diffIds.length ? 'alert' : missing.length ? 'alert info' : 'alert ok';
  const links = list => `<span class="olinks">${list.join('')}</span>`;
  return { diffIds, html: `<div class="${cls} small qp-block"><b>مقارنة مع فواتير شركة الشحن:</b>
    ${L(`${ok} مطابق، ${diffIds.length ? `<b>${diffIds.length} فيه فرق (إجمالي ${money(sum)} ج)</b>، ` : ''}${missing.length} لم يظهر في الفواتير المرفوعة بعد.`,
      `${ok} matched, ${diffIds.length ? `<b>${diffIds.length} with a difference (total ${money(sum)} EGP)</b>, ` : ''}${missing.length} not in the uploaded invoices yet.`)}
    ${diffIds.length && can('orders_finance') ? '<button class="btn sm" id="qpAdoptBtn" style="margin-inline-start:8px">اعتماد مبالغ شركة الشحن</button>' : ''}
    ${diffs.length ? `<div class="olinks-row"><span>${L('فيها فرق:', 'With difference:')}</span>${links(diffs.map(([o, d]) => orderLink(o, ` <span class="small ltr">(${d > 0 ? '+' : ''}${money(d)})</span>`)))}</div>` : ''}
    ${missing.length ? `<details class="olinks-row"><summary>${L(`عرض الطلبات اللي لم تظهر في الفواتير (${missing.length})`, `Show orders not in invoices yet (${missing.length})`)}</summary>${links(missing.map(o => orderLink(o)))}</details>` : ''}
    </div>` };
}

// =====================================================================
//  المرتجعات: لسه ما وصلتش ← وصلت عندنا (بحالتها) ← اتسلّمت للعميل بكشف
// =====================================================================
const RET_COND = { ok: ['سليم', 'OK', 'green'], missing: ['ناقص', 'Missing items', 'amber'], damaged: ['تالف', 'Damaged', 'red'], other: ['مشكلة أخرى', 'Other issue', 'orange'] };
const condBadge = c => { const x = RET_COND[c]; return x ? `<span class="badge b-${x[2]}">${esc(L(x[0], x[1]))}</span>` : ''; };
const KIND = { return_pickup: ['استرجاع', 'Return pickup', 'orange'], exchange: ['استبدال', 'Exchange', 'indigo'] };
const kindBadge = k => KIND[k] ? `<span class="badge b-${KIND[k][2]}">${esc(L(KIND[k][0], KIND[k][1]))}</span>` : '';
const COLL_SRC = { courier: ['شركة الشحن', 'Courier'], own_courier: ['مندوب خاص', 'Own courier'], client_direct: ['العميل مباشرة', 'Client directly'], other: ['أخرى', 'Other'] };
// المرتجع: مرتجع عادي، أو استرجاع/استبدال المندوب جاب فيه الحاجة من العميل
const returnsQuery = (sel = '*') => sb.from('orders').select(sel).or('status.eq.returned,and(kind.neq.normal,status.eq.delivered)');
// رقم من الماسح: «QP23481549» أو «23481549» أو «#1234»
const scanVal = v => toLatinDigits(v).trim().replace(/^qp/i, '').replace(/^#/, '').replace(/\s+/g, '');
const RF = { client: '', from: '', to: '' };

async function viewReturns() {
  setTitle('المرتجعات');
  let tab = (location.hash.match(/^#\/returns\/(\w+)/) || [])[1] || 'pending';
  const TABS = [['pending', L('لسه ما وصلتش', 'Not arrived yet')], ['received', L('وصلت عندنا', 'At our warehouse')], ['handovers', L('كشوف التسليم للعملاء', 'Handover sheets')]];
  if (!TABS.some(t => t[0] === tab)) tab = 'pending';
  $('#view').innerHTML = `<div class="tabs">${TABS.map(([k, l]) => `<a href="#/returns/${k}" class="${k === tab ? 'active' : ''}">${l}</a>`).join('')}</div>
    <div class="toolbar">${clientSelect('rClient', 'كل العملاء', RF.client)}${tab === 'pending' ? rangePicker('rRange', RF.from, RF.to, ['7d', '30d', 'month', 'last', 'all']) : ''}</div>
    <div id="rBody"><div class="empty">جارٍ التحميل...</div></div>`;
  $('#rClient').onchange = e => { RF.client = e.target.value; load(); };
  if ($('#rRange')) bindRange('rRange', (f, t) => { RF.from = f; RF.to = t; load(); });
  const load = () => ({ pending: returnsPending, received: returnsReceived, handovers: returnsHandovers })[tab]().catch(fail);
  await load();
}

// ---------- لسه ما وصلتش ----------
async function returnsPending() {
  const B = $('#rBody');
  let rows = await fetchAllRows(() => {
    // المرتجعات اللي اتسوّت قبل النظام ده كانت اتستلمت خلاص — مش شغل مستني
    let q = returnsQuery().is('return_received_at', null).is('settlement_id', null).order('closed_at', { ascending: false }).order('order_no', { ascending: false });
    if (RF.client) q = q.eq('client_id', RF.client);
    const [f, t] = rangeDates(RF.from, RF.to);
    if (f) q = q.gte('closed_at', f.toISOString());
    if (t) q = q.lt('closed_at', t.toISOString());
    return q;
  });
  const days = d => d ? Math.floor((Date.now() - new Date(d)) / 864e5) : '';
  B.innerHTML = `<div class="panel"><div class="panel-b">
      <div class="scanbox"><input id="rScan" class="grow" autocomplete="off" placeholder="${L('امسح باركود البوليصة أو اكتب رقم التتبع / رقم الطلب ثم Enter', 'Scan the waybill barcode or type the tracking / order no., then Enter')}">
        <span class="muted small">${L(`${rows.length} مرتجع لسه ما اتأكدش استلامه`, `${rows.length} return(s) not confirmed yet`)}</span></div>
      <div id="rBulk"></div></div>
    <div class="table-wrap"><table class="t"><thead><tr><th class="w1"><input type="checkbox" id="rAll"></th><th>رقم</th>
      <th class="hide-sm">العميل</th><th>المستلم</th><th class="hide-sm">رقم التتبع</th><th>${L('تاريخ الإرجاع', 'Return date')}</th><th class="hide-sm">${L('من كام يوم', 'Days')}</th>
      <th class="hide-sm">${L('عند شركة الشحن', 'At the courier')}</th></tr></thead><tbody>
    ${rows.map(o => `<tr data-id="${o.id}"><td><input type="checkbox" class="rSel" value="${o.id}"></td>
      <td class="num">${orderLink(o)} ${kindBadge(o.kind)}${o.brand || o.client_ref ? `<div class="muted small">${esc([o.brand, o.client_ref].filter(Boolean).join(' · '))}</div>` : ''}</td>
      <td class="hide-sm">${esc(clientName(o.client_id))}</td><td>${esc(o.customer_name)}</td>
      <td class="hide-sm small"><span class="ltr">${esc(o.qp_tracking || '')}</span></td><td class="num small">${dt(o.closed_at)}</td>
      <td class="num hide-sm ${days(o.closed_at) > 7 ? 'neg' : ''}">${days(o.closed_at)}</td><td class="small hide-sm">${esc(o.qp_status || '')}</td></tr>`).join('')
      || `<tr><td colspan="8" class="empty">${L('مفيش مرتجعات مستنية الاستلام', 'No returns waiting')}</td></tr>`}</tbody></table></div></div>`;
  bindOrderLinks(B, id => rows.find(x => x.id === id), returnsPending);
  const sel = () => $$('.rSel:checked', B).map(c => c.value);
  const bulk = () => {
    const ids = sel();
    $('#rBulk').innerHTML = ids.length ? `<div class="bulkbar"><b>${L(`تم تحديد ${ids.length}`, `${ids.length} selected`)}</b>
      <button class="btn primary sm" id="rOk">${L('استلام المحدد — سليم', 'Receive selected — OK')}</button>
      <button class="btn sm" id="rCond">${L('استلام بحالة أخرى…', 'Receive with another condition…')}</button></div>` : '';
    if (!ids.length) return;
    $('#rOk').onclick = e => busy(e.currentTarget, () => doReceive(ids, 'ok', null));
    $('#rCond').onclick = () => receiveDialog(rows.filter(o => ids.includes(o.id)), returnsPending);
  };
  $$('.rSel', B).forEach(c => c.onchange = bulk);
  $('#rAll').onchange = e => { $$('.rSel', B).forEach(c => c.checked = e.target.checked); bulk(); };
  const doReceive = async (ids, cond, notes) => {
    const { data, error } = await sb.rpc('returns_receive', { p_ids: ids, p_condition: cond, p_notes: notes });
    if (error) return fail(error);
    toast(L(`تم استلام ${data} مرتجع`, `${data} return(s) received`), 'ok'); returnsPending();
  };
  // الماسح: Enter بعد الرقم ← نافذة الحالة للطلب ده
  const scan = $('#rScan'); scan.focus();
  scan.onkeydown = async e => {
    if (e.key !== 'Enter') return;
    const v = scanVal(scan.value); scan.value = ''; if (!v) return;
    const hit = rows.find(o => o.qp_tracking === v || String(o.order_no) === v);
    if (hit) return receiveDialog([hit], () => { returnsPending(); });
    // مش في القائمة: نشوف ليه
    const { data } = await sb.from('orders').select('order_no, status, kind, return_received_at, return_handover_id, client_id')
      .or(`qp_tracking.eq.${v}${/^\d{1,9}$/.test(v) ? `,order_no.eq.${v}` : ''}`).limit(1);
    const o = data && data[0];
    playBeep(false);
    toast(!o ? L(`مفيش طلب بالرقم ${v}`, `No order with ${v}`)
      : o.return_received_at ? L(`الطلب #${o.order_no} اتأكد استلامه قبل كده`, `Order #${o.order_no} was already received`)
      : RF.client && o.client_id !== RF.client ? L(`الطلب #${o.order_no} لعميل تاني — شيل فلتر العميل`, `Order #${o.order_no} belongs to another client`)
      : L(`الطلب #${o.order_no} مش مرتجع (حالته: ${tr(STATUS[o.status]?.label || o.status)})`, `Order #${o.order_no} is not a return (${tr(STATUS[o.status]?.label || o.status)})`), 'err');
  };
}

// ---------- طلب استرجاع / استبدال (بند 12) ----------
function returnRequestDialog(o, done) {
  const m = modal({ title: `${L('طلب استرجاع / استبدال — الطلب', 'Return / exchange request — order')} ${orderNo(o)}`, body: `<form id="rqF" class="grid g2">
      <div class="alert info small span-all">${L('بيتعمل طلب جديد مربوط بالطلب ده. فريق Operative بيبلّغ شركة الشحن، ولما يوصل السيريال بتاعهم بيتكتب في الطلب الجديد عشان تتابعه هنا.',
        'A new order linked to this one is created. Operative informs the courier, and once their serial arrives it is added to the new order so you can follow it here.')}</div>
      <label class="f span-all"><span>${L('النوع *', 'Type *')}</span><select name="kind" required>
        ${opt('return_pickup', L('استرجاع — المندوب ياخد الحاجة من العميل ويرجّعها', 'Return — the courier picks the item up from the customer'))}
        ${opt('exchange', L('استبدال — المندوب يسلّم حاجة جديدة وياخد القديمة', 'Exchange — the courier delivers a new item and takes the old one'))}</select></label>
      <label class="f span-all"><span>${L('المحتوى (اللي هيتاخد / هيتسلّم)', 'Contents (to pick up / deliver)')}</span><input name="items" value="${esc(o.items)}"></label>
      <label class="f"><span>${L('المندوب يحصّل من العميل', 'Courier collects from the customer')}</span><input name="collect" type="number" min="0" step="0.01" value="0" dir="ltr"></label>
      <label class="f"><span>${L('المندوب يدفع للعميل', 'Courier pays the customer')}</span><input name="refund" type="number" min="0" step="0.01" value="0" dir="ltr"></label>
      <label class="f span-all"><span>ملاحظات</span><input name="notes" placeholder="${L('مثال: العميل هيدفع مصاريف الشحن، المقاس الجديد L', 'e.g. the customer pays shipping, new size L')}"></label></form>`,
    footer: `<button class="btn primary" id="rqOk">${L('إرسال الطلب', 'Send request')}</button>` });
  $('#rqOk', m.el).onclick = e => {
    const f = formValues($('#rqF', m.el));
    busy(e.currentTarget, async () => {
      const { data: id, error } = await sb.rpc('return_request_create', { p_order: o.id, p_kind: f.kind, p_collect: num(f.collect), p_refund: num(f.refund), p_items: f.items || null, p_notes: f.notes || null });
      if (error) return fail(error);
      toast(L('تم تسجيل الطلب', 'Request recorded'), 'ok'); m.close(); done && done();
      const { data: k } = await sb.from('orders').select('*').eq('id', id).maybeSingle();
      if (k) openOrder(k);
    });
  };
}
// رسالة الواتساب لشركة الشحن (بالعربي زي ما بيتبعت)
function returnWaText(o, p) {
  const ex = o.kind === 'exchange';
  return [`مطلوب ${ex ? 'استبدال' : 'استرجاع'} — Operative`,
    `سيريال الشحنة الأصلية: ${p.qp_tracking ? 'QP' + p.qp_tracking : '—'}`,
    `اسم العميل: ${o.customer_name}`, `الهاتف: ${[o.customer_phone, o.customer_phone2].filter(Boolean).join(' - ')}`,
    `العنوان: ${[o.governorate, o.city, o.address].filter(Boolean).join(' - ')}`,
    ex ? `المندوب يسلّم: ${o.items || '—'} ويستلم القديم: ${p.items || '—'}` : `المندوب يستلم: ${o.items || p.items || '—'}`,
    +o.cod_amount ? `المندوب يحصّل من العميل: ${money(o.cod_amount)} ج` : 'مفيش تحصيل من العميل',
    +o.refund_amount ? `المندوب يدفع للعميل: ${money(o.refund_amount)} ج` : '',
    o.notes ? `ملاحظات: ${o.notes}` : '', `رقمنا: Operative #${o.order_no}`].filter(Boolean).join('\n');
}

// صوت قصير للماسح: نجاح / خطأ
function playBeep(ok = true) {
  try {
    const ctx = playBeep.ctx || (playBeep.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = ok ? 880 : 220; g.gain.value = 0.12; o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + (ok ? 0.12 : 0.35));
  } catch (e) { }
}

// نافذة الاستلام: سليم بضغطة، أو ناقص / تالف / مشكلة مع ملاحظة
function receiveDialog(orders, done) {
  const one = orders.length === 1 ? orders[0] : null;
  const m = modal({ title: one ? `${L('استلام مرتجع — الطلب', 'Receive return — order')} ${orderNo(one)}` : L(`استلام ${orders.length} مرتجع`, `Receive ${orders.length} return(s)`), body: `
    ${one ? `<dl class="kv small"><dt>العميل</dt><dd>${esc(clientName(one.client_id))}${one.brand ? ' — ' + esc(one.brand) : ''}</dd>
      <dt>المستلم</dt><dd>${esc(one.customer_name)}</dd><dt>المحتوى</dt><dd>${esc(one.items || '—')} ${one.pieces > 1 ? `(${one.pieces} ${L('قطع', 'pcs')})` : ''}</dd>
      <dt>رقم التتبع</dt><dd><span class="ltr">${esc(one.qp_tracking || '—')}</span></dd></dl>` : ''}
    <div class="cond-btns">${Object.entries(RET_COND).map(([k, x]) => `<button type="button" class="btn ${k === 'ok' ? 'primary' : ''}" data-c="${k}">${esc(L(x[0], x[1]))}</button>`).join('')}</div>
    <label class="f" id="rcNotesL" style="display:none"><span>${L('اكتب الناقص أو المشكلة *', 'Describe what is missing or wrong *')}</span><textarea id="rcNotes" rows="3"></textarea></label>`,
    footer: `<button class="btn primary" id="rcSave" style="display:none">${L('تأكيد الاستلام', 'Confirm receipt')}</button><span class="muted small">${L('«سليم» بيأكد على طول', '"OK" confirms right away')}</span>` });
  let cond = null;
  const save = async btn => {
    const notes = $('#rcNotes', m.el).value.trim();
    if (cond !== 'ok' && !notes) return toast(L('اكتب الناقص أو المشكلة', 'Describe what is missing or wrong'), 'err');
    await busy(btn, async () => {
      const { data, error } = await sb.rpc('returns_receive', { p_ids: orders.map(o => o.id), p_condition: cond, p_notes: notes || null });
      if (error) { playBeep(false); return fail(error); }
      playBeep(true); toast(L(`تم استلام ${data} مرتجع`, `${data} return(s) received`), 'ok'); m.close(); done && done();
    });
  };
  $$('[data-c]', m.el).forEach(b => b.onclick = () => {
    cond = b.dataset.c;
    $$('[data-c]', m.el).forEach(x => x.classList.toggle('primary', x === b));
    if (cond === 'ok') return save(b);
    $('#rcNotesL', m.el).style.display = ''; $('#rcSave', m.el).style.display = ''; $('#rcNotes', m.el).focus();
  });
  $('#rcSave', m.el).onclick = e => save(e.currentTarget);
  setTimeout(() => $('[data-c=ok]', m.el).focus(), 40);   // Enter = سليم
}

// ---------- وصلت عندنا (لسه ما اتسلّمتش للعميل) ----------
async function returnsReceived() {
  const B = $('#rBody');
  const rows = await fetchAllRows(() => {
    let q = returnsQuery().not('return_received_at', 'is', null).is('return_handover_id', null).order('return_received_at', { ascending: false }).order('order_no');
    if (RF.client) q = q.eq('client_id', RF.client);
    return q;
  });
  if (!RF.client) {
    const g = {}; rows.forEach(o => { const x = g[o.client_id] || (g[o.client_id] = { n: 0, bad: 0 }); x.n++; if (o.return_condition !== 'ok') x.bad++; });
    B.innerHTML = `<div class="panel"><div class="panel-h">${L('مرتجعات عندنا لسه ما اتسلّمتش للعميل', 'Returns with us, not handed to the client yet')}</div><div class="table-wrap"><table class="t">
      <thead><tr><th>العميل</th><th>${L('المرتجعات', 'Returns')}</th><th>${L('فيها مشكلة', 'With issues')}</th><th class="w1"></th></tr></thead><tbody>
      ${Object.entries(g).sort((a, b) => b[1].n - a[1].n).map(([cid, x]) => `<tr class="click" data-c="${cid}"><td><b>${esc(clientName(cid))}</b></td><td class="num">${x.n}</td>
        <td class="num ${x.bad ? 'neg' : ''}">${x.bad}</td><td><button class="btn sm">${L('عرض وتسليم', 'View & hand over')}</button></td></tr>`).join('')
        || `<tr><td colspan="4" class="empty">${L('مفيش مرتجعات عندنا', 'No returns at our warehouse')}</td></tr>`}</tbody></table></div></div>`;
    $$('tr[data-c]', B).forEach(tr => tr.onclick = () => { RF.client = tr.dataset.c; $('#rClient').value = RF.client; returnsReceived(); });
    return;
  }
  B.innerHTML = `<div class="panel"><div class="panel-b"><div id="rBulk"></div></div><div class="table-wrap"><table class="t"><thead><tr>
      <th class="w1"><input type="checkbox" id="rAll"></th><th>رقم</th><th>المستلم</th><th class="hide-sm">رقم التتبع</th><th>${L('الحالة عند الاستلام', 'Condition')}</th>
      <th class="hide-sm">${L('استلمه', 'Received by')}</th></tr></thead><tbody>
    ${rows.map(o => `<tr><td><input type="checkbox" class="rSel" value="${o.id}"></td>
      <td class="num">${orderLink(o)} ${kindBadge(o.kind)}${o.brand || o.client_ref ? `<div class="muted small">${esc([o.brand, o.client_ref].filter(Boolean).join(' · '))}</div>` : ''}</td>
      <td>${esc(o.customer_name)}<div class="muted small">${esc(o.items || '')}</div></td><td class="hide-sm small"><span class="ltr">${esc(o.qp_tracking || '')}</span></td>
      <td>${condBadge(o.return_condition)}${o.return_notes ? `<div class="small">${esc(o.return_notes)}</div>` : ''}</td>
      <td class="hide-sm small">${esc(o.return_received_by_name || '')}<div class="muted num">${dtt(o.return_received_at)}</div></td></tr>`).join('')
      || `<tr><td colspan="6" class="empty">${L('مفيش مرتجعات عندنا للعميل ده', 'No returns for this client')}</td></tr>`}</tbody></table></div></div>`;
  bindOrderLinks(B, id => rows.find(x => x.id === id), returnsReceived);
  const bulk = () => {
    const ids = $$('.rSel:checked', B).map(c => c.value);
    $('#rBulk').innerHTML = `<div class="bulkbar"><b>${ids.length ? L(`تم تحديد ${ids.length}`, `${ids.length} selected`) : L('حدد المرتجعات اللي هتتسلّم', 'Select the returns to hand over')}</b>
      <button class="btn primary sm" id="rHand" ${ids.length ? '' : 'disabled'}>${L('تسليم المحدد للعميل وطباعة الكشف', 'Hand over & print sheet')}</button>
      <button class="btn sm ghost" id="rUndo" ${ids.length ? '' : 'disabled'}>${L('إلغاء الاستلام', 'Undo receipt')}</button></div>`;
    $('#rHand').onclick = () => handoverDialog(RF.client, rows.filter(o => ids.includes(o.id)));
    $('#rUndo').onclick = async e => {
      if (!await confirmBox(L(`إلغاء تأكيد استلام ${ids.length} مرتجع؟ هيرجعوا «لسه ما وصلتش».`, `Undo receipt of ${ids.length} return(s)? They go back to "not arrived".`), 'تأكيد', true)) return;
      const { data, error } = await sb.rpc('returns_unreceive', { p_ids: ids });
      if (error) return fail(error);
      toast(L(`اتلغى استلام ${data}`, `${data} undone`), 'ok'); returnsReceived();
    };
  };
  $$('.rSel', B).forEach(c => c.onchange = bulk);
  $('#rAll').onchange = e => { $$('.rSel', B).forEach(c => c.checked = e.target.checked); bulk(); };
  bulk();
}

function handoverDialog(clientId, orders) {
  const bad = orders.filter(o => o.return_condition !== 'ok').length;
  const m = modal({ title: L(`تسليم ${orders.length} مرتجع — ${clientName(clientId)}`, `Hand over ${orders.length} return(s) — ${clientName(clientId)}`), body: `
    ${bad ? `<div class="alert small">${L(`منهم ${bad} فيه مشكلة أو نقص — هيظهروا في الكشف بملاحظاتهم.`, `${bad} have an issue — they show on the sheet with notes.`)}</div>` : ''}
    <form id="hoF" class="grid"><label class="f"><span>${L('اسم اللي هيستلم من العميل', 'Name of the person receiving for the client')}</span><input name="receiver"></label>
      <label class="f"><span>ملاحظات</span><input name="notes"></label></form>
    <p class="hint">${L('بعد التأكيد بيتطبع الكشف نسختين (نسخة العميل ونسخة Operative) للتوقيع. اختار «حفظ كـ PDF» من نافذة الطباعة لو عايز ملف.', 'After confirming, the sheet prints in two copies (client and Operative) for signing. Choose "Save as PDF" in the print window for a file.')}</p>`,
    footer: `<button class="btn primary" id="hoOk">${L('تأكيد التسليم وطباعة الكشف', 'Confirm & print')}</button>` });
  $('#hoOk', m.el).onclick = e => busy(e.currentTarget, async () => {
    const f = formValues($('#hoF', m.el));
    const { data: id, error } = await sb.rpc('returns_handover_create', { p_client: clientId, p_ids: orders.map(o => o.id), p_receiver: f.receiver || null, p_notes: f.notes || null });
    if (error) return fail(error);
    m.close(); toast(L('تم تسجيل التسليم', 'Handover recorded'), 'ok');
    await openHandover(id, true);
    if ($('#rBody')) returnsReceived();
  });
}

// ---------- كشوف التسليم ----------
async function returnsHandovers() {
  const B = $('#rBody');
  let q = sb.from('returns_handovers').select('*').order('id', { ascending: false }).limit(300);
  if (RF.client) q = q.eq('client_id', RF.client);
  const { data, error } = await q;
  if (error) throw error;
  B.innerHTML = `<div class="panel"><div class="table-wrap"><table class="t"><thead><tr><th>${L('رقم الكشف', 'Sheet no.')}</th><th>العميل</th><th>${L('المرتجعات', 'Returns')}</th>
    <th>التاريخ</th><th class="hide-sm">${L('استلمه من العميل', 'Received by (client)')}</th><th class="hide-sm">${L('سلّمه', 'Handed by')}</th></tr></thead><tbody>
    ${(data || []).map(h => `<tr class="click" data-id="${h.id}"><td class="num"><b>${h.id}</b></td><td>${esc(clientName(h.client_id))}</td><td class="num">${h.orders_count}</td>
      <td class="num small">${dtt(h.created_at)}</td><td class="hide-sm">${esc(h.receiver_name || '—')}</td><td class="hide-sm">${esc(h.created_by_name || '')}</td></tr>`).join('')
      || `<tr><td colspan="6" class="empty">${L('مفيش كشوف تسليم لسه', 'No handover sheets yet')}</td></tr>`}</tbody></table></div></div>`;
  $$('tr[data-id]', B).forEach(tr => tr.onclick = () => openHandover(+tr.dataset.id));
}

async function openHandover(id, printNow = false) {
  const [{ data: h, error }, orders] = await Promise.all([sb.from('returns_handovers').select('*').eq('id', id).maybeSingle(),
    fetchAllRows(() => sb.from('orders').select('*').eq('return_handover_id', id).order('order_no'))]);
  if (error || !h) return fail(error || new Error(L('الكشف غير موجود', 'Sheet not found')));
  const html = handoverSheet(h, orders);
  const m = modal({ title: L(`كشف تسليم مرتجعات رقم ${h.id}`, `Returns handover sheet ${h.id}`), wide: true, body: `<div class="ho-prev">${handoverSheet(h, orders, null)}</div>`,
    footer: `<button class="btn primary" id="hoPrint">${L('طباعة نسختين / حفظ PDF', 'Print 2 copies / save PDF')}</button><span class="spacer"></span>
      ${can('returns') ? `<button class="btn danger" id="hoDel">${L('إلغاء الكشف', 'Cancel sheet')}</button>` : ''}` });
  bindOrderLinks(m.el, oid => orders.find(x => x.id === oid), () => { m.close(); openHandover(id); });
  $('#hoPrint', m.el).onclick = () => printHtml(html);
  if ($('#hoDel', m.el)) $('#hoDel', m.el).onclick = async () => {
    if (!await confirmBox(L('إلغاء الكشف؟ المرتجعات هترجع «وصلت عندنا».', 'Cancel the sheet? The returns go back to "at our warehouse".'), 'تأكيد', true)) return;
    const { error: e2 } = await sb.rpc('returns_handover_delete', { p_id: id });
    if (e2) return fail(e2);
    toast(L('تم إلغاء الكشف', 'Sheet cancelled'), 'ok'); m.close(); if ($('#rBody')) viewReturns();
  };
  if (printNow) printHtml(html);
}

// كشف التسليم: نسختين (العميل / Operative) في صفحتين، وتحت كل واحدة أماكن التوقيع
function handoverSheet(h, orders, copies = [L('نسخة العميل', 'Client copy'), L('نسخة Operative', 'Operative copy')]) {
  const BR = orders.some(o => o.brand);
  const body = copy => `<div class="ho-sheet">
    <div class="stmt-head"><div><div class="logo">Operative</div><div class="muted small">${L('كشف تسليم مرتجعات', 'Returns handover sheet')}</div></div>
      <dl class="kv small"><dt>${L('رقم الكشف', 'Sheet no.')}</dt><dd>${h.id}</dd><dt>العميل</dt><dd>${esc(clientName(h.client_id))}</dd>
        <dt>التاريخ</dt><dd>${dtt(h.created_at)}</dd><dt>${L('عدد المرتجعات', 'Returns')}</dt><dd>${orders.length}</dd>
        ${copy ? `<dt></dt><dd><b>${copy}</b></dd>` : ''}</dl></div>
    <table class="t"><thead><tr><th>#</th><th>${L('رقم الطلب', 'Order no.')}</th>${BR ? '<th>البراند</th>' : ''}<th>${L('رقم الطلب لديكم', 'Your ref')}</th><th>رقم التتبع</th>
      <th>المستلم</th><th>المحتوى</th><th>${L('الحالة', 'Condition')}</th></tr></thead><tbody>
      ${orders.map((o, i) => `<tr><td class="num">${i + 1}</td><td class="num">${copy ? orderNo(o) : orderLink(o)}</td>${BR ? `<td>${esc(o.brand || '')}</td>` : ''}<td class="num">${esc(o.client_ref || '')}</td>
        <td class="num"><span class="ltr">${esc(o.qp_tracking || '')}</span></td><td>${esc(o.customer_name)}</td><td>${esc(o.items || '')}${o.pieces > 1 ? ` (${o.pieces})` : ''}</td>
        <td>${esc(L(...(RET_COND[o.return_condition] || ['', '']).slice(0, 2)))}${o.return_notes ? ` — ${esc(o.return_notes)}` : ''}</td></tr>`).join('')}</tbody></table>
    ${h.notes ? `<p class="small"><b>ملاحظات:</b> ${esc(h.notes)}</p>` : ''}
    <p class="small">${L('أقرّ أنا الموقّع أدناه باستلام المرتجعات الموضحة في هذا الكشف بالحالة المذكورة قرين كل منها.', 'I, the undersigned, confirm receipt of the returns listed on this sheet in the condition stated for each.')}</p>
    <div class="sign-row"><div><b>${L('المستلم (عن العميل)', 'Received by (client)')}</b><div>${L('الاسم', 'Name')}: ${esc(h.receiver_name || '')} ........................</div>
      <div>${L('التوقيع', 'Signature')}: ........................</div><div>${L('التاريخ', 'Date')}: ........................</div></div>
      <div><b>${L('المسلّم (Operative)', 'Handed by (Operative)')}</b><div>${L('الاسم', 'Name')}: ${esc(h.created_by_name || '')}</div>
      <div>${L('التوقيع', 'Signature')}: ........................</div></div></div></div>`;
  return copies ? copies.map(body).join('<div class="page-break"></div>') : body(null);
}

// =====================================================================
//  الموظفين (لمدير النظام فقط)
// =====================================================================
async function viewStaff() {
  setTitle('الموظفين');
  $('#pageActions').innerHTML = '<button class="btn primary" id="addStaffBtn">+ موظف جديد</button>';
  $('#addStaffBtn').onclick = () => openStaff(null);
  const { data, error } = await sb.from('staff_members').select('*').order('created_at');
  if (error) return fail(error);
  const label = k => (PERMS.find(p => p[0] === k) || [k, k])[1];
  $('#view').innerHTML = `<div class="alert info small">الموظف يدخل على نفس الموقع ويرى فقط الصفحات والعمليات المسموح له بها. إعدادات الربط مع شركة الشحن، وحذف العملاء، وإدارة الموظفين متاحة لك وحدك.</div>
    <div class="panel"><div class="table-wrap"><table class="t"><thead><tr><th>الاسم</th><th class="hide-sm">البريد</th><th>الصلاحيات</th><th>الحالة</th><th></th></tr></thead><tbody>
    ${(data || []).map(u => `<tr data-id="${u.id}"><td><b>${esc(u.name)}</b>${u.phone ? `<div class="muted small ltr">${esc(u.phone)}</div>` : ''}</td>
      <td class="hide-sm"><span class="ltr small">${esc(u.email)}</span></td>
      <td class="small">${u.permissions.length ? u.permissions.map(label).map(esc).join('، ') : '<span class="muted">بدون صلاحيات</span>'}</td>
      <td>${!u.user_id ? '<span class="badge b-amber">لم يُنشأ الحساب</span>' : u.active ? '<span class="badge b-green">مفعّل</span>' : '<span class="badge b-muted">موقوف</span>'}</td>
      <td><button class="btn sm" data-edit>تعديل</button></td></tr>`).join('')
      || '<tr><td colspan="5" class="empty">لا يوجد موظفون بعد، اضغط "موظف جديد"</td></tr>'}
    </tbody></table></div></div>`;
  $$('#view tr[data-id]').forEach(tr => $('[data-edit]', tr).onclick = () => openStaff((data || []).find(u => u.id === tr.dataset.id)));
}

function openStaff(u) {
  const isNew = !u; u = u || { active: true, permissions: ['orders_view'] };
  const needsAccount = isNew || !u.user_id;
  const has = new Set(u.permissions || []);
  const body = `<form id="staffF" class="grid g2">
    <label class="f"><span>اسم الموظف *</span><input name="name" required value="${esc(u.name)}"></label>
    <label class="f"><span>رقم الهاتف</span><input name="phone" dir="ltr" value="${esc(u.phone)}"></label>
    <label class="f"><span>بريد الدخول *</span><input name="email" type="email" required dir="ltr" value="${esc(u.email)}" ${isNew ? '' : 'disabled'}></label>
    ${needsAccount ? `<label class="f"><span>كلمة المرور *</span><input name="password" required minlength="6" dir="ltr" value="${genPassword()}"></label>`
      : '<label class="chk" style="align-self:end"><input type="checkbox" name="active" ' + (u.active ? 'checked' : '') + '> الحساب مفعّل</label>'}
    <div class="section-title span-all">الصلاحيات</div>
    <div class="span-all perm-list">${PERMS.map(([k, l, h]) => `<label class="chk"><input type="checkbox" class="perm" value="${k}" ${has.has(k) ? 'checked' : ''}>
      ${esc(l)}${h ? ` <span class="hint">(${esc(h)})</span>` : ''}</label>`).join('')}</div>
  </form><div id="staffDone"></div>`;
  const m = modal({ title: isNew ? 'موظف جديد' : `تعديل — ${esc(u.name)}`, body, wide: true,
    footer: `<button class="btn primary" id="stSave">${isNew ? 'إضافة الموظف وإنشاء حسابه' : needsAccount ? 'حفظ وإنشاء الحساب' : 'حفظ'}</button>
      <span class="spacer"></span>${isNew ? '' : '<button class="btn danger" id="stfDel">حذف الموظف</button>'}` });
  // تفعيل صلاحية يفعّل ما تحتاجه تلقائيًا
  $$('.perm', m.el).forEach(cb => cb.onchange = () => {
    if (cb.checked) (PERM_NEEDS[cb.value] || []).forEach(k => { const x = $(`.perm[value="${k}"]`, m.el); if (x) x.checked = true; });
    else Object.entries(PERM_NEEDS).forEach(([k, needs]) => { if (needs.includes(cb.value)) { const x = $(`.perm[value="${k}"]`, m.el); if (x) x.checked = false; } });
  });
  $('#stSave', m.el).onclick = e => {
    const form = $('#staffF', m.el);
    if (!form.reportValidity()) return;
    const f = formValues(form);
    const perms = $$('.perm:checked', m.el).map(c => c.value);
    const btn = e.currentTarget;
    busy(btn, async () => {
      const rec = { name: f.name, phone: nz(f.phone), permissions: perms };
      if (!needsAccount) rec.active = f.active;
      let row = u;
      if (isNew) {
        rec.email = f.email.toLowerCase();
        const r = await sb.from('staff_members').insert(rec).select().single();
        if (r.error) return fail(/duplicate|unique/i.test(r.error.message) ? new Error('يوجد موظف بهذا البريد بالفعل') : r.error);
        row = r.data;
      } else {
        const r = await sb.from('staff_members').update(rec).eq('id', u.id).select().single();
        if (r.error) return fail(r.error);
        row = r.data;
      }
      if (!needsAccount) { toast('تم الحفظ', 'ok'); m.close(); return viewStaff(); }
      // إنشاء حساب الدخول — الخادم يربطه بالموظف تلقائيًا
      const tmp = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'op-tmp' } });
      const { data, error } = await tmp.auth.signUp({ email: row.email, password: f.password });
      if (error) {
        // الحساب موجود من قبل (موظف سابق) — نعيد ربطه
        if (/already registered|already been registered/i.test(error.message)) {
          const { data: pr } = await sb.from('profiles').select('id, role').ilike('email', row.email).maybeSingle();
          if (pr && pr.role === 'staff') {
            const l = await sb.from('staff_members').update({ user_id: pr.id, active: true }).eq('id', row.id);
            if (l.error) return fail(l.error);
            toast('هذا البريد له حساب سابق وتم ربطه بالموظف — يدخل بكلمة المرور القديمة', 'ok'); m.close(); return viewStaff();
          }
          viewStaff(); return fail(new Error('هذا البريد مسجّل بحساب آخر في النظام (عميل أو مدير)، استخدم بريدًا مختلفًا'));
        }
        viewStaff(); return fail(error);
      }
      const needsConfirm = data.user && !data.session;
      const link = location.origin + location.pathname;
      const msg = `مرحبًا ${row.name}،\nهذه بيانات حسابك على نظام Operative:\nالرابط: ${link}\nالبريد الإلكتروني: ${row.email}\nكلمة المرور: ${f.password}`;
      form.remove(); setTimeout(() => btn.closest('.modal-f')?.remove());
      $('#staffDone', m.el).innerHTML = `<div class="alert ok">تم إنشاء حساب الموظف ✓</div>
        ${needsConfirm ? '<div class="alert">يجب على الموظف تفعيل الحساب من بريده الإلكتروني أولًا.</div>' : ''}
        <p class="small muted">أرسل هذه الرسالة إلى الموظف:</p><div class="copybox">${esc(msg)}</div>
        <p><button class="btn sm" id="cpyBtn">نسخ الرسالة</button></p>`;
      $('#cpyBtn', m.el).onclick = () => navigator.clipboard.writeText(msg).then(() => toast('تم النسخ', 'ok'));
      viewStaff();
    });
  };
  const del = $('#stfDel', m.el);
  if (del) del.onclick = async () => {
    if (!await confirmBox(`هل تريد حذف الموظف <b>${esc(u.name)}</b>؟ لن يستطيع الدخول إلى النظام بعد ذلك.`, 'حذف', true)) return;
    const { error } = await sb.from('staff_members').delete().eq('id', u.id);
    if (error) return fail(error);
    toast('تم حذف الموظف', 'ok'); m.close(); viewStaff();
  };
}

// =====================================================================
//  قسم المبيعات (CRM) — الكود في crm.js ويُحمَّل عند أول فتح للقسم
// =====================================================================
const APP_V = (() => { const s = [...document.scripts].find(x => /app\.js/.test(x.src)); return (s && (s.src.match(/[?&]v=([\w.]+)/) || [])[1]) || ''; })();
window.OP = { sb, S, can, L, EN, $, $$, esc, num, money, egp, dt, dtt, opt, toast, fail, errMsg, formValues, nz, modal, confirmBox, busy,
  setTitle, fcard, pct, periodSelect, isoDay, monthStart, dateInput, hashParam, printHtml, reportHead, loadXLSX, normAr, normPhone,
  toLatinDigits, matchGov, GOVS, govOptions, DICT, PATTERNS, loadClients, refreshBell };
let crmReady = null;
function loadCrm() {
  if (window.OperativeCRM) return Promise.resolve();
  return crmReady || (crmReady = new Promise((res, rej) => {
    const sc = document.createElement('script'); sc.src = 'crm.js' + (APP_V ? '?v=' + APP_V : '');
    const bad = () => { crmReady = null; rej(new Error(L('تعذّر تحميل قسم المبيعات، تحقق من اتصالك بالإنترنت', 'Could not load the sales section, check your connection'))); };
    sc.onload = () => window.OperativeCRM ? res() : bad();
    sc.onerror = bad;
    document.head.appendChild(sc);
  }));
}
async function viewCrm() {
  setTitle('المبيعات');
  try { await loadCrm(); await window.OperativeCRM.view(); } catch (e) { fail(e); }
}
async function openCrmLead(id) {
  try { await loadCrm(); await window.OperativeCRM.openLead(id); } catch (e) { fail(e); }
}

// =====================================================================
//  تشغيل
// =====================================================================
(async () => {
  if (!configured) return renderSetupNeeded();
  const { data: { session } } = await sb.auth.getSession();
  if (session) await start(session.user); else renderLogin();
  sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT' && S.user) { S.user = null; renderLogin(); } });
})();

})();
