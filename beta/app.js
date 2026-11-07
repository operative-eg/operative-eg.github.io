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
const dt = d => d ? new Date(d).toLocaleDateString('en-GB') : '';
const dtt = d => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
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
  'اليوم': 'Today', 'آخر 7 أيام': 'Last 7 days', 'هذا الشهر': 'This month', 'الشهر الماضي': 'Last month', 'كل الفترات': 'All time',
  'كل العملاء': 'All clients', 'إجمالي الطلبات': 'Total orders', 'في الطريق': 'In transit', 'منها هولد': 'Of which on hold',
  'نسبة التسليم': 'Delivery rate', 'تحصيل متوقع (طلبات مفتوحة)': 'Expected COD (open orders)', 'المحصّل': 'Collected',
  'إيرادات الشركة': 'Company revenue', 'إجمالي التكلفة': 'Total cost', 'مستحقات العملاء غير المسوّاة': 'Unsettled client balances',
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
  'إلغاء التحديد': 'Clear selection', 'طلب جديد': 'New order', 'اسم المستلم *': 'Recipient name *', 'رقم الطلب لديك': 'Your order no.',
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
    'Search this settlement: tracking no., order no., name', 'طباعة / حفظ PDF': 'Print / save PDF', 'عرض صورة التحويل': 'View transfer proof',
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
  ['clients_view', 'عرض العملاء وأسعارهم'],
  ['clients_edit', 'إضافة وتعديل العملاء وإنشاء حسابات دخولهم'],
  ['settlements_view', 'عرض التسويات'],
  ['settlements_edit', 'إنشاء التسويات وتسجيل الدفع ورفع صور التحويل'],
];
// الصلاحية ← ما تحتاجه لتعمل
const PERM_NEEDS = { orders_edit: ['orders_view'], orders_finance: ['orders_view'], orders_delete: ['orders_view'], qp: ['orders_view'],
  dashboard: ['orders_view'], clients_edit: ['clients_view'], settlements_edit: ['settlements_view'] };
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
  staff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/><path d="M17 3.5l1.5 1.5L21 2.5"/></svg>',
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
  ['clients', 'العملاء', () => can('clients_view') || can('clients_edit')], ['settlements', 'التسويات', () => can('settlements_view')],
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
  ({ dashboard: viewDashboard, orders: viewOrders, clients: viewClients, settlements: viewSettlements, staff: viewStaff })[page]();
}
window.addEventListener('hashchange', route);
const setTitle = t => { $('#pageTitle').textContent = t; document.title = `${tr(t)} — Operative`; };

// =====================================================================
//  لوحة التحكم
// =====================================================================
async function viewDashboard() {
  setTitle('لوحة التحكم');
  $('#view').innerHTML = `<div class="toolbar">${periodSelect('dPeriod')}
    ${S.isAdmin ? clientSelect('dClient', 'كل العملاء') : ''}</div>
    <div class="cards" id="dCards"></div><div id="dExtra"></div>`;
  const load = async () => {
    const [from, to] = periodRange($('#dPeriod').value);
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
      [S.isAdmin ? 'إيرادات الشركة' : 'إجمالي التكلفة', egp(s.fees)],
      [S.isAdmin ? 'مستحقات العملاء غير المسوّاة' : 'رصيدك المستحق غير المسوّى', egp(all.unsettled_net), 'primary'],
    ];
    $('#dCards').innerHTML = cards.map(([l, v, c]) =>
      `<div class="card ${c || ''}"><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('');
  };
  $('#dPeriod').onchange = load;
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
    const { data: rates } = await sb.from('client_shipping_rates').select('*').eq('client_id', c.id).order('governorate');
    $('#dExtra').innerHTML = `<div class="panel"><div class="panel-h">أسعار الخدمة الخاصة بك</div><div class="panel-b">
      <dl class="kv"><dt>التجهيز والتغليف</dt><dd>${egp(c.fulfillment_fee)} / طلب</dd>
      <dt>المرتجع (أساسي)</dt><dd>${egp(c.return_fee)}</dd>
      <dt>الشحن (أساسي)</dt><dd>${egp(c.default_shipping_fee)}</dd></dl>
      <p class="hint" style="margin:10px 0 0">الطلب المسلَّم: الصافي = المبلغ المحصّل − (الشحن + التجهيز). الطلب المرتجع: الصافي = المبلغ المحصّل إن وُجد − (المرتجع + التجهيز).</p>
      ${rates && rates.length ? `<div class="section-title">الأسعار حسب المحافظة</div>
        <div class="table-wrap"><table class="t"><thead><tr><th>المحافظة</th><th>الشحن</th><th>المرتجع</th></tr></thead><tbody>
        ${rates.map(r => `<tr><td>${esc(r.governorate)}</td><td>${egp(r.price ?? c.default_shipping_fee)}</td><td>${egp(r.return_price ?? c.return_fee)}</td></tr>`).join('')}
        </tbody></table></div>` : ''}
    </div></div>`;
  }
}

// =====================================================================
//  الأوردرات
// =====================================================================
const OF = { q: '', status: '', client: '', page: 0 };
let selected = new Set();

function ordersQuery(select = '*', withCount = true) {
  let q = sb.from('orders').select(select, withCount ? { count: 'exact' } : undefined).order('created_at', { ascending: false });
  if (OF.status) q = q.eq('status', OF.status);
  if (OF.client) q = q.eq('client_id', OF.client);
  const t = OF.q.replace(/[,()*%"\\]/g, ' ').trim();
  if (t) {
    const parts = ['customer_name', 'customer_phone', 'qp_tracking', 'client_ref'].map(c => `${c}.ilike."*${t}*"`);
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
    </div><div id="bulk"></div><div class="panel" id="oPanel"></div>`;
  let timer;
  $('#oQ').oninput = e => { clearTimeout(timer); timer = setTimeout(() => { OF.q = e.target.value; OF.page = 0; loadOrders(); }, 350); };
  $('#oStatus').onchange = e => { OF.status = e.target.value; OF.page = 0; loadOrders(); };
  if (S.isAdmin) $('#oClient').onchange = e => { OF.client = e.target.value; OF.page = 0; loadOrders(); };
  await loadOrders();
}

async function loadOrders() {
  const from = OF.page * PAGE;
  const { data, count, error } = await ordersQuery().range(from, from + PAGE - 1);
  if (error) return fail(error);
  const rows = data || [];
  const A = S.isAdmin;
  const SEL = A && (can('qp') || can('orders_edit'));  // عمود التحديد للعمليات الجماعية
  $('#oPanel').innerHTML = `<div class="table-wrap"><table class="t"><thead><tr>
    ${SEL ? '<th class="w1"><input type="checkbox" id="selAll"></th>' : ''}
    <th>رقم</th>${A ? '<th class="hide-sm">العميل</th>' : ''}<th>المستلم</th><th class="hide-sm">المحافظة</th><th>التحصيل</th><th>الحالة</th>
    <th class="hide-sm">رقم التتبع</th><th class="hide-sm">التاريخ</th></tr></thead><tbody>
    ${rows.map(o => `<tr class="click ${selected.has(o.id) ? 'selected' : ''}" data-id="${o.id}">
      ${SEL ? `<td><input type="checkbox" class="sel" ${selected.has(o.id) ? 'checked' : ''}></td>` : ''}
      <td class="num"><b>${orderNo(o)}</b>${o.client_ref ? `<div class="muted small">${esc(o.client_ref)}</div>` : ''}</td>
      ${A ? `<td class="hide-sm">${esc(clientName(o.client_id))}</td>` : ''}
      <td>${esc(o.customer_name)}<div class="muted small"><span class="ltr">${esc(o.customer_phone)}</span></div></td>
      <td class="hide-sm">${esc(o.governorate)}<div class="muted small">${esc(o.city || '')}</div></td>
      <td class="num">${money(o.cod_amount)}</td><td>${badge(o.status)}</td>
      <td class="small hide-sm"><span class="ltr">${esc(o.qp_tracking || '')}</span>${o.qp_status ? `<div class="muted small">${esc(courierText(o.qp_status))}</div>` : ''}</td><td class="num small hide-sm">${dt(o.created_at)}</td></tr>`).join('')
      || `<tr><td colspan="9" class="empty">لا توجد طلبات${OF.q || OF.status || OF.client ? ' مطابقة للبحث' : ' بعد'}</td></tr>`}
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
    const { error } = await sb.from('orders').update({ status: st }).in('id', [...selected]);
    if (error) return fail(error);
    toast(`تم تغيير حالة ${selected.size} طلب`, 'ok'); selected.clear(); loadOrders();
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
  const { data, error } = await sb.from('orders').select('id, order_no, status, qp_tracking, customer_name, governorate')
    .in('id', ids).order('order_no');
  if (error) return fail(error);
  const ok = (data || []).filter(o => ['new', 'processing'].includes(o.status) && !o.qp_tracking);
  const skip = (data || []).length - ok.length;
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
  const { data, error } = await ordersQuery('*', false).range(0, 9999);
  if (error) return fail(error);
  const cols = [['order_no', 'رقم الطلب'], ['client', 'العميل'], ['client_ref', 'مرجع العميل'], ['customer_name', 'المستلم'],
    ['customer_phone', 'الهاتف'], ['customer_phone2', 'هاتف آخر'], ['governorate', 'المحافظة'], ['city', 'المنطقة'],
    ['address', 'العنوان'], ['items', 'المحتوى'], ['pieces', 'القطع'], ['cod_amount', 'التحصيل'], ['allow_open', 'متاح المعاينة'],
    ['notes', 'ملاحظات'], ['status', 'الحالة'], ['qp_tracking', 'رقم التتبع'], ['collected_amount', 'المحصّل'],
    ['shipping_fee', 'الشحن'], ['fulfillment_fee', 'التجهيز'], ['return_fee', 'المرتجع'],
    ['net_amount', 'الصافي'], ['created_at', 'التاريخ']];
  const val = (o, k) => k === 'client' ? clientName(o.client_id) : k === 'status' ? tr(STATUS[o.status]?.label)
    : k === 'allow_open' ? tr(o.allow_open ? 'نعم' : 'لا') : k === 'created_at' ? dtt(o.created_at) : k === 'governorate' ? tr(o.governorate) : o[k];
  const csv = [cols.map(c => tr(c[1])), ...(data || []).map(o => cols.map(([k]) => val(o, k)))]
    .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
}

// ---------- سجل الطلب ----------
const FIELD_LABELS = {
  client_id: ['العميل', 'Client'], client_ref: ['رقم الطلب لدى العميل', 'Client ref'], customer_name: ['اسم المستلم', 'Recipient'],
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
  const after = () => { if (onDone) onDone(); else if ($('#oPanel')) loadOrders(); };
  const body = `<form id="orderForm" class="grid g2">
    ${A ? `<label class="f span-all"><span>العميل *</span><select name="client_id" required ${isNew ? '' : 'disabled'}>
      ${opt('', '— اختر العميل —', o.client_id)}${S.clients.filter(c => c.active || c.id === o.client_id).map(c => opt(c.id, c.name, o.client_id)).join('')}</select></label>` : ''}
    <label class="f"><span>اسم المستلم *</span><input name="customer_name" required value="${esc(o.customer_name)}" ${dis}></label>
    <label class="f"><span>رقم الطلب لديك</span><input name="client_ref" value="${esc(o.client_ref)}" ${dis}></label>
    <label class="f"><span>رقم الهاتف *</span><input name="customer_phone" required inputmode="tel" dir="ltr" value="${esc(o.customer_phone)}" ${dis}></label>
    <label class="f"><span>رقم هاتف آخر</span><input name="customer_phone2" inputmode="tel" dir="ltr" value="${esc(o.customer_phone2)}" ${dis}></label>
    <label class="f"><span>المحافظة *</span><select name="governorate" required ${dis}>${govOptions(o.governorate)}</select></label>
    <label class="f"><span>المنطقة / المدينة</span><input name="city" value="${esc(o.city)}" ${dis}></label>
    <label class="f span-all"><span>العنوان بالتفصيل *</span><input name="address" required value="${esc(o.address)}" ${dis}></label>
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
        <dt>التسوية</dt><dd id="oSettle">${o.settlement_id ? L('تمت التسوية', 'Settled') : 'لم تتم بعد'}</dd></dl></div>
      ${A ? `<div class="section-title span-all">${L('طلبات تعديل الحسابات', 'Account change requests')}
          <button type="button" class="btn sm" id="oReqBtn">${L('+ طلب تعديل في الحسابات', '+ Request an accounts change')}</button></div>
        <div class="span-all" id="oReqs"></div>` : ''}` : ''}
  </form>`;
  const footer = `${E || F ? `<button class="btn primary" id="oSave">${isNew ? 'إضافة الطلب' : 'حفظ'}</button>` : ''}
    <span class="spacer"></span>
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
        el.innerHTML = `<a href="#" class="olink">${L('تمت التسوية — رقم', 'Settled — no.')} ${st.settlement_no}</a>`;
        $('a', el).onclick = ev => { ev.preventDefault(); openSettlement(st, async () => { if ($('#sPanel')) await viewSettlements(); }); };
      });
    }
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
      if (!/^\+?\d{10,13}$/.test(phone)) return toast('رقم الهاتف غير صحيح', 'err');
      Object.assign(rec, {
        client_ref: nz(f.client_ref), customer_name: f.customer_name, customer_phone: phone,
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
function notifText(n) {
  const no = n.order_no ? `#${n.order_no}` : '';
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
    <div class="req-list">${(list || []).map(n => `<a href="#" class="req-item ${n.read_at ? '' : 'unread'}" data-id="${n.request_id || ''}">
        ${esc(notifText(n))} <span class="muted small num">${dtt(n.created_at)}</span>
        ${n.snippet ? `<div class="small muted">${esc(n.snippet)}</div>` : ''}</a>`).join('')
      || `<p class="muted small">${L('لا توجد إشعارات.', 'No notifications.')}</p>`}</div>`,
    footer: `<button class="btn" id="ntAll">${L('تعليم الكل كمقروء', 'Mark all as read')}</button>` });
  $$('.req-item', m.el).forEach(a => a.onclick = ev => { ev.preventDefault(); if (a.dataset.id) { m.close(); openRequest(+a.dataset.id); } });
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
  { key: 'client_ref', label: 'رقم الطلب لديك', alias: ['رقم الطلب لديك', 'رقم الطلب', 'رقم الاوردر', 'مرجع', 'reference id', 'reference', 'order id', 'order number', 'order no'] },
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

function downloadTemplate() {
  const head = IMPORT_COLS.map(c => c.label);
  const ex = ['محمد أحمد', '01012345678', '', 'القاهرة', 'مدينة نصر', '10 شارع عباس العقاد، الدور الثالث', 'سلسلة فضة', 1, 450, '1001', 'الاتصال قبل التوصيل', 'نعم'];
  const ws = XLSX.utils.aoa_to_sheet([head, ex]);
  ws['!cols'] = head.map((h, i) => ({ wch: i === 5 ? 40 : Math.max(14, h.length + 4) }));
  const gs = XLSX.utils.aoa_to_sheet([['المحافظات المتاحة'], ...GOVS.map(g => [g])]);
  gs['!cols'] = [{ wch: 22 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'الطلبات');
  XLSX.utils.book_append_sheet(wb, gs, 'المحافظات');
  wb.Workbook = { Views: [{ RTL: true }] };
  XLSX.writeFile(wb, 'operative-orders-template.xlsx');
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
      client_ref: get(r, 'client_ref') || null,
      notes: get(r, 'notes') || null,
      allow_open: parseOpen(get(r, 'allow_open')),
    };
    validateImportRow(o);
    return o;
  });
}
function validateImportRow(o) {
  const e = [];
  if (!o.customer_name) e.push('الاسم ناقص');
  if (!/^0\d{9,10}$/.test(o.customer_phone)) e.push('رقم الهاتف غير صحيح');
  if (!o.address) e.push('العنوان ناقص');
  if (o.cod_amount === null) e.push('المبلغ غير صحيح');
  if (!o.governorate) e.push(o.govRaw ? 'اختر المحافظة' : 'المحافظة ناقصة');
  o.errors = e;
}

function openImport() {
  const A = S.isAdmin;
  const m = modal({ title: 'رفع طلبات من ملف Excel', wide: true, body: `
    <div class="import-steps">
      <div class="alert info">
        <b>الخطوات:</b> ١) نزّل النموذج واملأه بالطلبات، صف لكل طلب. ٢) ارفع الملف. ٣) راجع الطلبات واضغط "إضافة".
        <div class="small" style="margin-top:6px">يمكنك أيضًا رفع ملف بأعمدة مختلفة؛ سيتعرّف النظام على الأعمدة المعروفة مثل الاسم والهاتف والعنوان والمحافظة والمبلغ.</div>
      </div>
      <div class="toolbar">
        ${A ? clientSelect('impClient', '— اختر العميل —', OF.client) : ''}
        <button class="btn" id="impTpl">تنزيل النموذج</button>
        <label class="btn primary" style="cursor:pointer">اختيار الملف<input type="file" id="impFile" accept=".xlsx,.xls,.csv" hidden></label>
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
      <table class="t"><thead><tr><th>#</th><th>المستلم</th><th>الهاتف</th><th>المحافظة</th><th class="hide-sm">العنوان</th><th>المبلغ</th><th>الحالة</th></tr></thead><tbody>
      ${rows.map((r, i) => `<tr class="${r.errors.length ? 'row-err' : ''}">
        <td class="num muted">${r.line}</td><td>${esc(r.customer_name)}</td><td><span class="ltr">${esc(r.customer_phone)}</span></td>
        <td>${r.governorate && !r.govFixed ? esc(r.governorate)
          : `<select class="impGov" data-i="${i}" style="min-width:120px">${govOptions(r.governorate)}</select>${r.govRaw ? `<div class="muted small">في الملف: ${esc(r.govRaw)}</div>` : ''}`}</td>
        <td class="hide-sm small">${esc(r.address).slice(0, 60)}</td><td class="num">${r.cod_amount ?? ''}</td>
        <td>${r.errors.length ? `<span class="neg small">${r.errors.join('، ')}</span>` : '<span class="pos">✓</span>'}</td></tr>`).join('')}
      </tbody></table></div>`;
    $$('.impGov', m.el).forEach(sel => sel.onchange = () => {
      const r = rows[+sel.dataset.i]; r.governorate = sel.value || null; r.govFixed = true; validateImportRow(r); render();
    });
  };
  $('#impTpl', m.el).onclick = e => busy(e.currentTarget, async () => { try { await loadXLSX(); downloadTemplate(); } catch (err) { fail(err); } });
  $('#impFile', m.el).onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    $('#impName', m.el).textContent = file.name;
    $('#impBody', m.el).innerHTML = '<div class="empty">جارٍ قراءة الملف...</div>';
    try {
      await loadXLSX();
      const sheet = readSheetRows(await file.arrayBuffer());
      if (!sheet) { rows = []; render(); $('#impBody', m.el).innerHTML = '<div class="alert">لم يتم التعرّف على أعمدة الملف. استخدم النموذج، أو تأكد أن أول صف فيه عناوين الأعمدة (الاسم، الهاتف، العنوان، المحافظة، المبلغ).</div>'; return; }
      rows = buildImportRows(sheet);
      rows.forEach(r => { if (!r.governorate) r.govFixed = true; });
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
          cod_amount: r.cod_amount, client_ref: r.client_ref, notes: r.notes, allow_open: r.allow_open }));
        const { error } = await sb.from('orders').insert(chunk);
        if (error) { fail(error); if (done) toast(`تمت إضافة ${done} طلب قبل حدوث الخطأ`, 'ok'); loadOrders(); return; }
        done += chunk.length; btn.textContent = `جارٍ الإضافة... ${done}/${ok.length}`;
      }
      toast(`تمت إضافة ${done} طلب`, 'ok'); m.close(); loadOrders();
    });
  };
}

// =====================================================================
//  العملاء (للأدمن)
// =====================================================================
async function viewClients() {
  setTitle('العملاء');
  const E = can('clients_edit');
  if (E) {
    $('#pageActions').innerHTML = '<button class="btn primary" id="addClientBtn">+ عميل جديد</button>';
    $('#addClientBtn').onclick = () => openClient(null);
  }
  await loadClients();
  const { data: profs } = await sb.from('profiles').select('client_id,email').eq('role', 'client');
  const hasLogin = new Set((profs || []).map(p => p.client_id).filter(Boolean));
  $('#view').innerHTML = `<div class="panel"><div class="table-wrap"><table class="t"><thead><tr>
    <th class="hide-sm">الرمز</th><th>العلامة التجارية</th><th class="hide-sm">المسؤول</th><th class="hide-sm">الهاتف</th><th class="hide-sm">التجهيز</th>
    <th class="hide-sm">المرتجع الأساسي</th><th class="hide-sm">الشحن الأساسي</th><th>حساب الدخول</th><th></th></tr></thead><tbody>
    ${S.clients.map(c => `<tr data-id="${c.id}">
      <td class="num muted hide-sm">${c.code}</td>
      <td><b>${esc(c.name)}</b>${c.active ? '' : ' <span class="badge b-muted">موقوف</span>'}</td>
      <td class="hide-sm">${esc(c.contact_name || '')}</td><td class="hide-sm"><span class="ltr">${esc(c.phone || '')}</span></td>
      <td class="num hide-sm">${money(c.fulfillment_fee)}</td>
      <td class="num hide-sm">${money(c.return_fee)}</td><td class="num hide-sm">${money(c.default_shipping_fee)}</td>
      <td>${hasLogin.has(c.id) ? `<span class="badge b-green">مفعّل</span> <span class="muted small ltr">${esc(c.login_email)}</span>`
        : E ? `<button class="btn sm" data-login>إنشاء حساب</button>` : '<span class="muted small">لا يوجد</span>'}</td>
      <td><button class="btn sm" data-edit>${E ? 'تعديل' : 'عرض'}</button></td></tr>`).join('')
      || '<tr><td colspan="9" class="empty">لا يوجد عملاء بعد، اضغط "عميل جديد"</td></tr>'}
    </tbody></table></div></div>`;
  $$('#view tr[data-id]').forEach(tr => {
    const c = S.clients.find(x => x.id === tr.dataset.id);
    $('[data-edit]', tr).onclick = () => openClient(c);
    const l = $('[data-login]', tr); if (l) l.onclick = () => openLogin(c);
  });
}

async function openClient(c) {
  const isNew = !c; c = c || { active: true, fulfillment_fee: 0, return_fee: 0, default_shipping_fee: 0 };
  const E = can('clients_edit');
  let rates = {};
  if (!isNew) {
    const { data } = await sb.from('client_shipping_rates').select('*').eq('client_id', c.id);
    (data || []).forEach(r => rates[r.governorate] = r);
  }
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
  </form>`;
  const m = modal({ title: isNew ? 'عميل جديد' : `${E ? 'تعديل' : 'بيانات'} — ${esc(c.name)}`, body, wide: true,
    footer: `${E ? `<button class="btn primary" id="cSave">${isNew ? 'إضافة العميل' : 'حفظ'}</button>` : ''}
      <span class="spacer"></span>${!isNew && S.isOwner ? '<button class="btn danger" id="cDelete">حذف العميل</button>' : ''}` });
  if (!E) $$('#clientForm input, #clientForm select', m.el).forEach(i => i.disabled = true);
  if ($('#cDelete', m.el)) $('#cDelete', m.el).onclick = () => deleteClient(c, m);
  if (!E) return;
  $('[name=default_shipping_fee]', m.el).oninput = e => $$('.r-ship', m.el).forEach(i => i.placeholder = e.target.value);
  $('[name=return_fee]', m.el).oninput = e => $$('.r-ret', m.el).forEach(i => i.placeholder = e.target.value);
  $('#cSave', m.el).onclick = e => {
    const form = $('#clientForm', m.el);
    if (!form.reportValidity()) return;
    const f = formValues(form);
    const rec = { name: f.name, contact_name: nz(f.contact_name), phone: nz(f.phone), pickup_address: nz(f.pickup_address),
      notes: nz(f.notes), active: f.active, fulfillment_fee: num(f.fulfillment_fee),
      return_fee: num(f.return_fee), default_shipping_fee: num(f.default_shipping_fee) };
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
    <div id="sHits"></div><div class="panel" id="sPanel"></div>`;
  const load = async () => {
    const t = $('#sQ').value.replace(/[,()*%"\\]/g, ' ').trim();
    let ids = null;
    $('#sHits').innerHTML = '';
    if (t) {
      const parts = ['qp_tracking', 'customer_name', 'customer_phone', 'client_ref'].map(c => `${c}.ilike."*${t}*"`);
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
        || `<tr><td colspan="8" class="empty">لا توجد تسويات بعد</td></tr>`}</tbody></table></div>`;
    $$('#sPanel tr[data-id]').forEach(tr => tr.onclick = () => openSettlement((data || []).find(s => s.id === tr.dataset.id), load, t));
  };
  let timer;
  $('#sQ').oninput = () => { clearTimeout(timer); timer = setTimeout(load, 350); };
  if (S.isAdmin) $('#sClient').onchange = load;
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
const orderSearchText = o => normAr([o.order_no, '#' + o.order_no, o.qp_tracking, o.customer_name, o.customer_phone, o.client_ref].join(' '));

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
    if (!cid) { $('#nsBody', m.el).innerHTML = ''; return; }
    const { data, error } = await sb.from('orders').select('*').eq('client_id', cid).is('settlement_id', null)
      .in('status', ['delivered', 'returned']).order('closed_at');
    if (error) return fail(error);
    rows = data || [];
    if (!rows.length) { $('#nsBody', m.el).innerHTML = '<div class="empty">لا توجد طلبات جاهزة للتسوية لهذا العميل</div>'; return; }
    $('#nsBody', m.el).innerHTML = `<div class="stmt-totals" id="nsTot"></div><div class="table-wrap" style="max-height:50vh;overflow:auto">
      <table class="t"><thead><tr><th class="w1"><input type="checkbox" id="nsAll" checked></th><th>رقم</th><th>رقم التتبع</th><th>المستلم</th><th>الحالة</th><th>تاريخ الإقفال</th>${feeHead}</tr></thead>
      <tbody>${rows.map(o => `<tr class="nsRow" data-s="${esc(orderSearchText(o))}"><td><input type="checkbox" class="nsSel" value="${o.id}" checked></td><td class="num">${orderNo(o)}</td>
        ${trackCell(o)}<td>${esc(o.customer_name)}</td><td>${badge(o.status)}</td><td class="num small">${dt(o.closed_at)}</td>${feeRow(o)}</tr>`).join('')}</tbody></table></div>`;
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

async function openSettlement(s, reload, q = '') {
  const { data: orders, error } = await sb.from('orders').select('*').eq('settlement_id', s.id).order('order_no');
  if (error) return fail(error);
  const client = S.clients.find(c => c.id === s.client_id) || {};
  const head = `<div class="stmt-head"><div><div class="logo">Operative</div><div class="muted small">كشف تسوية حساب</div></div>
      <dl class="kv small"><dt>رقم التسوية</dt><dd>${s.settlement_no}</dd><dt>العميل</dt><dd>${esc(client.name || '')}</dd>
      <dt>التاريخ</dt><dd>${dt(s.created_at)}</dd><dt>الحالة</dt><dd>${s.status === 'paid' ? `مدفوعة ${dt(s.paid_at)}${s.payment_ref ? ' — ' + esc(s.payment_ref) : ''}` : 'غير مدفوعة'}</dd></dl></div>
    <div class="stmt-totals"><div><span class="muted small">عدد الطلبات</span><b>${s.orders_count}</b></div>
      <div><span class="muted small">إجمالي المحصّل</span><b>${egp(s.total_collected)}</b></div>
      <div><span class="muted small">إجمالي التكلفة</span><b>${egp(s.total_fees)}</b></div>
      <div><span class="muted small">الصافي للعميل</span><b>${egp(s.net_amount)}</b></div></div>`;
  const table = `<table class="t"><thead><tr><th>رقم</th><th>رقم التتبع</th><th>المستلم</th><th>المحافظة</th><th>الحالة</th>${feeHead}</tr></thead>
    <tbody>${(orders || []).map(o => `<tr class="stRow" data-s="${esc(orderSearchText(o))}"><td class="num"><a href="#" class="olink" data-oid="${o.id}">${orderNo(o)}</a>${o.client_ref ? ` <span class="muted small">(${esc(o.client_ref)})</span>` : ''}</td>
      ${trackCell(o)}<td>${esc(o.customer_name)}</td><td>${esc(o.governorate)}</td><td>${badge(o.status)}</td>${feeRow(o)}</tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="5">الإجمالي</td><td class="num">${money(s.total_collected)}</td><td colspan="4"></td><td>${signed(s.net_amount)}</td></tr></tfoot></table>
    ${s.notes ? `<p class="small"><b>ملاحظات:</b> ${esc(s.notes)}</p>` : ''}`;
  const E = S.isAdmin && can('settlements_edit');
  const m = modal({ title: `تسوية رقم ${s.settlement_no}`, wide: true,
    body: `${head}<div class="toolbar"><input class="grow" id="stQ" placeholder="بحث داخل التسوية: رقم التتبع، رقم الطلب، الاسم" value="${esc(q)}">
      <span class="muted small" id="stQn"></span></div><div class="table-wrap">${table}</div>`,
    footer: `<button class="btn primary" id="stPrint">طباعة / حفظ PDF</button>
      ${s.proof_path ? '<button class="btn" id="stProof">عرض صورة التحويل</button>' : ''}
      ${E && s.status !== 'paid' ? '<button class="btn" id="stPaid">تسجيل الدفع</button>' : ''}
      ${E ? `<button class="btn" id="stUpload">${s.proof_path ? 'تغيير صورة التحويل' : 'رفع صورة التحويل'}</button>` : ''}
      <span class="spacer"></span>
      ${E && s.status !== 'paid' ? '<button class="btn danger" id="stDel">إلغاء التسوية</button>' : ''}` });
  bindRowFilter($('#stQ', m.el), '#modals .stRow', $('#stQn', m.el));
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
  $('#stPrint', m.el).onclick = () => {
    $('#printArea').innerHTML = head + table; document.body.classList.add('printing');
    window.print();
    setTimeout(() => { document.body.classList.remove('printing'); $('#printArea').innerHTML = ''; }, 300);
  };
  if ($('#stProof', m.el)) $('#stProof', m.el).onclick = () => showProof(s);
  if ($('#stUpload', m.el)) $('#stUpload', m.el).onclick = () => openProofUpload(s, refresh);
  const paid = $('#stPaid', m.el);
  if (paid) paid.onclick = () => {
    const pm = modal({ title: 'تسجيل الدفع', body: `<form class="grid" id="payF">
      <label class="f"><span>طريقة / مرجع الدفع</span><input name="payment_ref" placeholder="مثال: إنستاباي، تحويل بنكي، نقدًا"></label>
      <label class="f"><span>صورة التحويل <span class="hint">(اختياري — صورة أو PDF)</span></span><input type="file" id="payProof" accept="image/*,application/pdf"></label>
      <label class="f"><span>ملاحظات</span><input name="notes" value="${esc(s.notes)}"></label></form>`,
      footer: '<button class="btn primary" id="payOk">تأكيد</button>' });
    $('#payOk', pm.el).onclick = e => busy(e.currentTarget, async () => {
      const f = formValues($('#payF', pm.el));
      const file = $('#payProof', pm.el).files[0];
      if (file) { try { await uploadProof(s, file); } catch (err) { return fail(err); } }
      const { error } = await sb.from('settlements').update({ status: 'paid', paid_at: new Date().toISOString(),
        payment_ref: nz(f.payment_ref), notes: nz(f.notes) }).eq('id', s.id);
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
//  تشغيل
// =====================================================================
(async () => {
  if (!configured) return renderSetupNeeded();
  const { data: { session } } = await sb.auth.getSession();
  if (session) await start(session.user); else renderLogin();
  sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT' && S.user) { S.user = null; renderLogin(); } });
})();

})();
