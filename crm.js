/* =====================================================================
   Operative System — قسم المبيعات (CRM)
   يُحمَّل من app.js عند أول فتح للقسم، ويستخدم أدوات الواجهة من window.OP.
   كل الصلاحيات وحجب الأرقام مطبّقة في قاعدة البيانات (migration-018) — الواجهة للعرض فقط.
   ===================================================================== */
(() => {
'use strict';
const OP = window.OP;
if (!OP || window.OperativeCRM) return;
const { sb, S, L, $, $$, esc, money, egp, dt, dtt, opt, toast, fail, formValues, modal, confirmBox, busy, fcard,
  isoDay, monthStart, dateInput, printHtml, reportHead, loadXLSX, normAr, toLatinDigits, GOVS } = OP;

// ترجمة البيانات الأساسية (المراحل والمصادر الافتراضية) في وضع الإنجليزية
Object.assign(OP.DICT, {
  'جديد': 'New', 'تم التواصل': 'Contacted', 'مهتم': 'Interested', 'اجتماع / زيارة': 'Meeting / visit', 'عرض سعر': 'Quotation',
  'تفاوض': 'Negotiation', 'تم التعاقد': 'Won', 'خسارة': 'Lost', 'فيسبوك': 'Facebook', 'إنستجرام': 'Instagram', 'تيك توك': 'TikTok',
  'واتساب': 'WhatsApp', 'ترشيح من عميل': 'Client referral', 'زيارة ميدانية': 'Field visit', 'معرض / فعالية': 'Exhibition / event',
  'إعلان ممول': 'Paid ad', 'بحث الموظف': 'Staff research', 'أخرى': 'Other', 'ملابس': 'Clothing', 'أحذية وشنط': 'Shoes & bags',
  'إكسسوارات': 'Accessories', 'مستحضرات تجميل': 'Cosmetics', 'إكسسوارات موبايل وإلكترونيات': 'Mobile accessories & electronics',
  'منتجات منزلية': 'Home products', 'مطبوعات وهدايا': 'Prints & gifts', 'أغذية ومكملات': 'Food & supplements',
  'السعر مرتفع': 'Price too high', 'متعاقد مع شركة أخرى': 'Using another company', 'لا يرد': 'No answer',
  'غير مهتم حاليًا': 'Not interested now', 'حجم الطلبات صغير': 'Low order volume', 'خارج نطاق الخدمة': 'Out of service area',
  'بيانات خاطئة': 'Wrong data', 'المبيعات': 'Sales', 'متابعة': 'Follow-up', 'أول تواصل': 'First contact', 'هاتف آخر': 'Other phone',
  'مدير النظام': 'System admin', 'النظام': 'System', 'تعريف بالخدمة': 'Service introduction', 'متابعة العرض': 'Offer follow-up',
});

// ---------------- الحالة والأدوات ----------------
const C = { me: {}, stages: [], lookups: [], teams: [], staff: [], reveal: {}, cfg: {}, settings: null, staff_settings: [], at: 0 };
async function rpc(name, args) {
  const { data, error } = await sb.rpc(name, args || {});
  if (error) throw error;
  return data;
}
async function boot(force) {
  if (!force && C.at && Date.now() - C.at < 60000) return;
  Object.assign(C, await rpc('crm_bootstrap'), { at: Date.now() });
}
const stage = id => C.stages.find(s => s.id === id) || { name: '', kind: 'open', sort: 0 };
const openStages = () => C.stages.filter(s => s.active && s.kind === 'open');
const openStageIds = () => openStages().map(s => s.id);
const STAGE_COLORS = ['gray', 'blue', 'indigo', 'amber', 'orange', 'indigo', 'blue'];
const stageBadge = id => {
  const s = stage(id);
  const color = s.kind === 'won' ? 'green' : s.kind === 'lost' ? 'red' : STAGE_COLORS[Math.max(0, openStages().findIndex(x => x.id === id)) % STAGE_COLORS.length];
  return `<span class="badge b-${color}">${esc(s.name)}</span>`;
};
const staffName = id => (C.staff.find(s => s.id === id) || {}).name || '';
const teamName = id => (C.teams.find(t => t.id === id) || {}).name || '';
const lookups = kind => C.lookups.filter(k => k.kind === kind && k.active);
const lookupOptions = (kind, sel, empty) => opt('', empty || L('— اختر —', '— Select —'), sel) +
  lookups(kind).map(k => opt(k.name, k.name, sel)).join('') +
  (sel && !lookups(kind).some(k => k.name === sel) ? opt(sel, sel, sel) : '');
// من يحق لي التوزيع عليهم
const assignable = () => C.staff.filter(s => s.crm && s.active && (C.me.admin || (C.me.team_staff || []).includes(s.id)));
const staffOptions = (sel, empty, list) => (empty != null ? opt('', empty, sel) : '') + (list || assignable()).map(s => opt(s.id, s.name, sel)).join('');
const canEdit = l => C.me.admin || (C.me.staff_id && l.owner_id === C.me.staff_id) || (C.me.teams || []).includes(l.team_id);
const canManage = l => C.me.admin || (C.me.teams || []).includes(l.team_id);
const phoneHtml = m => m ? `<span class="crm-phone ltr notr">${esc(m)}</span>` : `<span class="muted">—</span>`;
const pad = n => String(n).padStart(2, '0');
const toLocalInput = d => { d = new Date(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fromLocalInput = v => v ? new Date(v).toISOString() : null;
const inHours = h => { const d = new Date(Date.now() + h * 36e5); d.setSeconds(0, 0); return toLocalInput(d); };
const atDay = (days, hour = 11) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return toLocalInput(d); };
const isLate = d => d && new Date(d) < new Date();
const dueHtml = d => !d ? `<span class="muted">—</span>` : `<span class="num ${isLate(d) ? 'crm-late' : ''}">${dtt(d)}</span>`;
const ago = d => {
  if (!d) return '—';
  const m = Math.round((Date.now() - new Date(d)) / 60000);
  if (m < 60) return L(`منذ ${Math.max(m, 1)} د`, `${Math.max(m, 1)}m ago`);
  if (m < 1440) return L(`منذ ${Math.round(m / 60)} س`, `${Math.round(m / 60)}h ago`);
  return L(`منذ ${Math.round(m / 1440)} يوم`, `${Math.round(m / 1440)}d ago`);
};
const pctNum = (a, b) => b > 0 ? Math.round(a * 100 / b) : null;
const progress = (val, target, fmt = money) => {
  const p = pctNum(val, target);
  return `<div class="crm-prog" title="${fmt(val)} / ${target > 0 ? fmt(target) : '—'}"><div class="bar"><i style="width:${Math.min(p ?? 0, 100)}%" class="${p != null && p >= 100 ? 'done' : ''}"></i></div>
    <span class="num small">${p == null ? '—' : p + '%'}</span></div>`;
};
const ACT = {
  call: [L('مكالمة', 'Call'), '📞'], whatsapp: [L('واتساب', 'WhatsApp'), '💬'], meeting: [L('اجتماع', 'Meeting'), '🤝'],
  visit: [L('زيارة', 'Visit'), '📍'], email: [L('بريد إلكتروني', 'Email'), '✉️'], note: [L('ملاحظة', 'Note'), '📝'],
};
const OUTCOMES = {
  call: ['رد — مهتم', 'رد — غير مهتم', 'رد — طلب معاودة الاتصال', 'لم يرد', 'مشغول', 'مغلق / خارج الخدمة', 'رقم خاطئ'],
  whatsapp: ['تم الإرسال', 'رد — مهتم', 'رد — غير مهتم', 'لم يرد'],
  meeting: ['تم', 'تأجّل', 'لم يحضر'], visit: ['تم', 'تأجّل', 'لم يحضر'], email: ['تم الإرسال'], note: [],
};
Object.assign(OP.DICT, { 'رد — مهتم': 'Answered — interested', 'رد — غير مهتم': 'Answered — not interested',
  'رد — طلب معاودة الاتصال': 'Answered — asked for a callback', 'لم يرد': 'No answer', 'مشغول': 'Busy',
  'مغلق / خارج الخدمة': 'Switched off / unreachable', 'رقم خاطئ': 'Wrong number', 'تم الإرسال': 'Sent', 'تم': 'Done',
  'تأجّل': 'Postponed', 'لم يحضر': 'No-show' });
const EVT = {
  created: L('أُضيف العميل', 'Lead created'), updated: L('تعديل البيانات', 'Data updated'), assigned: L('توزيع', 'Assigned'),
  stage: L('تغيير المرحلة', 'Stage changed'), shared: L('تفويض إلى', 'Delegated to'), unshared: L('إلغاء تفويض', 'Delegation removed from'),
  contact_added: L('إضافة شخص', 'Contact added'), phone_changed: L('تغيير رقم', 'Number changed for'), contact_deleted: L('حذف شخص', 'Contact deleted'),
  archived: L('أرشفة', 'Archived'), unarchived: L('إلغاء الأرشفة', 'Unarchived'), dup_cleared: L('تأكيد أنه غير مكرر', 'Marked not duplicate'),
  convert_request: L('طلب تحويل إلى عميل', 'Conversion requested'), converted: L('تحويل إلى عميل', 'Converted to client'),
};
const FIELD = {
  brand_name: L('البراند', 'Brand'), category: L('النشاط', 'Category'), governorate: L('المحافظة', 'Governorate'), source: L('المصدر', 'Source'),
  page_url: L('رابط الصفحة', 'Page link'), expected_orders_month: L('طلبات متوقعة / شهر', 'Expected orders / month'),
  expected_value: L('إيراد متوقع / شهر', 'Expected revenue / month'), offer_fulfillment: L('عرض التجهيز', 'Fulfillment offer'),
  offer_shipping: L('عرض الشحن', 'Shipping offer'), offer_return: L('عرض المرتجع', 'Return offer'), notes: L('ملاحظات', 'Notes'),
  owner: L('المسؤول', 'Owner'), stage: L('المرحلة', 'Stage'),
};
const nextQuick = (target) => `<span class="crm-quick">${[[L('بعد ساعة', '+1h'), 'h1'], [L('غدًا', 'Tomorrow'), 'd1'], [L('بعد 3 أيام', '+3d'), 'd3'], [L('بعد أسبوع', '+1w'), 'd7']]
  .map(([l, k]) => `<button type="button" class="btn sm ghost" data-quick="${k}" data-target="${target}">${l}</button>`).join('')}</span>`;
function bindQuick(root) {
  $$('[data-quick]', root).forEach(b => b.onclick = () => {
    const el = $(`[name="${b.dataset.target}"]`, root); if (!el) return;
    el.value = b.dataset.quick === 'h1' ? inHours(1) : atDay(+b.dataset.quick.slice(1));
  });
}

// ---------------- الهيكل ----------------
const TABS = () => [
  ['today', L('يومي', 'My day'), true],
  ['leads', L('العملاء المحتملون', 'Leads'), true],
  ['pipeline', L('مراحل البيع', 'Pipeline'), true],
  ['performance', L('الأداء', 'Performance'), true],
  ['team', L('الفريق والإعدادات', 'Team & settings'), C.me.manager],
  ['security', L('سجل الأمان', 'Security log'), C.me.admin],
].filter(t => t[2]);

async function view() {
  OP.setTitle(L('المبيعات', 'Sales'));
  await boot();
  const tabs = TABS();
  let tab = (location.hash.match(/^#\/crm\/(\w+)/) || [])[1] || 'today';
  if (!tabs.some(t => t[0] === tab)) tab = 'today';
  $('#pageActions').innerHTML = `<button class="btn primary" id="crmNew">+ ${L('عميل محتمل', 'New lead')}</button>
    ${C.me.import ? `<button class="btn" id="crmImport">${L('رفع من Excel', 'Import from Excel')}</button>` : ''}`;
  $('#crmNew').onclick = () => openLeadForm(null, () => view());
  if ($('#crmImport')) $('#crmImport').onclick = () => openImport(() => view());
  $('#view').innerHTML = `<div class="tabs">${tabs.map(([k, l]) => `<a href="#/crm/${k}" class="${k === tab ? 'active' : ''}">${l}</a>`).join('')}</div>
    <div id="crmBody"><div class="empty">${L('جارٍ التحميل...', 'Loading...')}</div></div>`;
  await ({ today: tabToday, leads: tabLeads, pipeline: tabPipeline, performance: tabPerformance, team: tabTeam, security: tabSecurity })[tab]();
}
const body = () => $('#crmBody');
const LEAD_COLS = 'id, code, brand_name, contact_name, phone_masked, category, governorate, source, stage_id, owner_id, team_id, expected_value, next_followup_at, last_activity_at, first_contact_at, assigned_at, created_at, dup_state, archived_at, convert_requested_at, client_id';

// ---------------- يومي ----------------
async function tabToday() {
  const B = body();
  const who0 = C.me.staff_id || '';
  B.innerHTML = `<div class="toolbar">${C.me.manager ? `<select id="tdWho">${opt('', L('كل من أراهم', 'Everyone I can see'), who0)}${assignable().map(s => opt(s.id, s.name, who0)).join('')}</select>` : ''}
      <span class="spacer"></span><span class="muted small" id="tdReveal"></span></div>
    <div class="cards" id="tdCards"></div><div id="tdLists"><div class="empty">${L('جارٍ التحميل...', 'Loading...')}</div></div>`;
  const load = async () => {
    const who = C.me.manager ? $('#tdWho').value : who0;
    const week = new Date(Date.now() + 7 * 864e5).toISOString();
    let tq = sb.from('crm_tasks').select(`id, title, due_at, staff_id, lead_id, crm_leads!inner(${LEAD_COLS})`).is('done_at', null).lte('due_at', week).order('due_at').limit(400);
    if (who) tq = tq.eq('staff_id', who);
    let nq = sb.from('crm_leads').select(LEAD_COLS).is('first_contact_at', null).is('archived_at', null).in('stage_id', openStageIds()).not('owner_id', 'is', null).order('assigned_at').limit(100);
    if (who) nq = nq.eq('owner_id', who);
    const pq = sb.from('crm_activities').select(`id, type, happened_at, lead_id, crm_leads!inner(${LEAD_COLS})`).eq('pending', true).eq('user_id', S.user.id).order('happened_at');
    const [t, n, p, perf] = await Promise.all([tq, nq, pq, rpc('crm_performance', { p_from: monthStart(), p_to: isoDay() })]);
    for (const r of [t, n, p]) if (r.error) return fail(r.error);
    const tasks = (t.data || []).filter(x => !x.crm_leads.archived_at);
    const now = new Date(), endToday = new Date(); endToday.setHours(23, 59, 59, 999);
    const late = tasks.filter(x => new Date(x.due_at) < now);
    const today = tasks.filter(x => new Date(x.due_at) >= now && new Date(x.due_at) <= endToday);
    const soon = tasks.filter(x => new Date(x.due_at) > endToday);
    const rows = (perf || []).filter(r => !who || r.id === who);
    const sum = k => rows.reduce((a, r) => a + (+r[k] || 0), 0);
    $('#tdCards').innerHTML = [
      fcard(L('متابعات متأخرة', 'Overdue follow-ups'), late.length, late.length ? 'red' : ''),
      fcard(L('متابعات اليوم', 'Due today'), today.length, 'indigo'),
      fcard(L('عملاء جدد بلا تواصل', 'New leads not contacted'), (n.data || []).length, (n.data || []).length ? 'orange' : ''),
      fcard(L('أنشطة هذا الشهر', 'Activities this month'), sum('activities'), '', sum('target_activities') ? progress(sum('activities'), sum('target_activities')) : ''),
      fcard(L('تعاقدات هذا الشهر', 'Wins this month'), sum('wins'), 'green', sum('target_wins') ? progress(sum('wins'), sum('target_wins')) : ''),
      fcard(L('إيراد عملائي هذا الشهر', 'Revenue from my clients this month'), egp(sum('revenue')), '', sum('target_revenue') ? progress(sum('revenue'), sum('target_revenue')) : ''),
    ].join('');
    $('#tdReveal').innerHTML = C.reveal.limit == null ? '' : L(`إظهار الأرقام اليوم: <b class="num">${C.reveal.used}</b> من <b class="num">${C.reveal.limit}</b>`, `Numbers revealed today: <b class="num">${C.reveal.used}</b> of <b class="num">${C.reveal.limit}</b>`);
    const taskRow = x => `<tr class="click" data-lead="${x.lead_id}"><td class="num w1">#${x.crm_leads.code}</td>
        <td><b class="notr">${esc(x.crm_leads.brand_name)}</b><div class="small muted">${esc(x.title)}</div></td>
        <td class="hide-sm">${stageBadge(x.crm_leads.stage_id)}</td><td class="hide-sm notr">${esc(staffName(x.staff_id))}</td>
        <td>${dueHtml(x.due_at)}</td><td class="w1"><button class="btn sm" data-done="${x.id}">${L('تم', 'Done')}</button></td></tr>`;
    const sec = (title, list, rowFn, empty) => `<div class="section-title">${title} <span class="muted num">(${list.length})</span></div>
      <div class="panel"><div class="table-wrap"><table class="t"><tbody>${list.map(rowFn).join('') || `<tr><td class="empty">${empty}</td></tr>`}</tbody></table></div></div>`;
    $('#tdLists').innerHTML =
      ((p.data || []).length ? sec(L('تواصل بانتظار تسجيل النتيجة', 'Contacts awaiting an outcome'), p.data, x => `<tr class="click" data-pending="${x.id}" data-type="${x.type}" data-lead="${x.lead_id}">
          <td class="num w1">#${x.crm_leads.code}</td><td><b class="notr">${esc(x.crm_leads.brand_name)}</b></td><td>${ACT[x.type][1]} ${ACT[x.type][0]}</td>
          <td class="num">${dtt(x.happened_at)}</td><td class="w1"><button class="btn sm primary">${L('تسجيل النتيجة', 'Log outcome')}</button></td></tr>`, '') : '') +
      sec(L('متابعات متأخرة', 'Overdue follow-ups'), late, taskRow, L('لا توجد متابعات متأخرة 👌', 'Nothing overdue 👌')) +
      sec(L('متابعات اليوم', 'Due today'), today, taskRow, L('لا توجد متابعات لباقي اليوم.', 'Nothing else due today.')) +
      sec(L('عملاء جدد لم يتم التواصل معهم', 'New leads not contacted yet'), n.data || [], l => `<tr class="click" data-lead="${l.id}"><td class="num w1">#${l.code}</td>
          <td><b class="notr">${esc(l.brand_name)}</b><div class="small muted notr">${esc(l.contact_name || '')}</div></td><td>${phoneHtml(l.phone_masked)}</td>
          <td class="hide-sm notr">${esc(staffName(l.owner_id))}</td><td class="small muted">${L('أُسند', 'Assigned')} ${ago(l.assigned_at || l.created_at)}</td></tr>`,
        L('كل العملاء الجدد تم التواصل معهم.', 'All new leads have been contacted.')) +
      sec(L('قادمة خلال 7 أيام', 'Coming up in 7 days'), soon, taskRow, L('لا توجد متابعات قادمة.', 'Nothing coming up.'));
    $$('[data-done]', B).forEach(b => b.onclick = ev => { ev.stopPropagation(); busy(b, async () => {
      try { await rpc('crm_task_done', { p_id: +b.dataset.done }); toast(L('تم', 'Done'), 'ok'); load(); } catch (e) { fail(e); } }); });
    $$('tr[data-pending]', B).forEach(r => r.onclick = () => openOutcome({ id: +r.dataset.pending, type: r.dataset.type, lead_id: r.dataset.lead }, load));
    $$('tr.click[data-lead]:not([data-pending])', B).forEach(r => r.onclick = () => openLead(r.dataset.lead, load));
  };
  if ($('#tdWho')) $('#tdWho').onchange = load;
  await load();
}

// ---------------- العملاء المحتملون ----------------
const PAGE = 50;
const LF = { q: '', stage: '', owner: '', source: '', flag: '', page: 0 };
function leadsQuery(cols, count) {
  let q = sb.from('crm_leads').select(cols, count ? { count: 'exact' } : undefined);
  q = LF.flag === 'archived' ? q.not('archived_at', 'is', null) : q.is('archived_at', null);
  if (LF.stage) q = q.eq('stage_id', +LF.stage);
  if (LF.owner === 'none') q = q.is('owner_id', null); else if (LF.owner) q = q.eq('owner_id', LF.owner);
  if (LF.source) q = q.eq('source', LF.source);
  const open = openStageIds();
  if (LF.flag === 'late') q = q.lt('next_followup_at', new Date().toISOString());
  if (LF.flag === 'nonext') q = q.is('next_followup_at', null).in('stage_id', open);
  if (LF.flag === 'stale') { const x = new Date(Date.now() - (C.cfg.stale_days || 7) * 864e5).toISOString();
    q = q.in('stage_id', open).or(`last_activity_at.lt.${x},and(last_activity_at.is.null,created_at.lt.${x})`); }
  if (LF.flag === 'new') q = q.is('first_contact_at', null).in('stage_id', open);
  if (LF.flag === 'dup') q = q.eq('dup_state', 'suspect');
  if (LF.flag === 'convert') q = q.not('convert_requested_at', 'is', null);
  const s = LF.q.replace(/[,()%*\\]/g, ' ').trim();
  if (s) {
    const code = s.match(/^#?(\d{1,7})$/);
    q = code ? q.eq('code', +code[1]) : q.or(`brand_name.ilike.%${s}%,contact_name.ilike.%${s}%`);
  }
  return q;
}
async function tabLeads() {
  const B = body();
  B.innerHTML = `<div class="toolbar">
      <input class="grow" id="lfQ" placeholder="${L('بحث بالاسم أو الكود أو رقم الهاتف كاملًا', 'Search by name, code or full phone number')}" value="${esc(LF.q)}">
      <select id="lfStage">${opt('', L('كل المراحل', 'All stages'), LF.stage)}${C.stages.filter(s => s.active).map(s => opt(s.id, s.name, LF.stage)).join('')}</select>
      ${C.me.manager ? `<select id="lfOwner">${opt('', L('كل المسؤولين', 'All owners'), LF.owner)}${opt('none', L('غير موزّع', 'Unassigned'), LF.owner)}${staffOptions(LF.owner, null, C.staff.filter(s => C.me.admin || (C.me.team_staff || []).includes(s.id)))}</select>` : ''}
      <select id="lfSource">${opt('', L('كل المصادر', 'All sources'), LF.source)}${lookups('source').map(k => opt(k.name, k.name, LF.source)).join('')}</select>
      <select id="lfFlag">${[['', L('الكل', 'All')], ['late', L('متابعة متأخرة', 'Overdue follow-up')], ['nonext', L('بلا متابعة قادمة', 'No next follow-up')],
        ['new', L('لم يتم التواصل', 'Not contacted')], ['stale', L('راكد', 'Stale')], ['dup', L('مشتبه تكرار', 'Possible duplicate')],
        ['convert', L('بانتظار التحويل لعميل', 'Awaiting conversion')], ['archived', L('المؤرشف', 'Archived')]].map(([k, l]) => opt(k, l, LF.flag)).join('')}</select>
      <button class="btn" id="lfExport">${L('تصدير', 'Export')}</button></div>
    <div class="bulkbar" id="lfBulk" style="display:none"><span id="lfSel"></span><button class="btn sm primary" id="lfAssign">${L('توزيع المحدد', 'Assign selected')}</button></div>
    <div class="panel" id="lfList"><div class="empty">${L('جارٍ التحميل...', 'Loading...')}</div></div>`;
  const sel = new Set();
  const bulk = () => { $('#lfBulk').style.display = sel.size ? '' : 'none'; $('#lfSel').textContent = L(`تم تحديد ${sel.size} عميل`, `${sel.size} lead(s) selected`); };
  const load = async () => {
    // بحث برقم هاتف كامل: عن طريق دالة الفحص فقط (مفيش بحث بجزء من الرقم)
    const digits = toLatinDigits(LF.q).replace(/[^\d]/g, '');
    if (digits.length >= 8 && /^[\d\s+\-]+$/.test(toLatinDigits(LF.q).trim())) {
      try {
        const r = await rpc('crm_check_phone', { p_phone: LF.q }); C.at = 0;
        if (r.denied) toast(L('وصلت للحد اليومي لإظهار الأرقام', 'Daily reveal limit reached'), 'err');
        else if (r.state === 'mine') { LF.q = ''; $('#lfQ').value = ''; return openLead(r.lead_id, load); }
        else if (r.state === 'other') toast(L('الرقم مسجّل لعميل ليس ضمن عملائك', 'This number belongs to a lead outside your list'), 'err');
        else toast(L('الرقم غير مسجّل', 'Number not found'), '');
      } catch (e) { fail(e); }
      LF.q = ''; $('#lfQ').value = '';
    }
    const { data, error, count } = await leadsQuery(LEAD_COLS, true).order('created_at', { ascending: false }).range(LF.page * PAGE, LF.page * PAGE + PAGE - 1);
    if (error) return fail(error);
    sel.clear(); bulk();
    $('#lfList').innerHTML = `<div class="table-wrap"><table class="t"><thead><tr>${C.me.manager ? '<th class="w1"><input type="checkbox" id="lfAll"></th>' : ''}
        <th class="w1">#</th><th>${L('البراند', 'Brand')}</th><th>${L('التواصل', 'Contact')}</th><th>${L('المرحلة', 'Stage')}</th>
        <th class="hide-sm">${L('المسؤول', 'Owner')}</th><th>${L('المتابعة القادمة', 'Next follow-up')}</th><th class="hide-sm">${L('آخر نشاط', 'Last activity')}</th>
        <th class="hide-sm">${L('المصدر', 'Source')}</th></tr></thead><tbody>
      ${(data || []).map(l => `<tr class="click" data-id="${l.id}">${C.me.manager ? `<td><input type="checkbox" class="lfC" value="${l.id}"></td>` : ''}
        <td class="num">#${l.code}</td>
        <td><b class="notr">${esc(l.brand_name)}</b>${l.dup_state === 'suspect' ? ` <span class="badge b-amber">${L('مشتبه تكرار', 'Duplicate?')}</span>` : ''}
          ${l.convert_requested_at ? ` <span class="badge b-green">${L('طلب تحويل', 'Conversion requested')}</span>` : ''}
          <div class="small muted"><span>${esc(l.category || '')}</span>${l.governorate ? ` · <span>${esc(l.governorate)}</span>` : ''}</div></td>
        <td><span class="notr">${esc(l.contact_name || '')}</span><div>${phoneHtml(l.phone_masked)}</div></td>
        <td>${stageBadge(l.stage_id)}</td>
        <td class="hide-sm notr">${l.owner_id ? esc(staffName(l.owner_id)) : `<span class="badge b-gray">${L('غير موزّع', 'Unassigned')}</span>`}</td>
        <td>${stage(l.stage_id).kind === 'open' ? dueHtml(l.next_followup_at) : '<span class="muted">—</span>'}</td>
        <td class="hide-sm small muted">${ago(l.last_activity_at)}</td><td class="hide-sm small">${esc(l.source || '')}</td></tr>`).join('')
        || `<tr><td colspan="9" class="empty">${L('لا يوجد عملاء محتملون مطابقون.', 'No matching leads.')}</td></tr>`}</tbody></table></div>
      <div class="pager"><span class="num">${count ? `${LF.page * PAGE + 1}–${Math.min((LF.page + 1) * PAGE, count)} ${L('من', 'of')} ${count}` : ''}</span>
        <span><button class="btn sm" id="lfPrev" ${LF.page ? '' : 'disabled'}>${L('السابق', 'Previous')}</button>
        <button class="btn sm" id="lfNext" ${(LF.page + 1) * PAGE < (count || 0) ? '' : 'disabled'}>${L('التالي', 'Next')}</button></span></div>`;
    $$('#lfList tr.click').forEach(r => r.onclick = ev => { if (ev.target.closest('input')) return; openLead(r.dataset.id, load); });
    $$('.lfC', B).forEach(c => c.onchange = () => { c.checked ? sel.add(c.value) : sel.delete(c.value); bulk(); });
    if ($('#lfAll')) $('#lfAll').onchange = e => { $$('.lfC', B).forEach(c => { c.checked = e.target.checked; c.checked ? sel.add(c.value) : sel.delete(c.value); }); bulk(); };
    $('#lfPrev').onclick = () => { LF.page--; load(); };
    $('#lfNext').onclick = () => { LF.page++; load(); };
  };
  let timer;
  $('#lfQ').oninput = e => { clearTimeout(timer); timer = setTimeout(() => { LF.q = e.target.value.trim(); LF.page = 0; load(); }, 600); };
  [['lfStage', 'stage'], ['lfOwner', 'owner'], ['lfSource', 'source'], ['lfFlag', 'flag']].forEach(([id, k]) => {
    const el = $('#' + id); if (el) el.onchange = () => { LF[k] = el.value; LF.page = 0; load(); }; });
  $('#lfAssign').onclick = () => openAssign([...sel], load);
  $('#lfExport').onclick = e => busy(e.currentTarget, () => exportLeads());
  await load();
}

// تصدير CSV — من غير أرقام (المحجوب فقط)، والعملية بتتسجل
async function exportLeads() {
  const all = [];
  for (let from = 0; from < 5000; from += 1000) {
    const { data, error } = await leadsQuery(LEAD_COLS).order('code').range(from, from + 999);
    if (error) return fail(error);
    all.push(...data); if (data.length < 1000) break;
  }
  if (!all.length) return toast(L('لا توجد بيانات للتصدير', 'Nothing to export'), 'err');
  const head = [L('الكود', 'Code'), L('البراند', 'Brand'), L('المسؤول عن التواصل', 'Contact'), L('الهاتف (محجوب)', 'Phone (masked)'), L('النشاط', 'Category'),
    L('المحافظة', 'Governorate'), L('المصدر', 'Source'), L('المرحلة', 'Stage'), L('المسؤول', 'Owner'), L('المتابعة القادمة', 'Next follow-up'),
    L('آخر نشاط', 'Last activity'), L('تاريخ الإضافة', 'Created')];
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [head, ...all.map(l => [l.code, l.brand_name, l.contact_name, l.phone_masked, l.category, l.governorate, l.source, stage(l.stage_id).name,
    staffName(l.owner_id), l.next_followup_at ? dtt(l.next_followup_at) : '', l.last_activity_at ? dtt(l.last_activity_at) : '', dt(l.created_at)])]
    .map(r => r.map(cell).join(','));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  a.download = `operative-leads-${isoDay()}.csv`; a.click(); URL.revokeObjectURL(a.href);
  rpc('crm_log_export', { p_count: all.length }).catch(() => { });
}

// ---------------- مراحل البيع ----------------
async function tabPipeline() {
  const B = body();
  let owner = '';
  B.innerHTML = `<div class="toolbar">${C.me.manager ? `<select id="ppOwner">${opt('', L('كل المسؤولين', 'All owners'))}${staffOptions('', null, C.staff.filter(s => C.me.admin || (C.me.team_staff || []).includes(s.id)))}</select>` : ''}
      <span class="muted small">${L('اسحب البطاقة لمرحلة أخرى، أو افتح العميل وغيّر المرحلة.', 'Drag a card to another stage, or open the lead to change its stage.')}</span></div>
    <div class="crm-kanban" id="ppBoard"><div class="empty">${L('جارٍ التحميل...', 'Loading...')}</div></div>`;
  const lostStage = C.stages.find(s => s.active && s.kind === 'lost');
  const load = async () => {
    let q = sb.from('crm_leads').select(LEAD_COLS).is('archived_at', null).in('stage_id', openStageIds()).order('next_followup_at', { nullsFirst: false }).limit(1000);
    if (owner) q = q.eq('owner_id', owner);
    const { data, error } = await q;
    if (error) return fail(error);
    const cols = [...openStages(), ...(lostStage ? [lostStage] : [])];
    $('#ppBoard').innerHTML = cols.map(s => {
      const list = (data || []).filter(l => l.stage_id === s.id);
      const val = list.reduce((a, l) => a + (+l.expected_value || 0), 0);
      return `<div class="kcol ${s.kind === 'lost' ? 'lost' : ''}" data-stage="${s.id}"><div class="kcol-h"><b>${esc(s.name)}</b>
          <span class="muted small num">${s.kind === 'lost' ? '' : list.length}${val ? ' · ' + money(val) : ''}</span></div>
        <div class="kcol-b">${s.kind === 'lost' ? `<div class="kdrop">${L('اسحب هنا لتسجيل خسارة', 'Drop here to mark as lost')}</div>` : list.map(l => `<div class="kcard" draggable="true" data-id="${l.id}">
            <b class="notr">${esc(l.brand_name)}</b><div class="small muted notr">${esc(l.contact_name || '')}</div>
            <div class="kmeta"><span class="small notr">${esc(staffName(l.owner_id) || L('غير موزّع', 'Unassigned'))}</span>
              <span class="small ${isLate(l.next_followup_at) ? 'crm-late' : 'muted'} num">${l.next_followup_at ? dtt(l.next_followup_at) : L('بلا متابعة', 'No follow-up')}</span></div></div>`).join('')}</div></div>`;
    }).join('');
    $$('.kcard', B).forEach(c => {
      c.onclick = () => openLead(c.dataset.id, load);
      c.ondragstart = e => { e.dataTransfer.setData('text/plain', c.dataset.id); c.classList.add('drag'); };
      c.ondragend = () => c.classList.remove('drag');
    });
    $$('.kcol', B).forEach(col => {
      col.ondragover = e => { e.preventDefault(); col.classList.add('over'); };
      col.ondragleave = () => col.classList.remove('over');
      col.ondrop = async e => {
        e.preventDefault(); col.classList.remove('over');
        const id = e.dataTransfer.getData('text/plain'); const st = +col.dataset.stage;
        const l = (data || []).find(x => x.id === id); if (!l || l.stage_id === st) return;
        if (await changeStage(l, st)) load();
      };
    });
  };
  if ($('#ppOwner')) $('#ppOwner').onchange = e => { owner = e.target.value; load(); };
  await load();
}

// تغيير المرحلة (مع سؤال سبب الخسارة). بيرجّع true لو اتغيرت
async function changeStage(l, stageId) {
  const st = stage(stageId);
  if (st.kind === 'won') { toast(L('التعاقد يُسجَّل من «تحويل إلى عميل»', 'Winning is recorded via "Convert to client"'), 'err'); return false; }
  let reason = null;
  if (st.kind === 'lost') {
    reason = await new Promise(res => {
      const m = modal({ title: L('سبب الخسارة', 'Lost reason'), body: `<form id="lostForm" class="grid">
          <label class="f"><span>${L('السبب *', 'Reason *')}</span><select name="reason" required>${lookupOptions('lost_reason', '')}</select></label>
          <label class="f"><span>${L('تفاصيل (اختياري)', 'Details (optional)')}</span><input name="more"></label></form>`,
        footer: `<button class="btn danger" id="lostOk">${L('تسجيل الخسارة', 'Mark as lost')}</button>` });
      $('.x', m.el).addEventListener('click', () => res(null));
      $('#lostOk', m.el).onclick = () => { const f = formValues($('#lostForm', m.el)); if (!f.reason) return toast(L('اختر السبب', 'Choose a reason'), 'err');
        m.close(); res(f.reason + (f.more ? ' — ' + f.more : '')); };
    });
    if (!reason) return false;
  }
  try { await rpc('crm_set_stage', { p_lead: l.id, p_stage: stageId, p_reason: reason }); toast(L('تم تغيير المرحلة', 'Stage changed'), 'ok'); return true; }
  catch (e) { fail(e); return false; }
}

// =====================================================================
//  نافذة العميل المحتمل
// =====================================================================
async function openLead(id, done) {
  try { await boot(); } catch (e) { return fail(e); }
  const [lr, cr, ar, tr_, er, sr] = await Promise.all([
    sb.from('crm_leads').select('*').eq('id', id).maybeSingle(),
    sb.from('crm_contacts').select('*').eq('lead_id', id).order('is_primary', { ascending: false }).order('created_at'),
    sb.from('crm_activities').select('*').eq('lead_id', id).order('happened_at', { ascending: false }).limit(200),
    sb.from('crm_tasks').select('*').eq('lead_id', id).is('done_at', null).order('due_at'),
    sb.from('crm_events').select('*').eq('lead_id', id).order('created_at', { ascending: false }).limit(200),
    sb.from('crm_lead_shares').select('*').eq('lead_id', id),
  ]);
  for (const r of [lr, cr, ar, tr_, er, sr]) if (r.error) return fail(r.error);
  const l = lr.data;
  if (!l) return toast(L('العميل غير موجود أو ليس ضمن عملائك', 'Lead not found or not in your list'), 'err');
  sb.rpc('crm_notif_read', { p_lead: id }).then(() => OP.refreshBell());
  const st = stage(l.stage_id), E = canEdit(l), M = canManage(l), isOpen = st.kind === 'open' && !l.archived_at;
  const shares = (sr.data || []).filter(s => !s.expires_at || new Date(s.expires_at) > new Date());
  const timeline = [
    ...(ar.data || []).map(a => ({ at: a.happened_at, html: `<div class="tl-i act"><div class="tl-h"><b>${ACT[a.type][1]} ${ACT[a.type][0]}</b>
        ${a.verified ? `<span class="badge b-green" title="${L('تمت من زر النظام', 'Made from the system button')}">${L('موثّق', 'Verified')}</span>` : ''}
        ${a.pending ? `<span class="badge b-amber">${L('بانتظار النتيجة', 'Awaiting outcome')}</span>` : a.outcome ? `<span class="badge b-gray">${esc(a.outcome)}</span>` : ''}
        <span class="muted small num">${dtt(a.happened_at)}</span></div>
        <div class="small"><span class="ev-who notr">${esc(a.actor_name || '')}</span>${a.duration_min ? ` · ${a.duration_min} ${L('د', 'min')}` : ''}</div>
        ${a.notes ? `<div class="tl-n notr">${esc(a.notes)}</div>` : ''}</div>` })),
    ...(er.data || []).map(e => ({ at: e.created_at, html: `<div class="tl-i"><div class="tl-h"><span>${EVT[e.action] || esc(e.action)}${e.note ? `: <span class="notr">${esc(e.note)}</span>` : ''}</span>
        <span class="muted small num">${dtt(e.created_at)}</span></div>
        <div class="small"><span class="ev-who notr">${esc(e.actor_name || '')}</span>
        ${e.changes ? ' · ' + Object.entries(e.changes).map(([k, v]) => Array.isArray(v)
          ? `${FIELD[k] || esc(k)}: <span class="notr">${esc(v[0] ?? '—')} ← ${esc(v[1] ?? '—')}</span>` : `${esc(k)}: <span class="notr">${esc(k === 'expires_at' ? dtt(v) : v)}</span>`).join(' · ') : ''}</div></div>` })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));
  const info = (label, val) => val == null || val === '' ? '' : `<div><span class="muted small">${label}</span><div class="notr">${val}</div></div>`;

  const m = modal({ wide: true, title: `<span class="notr">${esc(l.brand_name)}</span> <span class="muted num">#${l.code}</span> ${stageBadge(l.stage_id)}
      ${l.archived_at ? `<span class="badge b-gray">${L('مؤرشف', 'Archived')}</span>` : ''}`,
    body: `
    ${l.dup_state === 'suspect' ? `<div class="alert">${L('مشتبه أنه مكرر: نفس اسم البراند أو رابط الصفحة موجود عند عميل آخر.', 'Possible duplicate: another lead has the same brand name or page link.')}
        ${M ? `<button class="btn sm" id="ldDupOk">${L('ليس مكررًا', 'Not a duplicate')}</button> <button class="btn sm danger" id="ldDupArc">${L('أرشفة', 'Archive')}</button>` : L(' تم إبلاغ المدير للمراجعة.', ' Your manager has been notified.')}</div>` : ''}
    ${l.convert_requested_at && !l.client_id ? `<div class="alert ok">${L('تم طلب التحويل إلى عميل', 'Conversion to client requested')} — <span class="num">${dtt(l.convert_requested_at)}</span></div>` : ''}
    ${l.client_id ? `<div class="alert ok">${L('عميل فعلي في النظام', 'Now a client in the system')}: <b class="notr">${esc((S.clients.find(c => c.id === l.client_id) || {}).name || '')}</b>
        ${l.won_at ? ` · ${L('تعاقد', 'Won')} <span class="num">${dt(l.won_at)}</span>` : ''}${l.activated_at ? ` · ${L('أول طلب مسلَّم', 'First delivered order')} <span class="num">${dt(l.activated_at)}</span>` : ` · ${L('لم يُفعَّل بعد', 'Not activated yet')}`}</div>` : ''}
    <div class="crm-lead">
      <div>
        <div class="section-title" style="margin-top:0">${L('المرحلة', 'Stage')}</div>
        <div class="crm-stages">${C.stages.filter(s => s.active && s.kind !== 'won').map(s => `<button class="btn sm ${s.id === l.stage_id ? 'primary' : ''} ${s.kind === 'lost' ? 'danger' : ''}" data-stage="${s.id}" ${l.archived_at ? 'disabled' : ''}>${esc(s.name)}</button>`).join('')}</div>
        ${st.kind === 'lost' && l.lost_reason ? `<p class="small muted">${L('سبب الخسارة', 'Lost reason')}: <span class="notr">${esc(l.lost_reason)}</span></p>` : ''}

        <div class="section-title">${L('أشخاص التواصل', 'Contacts')} ${E ? `<button class="btn sm" id="ldAddC">+ ${L('رقم / شخص', 'Number / person')}</button>` : ''}</div>
        <div class="crm-contacts">${(cr.data || []).map(c => `<div class="crm-contact" data-c="${c.id}">
            <div><b class="notr">${esc(c.name || L('بدون اسم', 'No name'))}</b> ${c.role ? `<span class="muted small notr">${esc(c.role)}</span>` : ''}
              ${c.is_primary ? `<span class="badge b-blue">${L('أساسي', 'Primary')}</span>` : ''}</div>
            <div class="crm-num" data-masked="${esc(c.phone_masked || '')}">${phoneHtml(c.phone_masked)}</div>
            ${c.phone_masked ? `<div class="crm-cbtns"><button class="btn sm" data-reveal="view">${L('إظهار', 'Show')}</button>
              <button class="btn sm primary" data-reveal="call">📞 ${L('اتصال', 'Call')}</button>
              <button class="btn sm" data-reveal="whatsapp">💬 ${L('واتساب', 'WhatsApp')}</button>
              ${E ? `<button class="btn sm ghost" data-editc>${L('تعديل', 'Edit')}</button>` : ''}</div>` : (E ? `<div class="crm-cbtns"><button class="btn sm ghost" data-editc>${L('إضافة رقم', 'Add number')}</button></div>` : '')}
          </div>`).join('') || `<p class="muted small">${L('لا توجد أرقام مسجّلة.', 'No numbers on file.')}</p>`}</div>

        <details class="crm-det" open><summary class="section-title">${L('البيانات', 'Details')}</summary>
        ${E ? `<p style="margin:0 0 8px"><button class="btn sm" id="ldEdit">${L('تعديل البيانات', 'Edit details')}</button></p>` : ''}
        <div class="crm-info">
          ${info(L('النشاط', 'Category'), esc(l.category))}${info(L('المحافظة', 'Governorate'), esc(l.governorate))}${info(L('المصدر', 'Source'), esc(l.source))}
          ${info(L('رابط الصفحة', 'Page link'), l.page_url ? `<a class="ltr" href="${esc(/^https?:\/\//i.test(l.page_url) ? l.page_url : 'https://' + l.page_url)}" target="_blank" rel="noopener noreferrer">${esc(l.page_url.replace(/^https?:\/\/(www\.)?/i, '').slice(0, 40))}</a>` : '')}
          ${info(L('طلبات متوقعة / شهر', 'Expected orders / month'), l.expected_orders_month)}
          ${info(L('إيراد متوقع / شهر', 'Expected revenue / month'), l.expected_value != null ? egp(l.expected_value) : '')}
          ${info(L('العرض المقدَّم (تجهيز / شحن / مرتجع)', 'Offer (fulfillment / shipping / return)'), (l.offer_fulfillment ?? l.offer_shipping ?? l.offer_return) != null
            ? `<span class="ltr num">${money(l.offer_fulfillment)} / ${money(l.offer_shipping)} / ${money(l.offer_return)}</span>` : '')}
          ${info(L('المسؤول', 'Owner'), l.owner_id ? esc(staffName(l.owner_id)) : `<span class="badge b-gray">${L('غير موزّع', 'Unassigned')}</span>`)}
          ${info(L('الفريق', 'Team'), esc(teamName(l.team_id)))}
          ${info(L('أُضيف', 'Added'), `${esc(l.created_by_name || '')} · <span class="num">${dt(l.created_at)}</span>`)}
        </div>
        ${l.notes ? `<div class="copybox small notr" style="margin-top:10px">${esc(l.notes)}</div>` : ''}
        ${shares.length || M ? `<div class="section-title">${L('التفويض', 'Delegation')} ${M ? `<button class="btn sm" id="ldShare">+ ${L('تفويض موظف', 'Delegate')}</button>` : ''}</div>
          <div>${shares.map(s => `<div class="crm-share"><span class="notr">${esc(staffName(s.staff_id))}</span>
              <span class="muted small">${s.expires_at ? L('حتى ', 'until ') + `<span class="num">${dtt(s.expires_at)}</span>` : L('بدون تاريخ انتهاء', 'no expiry')}</span>
              ${M ? `<button class="btn sm ghost danger" data-unshare="${s.staff_id}">${L('إلغاء', 'Remove')}</button>` : ''}</div>`).join('')
            || `<p class="muted small">${L('لا يوجد تفويض.', 'No delegation.')}</p>`}</div>` : ''}
        </details>
      </div>

      <div>
        ${!l.archived_at ? `<div class="section-title" style="margin-top:0">${L('تسجيل نشاط', 'Log activity')}</div>
        <form id="ldAct" class="grid crm-act">
          <div class="grid g2">
            <label class="f"><span>${L('النوع', 'Type')}</span><select name="type">${Object.entries(ACT).map(([k, v]) => opt(k, v[0], 'call')).join('')}</select></label>
            <label class="f"><span>${L('النتيجة', 'Outcome')}</span><select name="outcome"></select></label></div>
          <label class="f"><span>${L('ملاحظات', 'Notes')}</span><textarea name="notes" rows="2"></textarea></label>
          ${isOpen ? `<div class="grid g2"><label class="f"><span>${L('المتابعة القادمة', 'Next follow-up')} *</span><input type="datetime-local" name="next_at" value="${atDay(1)}"></label>
            <label class="f"><span>${L('عنوان المتابعة', 'Follow-up title')}</span><input name="next_title" placeholder="${L('مثال: إرسال العرض', 'e.g. send the offer')}"></label></div>
          ${nextQuick('next_at')}` : ''}
          <div><button class="btn primary" type="submit">${L('تسجيل', 'Log')}</button></div></form>` : ''}

        <div class="section-title">${L('المتابعات المفتوحة', 'Open follow-ups')} ${!l.archived_at ? `<button class="btn sm" id="ldAddT">+ ${L('متابعة', 'Follow-up')}</button>` : ''}</div>
        <div>${(tr_.data || []).map(t => `<div class="crm-task ${isLate(t.due_at) ? 'late' : ''}"><label class="chk"><input type="checkbox" data-task="${t.id}"><span class="notr">${esc(t.title)}</span></label>
            ${dueHtml(t.due_at)}</div>`).join('') || `<p class="muted small">${isOpen ? L('لا توجد متابعة قادمة — حدّد موعدًا.', 'No upcoming follow-up — set one.') : L('لا توجد.', 'None.')}</p>`}</div>

        <div class="section-title">${L('السجل', 'History')}</div>
        <div class="crm-tl">${timeline.map(x => x.html).join('') || `<p class="muted small">${L('لا يوجد نشاط بعد.', 'No activity yet.')}</p>`}</div>
      </div>
    </div>`,
    footer: `${M && !l.archived_at ? `<button class="btn" id="ldAssign">${L('توزيع', 'Assign')}</button>` : ''}
      ${!l.client_id && !l.archived_at ? ((M || (C.me.clients_edit && true)) ? `<button class="btn primary" id="ldConvert">${L('تحويل إلى عميل', 'Convert to client')}</button>`
        : `<button class="btn" id="ldConvReq" ${l.convert_requested_at ? 'disabled' : ''}>${L('طلب تحويل إلى عميل', 'Request conversion')}</button>`) : ''}
      <span class="spacer"></span>
      ${M ? `<button class="btn ${l.archived_at ? '' : 'danger'}" id="ldArchive">${l.archived_at ? L('إلغاء الأرشفة', 'Unarchive') : L('أرشفة', 'Archive')}</button>` : ''}` });

  const reopen = () => { m.close(); if (done) done(); openLead(id, done); };
  // على الموبايل: البيانات مطوية عشان الاتصال وتسجيل النشاط يبقوا قدام الموظف
  if (window.innerWidth <= 860) { const det = $('.crm-det', m.el); if (det) det.open = false; }
  const run = (btn, fn, msg) => busy(btn, async () => { try { await fn(); if (msg) toast(msg, 'ok'); reopen(); } catch (e) { fail(e); } });

  // المرحلة
  $$('[data-stage]', m.el).forEach(b => b.onclick = async () => { if (+b.dataset.stage !== l.stage_id && await changeStage(l, +b.dataset.stage)) reopen(); });
  // الأرقام
  $$('.crm-contact', m.el).forEach(row => {
    const c = (cr.data || []).find(x => x.id === row.dataset.c);
    $$('[data-reveal]', row).forEach(b => b.onclick = () => revealPhone(l, c, b.dataset.reveal, row, b, reopen));
    const ed = $('[data-editc]', row); if (ed) ed.onclick = () => openContactForm(l, c, reopen);
  });
  if ($('#ldAddC', m.el)) $('#ldAddC', m.el).onclick = () => openContactForm(l, null, reopen);
  if ($('#ldEdit', m.el)) $('#ldEdit', m.el).onclick = () => openLeadForm(l, reopen);
  // النشاط
  const af = $('#ldAct', m.el);
  if (af) {
    const fillOut = () => { const t = af.elements.type.value; af.elements.outcome.innerHTML = OUTCOMES[t].length ? OUTCOMES[t].map(o => opt(o, o)).join('') : opt('', '—');
      af.elements.outcome.disabled = !OUTCOMES[t].length; };
    af.elements.type.onchange = fillOut; fillOut(); bindQuick(af);
    af.onsubmit = e => {
      e.preventDefault(); const f = formValues(af);
      run($('button[type=submit]', af), () => rpc('crm_activity_add', { p: { lead_id: id, type: f.type, outcome: f.outcome || null, notes: f.notes || null,
        next_at: fromLocalInput(f.next_at), next_title: f.next_title || null } }), L('تم تسجيل النشاط', 'Activity logged'));
    };
  }
  // المتابعات
  $$('[data-task]', m.el).forEach(c => c.onchange = async () => { try { await rpc('crm_task_done', { p_id: +c.dataset.task }); toast(L('تم', 'Done'), 'ok'); reopen(); } catch (e) { fail(e); c.checked = false; } });
  if ($('#ldAddT', m.el)) $('#ldAddT', m.el).onclick = () => openTaskForm(id, reopen);
  // الإدارة
  if ($('#ldAssign', m.el)) $('#ldAssign', m.el).onclick = () => openAssign([id], reopen, l);
  if ($('#ldShare', m.el)) $('#ldShare', m.el).onclick = () => openShare(l, reopen);
  $$('[data-unshare]', m.el).forEach(b => b.onclick = () => run(b, () => rpc('crm_lead_unshare', { p_lead: id, p_staff: b.dataset.unshare }), L('تم إلغاء التفويض', 'Delegation removed')));
  if ($('#ldDupOk', m.el)) $('#ldDupOk', m.el).onclick = e => run(e.currentTarget, () => rpc('crm_dup_resolve', { p_lead: id, p_action: 'clear' }), L('تم', 'Done'));
  if ($('#ldDupArc', m.el)) $('#ldDupArc', m.el).onclick = e => run(e.currentTarget, () => rpc('crm_dup_resolve', { p_lead: id, p_action: 'archive' }), L('تمت الأرشفة', 'Archived'));
  if ($('#ldArchive', m.el)) $('#ldArchive', m.el).onclick = async e => {
    const btn = e.currentTarget;
    if (!l.archived_at && !await confirmBox(L('أرشفة العميل تخفيه من القوائم وتقفل متابعاته. يمكن إلغاء الأرشفة لاحقًا.', 'Archiving hides the lead from lists and closes its follow-ups. You can unarchive later.'), L('أرشفة', 'Archive'), true)) return;
    run(btn, () => rpc('crm_lead_archive', { p_lead: id, p_archive: !l.archived_at }), L('تم', 'Done'));
  };
  if ($('#ldConvReq', m.el)) $('#ldConvReq', m.el).onclick = e => run(e.currentTarget, () => rpc('crm_convert_request', { p_lead: id, p_note: null }), L('تم إرسال الطلب للمدير', 'Request sent to your manager'));
  if ($('#ldConvert', m.el)) $('#ldConvert', m.el).onclick = () => openConvert(l, reopen);
}

// ---------------- كشف الرقم / اتصال / واتساب ----------------
async function revealPhone(l, c, action, row, btn, reopen) {
  // نافذة الواتساب لازم تتفتح في نفس لحظة الضغط (وإلا المتصفح يمنعها)
  const w = action === 'whatsapp' ? window.open('', '_blank') : null;
  let r;
  btn.disabled = true;
  try { r = await rpc('crm_reveal_phone', { p_contact: c.id, p_action: action }); }
  catch (e) { if (w) w.close(); btn.disabled = false; return fail(e); }
  btn.disabled = false; C.at = 0;
  if (r.denied) {
    if (w) w.close();
    return toast(L(`وصلت للحد اليومي لإظهار الأرقام (${r.limit}). تم إبلاغ المدير.`, `Daily reveal limit reached (${r.limit}). Your manager has been notified.`), 'err');
  }
  const phone = r.phone;
  const box = $('.crm-num', row);
  const stamp = `${r.actor || ''} · ${dtt(new Date())}`;
  box.innerHTML = `<span class="crm-reveal notr" data-wm="${esc(stamp)}"><b class="ltr num">${esc(phone.replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3'))}</b></span>
    <span class="muted small" data-count></span>`;
  let left = 30;
  const tick = () => { const el = $('[data-count]', box); if (!el || !document.body.contains(box)) return clearInterval(tm);
    el.textContent = L(`يختفي بعد ${left} ث`, `hides in ${left}s`); if (left-- <= 0) { clearInterval(tm); box.innerHTML = phoneHtml(box.dataset.masked); } };
  const tm = setInterval(tick, 1000); tick();
  if (action === 'call') window.location.href = 'tel:' + phone;
  if (action === 'whatsapp') {
    const intl = phone.startsWith('0') ? '2' + phone : phone;
    const tpls = lookups('wa_template');
    const go = text => { const url = `https://wa.me/${intl}${text ? '?text=' + encodeURIComponent(text) : ''}`; if (w) w.location.href = url; else window.location.href = url; };
    if (!tpls.length) go('');
    else {
      const fill = t => (t || '').replace(/\{name\}/g, c.name || l.brand_name).replace(/\{brand\}/g, l.brand_name).replace(/\{me\}/g, C.me.name || '');
      go(fill(tpls[0].body));
    }
  }
  if (r.activity_id && (action === 'call' || action === 'whatsapp')) openOutcome({ id: r.activity_id, type: action, lead_id: l.id }, reopen, l);
}

// نتيجة التواصل بعد الاتصال/الواتساب
function openOutcome(a, done, lead) {
  const isOpen = !lead || (stage(lead.stage_id).kind === 'open' && !lead.archived_at);
  const m = modal({ title: `${ACT[a.type][1]} ${L('نتيجة التواصل', 'Contact outcome')}`, body: `<form id="ocForm" class="grid">
      <label class="f"><span>${L('النتيجة *', 'Outcome *')}</span><select name="outcome" required>${OUTCOMES[a.type].map(o => opt(o, o)).join('')}</select></label>
      ${a.type === 'call' ? `<label class="f"><span>${L('مدة المكالمة (دقائق)', 'Call duration (minutes)')}</span><input type="number" name="duration_min" min="0" dir="ltr"></label>` : ''}
      <label class="f"><span>${L('ملاحظات', 'Notes')}</span><textarea name="notes" rows="3"></textarea></label>
      ${isOpen ? `<div class="grid g2"><label class="f"><span>${L('المتابعة القادمة', 'Next follow-up')} *</span><input type="datetime-local" name="next_at" value="${atDay(1)}"></label>
        <label class="f"><span>${L('عنوان المتابعة', 'Follow-up title')}</span><input name="next_title"></label></div>${nextQuick('next_at')}` : ''}</form>`,
    footer: `<button class="btn primary" id="ocSave">${L('حفظ', 'Save')}</button><button class="btn" id="ocLater">${L('لاحقًا', 'Later')}</button>
      <span class="spacer"></span><button class="btn ghost danger" id="ocCancel">${L('لم يتم التواصل (إلغاء)', "Didn't contact (cancel)")}</button>` });
  bindQuick(m.el);
  $('#ocLater', m.el).onclick = () => m.close();
  $('#ocSave', m.el).onclick = e => { const f = formValues($('#ocForm', m.el)); busy(e.currentTarget, async () => {
    try { await rpc('crm_activity_outcome', { p: { id: a.id, outcome: f.outcome, notes: f.notes || null, duration_min: f.duration_min || null,
        next_at: fromLocalInput(f.next_at), next_title: f.next_title || null } });
      toast(L('تم الحفظ', 'Saved'), 'ok'); m.close(); if (done) done(); } catch (er) { fail(er); } }); };
  $('#ocCancel', m.el).onclick = e => busy(e.currentTarget, async () => {
    try { await rpc('crm_activity_outcome', { p: { id: a.id, cancel: true } }); m.close(); if (done) done(); } catch (er) { fail(er); } });
}

// ---------------- إضافة / تعديل عميل محتمل ----------------
function openLeadForm(l, done) {
  const isNew = !l; l = l || {};
  const mgr = C.me.manager && isNew;
  const m = modal({ wide: true, title: isNew ? L('عميل محتمل جديد', 'New lead') : L('تعديل بيانات العميل', 'Edit lead'), body: `<form id="lfForm" class="grid">
      <div class="grid g2">
        <label class="f"><span>${L('اسم البراند *', 'Brand name *')}</span><input name="brand_name" required value="${esc(l.brand_name)}"></label>
        <label class="f"><span>${L('النشاط', 'Category')}</span><select name="category">${lookupOptions('category', l.category)}</select></label></div>
      ${isNew ? `<div class="grid g2">
        <label class="f"><span>${L('اسم المسؤول عن التواصل', 'Contact name')}</span><input name="contact_name"></label>
        <label class="f"><span>${L('صفته', 'Role')}</span><input name="contact_role" placeholder="${L('المالك، مدير العمليات…', 'Owner, operations manager…')}"></label>
        <label class="f"><span>${L('رقم الهاتف', 'Phone')}</span><input name="phone" inputmode="tel" dir="ltr" autocomplete="off"></label>
        <label class="f"><span>${L('رقم هاتف آخر', 'Other phone')}</span><input name="phone2" inputmode="tel" dir="ltr" autocomplete="off"></label></div>
      <p class="hint" style="margin:-6px 0 0">${L('الرقم يُحفظ محجوبًا ولا يظهر بعد الحفظ إلا بزر «إظهار». لا تكتب أرقامًا في الملاحظات — تُحجب تلقائيًا.', 'The number is stored masked and only shown via "Show". Do not type numbers in notes — they are masked automatically.')}</p>` : ''}
      <div class="grid g3">
        <label class="f"><span>${L('المحافظة', 'Governorate')}</span><select name="governorate">${opt('', L('— اختر —', '— Select —'), l.governorate)}${GOVS.map(g => opt(g, g, l.governorate)).join('')}</select></label>
        <label class="f"><span>${L('المصدر', 'Source')}</span><select name="source">${lookupOptions('source', l.source)}</select></label>
        <label class="f"><span>${L('رابط الصفحة / المتجر', 'Page / store link')}</span><input name="page_url" dir="ltr" value="${esc(l.page_url)}" placeholder="instagram.com/brand"></label></div>
      <div class="grid g2">
        <label class="f"><span>${L('طلبات متوقعة شهريًا', 'Expected orders per month')}</span><input type="number" name="expected_orders_month" min="0" dir="ltr" value="${esc(l.expected_orders_month)}"></label>
        <label class="f"><span>${L('إيراد متوقع شهريًا (ج)', 'Expected monthly revenue (EGP)')}</span><input type="number" name="expected_value" min="0" step="0.01" dir="ltr" value="${esc(l.expected_value)}"></label></div>
      <div class="section-title" style="margin:4px 0 0">${L('العرض المقدَّم', 'Offer')}</div>
      <div class="grid g3">
        <label class="f"><span>${L('التجهيز / طلب', 'Fulfillment / order')}</span><input type="number" name="offer_fulfillment" min="0" step="0.01" dir="ltr" value="${esc(l.offer_fulfillment)}"></label>
        <label class="f"><span>${L('الشحن الأساسي', 'Base shipping')}</span><input type="number" name="offer_shipping" min="0" step="0.01" dir="ltr" value="${esc(l.offer_shipping)}"></label>
        <label class="f"><span>${L('المرتجع', 'Return')}</span><input type="number" name="offer_return" min="0" step="0.01" dir="ltr" value="${esc(l.offer_return)}"></label></div>
      <label class="f"><span>${L('ملاحظات', 'Notes')}</span><textarea name="notes" rows="2">${esc(l.notes)}</textarea></label>
      ${isNew ? `<div class="grid g2">
        ${mgr ? `<label class="f"><span>${L('المسؤول', 'Owner')}</span><select name="owner_id">${C.me.staff_id ? opt(C.me.staff_id, L('أنا', 'Me'), C.me.staff_id) : opt('', L('غير موزّع', 'Unassigned'), '')}${assignable().filter(s => s.id !== C.me.staff_id).map(s => opt(s.id, s.name)).join('')}${C.me.admin && C.me.staff_id ? opt('', L('غير موزّع', 'Unassigned')) : ''}</select></label>` : ''}
        <label class="f"><span>${L('أول متابعة', 'First follow-up')}</span><input type="datetime-local" name="next_at" value="${inHours(2)}"></label></div>` : ''}
    </form>`, footer: `<button class="btn primary" id="lfSave">${L('حفظ', 'Save')}</button>` });
  $('#lfSave', m.el).onclick = e => {
    const form = $('#lfForm', m.el); if (!form.reportValidity()) return;
    const f = formValues(form); const p = { ...f };
    if (!isNew) p.id = l.id; else p.next_at = fromLocalInput(f.next_at);
    busy(e.currentTarget, async () => {
      try {
        const r = await rpc('crm_lead_save', { p });
        toast(r.dup ? L('تم الحفظ — مشتبه أنه مكرر، وتم إبلاغ المدير', 'Saved — flagged as possible duplicate; manager notified') : L('تم الحفظ', 'Saved'), r.dup ? '' : 'ok');
        m.close(); C.at = 0;
        if (isNew) { if (done) done(); openLead(r.id, done); } else if (done) done();
      } catch (er) { fail(er); }
    });
  };
}

function openContactForm(l, c, done) {
  const isNew = !c; c = c || {};
  const m = modal({ title: isNew ? L('إضافة رقم / شخص', 'Add number / person') : L('تعديل شخص التواصل', 'Edit contact'), body: `<form id="ctForm" class="grid">
      <div class="grid g2"><label class="f"><span>${L('الاسم', 'Name')}</span><input name="name" value="${esc(c.name)}"></label>
        <label class="f"><span>${L('الصفة', 'Role')}</span><input name="role" value="${esc(c.role)}"></label></div>
      <label class="f"><span>${isNew ? L('رقم الهاتف *', 'Phone *') : L('رقم جديد (اتركه فارغًا إن لم يتغير)', 'New number (leave empty to keep)')}</span>
        <input name="phone" inputmode="tel" dir="ltr" autocomplete="off" ${isNew ? 'required' : ''} placeholder="${esc(c.phone_masked || '')}"></label>
      <label class="chk"><input type="checkbox" name="is_primary" ${c.is_primary ? 'checked' : ''}> ${L('الرقم الأساسي للعميل', 'Primary number for this lead')}</label></form>`,
    footer: `<button class="btn primary" id="ctSave">${L('حفظ', 'Save')}</button>
      ${!isNew && canManage(l) ? `<span class="spacer"></span><button class="btn danger" id="ctDel">${L('حذف', 'Delete')}</button>` : ''}` });
  $('#ctSave', m.el).onclick = e => { const form = $('#ctForm', m.el); if (!form.reportValidity()) return; const f = formValues(form);
    busy(e.currentTarget, async () => { try { await rpc('crm_contact_save', { p: { id: c.id || null, lead_id: l.id, name: f.name, role: f.role, phone: f.phone, is_primary: f.is_primary } });
      toast(L('تم الحفظ', 'Saved'), 'ok'); m.close(); done(); } catch (er) { fail(er); } }); };
  if ($('#ctDel', m.el)) $('#ctDel', m.el).onclick = async e => { const btn = e.currentTarget;
    if (!await confirmBox(L('حذف هذا الشخص ورقمه نهائيًا؟', 'Delete this contact and number permanently?'), L('حذف', 'Delete'), true)) return;
    busy(btn, async () => { try { await rpc('crm_contact_delete', { p_contact: c.id }); m.close(); done(); } catch (er) { fail(er); } }); };
}

function openTaskForm(leadId, done) {
  const m = modal({ title: L('متابعة جديدة', 'New follow-up'), body: `<form id="tkForm" class="grid">
      <label class="f"><span>${L('العنوان', 'Title')}</span><input name="title" placeholder="${L('متابعة', 'Follow-up')}"></label>
      <label class="f"><span>${L('الموعد *', 'Due *')}</span><input type="datetime-local" name="due_at" required value="${atDay(1)}"></label>${nextQuick('due_at')}</form>`,
    footer: `<button class="btn primary" id="tkSave">${L('حفظ', 'Save')}</button>` });
  bindQuick(m.el);
  $('#tkSave', m.el).onclick = e => { const f = formValues($('#tkForm', m.el)); if (!f.due_at) return toast(L('حدّد الموعد', 'Set the due time'), 'err');
    busy(e.currentTarget, async () => { try { await rpc('crm_task_save', { p: { lead_id: leadId, title: f.title, due_at: fromLocalInput(f.due_at) } });
      toast(L('تم الحفظ', 'Saved'), 'ok'); m.close(); done(); } catch (er) { fail(er); } }); };
}

// ---------------- التوزيع والتفويض ----------------
function openAssign(ids, done, lead) {
  if (!ids.length) return;
  const list = assignable();
  const m = modal({ title: L(`توزيع ${ids.length} عميل`, `Assign ${ids.length} lead(s)`), body: `<form id="asForm" class="grid">
      <label class="f"><span>${L('المسؤول الجديد', 'New owner')}</span><select name="staff">${opt('', L('— غير موزّع —', '— Unassigned —'), lead ? lead.owner_id : '')}${list.map(s => opt(s.id, s.name + (s.team_id ? ' — ' + teamName(s.team_id) : ''), lead ? lead.owner_id : '')).join('')}</select></label>
      ${C.me.admin ? `<label class="f"><span>${L('الفريق (لو غير موزّع)', 'Team (if unassigned)')}</span><select name="team">${opt('', '—')}${C.teams.filter(t => t.active).map(t => opt(t.id, t.name, lead ? lead.team_id : '')).join('')}</select></label>` : ''}
      <p class="hint">${L('المسؤول السابق يفقد صلاحية رؤية العميل ورقمه فورًا، والمتابعات المفتوحة تنتقل للمسؤول الجديد.', 'The previous owner immediately loses access to the lead and its number; open follow-ups move to the new owner.')}</p></form>`,
    footer: `<button class="btn primary" id="asOk">${L('توزيع', 'Assign')}</button>` });
  $('#asOk', m.el).onclick = e => { const f = formValues($('#asForm', m.el));
    busy(e.currentTarget, async () => { try { const n = await rpc('crm_lead_assign', { p_leads: ids, p_staff: f.staff || null, p_team: f.team || null });
      toast(L(`تم توزيع ${n} عميل`, `${n} lead(s) assigned`), 'ok'); m.close(); done(); } catch (er) { fail(er); } }); };
}
function openShare(l, done) {
  const list = assignable().filter(s => s.id !== l.owner_id);
  const m = modal({ title: L('تفويض موظف على العميل', 'Delegate lead to a staff member'), body: `<form id="shForm" class="grid">
      <label class="f"><span>${L('الموظف *', 'Staff *')}</span><select name="staff" required>${opt('', L('— اختر —', '— Select —'))}${list.map(s => opt(s.id, s.name)).join('')}</select></label>
      <label class="f"><span>${L('ينتهي التفويض في', 'Delegation ends at')} <span class="hint">${L('(اتركه فارغًا لتفويض مفتوح)', '(leave empty for open-ended)')}</span></span>
        <input type="datetime-local" name="expires" value="${atDay(7, 23)}"></label>
      <p class="hint">${L('المفوَّض يرى العميل ويكشف رقمه ويسجّل نشاطًا، لكنه لا يعدّل بياناته.', 'The delegate can see the lead, reveal its number and log activity, but cannot edit its data.')}</p></form>`,
    footer: `<button class="btn primary" id="shOk">${L('تفويض', 'Delegate')}</button>` });
  $('#shOk', m.el).onclick = e => { const f = formValues($('#shForm', m.el)); if (!f.staff) return toast(L('اختر الموظف', 'Choose a staff member'), 'err');
    busy(e.currentTarget, async () => { try { await rpc('crm_lead_share', { p_lead: l.id, p_staff: f.staff, p_expires: fromLocalInput(f.expires) });
      toast(L('تم التفويض', 'Delegated'), 'ok'); m.close(); done(); } catch (er) { fail(er); } }); };
}

// ---------------- التحويل إلى عميل ----------------
function openConvert(l, done) {
  const linked = new Set();   // العملاء المرتبطون بعميل محتمل آخر بيترفضوا من قاعدة البيانات
  const m = modal({ title: L('تحويل إلى عميل', 'Convert to client'), body: `<form id="cvForm" class="grid">
      <div class="alert info small">${L('ينشئ عميلًا في صفحة «العملاء» بالأسعار المعروضة، ويسجّل التعاقد للمسؤول الحالي. أسعار المحافظات وحساب الدخول يُضبطان بعد ذلك من صفحة العملاء.', 'Creates a client on the Clients page with the offered prices and credits the win to the current owner. Governorate prices and the login account are set afterwards on the Clients page.')}</div>
      <label class="chk"><input type="radio" name="mode" value="new" checked> ${L('عميل جديد', 'New client')}</label>
      <div id="cvNew" class="grid">
        <label class="f"><span>${L('اسم العميل *', 'Client name *')}</span><input name="name" value="${esc(l.brand_name)}"></label>
        <div class="grid g3">
          <label class="f"><span>${L('التجهيز / طلب', 'Fulfillment / order')}</span><input type="number" name="fulfillment_fee" min="0" step="0.01" dir="ltr" value="${esc(l.offer_fulfillment ?? 0)}"></label>
          <label class="f"><span>${L('الشحن الأساسي', 'Base shipping')}</span><input type="number" name="default_shipping_fee" min="0" step="0.01" dir="ltr" value="${esc(l.offer_shipping ?? 0)}"></label>
          <label class="f"><span>${L('المرتجع', 'Return')}</span><input type="number" name="return_fee" min="0" step="0.01" dir="ltr" value="${esc(l.offer_return ?? 0)}"></label></div>
        <label class="chk"><input type="checkbox" name="copy_phone" checked> ${L('نسخ رقم الهاتف الأساسي إلى بيانات العميل (يظهر لموظفي التشغيل)', 'Copy the primary phone to the client record (visible to operations staff)')}</label></div>
      <label class="chk"><input type="radio" name="mode" value="link"> ${L('ربط بعميل موجود', 'Link to an existing client')}</label>
      <div id="cvLink" style="display:none"><select name="client">${opt('', L('— اختر العميل —', '— Select client —'))}${S.clients.filter(c => !linked.has(c.id)).map(c => opt(c.id, c.name)).join('')}</select></div></form>`,
    footer: `<button class="btn primary" id="cvOk">${L('تحويل', 'Convert')}</button>` });
  const form = $('#cvForm', m.el);
  $$('[name=mode]', form).forEach(r => r.onchange = () => { const nw = form.querySelector('[name=mode]:checked').value === 'new';
    $('#cvNew', m.el).style.display = nw ? '' : 'none'; $('#cvLink', m.el).style.display = nw ? 'none' : ''; });
  $('#cvOk', m.el).onclick = e => {
    const nw = form.querySelector('[name=mode]:checked').value === 'new'; const f = formValues(form);
    if (nw && !f.name) return toast(L('اسم العميل مطلوب', 'Client name is required'), 'err');
    if (!nw && !f.client) return toast(L('اختر العميل', 'Choose the client'), 'err');
    busy(e.currentTarget, async () => {
      try {
        await rpc('crm_convert_to_client', { p_lead: l.id, p_client: nw ? null : f.client,
          p_new: nw ? { name: f.name, copy_phone: f.copy_phone, fulfillment_fee: f.fulfillment_fee, default_shipping_fee: f.default_shipping_fee, return_fee: f.return_fee } : null });
        await OP.loadClients();
        toast(L('تم التحويل إلى عميل 🎉', 'Converted to client 🎉'), 'ok'); m.close(); done();
      } catch (er) { fail(er); }
    });
  };
}

// ---------------- الرفع من Excel ----------------
const IMP_COLS = [
  { key: 'brand_name', label: 'اسم البراند', alias: ['اسم البراند', 'البراند', 'براند', 'المتجر', 'اسم المتجر', 'الشركه', 'اسم الشركه', 'brand', 'brand name', 'store', 'company'] },
  { key: 'contact_name', label: 'اسم المسؤول', alias: ['اسم المسؤول', 'المسؤول', 'الاسم', 'اسم العميل', 'جهه الاتصال', 'contact', 'contact name', 'name'] },
  { key: 'phone', label: 'رقم الهاتف', alias: ['رقم الهاتف', 'الهاتف', 'الموبايل', 'موبايل', 'التليفون', 'رقم الموبايل', 'phone', 'mobile', 'phone number'] },
  { key: 'phone2', label: 'رقم هاتف آخر', alias: ['رقم هاتف آخر', 'رقم هاتف اخر', 'هاتف آخر', 'هاتف اخر', 'هاتف 2', 'موبايل 2', 'phone2', 'phone 2', 'other phone'] },
  { key: 'category', label: 'النشاط', alias: ['النشاط', 'نوع النشاط', 'المجال', 'الفئه', 'category', 'industry'] },
  { key: 'governorate', label: 'المحافظة', alias: ['المحافظه', 'محافظه', 'المدينه', 'governorate', 'city'] },
  { key: 'source', label: 'المصدر', alias: ['المصدر', 'مصدر', 'source'] },
  { key: 'page_url', label: 'رابط الصفحة', alias: ['رابط الصفحه', 'الرابط', 'الصفحه', 'اللينك', 'لينك', 'page', 'link', 'url', 'page url', 'instagram', 'facebook'] },
  { key: 'notes', label: 'ملاحظات', alias: ['ملاحظات', 'ملاحظه', 'notes', 'note'] },
];
async function openImport(done) {
  try { await loadXLSX(); } catch (e) { return fail(e); }
  const XLSX = window.XLSX;
  let rows = [], offset = 1;
  const m = modal({ wide: true, title: L('رفع عملاء محتملين من Excel', 'Import leads from Excel'), body: `
      <div class="alert info small">${L('حمّل النموذج، املأه، ثم ارفعه. الأرقام المكررة (المسجّلة عند أي موظف) تُتجاهل ويُعرض رقم الصف فقط.', 'Download the template, fill it in, then upload it. Duplicate numbers (already held by any staff member) are skipped; only the row number is shown.')}</div>
      <div class="toolbar"><button class="btn" id="imTpl">${L('تنزيل النموذج', 'Download template')}</button><input type="file" id="imFile" accept=".xlsx,.xls,.csv"></div>
      <div id="imPrev"></div>
      <div id="imOpts" style="display:none" class="grid g3">
        <label class="f"><span>${L('التوزيع', 'Assign to')}</span><select id="imMode">${C.me.staff_id ? opt('me', L('لنفسي', 'Myself')) : ''}
          ${C.me.manager ? opt('staff', L('لموظف', 'A staff member')) + opt('team', L('بالتساوي على الفريق', 'Evenly across the team')) + opt('pool', L('غير موزّع', 'Unassigned')) : ''}</select></label>
        <label class="f" id="imStaffW" style="display:none"><span>${L('الموظف', 'Staff')}</span><select id="imStaff">${staffOptions('', L('— اختر —', '— Select —'))}</select></label>
        <label class="f" id="imTeamW" style="display:none"><span>${L('الفريق', 'Team')}</span><select id="imTeam">${C.teams.filter(t => t.active && (C.me.admin || (C.me.teams || []).includes(t.id))).map(t => opt(t.id, t.name)).join('')}</select></label></div>
      <div id="imResult"></div>`,
    footer: `<button class="btn primary" id="imGo" disabled>${L('إضافة', 'Import')}</button>` });
  const modeChange = () => { const v = $('#imMode', m.el).value;
    $('#imStaffW', m.el).style.display = v === 'staff' ? '' : 'none'; $('#imTeamW', m.el).style.display = (v === 'team' || v === 'pool') ? '' : 'none'; };
  $('#imMode', m.el).onchange = modeChange; modeChange();
  $('#imTpl', m.el).onclick = () => {
    const ws = XLSX.utils.aoa_to_sheet([IMP_COLS.map(c => c.label), ['Brand X', 'أحمد محمد', '01012345678', '', 'ملابس', 'القاهرة', 'إنستجرام', 'instagram.com/brandx', '']]);
    ws['!cols'] = IMP_COLS.map(c => ({ wch: c.key === 'page_url' || c.key === 'notes' ? 32 : 18 }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'العملاء المحتملون'); wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.writeFile(wb, 'operative-leads-template.xlsx');
  };
  $('#imFile', m.el).onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    rows = []; $('#imResult', m.el).innerHTML = '';
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    let found = null;
    for (const name of wb.SheetNames) {
      const raw = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: '' });
      for (let h = 0; h < Math.min(raw.length, 6) && !found; h++) {
        const map = {};
        raw[h].forEach((cell, i) => { const n = normAr(cell); if (!n) return;
          const col = IMP_COLS.find(c => !(c.key in map) && c.alias.some(a => normAr(a) === n)); if (col) map[col.key] = i; });
        if ('brand_name' in map && ('phone' in map || 'page_url' in map)) found = { map, h, data: raw.slice(h + 1).filter(r => r.some(x => String(x).trim() !== '')) };
      }
      if (found) break;
    }
    if (!found) { $('#imPrev', m.el).innerHTML = `<div class="alert">${L('لم أجد أعمدة «اسم البراند» و«رقم الهاتف» في الملف. استخدم النموذج.', 'Could not find "Brand name" and "Phone" columns. Please use the template.')}</div>`;
      $('#imGo', m.el).disabled = true; $('#imOpts', m.el).style.display = 'none'; return; }
    offset = found.h + 2;
    rows = found.data.map(r => { const o = {}; IMP_COLS.forEach(c => { if (c.key in found.map) o[c.key] = String(r[found.map[c.key]] ?? '').trim(); }); return o; });
    $('#imPrev', m.el).innerHTML = `<p class="small">${L(`عدد الصفوف: <b class="num">${rows.length}</b> — عرض أول 20`, `Rows: <b class="num">${rows.length}</b> — showing the first 20`)}</p>
      <div class="panel"><div class="table-wrap" style="max-height:260px;overflow:auto"><table class="t"><thead><tr><th>#</th>${IMP_COLS.filter(c => c.key in found.map).map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
      <tbody>${rows.slice(0, 20).map((r, i) => `<tr><td class="num">${i + offset}</td>${IMP_COLS.filter(c => c.key in found.map).map(c => `<td class="notr ${/phone/.test(c.key) ? 'ltr' : ''}">${esc(r[c.key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    $('#imOpts', m.el).style.display = ''; $('#imGo', m.el).disabled = !rows.length;
  };
  $('#imGo', m.el).onclick = e => {
    const mode = $('#imMode', m.el).value;
    if (mode === 'staff' && !$('#imStaff', m.el).value) return toast(L('اختر الموظف', 'Choose a staff member'), 'err');
    if (rows.length > 2000) return toast(L('الحد الأقصى 2000 صف في الملف', 'Maximum 2000 rows per file'), 'err');
    busy(e.currentTarget, async () => {
      try {
        const r = await rpc('crm_import_leads', { p_rows: rows, p_mode: mode, p_staff: mode === 'staff' ? $('#imStaff', m.el).value : null,
          p_team: (mode === 'team' || mode === 'pool') ? ($('#imTeam', m.el).value || null) : null });
        $('#imResult', m.el).innerHTML = `<div class="alert ok">${L(`تمت إضافة <b class="num">${r.added}</b> عميل.`, `<b class="num">${r.added}</b> lead(s) added.`)}</div>
          ${r.dup.length ? `<div class="alert">${L('أرقام مسجّلة بالفعل (تم تجاهلها) — الصفوف', 'Already registered numbers (skipped) — rows')}: <span class="num ltr">${r.dup.map(i => i + offset - 1).join(', ')}</span></div>` : ''}
          ${r.bad.length ? `<div class="alert">${L('صفوف بها أخطاء', 'Rows with errors')}:<br>${r.bad.map(b => `<span class="num">${b.row + offset - 1}</span>: <span class="notr">${esc(b.error)}</span>`).join('<br>')}</div>` : ''}`;
        rows = []; $('#imGo', m.el).disabled = true; C.at = 0; if (done) done();
      } catch (er) { fail(er); }
    });
  };
}

// =====================================================================
//  الأداء
// =====================================================================
const PF = { from: null, to: null, team: '' };
const commissionOf = r => (+r.revenue || 0) * (+r.commission_pct || 0) / 100 + (+r.win_bonus || 0) * (+r.wins || 0);
const rate = (a, b) => b > 0 ? Math.round(a * 100 / b) + '%' : '—';
async function tabPerformance() {
  const B = body();
  PF.from = PF.from || monthStart(); PF.to = PF.to || isoDay();
  const teams = C.teams.filter(t => t.active && (C.me.admin || (C.me.teams || []).includes(t.id)));
  B.innerHTML = `<div class="toolbar">${dateInput('pfFrom', PF.from, L('من', 'From'))}${dateInput('pfTo', PF.to, L('إلى', 'To'))}
      ${teams.length > 1 || (C.me.admin && teams.length) ? `<select id="pfTeam">${opt('', L('كل الفرق', 'All teams'), PF.team)}${teams.map(t => opt(t.id, t.name, PF.team)).join('')}</select>` : ''}
      <span class="spacer"></span><button class="btn" id="pfPrint">${L('طباعة', 'Print')}</button></div>
    <div id="pfBody"><div class="empty">${L('جارٍ التحميل...', 'Loading...')}</div></div>`;
  const load = async () => {
    PF.from = $('#pfFrom').value || monthStart(); PF.to = $('#pfTo').value || isoDay(); PF.team = $('#pfTeam') ? $('#pfTeam').value : '';
    let rows, fn;
    try { [rows, fn] = await Promise.all([rpc('crm_performance', { p_from: PF.from, p_to: PF.to, p_team: PF.team || null }),
      rpc('crm_funnel', { p_from: PF.from, p_to: PF.to, p_team: PF.team || null })]); } catch (e) { return fail(e); }
    rows = rows || [];
    const sum = k => rows.reduce((a, r) => a + (+r[k] || 0), 0);
    const totalCom = rows.reduce((a, r) => a + commissionOf(r), 0);
    const maxStage = Math.max(1, ...fn.stages.map(s => s.count));
    const maxLost = Math.max(1, ...fn.lost_reasons.map(s => s.count));
    $('#pfBody').innerHTML = `<div id="pfPrintable">
      <div class="cards">
        ${fcard(L('عملاء جدد موزّعون', 'Leads assigned'), sum('assigned'), '')}
        ${fcard(L('أنشطة التواصل', 'Contact activities'), sum('activities'), 'indigo', `${L('موثّق', 'Verified')}: ${sum('verified')} · ${L('مكالمات', 'Calls')}: ${sum('calls')}`)}
        ${fcard(L('تعاقدات', 'Wins'), sum('wins'), 'green', `${L('تفعيل (أول طلب)', 'Activated (first order)')}: ${sum('activations')}`)}
        ${fcard(L('نسبة القفل', 'Win rate'), rate(sum('wins'), sum('wins') + sum('lost')), '', `${L('خسارة', 'Lost')}: ${sum('lost')}`)}
        ${fcard(L('إيراد عملاء المبيعات', 'Revenue from sales clients'), egp(sum('revenue')), 'primary', sum('target_revenue') ? `${L('التارجت', 'Target')}: ${money(sum('target_revenue'))}` : '')}
        ${fcard(L('العمولة المحسوبة', 'Calculated commission'), egp(totalCom), 'orange')}
      </div>
      <div class="section-title">${L('أداء الموظفين', 'Staff performance')}</div>
      <div class="panel"><div class="table-wrap"><table class="t crm-perf"><thead><tr>
        <th>${L('الموظف', 'Staff')}</th><th>${L('موزّع', 'Assigned')}</th><th>${L('أنشطة', 'Activities')}</th><th class="hide-sm">${L('مكالمات', 'Calls')}</th>
        <th class="hide-sm">${L('واتساب', 'WhatsApp')}</th><th class="hide-sm">${L('اجتماعات', 'Meetings')}</th><th title="${L('متوسط ساعات أول تواصل بعد التوزيع', 'Average hours to first contact after assignment')}">${L('أول رد (س)', '1st reply (h)')}</th>
        <th title="${L('عملاء عدّوا مهلة أول رد بدون تواصل', 'Leads past the first-response deadline')}">${L('بلا رد', 'No reply')}</th>
        <th>${L('مفتوح', 'Open')}</th><th>${L('متأخرة', 'Overdue')}</th><th class="hide-sm">${L('راكد', 'Stale')}</th><th class="hide-sm">${L('بلا متابعة', 'No next')}</th>
        <th>${L('تعاقد', 'Wins')}</th><th class="hide-sm">${L('تفعيل', 'Activated')}</th><th class="hide-sm">${L('خسارة', 'Lost')}</th><th>${L('القفل', 'Win rate')}</th>
        <th class="hide-sm">${L('أيام القفل', 'Days to close')}</th><th>${L('الإيراد', 'Revenue')}</th><th>${L('العمولة', 'Commission')}</th></tr></thead>
        <tbody>${rows.map(r => `<tr class="${r.active ? '' : 'inactive'}"><td><b class="notr">${esc(r.name)}</b><div class="small muted notr">${esc(teamName(r.team_id))}</div></td>
          <td class="num">${r.assigned}</td>
          <td class="num">${r.activities}<div class="small muted">${L('موثّق', 'verified')} ${r.verified}${r.pending ? ` · <span class="crm-late">${r.pending} ${L('بلا نتيجة', 'no outcome')}</span>` : ''}</div>${+r.target_activities ? progress(r.activities, +r.target_activities) : ''}</td>
          <td class="num hide-sm">${r.calls}</td><td class="num hide-sm">${r.whatsapp}</td><td class="num hide-sm">${r.meetings}</td>
          <td class="num">${r.first_response_hours ?? '—'}</td><td class="num ${r.no_response ? 'crm-late' : ''}">${r.no_response}</td>
          <td class="num">${r.open_leads}</td><td class="num ${r.overdue ? 'crm-late' : ''}">${r.overdue}</td><td class="num hide-sm ${r.stale ? 'crm-late' : ''}">${r.stale}</td>
          <td class="num hide-sm ${r.no_next ? 'crm-late' : ''}">${r.no_next}</td>
          <td class="num"><b>${r.wins}</b>${+r.target_wins ? progress(r.wins, +r.target_wins) : ''}</td><td class="num hide-sm">${r.activations}</td><td class="num hide-sm">${r.lost}</td>
          <td class="num">${rate(r.wins, r.wins + r.lost)}</td><td class="num hide-sm">${r.avg_close_days ?? '—'}</td>
          <td class="num">${money(r.revenue)}${+r.target_revenue ? progress(+r.revenue, +r.target_revenue) : ''}</td>
          <td class="num">${money(commissionOf(r))}<div class="small muted">${+r.commission_pct}%${+r.win_bonus ? ' + ' + money(r.win_bonus) : ''}</div></td></tr>`).join('')
          || `<tr><td colspan="19" class="empty">${L('لا يوجد موظفو مبيعات بعد.', 'No sales staff yet.')}</td></tr>`}</tbody></table></div></div>
      <div class="crm-two">
        <div><div class="section-title">${L('قمع المراحل (الحالي)', 'Stage funnel (current)')}</div>
          <div class="panel"><div class="panel-b">${fn.stages.map(s => `<div class="crm-hbar"><span class="lbl">${esc(s.name)}</span>
            <div class="bar"><i class="${s.kind}" style="width:${Math.round(s.count * 100 / maxStage)}%"></i></div>
            <span class="num small"><b>${s.count}</b>${+s.value ? ` · ${money(s.value)}` : ''} <span class="muted">(${L('دخلها في الفترة', 'entered')}: ${s.entered})</span></span></div>`).join('')}</div></div></div>
        <div><div class="section-title">${L('أسباب الخسارة', 'Lost reasons')}</div>
          <div class="panel"><div class="panel-b">${fn.lost_reasons.map(s => `<div class="crm-hbar"><span class="lbl notr">${esc(s.reason)}</span>
            <div class="bar"><i class="lost" style="width:${Math.round(s.count * 100 / maxLost)}%"></i></div><span class="num small"><b>${s.count}</b></span></div>`).join('')
            || `<p class="muted small" style="margin:0">${L('لا توجد خسائر في الفترة.', 'No losses in this period.')}</p>`}</div></div>
          <div class="section-title">${L('المصادر', 'Sources')}</div>
          <div class="panel"><div class="table-wrap"><table class="t"><thead><tr><th>${L('المصدر', 'Source')}</th><th>${L('عملاء', 'Leads')}</th><th>${L('تعاقد', 'Wins')}</th><th>${L('النسبة', 'Rate')}</th></tr></thead>
            <tbody>${fn.sources.map(s => `<tr><td>${esc(s.source)}</td><td class="num">${s.leads}</td><td class="num">${s.wins}</td><td class="num">${rate(s.wins, s.leads)}</td></tr>`).join('')
              || `<tr><td colspan="4" class="empty">${L('لا يوجد عملاء جدد في الفترة.', 'No new leads in this period.')}</td></tr>`}</tbody></table></div></div></div>
      </div></div>
      <div class="section-title">${L('عمولات الشهر', 'Monthly commissions')}</div><div id="pfCom"></div>`;
    renderCommissions();
  };
  const renderCommissions = async () => {
    const month = (PF.to || isoDay()).slice(0, 7) + '-01';
    const { data, error } = await sb.from('crm_commissions').select('*').eq('month', month).order('staff_name');
    if (error) return fail(error);
    const ST = { draft: [L('مسودة', 'Draft'), 'gray'], approved: [L('معتمدة', 'Approved'), 'blue'], paid: [L('مدفوعة', 'Paid'), 'green'] };
    $('#pfCom').innerHTML = `<div class="toolbar"><span class="muted small">${L('شهر', 'Month')} <b class="num ltr">${month.slice(0, 7)}</b> — ${L('الإقفال يثبّت أرقام الشهر؛ المعتمد والمدفوع لا يتغيران بعد ذلك.', 'Closing freezes the month; approved and paid rows no longer change.')}</span>
        <span class="spacer"></span>${C.me.admin ? `<button class="btn primary" id="cmClose">${L('إقفال / تحديث عمولات الشهر', 'Close / refresh month')}</button>` : ''}</div>
      <div class="panel"><div class="table-wrap"><table class="t"><thead><tr><th>${L('الموظف', 'Staff')}</th><th>${L('تعاقدات', 'Wins')}</th><th>${L('الإيراد', 'Revenue')}</th>
        <th>${L('النسبة', 'Rate')}</th><th>${L('مكافأة التعاقد', 'Win bonus')}</th><th>${L('العمولة', 'Commission')}</th><th>${L('الحالة', 'Status')}</th>${C.me.admin ? '<th></th>' : ''}</tr></thead>
        <tbody>${(data || []).map(c => `<tr><td class="notr">${esc(c.staff_name || staffName(c.staff_id))}</td><td class="num">${c.wins}</td><td class="num">${money(c.revenue)}</td>
          <td class="num">${+c.pct}%</td><td class="num">${money(c.bonus)}</td><td class="num"><b>${money(c.amount)}</b></td>
          <td><span class="badge b-${ST[c.status][1]}">${ST[c.status][0]}</span>${c.approved_by ? `<div class="small muted notr">${esc(c.approved_by)}</div>` : ''}</td>
          ${C.me.admin ? `<td class="w1">${c.status === 'draft' ? `<button class="btn sm" data-cm="${c.id}" data-s="approved">${L('اعتماد', 'Approve')}</button>`
            : c.status === 'approved' ? `<button class="btn sm" data-cm="${c.id}" data-s="paid">${L('تم الدفع', 'Mark paid')}</button> <button class="btn sm ghost" data-cm="${c.id}" data-s="draft">${L('إلغاء الاعتماد', 'Unapprove')}</button>`
            : `<button class="btn sm ghost" data-cm="${c.id}" data-s="approved">${L('إلغاء الدفع', 'Unmark paid')}</button>`}</td>` : ''}</tr>`).join('')
          || `<tr><td colspan="8" class="empty">${C.me.admin ? L('لم يُقفَل هذا الشهر بعد.', 'This month is not closed yet.') : L('لا توجد عمولات مسجّلة لك في هذا الشهر.', 'No commissions recorded for you this month.')}</td></tr>`}</tbody></table></div></div>`;
    if ($('#cmClose')) $('#cmClose').onclick = e => busy(e.currentTarget, async () => { try { await rpc('crm_commission_close', { p_month: month }); toast(L('تم', 'Done'), 'ok'); renderCommissions(); } catch (er) { fail(er); } });
    $$('[data-cm]', $('#pfCom')).forEach(b => b.onclick = () => busy(b, async () => { try { await rpc('crm_commission_set', { p_id: +b.dataset.cm, p_status: b.dataset.s }); renderCommissions(); } catch (er) { fail(er); } }));
  };
  ['pfFrom', 'pfTo', 'pfTeam'].forEach(id => { const el = $('#' + id); if (el) el.onchange = load; });
  $('#pfPrint').onclick = () => { const el = $('#pfPrintable'); if (!el) return;
    printHtml(reportHead(L('تقرير أداء المبيعات', 'Sales performance report'), `<span class="num ltr">${PF.from} → ${PF.to}</span>`) + el.innerHTML); };
  await load();
}

// =====================================================================
//  الفريق والإعدادات
// =====================================================================
async function tabTeam() {
  await boot(true);
  const B = body(), A = C.me.admin;
  const crmStaff = C.staff.filter(s => s.crm && (A || (C.me.team_staff || []).includes(s.id)));
  const month0 = isoDay().slice(0, 7);
  B.innerHTML = `
    <div class="section-title" style="margin-top:0">${L('الفرق', 'Teams')} ${A ? `<button class="btn sm" id="tmNew">+ ${L('فريق', 'Team')}</button>` : ''}</div>
    <div class="panel"><div class="table-wrap"><table class="t"><thead><tr><th>${L('الفريق', 'Team')}</th><th>${L('المدير', 'Manager')}</th><th>${L('الأعضاء', 'Members')}</th>${A ? '<th></th>' : ''}</tr></thead>
      <tbody>${C.teams.filter(t => A || (C.me.teams || []).includes(t.id)).map(t => `<tr class="${t.active ? '' : 'inactive'}"><td><b class="notr">${esc(t.name)}</b></td><td class="notr">${esc(staffName(t.manager_id)) || '—'}</td>
        <td class="notr small">${C.staff.filter(s => s.team_id === t.id).map(s => esc(s.name)).join('، ') || '—'}</td>${A ? `<td class="w1"><button class="btn sm" data-team="${t.id}">${L('تعديل', 'Edit')}</button></td>` : ''}</tr>`).join('')
        || `<tr><td colspan="4" class="empty">${L('لا توجد فرق بعد.', 'No teams yet.')}</td></tr>`}</tbody></table></div></div>
    ${A ? `<p class="hint">${L('صلاحيات المبيعات (استخدام القسم / مدير مبيعات / الرفع من Excel) تُمنح من صفحة «الموظفين». مدير الفريق يحتاج صلاحية «مدير مبيعات».', 'Sales permissions (use the section / sales manager / Excel import) are granted on the Staff page. A team manager needs the "sales manager" permission.')}</p>` : ''}

    <div class="section-title">${L('التارجت الشهري', 'Monthly targets')} <input type="month" id="tgMonth" value="${month0}" style="width:auto;margin-inline-start:10px"></div>
    <div class="panel" id="tgList"></div>

    ${A ? `<div class="section-title">${L('الإعدادات العامة', 'General settings')}</div>
    <div class="panel"><div class="panel-b"><form id="stForm" class="grid">
      <div class="grid g4">
        <label class="f"><span>${L('حد إظهار الأرقام يوميًا (موظف)', 'Daily reveal limit (staff)')}</span><input type="number" name="reveal_limit" min="0" dir="ltr" value="${C.settings.reveal_limit}"></label>
        <label class="f"><span>${L('حد إظهار الأرقام يوميًا (مدير)', 'Daily reveal limit (manager)')}</span><input type="number" name="manager_reveal_limit" min="0" dir="ltr" value="${C.settings.manager_reveal_limit}"></label>
        <label class="f"><span>${L('مهلة أول رد (ساعات)', 'First-response deadline (hours)')}</span><input type="number" name="first_response_hours" min="1" dir="ltr" value="${C.settings.first_response_hours}"></label>
        <label class="f"><span>${L('العميل راكد بعد (أيام)', 'Lead is stale after (days)')}</span><input type="number" name="stale_days" min="1" dir="ltr" value="${C.settings.stale_days}"></label>
        <label class="f"><span>${L('أقصى تسجيل نشاط بأثر رجعي (ساعات)', 'Max activity backdating (hours)')}</span><input type="number" name="backdate_hours" min="1" dir="ltr" value="${C.settings.backdate_hours}"></label>
        <label class="f"><span>${L('نسبة العمولة %', 'Commission %')}</span><input type="number" name="commission_pct" min="0" step="0.001" dir="ltr" value="${+C.settings.commission_pct}"></label>
        <label class="f"><span>${L('العمولة على', 'Commission base')}</span><select name="commission_base">${opt('fees', L('كل رسوم Operative (شحن + تجهيز + مرتجع)', 'All Operative fees (shipping + fulfillment + return)'), C.settings.commission_base)}${opt('fulfillment', L('رسوم التجهيز فقط', 'Fulfillment fees only'), C.settings.commission_base)}</select></label>
        <label class="f"><span>${L('شهور احتساب العمولة بعد التعاقد (0 = دائمًا)', 'Commission months after win (0 = always)')}</span><input type="number" name="commission_months" min="0" dir="ltr" value="${C.settings.commission_months}"></label>
        <label class="f"><span>${L('مكافأة ثابتة لكل تعاقد (ج)', 'Fixed bonus per win (EGP)')}</span><input type="number" name="win_bonus" min="0" step="0.01" dir="ltr" value="${+C.settings.win_bonus}"></label></div>
      <div><button class="btn primary" type="submit">${L('حفظ الإعدادات', 'Save settings')}</button></div></form></div></div>

    <div class="section-title">${L('إعدادات خاصة بموظف', 'Per-staff overrides')} <span class="hint">${L('(الخانة الفارغة = الإعداد العام)', '(empty = general setting)')}</span></div>
    <div class="panel"><div class="table-wrap"><table class="t"><thead><tr><th>${L('الموظف', 'Staff')}</th><th>${L('حد الإظهار اليومي', 'Daily reveal limit')}</th><th>${L('نسبة العمولة %', 'Commission %')}</th><th>${L('مكافأة التعاقد', 'Win bonus')}</th><th></th></tr></thead>
      <tbody>${crmStaff.map(s => { const o = (C.staff_settings || []).find(x => x.staff_id === s.id) || {};
        return `<tr data-ss="${s.id}"><td class="notr">${esc(s.name)}</td><td><input type="number" min="0" dir="ltr" data-k="reveal_limit" value="${o.reveal_limit ?? ''}" style="width:110px"></td>
          <td><input type="number" min="0" step="0.001" dir="ltr" data-k="commission_pct" value="${o.commission_pct ?? ''}" style="width:110px"></td>
          <td><input type="number" min="0" step="0.01" dir="ltr" data-k="win_bonus" value="${o.win_bonus ?? ''}" style="width:110px"></td>
          <td class="w1"><button class="btn sm">${L('حفظ', 'Save')}</button></td></tr>`; }).join('')
        || `<tr><td colspan="5" class="empty">${L('لا يوجد موظفو مبيعات بعد.', 'No sales staff yet.')}</td></tr>`}</tbody></table></div></div>

    <div class="section-title">${L('مراحل البيع', 'Pipeline stages')} <button class="btn sm" id="sgNew">+ ${L('مرحلة', 'Stage')}</button></div>
    <div class="panel"><div class="table-wrap"><table class="t"><thead><tr><th>${L('المرحلة', 'Stage')}</th><th>${L('النوع', 'Type')}</th><th>${L('الترتيب', 'Order')}</th><th>${L('الاحتمال %', 'Probability %')}</th><th></th></tr></thead>
      <tbody>${C.stages.map(s => `<tr class="${s.active ? '' : 'inactive'}"><td>${esc(s.name)}</td><td>${{ open: L('مفتوحة', 'Open'), won: L('تعاقد', 'Won'), lost: L('خسارة', 'Lost') }[s.kind]}</td>
        <td class="num">${s.sort}</td><td class="num">${s.probability}</td><td class="w1"><button class="btn sm" data-sg="${s.id}">${L('تعديل', 'Edit')}</button></td></tr>`).join('')}</tbody></table></div></div>` : ''}

    <div class="section-title">${L('القوائم', 'Lists')}</div>
    <div class="crm-two">${[['source', L('المصادر', 'Sources')], ['category', L('أنواع النشاط', 'Categories')], ['lost_reason', L('أسباب الخسارة', 'Lost reasons')], ['wa_template', L('قوالب واتساب', 'WhatsApp templates')]].map(([k, t]) => `
      <div class="panel"><div class="panel-h"><span>${t}</span><button class="btn sm" data-lknew="${k}">+ ${L('إضافة', 'Add')}</button></div>
        <div class="panel-b crm-lk">${C.lookups.filter(x => x.kind === k).map(x => `<a href="#" class="chip ${x.active ? '' : 'off'}" data-lk="${x.id}">${esc(x.name)}</a>`).join('') || `<span class="muted small">—</span>`}</div></div>`).join('')}</div>
    <p class="hint">${L('في قوالب واتساب: {name} اسم الشخص، {brand} اسم البراند، {me} اسمك. أول قالب مفعّل هو المستخدم عند الضغط على «واتساب».', 'In WhatsApp templates: {name} contact name, {brand} brand name, {me} your name. The first active template is used when pressing "WhatsApp".')}</p>`;

  const refresh = async () => { await boot(true); tabTeam(); };
  // التارجت
  const loadTargets = async () => {
    const month = ($('#tgMonth').value || month0) + '-01';
    const { data, error } = await sb.from('crm_targets').select('*').eq('month', month);
    if (error) return fail(error);
    $('#tgList').innerHTML = `<div class="table-wrap"><table class="t"><thead><tr><th>${L('الموظف', 'Staff')}</th><th>${L('تعاقدات', 'Wins')}</th><th>${L('إيراد (ج)', 'Revenue (EGP)')}</th><th>${L('أنشطة تواصل', 'Contact activities')}</th><th></th></tr></thead>
      <tbody>${crmStaff.map(s => { const t = (data || []).find(x => x.staff_id === s.id) || {};
        return `<tr data-tg="${s.id}"><td class="notr">${esc(s.name)}</td><td><input type="number" min="0" dir="ltr" data-k="wins" value="${t.target_wins ?? ''}" style="width:100px"></td>
          <td><input type="number" min="0" step="0.01" dir="ltr" data-k="revenue" value="${t.target_revenue != null ? +t.target_revenue : ''}" style="width:130px"></td>
          <td><input type="number" min="0" dir="ltr" data-k="activities" value="${t.target_activities ?? ''}" style="width:100px"></td>
          <td class="w1"><button class="btn sm">${L('حفظ', 'Save')}</button></td></tr>`; }).join('')
        || `<tr><td colspan="5" class="empty">${L('لا يوجد موظفو مبيعات في فريقك بعد.', 'No sales staff in your team yet.')}</td></tr>`}</tbody></table></div>`;
    $$('tr[data-tg]', B).forEach(r => $('button', r).onclick = e => busy(e.currentTarget, async () => {
      const v = k => +($(`[data-k="${k}"]`, r).value || 0);
      try { await rpc('crm_targets_save', { p_staff: r.dataset.tg, p_month: month, p_wins: v('wins'), p_revenue: v('revenue'), p_activities: v('activities') }); toast(L('تم الحفظ', 'Saved'), 'ok'); } catch (er) { fail(er); } }));
  };
  $('#tgMonth').onchange = loadTargets; loadTargets();

  // القوائم
  const lkForm = (kind, x) => {
    x = x || {}; const tpl = kind === 'wa_template';
    const m = modal({ title: x.id ? L('تعديل', 'Edit') : L('إضافة', 'Add'), body: `<form id="lkForm" class="grid">
        <label class="f"><span>${L('الاسم *', 'Name *')}</span><input name="name" required value="${esc(x.name)}"></label>
        ${tpl ? `<label class="f"><span>${L('نص الرسالة', 'Message text')}</span><textarea name="body" rows="5">${esc(x.body)}</textarea></label>` : ''}
        <div class="grid g2"><label class="f"><span>${L('الترتيب', 'Order')}</span><input type="number" name="sort" dir="ltr" value="${x.sort ?? 50}"></label>
          <label class="chk" style="align-self:end"><input type="checkbox" name="active" ${x.id && !x.active ? '' : 'checked'}> ${L('مفعّل', 'Active')}</label></div></form>`,
      footer: `<button class="btn primary" id="lkSave">${L('حفظ', 'Save')}</button>` });
    $('#lkSave', m.el).onclick = e => { const form = $('#lkForm', m.el); if (!form.reportValidity()) return; const f = formValues(form);
      busy(e.currentTarget, async () => { try { await rpc('crm_lookup_save', { p: { id: x.id || null, kind, name: f.name, body: f.body || null, sort: f.sort, active: f.active } }); m.close(); refresh(); } catch (er) { fail(er); } }); };
  };
  $$('[data-lknew]', B).forEach(b => b.onclick = () => lkForm(b.dataset.lknew));
  $$('[data-lk]', B).forEach(a => a.onclick = ev => { ev.preventDefault(); const x = C.lookups.find(k => k.id === +a.dataset.lk); lkForm(x.kind, x); });
  if (!A) return;

  // الفرق
  const teamForm = t => {
    t = t || {}; const members = new Set(C.staff.filter(s => t.id && s.team_id === t.id).map(s => s.id));
    const cand = C.staff.filter(s => s.crm);
    const m = modal({ title: t.id ? L('تعديل الفريق', 'Edit team') : L('فريق جديد', 'New team'), body: `<form id="tmForm" class="grid">
        <label class="f"><span>${L('اسم الفريق *', 'Team name *')}</span><input name="name" required value="${esc(t.name)}"></label>
        <label class="f"><span>${L('مدير الفريق', 'Team manager')}</span><select name="manager_id">${opt('', '—', t.manager_id)}${cand.filter(s => s.manager).map(s => opt(s.id, s.name, t.manager_id)).join('')}</select>
          <span class="hint">${L('يظهر هنا من لديه صلاحية «مدير مبيعات» فقط.', 'Only staff with the "sales manager" permission appear here.')}</span></label>
        <div class="section-title" style="margin:4px 0">${L('الأعضاء', 'Members')}</div>
        <div class="perm-list">${cand.map(s => `<label class="chk"><input type="checkbox" class="tmM" value="${s.id}" ${members.has(s.id) ? 'checked' : ''}> <span class="notr">${esc(s.name)}</span>
          ${s.team_id && s.team_id !== t.id ? `<span class="hint">(${esc(teamName(s.team_id))})</span>` : ''}</label>`).join('') || `<span class="muted small">${L('لا يوجد موظفون لديهم صلاحية المبيعات — امنحها من صفحة «الموظفين».', 'No staff have the sales permission — grant it on the Staff page.')}</span>`}</div>
        ${t.id ? `<label class="chk"><input type="checkbox" name="active" ${t.active ? 'checked' : ''}> ${L('مفعّل', 'Active')}</label>` : ''}</form>`,
      footer: `<button class="btn primary" id="tmSave">${L('حفظ', 'Save')}</button>` });
    $('#tmSave', m.el).onclick = e => { const form = $('#tmForm', m.el); if (!form.reportValidity()) return; const f = formValues(form);
      busy(e.currentTarget, async () => { try { await rpc('crm_team_save', { p: { id: t.id || null, name: f.name, manager_id: f.manager_id || null,
        members: $$('.tmM:checked', m.el).map(c => c.value), active: t.id ? f.active : true } }); toast(L('تم الحفظ', 'Saved'), 'ok'); m.close(); refresh(); } catch (er) { fail(er); } }); };
  };
  $('#tmNew').onclick = () => teamForm();
  $$('[data-team]', B).forEach(b => b.onclick = () => teamForm(C.teams.find(t => t.id === b.dataset.team)));
  // الإعدادات
  $('#stForm').onsubmit = e => { e.preventDefault(); const f = formValues(e.target);
    busy($('button[type=submit]', e.target), async () => { try { await rpc('crm_settings_save', { p: f }); toast(L('تم حفظ الإعدادات', 'Settings saved'), 'ok'); await boot(true); } catch (er) { fail(er); } }); };
  $$('tr[data-ss]', B).forEach(r => $('button', r).onclick = e => busy(e.currentTarget, async () => {
    const p = {}; $$('[data-k]', r).forEach(i => p[i.dataset.k] = i.value);
    try { await rpc('crm_staff_settings_save', { p_staff: r.dataset.ss, p }); toast(L('تم الحفظ', 'Saved'), 'ok'); C.at = 0; } catch (er) { fail(er); } }));
  // المراحل
  const stageForm = s => {
    s = s || {};
    const m = modal({ title: s.id ? L('تعديل المرحلة', 'Edit stage') : L('مرحلة جديدة', 'New stage'), body: `<form id="sgForm" class="grid">
        <label class="f"><span>${L('الاسم *', 'Name *')}</span><input name="name" required value="${esc(s.name)}"></label>
        <div class="grid g3">
          ${s.id ? '' : `<label class="f"><span>${L('النوع', 'Type')}</span><select name="kind">${opt('open', L('مفتوحة', 'Open'))}${opt('lost', L('خسارة', 'Lost'))}</select></label>`}
          <label class="f"><span>${L('الترتيب', 'Order')}</span><input type="number" name="sort" dir="ltr" value="${s.sort ?? 55}"></label>
          <label class="f"><span>${L('الاحتمال %', 'Probability %')}</span><input type="number" name="probability" min="0" max="100" dir="ltr" value="${s.probability ?? 0}"></label></div>
        ${s.id ? `<label class="chk"><input type="checkbox" name="active" ${s.active ? 'checked' : ''}> ${L('مفعّلة', 'Active')}</label>` : ''}</form>`,
      footer: `<button class="btn primary" id="sgSave">${L('حفظ', 'Save')}</button>` });
    $('#sgSave', m.el).onclick = e => { const form = $('#sgForm', m.el); if (!form.reportValidity()) return; const f = formValues(form);
      busy(e.currentTarget, async () => { try { await rpc('crm_stage_save', { p: { id: s.id || null, name: f.name, kind: f.kind || s.kind, sort: f.sort, probability: f.probability, active: s.id ? f.active : true } });
        m.close(); refresh(); } catch (er) { fail(er); } }); };
  };
  $('#sgNew').onclick = () => stageForm();
  $$('[data-sg]', B).forEach(b => b.onclick = () => stageForm(C.stages.find(s => s.id === +b.dataset.sg)));
}

// =====================================================================
//  سجل الأمان (للأدمن)
// =====================================================================
async function tabSecurity() {
  const B = body();
  B.innerHTML = `<div class="alert info small">${L('كل إظهار لرقم، وكل اتصال أو واتساب من النظام، وكل فحص لرقم يُسجَّل هنا باسم صاحبه. «إظهار بلا نشاط» = أرقام أُظهرت دون تسجيل أي نشاط على عميلها خلال 24 ساعة — مؤشر يستحق المراجعة.', 'Every number reveal, every call or WhatsApp from the system, and every number check is logged here. "Revealed with no activity" = numbers revealed with no activity logged on the lead within 24 hours — worth reviewing.')}</div>
    <div class="toolbar">${dateInput('scFrom', monthStart(), L('من', 'From'))}${dateInput('scTo', isoDay(), L('إلى', 'To'))}</div><div id="scBody"><div class="empty">${L('جارٍ التحميل...', 'Loading...')}</div></div>`;
  const AC = { view: L('إظهار', 'Show'), call: L('اتصال', 'Call'), whatsapp: L('واتساب', 'WhatsApp'), check: L('فحص رقم', 'Number check'), denied: L('مرفوض (تجاوز الحد)', 'Denied (limit)') };
  const load = async () => {
    let r; try { r = await rpc('crm_security_log', { p_from: $('#scFrom').value || monthStart(), p_to: $('#scTo').value || isoDay() }); } catch (e) { return fail(e); }
    const lim = C.settings ? C.settings.reveal_limit : 30;
    $('#scBody').innerHTML = `<div class="section-title" style="margin-top:0">${L('ملخص لكل مستخدم', 'Summary per user')}</div>
      <div class="panel"><div class="table-wrap"><table class="t"><thead><tr><th>${L('المستخدم', 'User')}</th><th>${L('أرقام مكشوفة (الفترة)', 'Numbers revealed (period)')}</th>
        <th>${L('أقصى يوم', 'Peak day')}</th><th>${L('إظهار بلا نشاط', 'Revealed, no activity')}</th><th>${L('فحص أرقام', 'Checks')}</th><th>${L('مرفوض', 'Denied')}</th>
        <th>${L('آخر 7 أيام', 'Last 7 days')}</th><th>${L('آخر 30 يوم', 'Last 30 days')}</th></tr></thead>
        <tbody>${r.users.map(u => `<tr><td class="notr"><b>${esc(u.name || '')}</b></td><td class="num">${u.contacts}</td>
          <td class="num ${u.max_day >= lim ? 'crm-late' : ''}">${u.max_day}</td><td class="num ${u.no_activity ? 'crm-late' : ''}">${u.no_activity}</td>
          <td class="num">${u.checks}</td><td class="num ${u.denied ? 'crm-late' : ''}">${u.denied}</td><td class="num">${u.d7}</td><td class="num">${u.d30}</td></tr>`).join('')
          || `<tr><td colspan="8" class="empty">${L('لا توجد عمليات في هذه الفترة.', 'No operations in this period.')}</td></tr>`}</tbody></table></div></div>
      <div class="section-title">${L('آخر العمليات', 'Latest operations')} <span class="muted small">(${r.recent.length})</span></div>
      <div class="panel"><div class="table-wrap"><table class="t"><thead><tr><th>${L('الوقت', 'Time')}</th><th>${L('المستخدم', 'User')}</th><th>${L('العملية', 'Operation')}</th>
        <th>${L('العميل', 'Lead')}</th><th>${L('الشخص / الرقم', 'Contact / number')}</th></tr></thead>
        <tbody>${r.recent.map(x => `<tr><td class="num">${dtt(x.at)}</td><td class="notr">${esc(x.actor_name || '')}</td>
          <td><span class="badge b-${x.action === 'denied' ? 'red' : x.action === 'check' ? 'gray' : x.action === 'view' ? 'amber' : 'green'}">${AC[x.action] || esc(x.action)}</span></td>
          <td class="notr">${x.code ? `#${x.code} ${esc(x.brand_name || '')}` : '—'}</td><td><span class="notr">${esc(x.contact_name || '')}</span> ${x.phone_masked ? phoneHtml(x.phone_masked) : ''}</td></tr>`).join('')
          || `<tr><td colspan="5" class="empty">—</td></tr>`}</tbody></table></div></div>`;
  };
  $('#scFrom').onchange = load; $('#scTo').onchange = load;
  await load();
}

window.OperativeCRM = { view, openLead };
})();
