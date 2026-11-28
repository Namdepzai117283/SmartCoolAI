/* SmartCool Admin – SPA thuần JavaScript, gọi REST API /api/admin/* bằng JWT */
'use strict';

const API = (window.SMARTCOOL_API || '/api').replace(/\/+$/, '');
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (id) => `<svg class="i"><use href="#${id}"/></svg>`;
const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const dt = (v) => (v ? new Date(v).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const d = (v) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—');
const ago = (v) => {
  if (!v) return '—';
  const m = Math.round((Date.now() - new Date(v).getTime()) / 60000);
  if (m < 1) return 'vừa xong'; if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60); if (h < 24) return `${h} giờ trước`;
  return `${Math.round(h / 24)} ngày trước`;
};

// ---------- Nhãn tiếng Việt ----------
const L = {
  deviceType: { AIR_CONDITIONER: 'Máy lạnh', REFRIGERATOR: 'Tủ lạnh', FREEZER: 'Tủ đông' },
  status: { ONLINE: 'Online', OFFLINE: 'Offline', ERROR: 'Lỗi' },
  severity: { INFO: 'Thông tin', WARNING: 'Cảnh báo', CRITICAL: 'Nghiêm trọng' },
  ticketType: { REPAIR: 'Sửa chữa', MAINTENANCE: 'Bảo trì', WARRANTY: 'Bảo hành', INSTALLATION: 'Lắp đặt' },
  ticketStatus: { NEW: 'Mới', ASSIGNED: 'Đã gán', IN_PROGRESS: 'Đang xử lý', DONE: 'Hoàn thành', CANCELLED: 'Đã hủy' },
  priority: { LOW: 'Thấp', NORMAL: 'Thường', HIGH: 'Cao', URGENT: 'Khẩn cấp' },
  userStatus: { ACTIVE: 'Hoạt động', INACTIVE: 'Chưa kích hoạt', BLOCKED: 'Đã khóa' },
  notifType: { SYSTEM: 'Hệ thống', PROMOTION: 'Khuyến mãi', WEATHER: 'Thời tiết', DEVICE_ALERT: 'Cảnh báo thiết bị', MAINTENANCE: 'Bảo trì' },
  target: { ALL: 'Tất cả', ROLE: 'Theo vai trò', USER: 'Một người' },
  category: { AIR_CONDITIONER: 'Máy lạnh', REFRIGERATOR: 'Tủ lạnh', FREEZER: 'Tủ đông', MAINTENANCE: 'Bảo trì', SAFETY: 'An toàn', ENERGY_SAVING: 'Tiết kiệm điện', USAGE_GUIDE: 'Hướng dẫn sử dụng' },
  rollout: { PENDING: 'Đang chờ', SUCCESS: 'Thành công', FAILED: 'Thất bại' },
};
const tone = {
  ONLINE: 'ok', OFFLINE: 'dim', ERROR: 'bad', INFO: 'info', WARNING: 'warn', CRITICAL: 'bad',
  NEW: 'info', ASSIGNED: 'vio', IN_PROGRESS: 'warn', DONE: 'ok', CANCELLED: 'dim',
  LOW: 'dim', NORMAL: 'info', HIGH: 'warn', URGENT: 'bad', ACTIVE: 'ok', INACTIVE: 'dim', BLOCKED: 'bad',
  SUCCESS: 'ok', FAILED: 'bad', PENDING: 'warn',
};
const badge = (value, dict) => `<span class="badge b-${tone[value] || 'info'}">${esc(dict?.[value] ?? value)}</span>`;
const opts = (dict, selected, empty) => (empty !== undefined ? `<option value="">${esc(empty)}</option>` : '') +
  Object.entries(dict).map(([k, v]) => `<option value="${esc(k)}"${k === selected ? ' selected' : ''}>${esc(v)}</option>`).join('');

// ---------- Phiên đăng nhập ----------
const store = {
  get() { try { return JSON.parse(localStorage.getItem('sc_admin') || 'null'); } catch { return null; } },
  set(v) { try { v ? localStorage.setItem('sc_admin', JSON.stringify(v)) : localStorage.removeItem('sc_admin'); } catch { /* bỏ qua */ } },
};
// Web chính chuyển sang với #sso=<phiên> → lưu phiên, xóa khỏi thanh địa chỉ, vào thẳng Dashboard
(function takeSso() {
  const m = location.hash.match(/^#sso=([^&]+)/);
  if (!m) return;
  try {
    const s = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))));
    if (s && s.accessToken) store.set({ accessToken: s.accessToken, refreshToken: s.refreshToken });
  } catch { /* bỏ qua phiên lỗi */ }
  history.replaceState(null, '', location.pathname + location.search);
})();
let session = store.get();
let me = null;
let refreshing = null;

async function refreshToken() {
  if (!session?.refreshToken) throw new Error('no session');
  refreshing ??= fetch(`${API}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: session.refreshToken }) })
    .then((r) => r.json())
    .then((j) => {
      if (!j.success) throw new Error(j.message);
      session = { accessToken: j.data.accessToken, refreshToken: j.data.refreshToken };
      store.set(session);
    })
    .finally(() => { refreshing = null; });
  return refreshing;
}

// Gọi API: tự gắn Bearer token, hết hạn (401) thì làm mới token rồi gọi lại 1 lần
async function api(path, { method = 'GET', body, retry = true } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && retry && session?.refreshToken) {
    try { await refreshToken(); return api(path, { method, body, retry: false }); } catch { logout(); throw new Error('Phiên đăng nhập đã hết hạn.'); }
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message || `Lỗi ${res.status}`);
  return json.data;
}
const qs = (o) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(o)) if (v !== '' && v != null) p.set(k, v); const s = p.toString(); return s ? `?${s}` : ''; };

function toast(msg, isErr = false) {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast' + (isErr ? ' err' : ''); t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 3200);
}
const can = (p) => me?.permissions?.includes(p);

// ---------- Đăng nhập ----------
async function startLogin() {
  $('#app').hidden = true; $('#login').hidden = false;
  try {
    const cfg = await fetch(`${API}/auth/google/config`).then((r) => r.json());
    if (cfg.data?.enabled) initGoogle(cfg.data.clientId); else $('#googleHint').hidden = false;
  } catch { $('#googleHint').hidden = false; }
}

function initGoogle(clientId, tries = 0) {
  if (!window.google?.accounts?.id) { if (tries < 40) setTimeout(() => initGoogle(clientId, tries + 1), 150); return; }
  google.accounts.id.initialize({ client_id: clientId, callback: onGoogleCredential });
  google.accounts.id.renderButton($('#googleBtn'), { theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', locale: 'vi', width: 300 });
  $('#googleOr').hidden = false;
}

async function onGoogleCredential(resp) {
  try {
    const data = await api('/auth/google', { method: 'POST', body: { idToken: resp.credential }, retry: false });
    afterLogin(data);
  } catch (e) { $('#loginError').textContent = e.message; }
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  $('#loginError').textContent = '';
  try {
    const data = await api('/auth/login', { method: 'POST', body: { email: f.get('email'), password: f.get('password') }, retry: false });
    afterLogin(data);
  } catch (err) { $('#loginError').textContent = err.message; }
});

function afterLogin(data) {
  session = { accessToken: data.accessToken, refreshToken: data.refreshToken };
  store.set(session);
  boot();
}

async function logout() {
  try { if (session?.refreshToken) await fetch(`${API}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: session.refreshToken }) }); } catch { /* bỏ qua */ }
  session = null; me = null; store.set(null); startLogin();
}

// ---------- Menu & điều hướng ----------
const PAGES = [
  { group: 'Vận hành' },
  { id: 'dashboard', label: 'Tổng quan', icon: 'activity', perm: 'dashboard:read', sub: 'KPI, biểu đồ và cảnh báo khẩn cấp' },
  { id: 'devices', label: 'Thiết bị IoT', icon: 'thermo', perm: 'devices:read', sub: 'Tra cứu Serial/MAC, trạng thái, thông số vận hành' },
  { id: 'tickets', label: 'Phiếu dịch vụ', icon: 'ticket', perm: 'tickets:read', sub: 'Tiếp nhận, điều phối, lịch sử sửa chữa' },
  { id: 'maintenance', label: 'Bảo trì định kỳ', icon: 'cal', perm: 'tickets:read', sub: 'Chu kỳ bảo dưỡng và nhắc khách hàng' },
  { group: 'Danh mục' },
  { id: 'products', label: 'Sản phẩm & giá', icon: 'box', perm: 'dashboard:read', sub: 'Thông tin sản phẩm, giá bán, phí lắp đặt – web chính lấy dữ liệu từ đây' },
  { id: 'catalog', label: 'Bảng mã lỗi', icon: 'alert', perm: 'devices:read', sub: 'Mã lỗi theo hãng, nguyên nhân và cách khắc phục' },
  { id: 'firmware', label: 'Firmware / OTA', icon: 'chip', perm: 'devices:read', sub: 'Phát hành và đẩy cập nhật phần mềm' },
  { group: 'Con người' },
  { id: 'users', label: 'Người dùng & phân quyền', icon: 'users', perm: 'users:read', sub: 'Khách hàng, nhân viên, vai trò RBAC' },
  { id: 'technicians', label: 'Kỹ thuật viên', icon: 'wrench', perm: 'tickets:read', sub: 'Khu vực phụ trách và tình trạng nhận việc' },
  { group: 'Nội dung & hệ thống' },
  { id: 'notifications', label: 'Thông báo đẩy', icon: 'bell', perm: 'notifications:write', sub: 'Gửi thông báo theo đối tượng' },
  { id: 'content', label: 'Tài liệu / FAQ', icon: 'book', perm: 'content:write', sub: 'Hướng dẫn, mẹo tiết kiệm điện, câu hỏi thường gặp' },
  { id: 'settings', label: 'Cấu hình', icon: 'gear', perm: 'dashboard:read', sub: 'Ngưỡng cảnh báo, quy tắc tự động, thời hạn bảo hành' },
  { id: 'audit', label: 'Nhật ký hệ thống', icon: 'logs', perm: 'audit:read', sub: 'Ai đã thay đổi gì, khi nào' },
];
let current = 'dashboard';
const charts = [];

function renderNav() {
  const visible = PAGES.filter((p, i) => {
    if (!p.group) return can(p.perm);
    const next = PAGES.slice(i + 1); const end = next.findIndex((x) => x.group);
    return (end === -1 ? next : next.slice(0, end)).some((x) => can(x.perm));
  });
  $('#nav').innerHTML = visible.map((p) => (p.group ? `<div class="group">${esc(p.group)}</div>` :
    `<button data-page="${p.id}" class="${p.id === current ? 'active' : ''}">${icon(p.icon)}<span>${esc(p.label)}</span></button>`)).join('');
  $('#nav').onclick = (e) => { const b = e.target.closest('button[data-page]'); if (b) go(b.dataset.page); };
  const name = me.profile?.fullName || me.email;
  $('#me').innerHTML = `<div class="who"><span class="avatar">${me.profile?.avatarUrl ? `<img src="${esc(me.profile.avatarUrl)}" alt="">` : esc(name[0]?.toUpperCase())}</span>
    <div><b>${esc(name)}</b><div class="small muted">${esc(me.roleLabel)}${me.authProvider === 'GOOGLE' ? ' · Google' : ''}</div></div></div>
    <button class="btn sm" id="logoutBtn">${icon('logout')}Đăng xuất</button>`;
  $('#logoutBtn').onclick = logout;
}

function go(page) {
  const p = PAGES.find((x) => x.id === page && can(x.perm)) || PAGES.find((x) => x.id && can(x.perm));
  if (!p) return;
  current = p.id;
  location.hash = p.id;
  $('#pageTitle').textContent = p.label;
  $('#pageSub').textContent = p.sub;
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('active', b.dataset.page === p.id));
  $('#side').classList.remove('open');
  charts.splice(0).forEach((c) => c.destroy());
  $('#view').innerHTML = '<div class="glass card empty">Đang tải…</div>';
  VIEWS[p.id]().catch((e) => { $('#view').innerHTML = `<div class="glass card empty">${esc(e.message)}</div>`; });
}

async function boot() {
  if (!session) return startLogin();
  try { me = await api('/admin/me'); } catch { return logout(); }
  if (!me.permissions.length) {
    $('#login').hidden = false; $('#app').hidden = true;
    $('#loginError').textContent = `Đăng nhập thành công với ${me.email}, nhưng tài khoản khách hàng không có quyền vào trang quản trị.`;
    session = null; store.set(null);
    return;
  }
  $('#login').hidden = true; $('#app').hidden = false;
  renderNav();
  go(location.hash.slice(1) || 'dashboard');
}

$('#menuBtn').onclick = () => $('#side').classList.toggle('open');
$('#reloadBtn').onclick = () => go(current);
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (me && h && h !== current) go(h); });

// ---------- Drawer / modal ----------
function openDrawer(html) { $('#drawerBody').innerHTML = html; $('#drawer').hidden = false; $('#drawerBg').hidden = false; }
function closeDrawer() { $('#drawer').hidden = true; $('#drawerBg').hidden = true; }
$('#drawerClose').onclick = closeDrawer; $('#drawerBg').onclick = closeDrawer;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

/**
 * Hộp thoại form chung. fields: [{ name, label, type, options, value, full, required, placeholder }]
 * Trả về object giá trị hoặc null nếu hủy.
 */
function formModal(title, fields, { submit = 'Lưu', note = '' } = {}) {
  return new Promise((resolve) => {
    const m = $('#modal'); const f = $('#modalForm');
    const field = (x) => {
      const v = x.value ?? '';
      const common = `name="${x.name}" ${x.required ? 'required' : ''} placeholder="${esc(x.placeholder || '')}"`;
      let input;
      if (x.type === 'select') input = `<select ${common}>${x.empty !== undefined ? `<option value="">${esc(x.empty)}</option>` : ''}${x.options.map(([k, lbl]) => `<option value="${esc(k)}"${String(k) === String(v) ? ' selected' : ''}>${esc(lbl)}</option>`).join('')}</select>`;
      else if (x.type === 'textarea') input = `<textarea ${common}>${esc(v)}</textarea>`;
      else if (x.type === 'checkbox') return `<label class="check ${x.full ? 'full' : ''}"><input type="checkbox" name="${x.name}" ${v ? 'checked' : ''}>${esc(x.label)}</label>`;
      else input = `<input type="${x.type || 'text'}" ${common} value="${esc(v)}" ${x.step ? `step="${x.step}"` : ''}>`;
      return `<label class="${x.full ? 'full' : ''}">${esc(x.label)}${input}</label>`;
    };
    f.innerHTML = `<h3>${esc(title)}</h3>${note ? `<p class="muted small">${note}</p>` : ''}<div class="form-grid">${fields.map(field).join('')}</div>
      <p class="error" id="modalErr"></p><div class="row"><button class="btn" value="cancel" formnovalidate>Hủy</button><button class="btn primary" value="ok">${esc(submit)}</button></div>`;
    const done = (val) => { m.close(); f.onsubmit = null; m.onclose = null; resolve(val); };
    f.onsubmit = (e) => {
      if (e.submitter?.value !== 'ok') return done(null);
      e.preventDefault();
      const out = {};
      for (const x of fields) {
        const el = f.elements[x.name];
        if (x.type === 'checkbox') out[x.name] = el.checked;
        else if (x.type === 'number') out[x.name] = el.value === '' ? undefined : Number(el.value);
        else if (x.type === 'list') out[x.name] = el.value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
        else out[x.name] = el.value === '' ? (x.nullable ? null : undefined) : el.value;
      }
      done(out);
    };
    m.onclose = () => resolve(null);
    m.showModal();
  });
}
async function confirmBox(text) { return (await formModal('Xác nhận', [], { submit: 'Đồng ý', note: esc(text) })) !== null; }

// Bảng có phân trang dùng chung
function tableHTML(cols, rows, { onRow, empty = 'Không có dữ liệu' } = {}) {
  if (!rows.length) return `<div class="empty">${esc(empty)}</div>`;
  return `<div class="table-wrap"><table><thead><tr>${cols.map((c) => `<th class="${c.num ? 'num' : ''}">${esc(c.label)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r, i) => `<tr data-i="${i}" class="${onRow ? 'click' : ''}">${cols.map((c) => `<td class="${c.num ? 'num' : ''}">${c.render(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function bindRows(container, rows, onRow) {
  container.querySelectorAll('tbody tr').forEach((tr) => tr.addEventListener('click', (e) => { if (!e.target.closest('button,select,a,input')) onRow(rows[tr.dataset.i]); }));
}
function pagerHTML(p) { return p ? `<div class="pager">Trang ${p.page}/${p.totalPages} · ${p.total} mục <button class="btn sm" data-pg="${p.page - 1}" ${p.page <= 1 ? 'disabled' : ''}>‹</button><button class="btn sm" data-pg="${p.page + 1}" ${p.page >= p.totalPages ? 'disabled' : ''}>›</button></div>` : ''; }
const run = async (fn, okMsg) => { try { const r = await fn(); if (okMsg) toast(okMsg); return r; } catch (e) { toast(e.message, true); return undefined; } };

// ---------- Biểu đồ ----------
const C = { ice: '#22D3EE', blue: '#3B82F6', violet: '#8B5CF6', ok: '#34D399', warn: '#FBBF24', bad: '#F87171', muted: '#8DA2C4', line: 'rgba(255,255,255,.08)' };
const PALETTE = [C.ice, C.violet, C.blue, C.ok, C.warn, C.bad, '#F472B6', '#A3E635'];
if (window.Chart) {
  Chart.defaults.color = C.muted; Chart.defaults.font.family = '"Be Vietnam Pro", system-ui, sans-serif'; Chart.defaults.borderColor = C.line;
  Chart.defaults.plugins.legend.labels.boxWidth = 10; Chart.defaults.plugins.legend.labels.boxHeight = 10;
}
function chart(canvas, config) { if (!window.Chart) { canvas.parentElement.innerHTML = '<div class="empty">Không tải được thư viện biểu đồ</div>'; return; } charts.push(new Chart(canvas, { ...config, options: { responsive: true, maintainAspectRatio: false, ...config.options } })); }

// ==========================================
// CÁC TRANG
// ==========================================
const VIEWS = {};

// ===== 1. TỔNG QUAN =====
VIEWS.dashboard = async () => {
  const [data, demo] = await Promise.all([api('/admin/dashboard'), api('/admin/demo-data').catch(() => ({ total: 0 }))]);
  const k = data.kpi;
  const kpi = (label, value, sub, ic, color) => `<div class="glass kpi" style="--c:${color}"><span class="label">${icon(ic)}${label}</span><span class="value">${value}</span><span class="sub">${sub}</span></div>`;
  const b = data.business;
  const vnd = (v) => (v >= 1e6 ? (Math.round(v / 1e5) / 10).toLocaleString('vi-VN') + ' tr' : money(v));
  $('#view').innerHTML = `
    <div class="sec-title">${icon('users')}Kinh doanh & người dùng <span class="badge b-ok">dữ liệu thật</span></div>
    <div class="kpis">
      ${kpi('Khách hàng đăng ký', b.accounts, `+${b.newUsers7d} trong 7 ngày`, 'users', C.ice)}
      ${kpi('Đăng nhập hôm nay', b.loginsToday, 'tài khoản đã đăng nhập', 'user', C.ok)}
      ${kpi('Sản phẩm đang bán', b.activeProducts, `${b.hiddenProducts} sản phẩm đang ẩn`, 'box', C.violet)}
      ${kpi('Giá bán trung bình', vnd(b.avgPrice), `${vnd(b.minPrice)} – ${vnd(b.maxPrice)}`, 'wallet', C.warn)}
      ${kpi('Dự toán · So sánh', `${b.estimates} · ${b.comparisons}`, `${b.diagnoses} chẩn đoán · ${b.conversations} hội thoại AI`, 'activity', C.blue)}
    </div>
    <div class="charts">
      <div class="glass card span-8"><h3>${icon('users')}Đăng ký mới & đăng nhập 14 ngày</h3><div class="chart-box"><canvas id="cUsers"></canvas></div></div>
      <div class="glass card span-4"><div class="card-head"><h3>${icon('user')}Khách hàng mới nhất</h3><span class="spacer"></span><button class="btn sm" id="seeUsers">Xem tất cả</button></div>
        <div class="mini-list">${b.recentUsers.length ? b.recentUsers.map((u) => `<div class="mini-row"><div><b>${esc(u.profile?.fullName || u.email)}</b><div class="small muted">${esc(u.email)}${u.authProvider === 'GOOGLE' ? ' · Google' : ''}</div></div><span class="small dim">${ago(u.createdAt)}</span></div>`).join('') : '<div class="empty">Chưa có khách hàng</div>'}</div></div>
      <div class="glass card span-12"><div class="card-head"><h3>${icon('wallet')}Giá bán theo loại sản phẩm</h3><span class="spacer"></span><button class="btn sm" id="seeProducts">Quản lý sản phẩm</button></div>
        ${tableHTML([
          { label: 'Loại', render: (r) => `<b>${esc(L.deviceType[r.deviceType])}</b>` },
          { label: 'Số sản phẩm', num: true, render: (r) => r.count },
          { label: 'Rẻ nhất', num: true, render: (r) => money(r.min) },
          { label: 'Trung bình', num: true, render: (r) => `<b>${money(r.avg)}</b>` },
          { label: 'Đắt nhất', num: true, render: (r) => money(r.max) },
        ], b.priceByType, { empty: 'Chưa có sản phẩm nào đang bán' })}</div>
    </div>
    <div class="sec-title">${icon('thermo')}Thiết bị IoT & dịch vụ ${demo.total ? `<span class="badge b-warn">có ${demo.devices} thiết bị mẫu</span> <button class="btn sm" id="goDemo">Xóa dữ liệu mẫu</button>` : '<span class="badge b-ok">dữ liệu thật</span>'}</div>
    <div class="kpis">
      ${kpi('Thiết bị đang hoạt động', k.online, `/${k.totalDevices} thiết bị`, 'zap', C.ok)}
      ${kpi('Ngoại tuyến (offline)', k.offline, 'không gửi dữ liệu', 'info', C.muted)}
      ${kpi('Đang báo lỗi', k.error, `${k.alertsToday} cảnh báo hôm nay`, 'alert', C.bad)}
      ${kpi('Phiếu đang mở', k.openTickets, `${k.urgentTickets} khẩn cấp`, 'ticket', C.warn)}
      ${kpi('Kỹ thuật viên sẵn sàng', `${k.availableTechs}/${k.technicians}`, `${k.customers} khách hàng`, 'wrench', C.violet)}
    </div>
    <div class="charts">
      <div class="glass card span-8"><h3>${icon('alert')}Xu hướng báo lỗi 14 ngày</h3><div class="chart-box"><canvas id="cErr"></canvas></div></div>
      <div class="glass card span-4"><h3>${icon('box')}Theo dòng máy</h3><div class="chart-box"><canvas id="cType"></canvas></div></div>
      <div class="glass card span-6"><h3>${icon('zap')}Điện năng tiêu thụ (kWh/ngày)</h3><div class="chart-box"><canvas id="cEnergy"></canvas></div></div>
      <div class="glass card span-6"><h3>${icon('wrench')}Tần suất dịch vụ 6 tháng</h3><div class="chart-box"><canvas id="cTickets"></canvas></div></div>
      <div class="glass card span-5" style="align-self:start"><h3>${icon('home')}Phân bổ theo khu vực</h3><div class="chart-box"><canvas id="cRegion"></canvas></div></div>
      <div class="glass card span-7"><div class="card-head"><h3>${icon('shield')}Cảnh báo khẩn cấp</h3><span class="spacer"></span><span class="muted small">${data.urgentAlerts.length} thiết bị</span></div>
        <div class="alerts" id="alerts">${data.urgentAlerts.length ? data.urgentAlerts.map((a, i) => `
          <div class="alert-row ${a.severity === 'CRITICAL' ? '' : 'warn'}">
            <span class="ic">${icon('alert')}</span>
            <div><b>${esc(a.errorCode)} · ${esc(a.title)}</b><div class="small muted">${esc(a.serial)} · ${esc(a.product)} · ${esc(a.region)} · ${ago(a.lastSeenAt)}</div>
              <div class="small dim">${a.openTicket ? `Phiếu ${esc(a.openTicket.code)} – ${esc(L.ticketStatus[a.openTicket.status])}` : 'Chưa có phiếu xử lý'}</div></div>
            <div class="pill-row">${badge(a.severity, L.severity)}<button class="btn sm" data-dev="${i}">Xem</button></div>
          </div>`).join('') : '<div class="empty">Không có thiết bị nào đang lỗi 🎉</div>'}</div></div>
    </div>`;
  $('#seeUsers').onclick = () => go('users');
  if ($('#goDemo')) $('#goDemo').onclick = () => go('settings');
  $('#seeProducts').onclick = () => go('products');
  $('#alerts').onclick = (e) => { const b = e.target.closest('[data-dev]'); if (b) showDevice(data.urgentAlerts[b.dataset.dev].deviceId); };
  const c = data.charts;
  chart($('#cUsers'), { type: 'bar', data: { labels: b.usersByDay.map((x) => x.day.slice(5)), datasets: [
    { label: 'Đăng ký mới', data: b.usersByDay.map((x) => x.signups), backgroundColor: C.ice, borderRadius: 6 },
    { label: 'Đăng nhập (lần cuối)', data: b.usersByDay.map((x) => x.logins), backgroundColor: C.violet, borderRadius: 6 },
  ] }, options: { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
  chart($('#cErr'), { type: 'line', data: { labels: c.errorsByDay.map((x) => x.day.slice(5)), datasets: [{ label: 'Số lần báo lỗi', data: c.errorsByDay.map((x) => x.total), borderColor: C.bad, backgroundColor: 'rgba(248,113,113,.15)', fill: true, tension: .35 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
  chart($('#cType'), { type: 'doughnut', data: { labels: Object.keys(c.byType).map((t) => L.deviceType[t]), datasets: [{ data: Object.values(c.byType), backgroundColor: PALETTE, borderWidth: 0 }] }, options: { cutout: '65%', plugins: { legend: { position: 'bottom' } } } });
  chart($('#cEnergy'), { type: 'bar', data: { labels: c.energyByDay.map((x) => x.day.slice(5)), datasets: [{ label: 'kWh', data: c.energyByDay.map((x) => x.totalKwh), backgroundColor: C.ice, borderRadius: 6 }] }, options: { plugins: { legend: { display: false } } } });
  chart($('#cTickets'), { type: 'bar', data: { labels: c.ticketsByMonth.map((x) => x.month), datasets: Object.keys(L.ticketType).map((t, i) => ({ label: L.ticketType[t], data: c.ticketsByMonth.map((x) => x[t]), backgroundColor: PALETTE[i], borderRadius: 4 })) }, options: { scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } } } });
  chart($('#cRegion'), { type: 'bar', data: { labels: Object.keys(c.byRegion), datasets: [{ label: 'Thiết bị', data: Object.values(c.byRegion), backgroundColor: C.violet, borderRadius: 6 }] }, options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } } });
};

// ===== 2. THIẾT BỊ =====
const deviceFilter = { q: '', status: '', region: '', deviceType: '', page: 1 };
VIEWS.devices = async () => {
  $('#view').innerHTML = `<div class="glass card">
    <div class="card-head"><div class="toolbar">
      <input type="search" id="dq" placeholder="Tìm Serial / MAC / tên / email chủ…" value="${esc(deviceFilter.q)}">
      <select id="ds">${opts(L.status, deviceFilter.status, 'Mọi trạng thái')}</select>
      <select id="dt">${opts(L.deviceType, deviceFilter.deviceType, 'Mọi loại máy')}</select>
      <select id="dr"><option value="">Mọi khu vực</option>${['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Bình Dương'].map((r) => `<option${r === deviceFilter.region ? ' selected' : ''}>${r}</option>`).join('')}</select>
    </div><span class="spacer"></span>${can('devices:write') ? `<button class="btn primary" id="addDev">${icon('plus')}Thêm thiết bị</button>` : ''}</div>
    <div id="devTable"></div></div>`;
  const load = async () => {
    const res = await api('/admin/devices' + qs({ ...deviceFilter, limit: 15 }));
    const cols = [
      { label: 'Serial / MAC', render: (r) => `<b class="mono">${esc(r.serial)}</b><div class="small dim mono">${esc(r.macAddress || '')}</div>` },
      { label: 'Thiết bị', render: (r) => `${esc(r.name || '')}<div class="small muted">${esc(r.product.brand.name)} · ${esc(r.product.model)}</div>` },
      { label: 'Chủ máy', render: (r) => esc(r.owner?.profile?.fullName || r.owner?.email || '—') },
      { label: 'Khu vực', render: (r) => esc(r.region) },
      { label: 'Trạng thái', render: (r) => badge(r.status, L.status) + (r.lastErrorCode ? ` <span class="mono small">${esc(r.lastErrorCode)}</span>` : '') },
      { label: 'Nhiệt độ', num: true, render: (r) => (r.currentTemp != null ? `${r.currentTemp}°C` : '—') + (r.targetTemp != null ? `<div class="small dim">đặt ${r.targetTemp}°C</div>` : '') },
      { label: 'Firmware', render: (r) => `<span class="mono">${esc(r.firmwareVersion)}</span>` },
      { label: 'Lần cuối', render: (r) => ago(r.lastSeenAt) },
    ];
    const box = $('#devTable');
    box.innerHTML = tableHTML(cols, res.items, { onRow: true }) + pagerHTML(res.pagination);
    bindRows(box, res.items, (r) => showDevice(r.id));
    box.querySelectorAll('[data-pg]').forEach((b) => (b.onclick = () => { deviceFilter.page = Number(b.dataset.pg); load(); }));
  };
  let t;
  $('#dq').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { deviceFilter.q = e.target.value; deviceFilter.page = 1; load(); }, 300); };
  for (const [id, key] of [['#ds', 'status'], ['#dt', 'deviceType'], ['#dr', 'region']]) $(id).onchange = (e) => { deviceFilter[key] = e.target.value; deviceFilter.page = 1; load(); };
  if ($('#addDev')) $('#addDev').onclick = addDevice;
  await load();
};

async function productOptions() {
  const res = await api('/products?limit=100&sort=name');
  return res.items.map((p) => [p.id, `${p.name} (${p.model})`]);
}
async function customerOptions() {
  const res = await api('/admin/users?role=USER&limit=100');
  return res.items.map((u) => [u.id, `${u.profile?.fullName || ''} – ${u.email}`]);
}

async function addDevice() {
  const [products, customers] = await Promise.all([productOptions(), customerOptions().catch(() => [])]);
  const v = await formModal('Thêm thiết bị', [
    { name: 'serial', label: 'Serial', required: true, placeholder: 'SCD-AC-2001' },
    { name: 'macAddress', label: 'MAC', placeholder: 'AC:1F:00:00:00:01' },
    { name: 'productId', label: 'Model', type: 'select', options: products, full: true, required: true },
    { name: 'ownerId', label: 'Chủ máy (khách hàng)', type: 'select', options: customers, empty: '— Chưa kích hoạt —', full: true },
    { name: 'name', label: 'Tên hiển thị', placeholder: 'Máy lạnh phòng khách' },
    { name: 'region', label: 'Khu vực', type: 'select', options: ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Bình Dương'].map((r) => [r, r]) },
    { name: 'installedAt', label: 'Ngày lắp đặt', type: 'date' },
    { name: 'firmwareVersion', label: 'Firmware', value: '1.0.0' },
  ], { note: 'Hạn bảo hành tự tính theo cấu hình hệ thống nếu nhập ngày lắp đặt.' });
  if (!v) return;
  if (await run(() => api('/admin/devices', { method: 'POST', body: v }), 'Đã thêm thiết bị')) go('devices');
}

async function showDevice(id) {
  const dv = await run(() => api(`/admin/devices/${id}`));
  if (!dv) return;
  const w = dv.warrantyUntil ? new Date(dv.warrantyUntil) : null;
  openDrawer(`
    <h3>${esc(dv.name || dv.serial)}</h3>
    <div class="pill-row">${badge(dv.status, L.status)} <span class="badge b-info">${esc(L.deviceType[dv.product.deviceType])}</span> ${w ? `<span class="badge b-${w > new Date() ? 'ok' : 'dim'}">${w > new Date() ? 'Còn bảo hành' : 'Hết bảo hành'} · ${d(w)}</span>` : ''}</div>
    ${dv.errorInfo ? `<section><div class="alert-row ${dv.errorInfo.severity === 'CRITICAL' ? '' : 'warn'}"><span class="ic">${icon('alert')}</span><div><b>${esc(dv.lastErrorCode)} · ${esc(dv.errorInfo.title)}</b><div class="small muted">${esc(dv.errorInfo.solution)}</div></div>${badge(dv.errorInfo.severity, L.severity)}</div></section>` : ''}
    <section><h4>Thông tin</h4><dl class="kv">
      <dt>Serial</dt><dd class="mono">${esc(dv.serial)}</dd><dt>MAC</dt><dd class="mono">${esc(dv.macAddress || '—')}</dd>
      <dt>Model</dt><dd>${esc(dv.product.brand.name)} ${esc(dv.product.name)} (${esc(dv.product.model)})</dd>
      <dt>Chủ máy</dt><dd>${esc(dv.owner ? `${dv.owner.profile?.fullName || ''} · ${dv.owner.email} · ${dv.owner.profile?.phone || ''}` : 'Chưa kích hoạt')}</dd>
      <dt>Địa chỉ</dt><dd>${esc(dv.address || '—')} (${esc(dv.region)})</dd>
      <dt>Firmware</dt><dd class="mono">${esc(dv.firmwareVersion)}</dd>
      <dt>Nguồn / chế độ</dt><dd>${dv.powerOn ? 'Đang bật' : 'Đang tắt'} · ${esc(dv.mode || '—')} · đặt ${dv.targetTemp ?? '—'}°C · hiện ${dv.currentTemp ?? '—'}°C</dd>
      <dt>Lắp đặt</dt><dd>${d(dv.installedAt)} · bảo trì cuối ${d(dv.lastServiceAt)}</dd>
      <dt>Lần cuối online</dt><dd>${dt(dv.lastSeenAt)}</dd></dl></section>
    ${can('devices:write') ? `<section><h4>Thao tác</h4><div class="pill-row">
      <button class="btn sm" data-sim="normal">${icon('activity')}Gửi dữ liệu bình thường</button>
      <button class="btn sm" data-sim="gas">${icon('alert')}Giả lập rò gas</button>
      <button class="btn sm" data-sim="overheat">${icon('thermo')}Giả lập quá nhiệt</button>
      <button class="btn sm" id="devPower">${icon('zap')}${dv.powerOn ? 'Tắt máy' : 'Bật máy'}</button>
      <button class="btn sm danger" id="devDel">${icon('trash')}Xóa</button></div></section>` : ''}
    <section><h4>Lịch sử thông số vận hành</h4><div class="chart-box"><canvas id="cTele"></canvas></div></section>
    <section><h4>Lịch sử sửa chữa & linh kiện</h4>${tableHTML([
      { label: 'Phiếu', render: (t) => `<b class="mono">${esc(t.code)}</b><div class="small dim">${d(t.createdAt)}</div>` },
      { label: 'Nội dung', render: (t) => `${esc(t.title)}<div class="small muted">${(t.partsUsed || []).map((p) => esc(p.name)).join(', ')}</div>` },
      { label: 'Trạng thái', render: (t) => badge(t.status, L.ticketStatus) },
      { label: 'Chi phí', num: true, render: (t) => money(t.totalCost) },
    ], dv.tickets, { empty: 'Chưa có lần sửa chữa nào' })}</section>
    <section><h4>Sự kiện bật/tắt, lỗi, firmware</h4><div class="list">${dv.events.slice(0, 15).map((e) => `<div class="item"><span class="mono small dim">${dt(e.createdAt)}</span><b>${esc(e.type)}</b><span class="small muted">${esc(e.detail ? JSON.stringify(e.detail) : '')}</span></div>`).join('') || '<div class="empty">Chưa có</div>'}</div></section>
    <section><h4>Cập nhật OTA</h4><div class="list">${dv.rollouts.map((r) => `<div class="item">${badge(r.status, L.rollout)}<span class="mono">${esc(r.firmware.version)}</span><span class="small muted">${esc(r.message || '')} · ${dt(r.startedAt)}</span></div>`).join('') || '<div class="empty">Chưa có</div>'}</div></section>`);
  const t = dv.telemetry;
  chart($('#cTele'), { type: 'line', data: { labels: t.map((x) => new Date(x.recordedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit' })), datasets: [
    { label: 'Nhiệt độ (°C)', data: t.map((x) => x.temperature), borderColor: C.ice, tension: .3, pointRadius: 0, yAxisID: 'y' },
    { label: 'Công suất (kW)', data: t.map((x) => x.powerKw), borderColor: C.violet, tension: .3, pointRadius: 0, yAxisID: 'y1' },
  ] }, options: { interaction: { mode: 'index', intersect: false }, scales: { y: { position: 'left' }, y1: { position: 'right', grid: { display: false } }, x: { ticks: { maxTicksLimit: 7 } } } } });
  document.querySelectorAll('[data-sim]').forEach((b) => (b.onclick = async () => {
    const r = await run(() => api(`/admin/devices/${id}/simulate`, { method: 'POST', body: { scenario: b.dataset.sim } }));
    if (r) { toast(r.errorCode ? `Thiết bị báo lỗi ${r.errorCode}${r.ticket ? ` – đã tạo phiếu ${r.ticket.code}` : ''}` : 'Đã ghi nhận dữ liệu bình thường'); showDevice(id); }
  }));
  if ($('#devPower')) $('#devPower').onclick = async () => { if (await run(() => api(`/admin/devices/${id}`, { method: 'PATCH', body: { powerOn: !dv.powerOn } }), 'Đã gửi lệnh')) showDevice(id); };
  if ($('#devDel')) $('#devDel').onclick = async () => { if (await confirmBox(`Xóa thiết bị ${dv.serial}? Toàn bộ lịch sử vận hành sẽ bị xóa.`) && await run(() => api(`/admin/devices/${id}`, { method: 'DELETE' }), 'Đã xóa')) { closeDrawer(); go('devices'); } };
}

// ===== 3. PHIẾU DỊCH VỤ =====
const ticketFilter = { q: '', status: '', priority: '', type: '', page: 1 };
let techCache = null;
async function techOptions() { techCache ??= await api('/admin/technicians'); return techCache; }

VIEWS.tickets = async () => {
  $('#view').innerHTML = `<div class="glass card">
    <div class="card-head"><div class="toolbar">
      <input type="search" id="tq" placeholder="Mã phiếu / tiêu đề / email / serial…" value="${esc(ticketFilter.q)}">
      <select id="tst">${opts(L.ticketStatus, ticketFilter.status, 'Mọi trạng thái')}</select>
      <select id="tpr">${opts(L.priority, ticketFilter.priority, 'Mọi mức ưu tiên')}</select>
      <select id="tty">${opts(L.ticketType, ticketFilter.type, 'Mọi loại')}</select>
    </div><span class="spacer"></span>${can('tickets:write') ? `<button class="btn primary" id="addTk">${icon('plus')}Tạo phiếu</button>` : ''}</div>
    ${!can('tickets:write') ? '<p class="muted small" style="margin-bottom:10px">Bạn là kỹ thuật viên: chỉ thấy các phiếu được giao cho mình.</p>' : ''}
    <div id="tkTable"></div></div>`;
  const load = async () => {
    const res = await api('/admin/tickets' + qs({ ...ticketFilter, limit: 15 }));
    const cols = [
      { label: 'Mã', render: (r) => `<b class="mono">${esc(r.code)}</b><div class="small dim">${d(r.createdAt)}</div>` },
      { label: 'Nội dung', render: (r) => `${esc(r.title)}<div class="small muted">${esc(L.ticketType[r.type])}${r.device ? ` · ${esc(r.device.serial)}` : ''}${r.errorCode ? ` · <span class="mono">${esc(r.errorCode)}</span>` : ''}</div>` },
      { label: 'Khách hàng', render: (r) => `${esc(r.customer.profile?.fullName || r.customer.email)}<div class="small dim">${esc(r.region || '')}</div>` },
      { label: 'Kỹ thuật viên', render: (r) => esc(r.technician?.profile?.fullName || '—') },
      { label: 'Ưu tiên', render: (r) => badge(r.priority, L.priority) },
      { label: 'Trạng thái', render: (r) => badge(r.status, L.ticketStatus) },
      { label: 'Chi phí', num: true, render: (r) => money(r.totalCost) },
    ];
    const box = $('#tkTable');
    box.innerHTML = tableHTML(cols, res.items, { onRow: true }) + pagerHTML(res.pagination);
    bindRows(box, res.items, (r) => showTicket(r.id));
    box.querySelectorAll('[data-pg]').forEach((b) => (b.onclick = () => { ticketFilter.page = Number(b.dataset.pg); load(); }));
  };
  let t;
  $('#tq').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { ticketFilter.q = e.target.value; ticketFilter.page = 1; load(); }, 300); };
  for (const [id, key] of [['#tst', 'status'], ['#tpr', 'priority'], ['#tty', 'type']]) $(id).onchange = (e) => { ticketFilter[key] = e.target.value; ticketFilter.page = 1; load(); };
  if ($('#addTk')) $('#addTk').onclick = addTicket;
  await load();
};

async function addTicket() {
  const customers = await customerOptions();
  const v = await formModal('Tạo phiếu dịch vụ', [
    { name: 'customerId', label: 'Khách hàng', type: 'select', options: customers, full: true, required: true },
    { name: 'type', label: 'Loại', type: 'select', options: Object.entries(L.ticketType) },
    { name: 'priority', label: 'Ưu tiên', type: 'select', options: Object.entries(L.priority), value: 'NORMAL' },
    { name: 'title', label: 'Tiêu đề', full: true, required: true, placeholder: 'Máy lạnh không mát' },
    { name: 'description', label: 'Mô tả', type: 'textarea', full: true },
    { name: 'errorCode', label: 'Mã lỗi' },
    { name: 'scheduledAt', label: 'Hẹn ngày', type: 'datetime-local' },
    { name: 'address', label: 'Địa chỉ', full: true },
  ]);
  if (!v) return;
  if (await run(() => api('/admin/tickets', { method: 'POST', body: v }), 'Đã tạo phiếu')) go('tickets');
}

async function showTicket(id) {
  const t = await run(() => api(`/admin/tickets/${id}`));
  if (!t) return;
  const techs = can('tickets:write') ? await techOptions() : [];
  const parts = t.partsUsed || [];
  openDrawer(`
    <h3>${esc(t.code)} · ${esc(t.title)}</h3>
    <div class="pill-row">${badge(t.status, L.ticketStatus)} ${badge(t.priority, L.priority)} <span class="badge b-info">${esc(L.ticketType[t.type])}</span></div>
    <section><h4>Thông tin</h4><dl class="kv">
      <dt>Khách hàng</dt><dd>${esc(t.customer.profile?.fullName || '')} · ${esc(t.customer.email)} · ${esc(t.customer.profile?.phone || '')}</dd>
      <dt>Thiết bị</dt><dd>${t.device ? `${esc(t.device.serial)} · ${esc(t.device.product.name)} · BH đến ${d(t.device.warrantyUntil)}` : '—'}</dd>
      <dt>Mã lỗi</dt><dd class="mono">${esc(t.errorCode || '—')}</dd>
      <dt>Mô tả</dt><dd>${esc(t.description || '—')}</dd>
      <dt>Địa chỉ</dt><dd>${esc(t.address || '')} ${esc(t.region || '')}</dd>
      <dt>Hẹn / bắt đầu / xong</dt><dd>${dt(t.scheduledAt)} · ${dt(t.startedAt)} · ${dt(t.completedAt)}</dd>
      ${t.rating ? `<dt>Đánh giá</dt><dd>${'★'.repeat(t.rating)}</dd>` : ''}</dl></section>
    <section><h4>Điều phối & xử lý</h4><form id="tkForm" class="form-grid">
      ${can('tickets:write') ? `<label>Kỹ thuật viên<select name="technicianId"><option value="">— Chưa gán —</option>${techs.map((x) => `<option value="${x.id}"${x.id === t.technicianId ? ' selected' : ''}>${esc(x.profile?.fullName)} · ${esc(x.profile?.region || '')} · ${x.openTickets} việc${x.profile?.isAvailable ? '' : ' (bận)'}</option>`).join('')}</select></label>
      <label>Ưu tiên<select name="priority">${opts(L.priority, t.priority)}</select></label>` : ''}
      <label>Trạng thái<select name="status">${opts(L.ticketStatus, t.status)}</select></label>
      <label>Tiền công (đ)<input name="laborCost" type="number" min="0" step="10000" value="${t.laborCost}"></label>
      <label class="full">Linh kiện đã thay (mỗi dòng: tên; số lượng; đơn giá)<textarea name="parts" placeholder="Tụ quạt; 1; 180000">${parts.map((p) => `${p.name}; ${p.quantity}; ${p.price}`).join('\n')}</textarea></label>
      <label class="full">Kết quả xử lý<textarea name="resolution">${esc(t.resolution || '')}</textarea></label>
      <div class="full pill-row"><span class="muted">Linh kiện ${money(t.partsCost)} + công ${money(t.laborCost)} = <b>${money(t.totalCost)}</b></span><span style="flex:1"></span>
        ${can('tickets:write') ? `<button type="button" class="btn sm danger" id="tkDel">${icon('trash')}Xóa</button>` : ''}<button class="btn primary">${icon('check')}Lưu</button></div>
    </form></section>`);
  $('#tkForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const body = {
      status: f.get('status'), laborCost: Number(f.get('laborCost') || 0), resolution: f.get('resolution') || null,
      partsUsed: String(f.get('parts') || '').split('\n').map((l) => l.split(';').map((s) => s.trim())).filter((p) => p[0]).map(([name, q, price]) => ({ name, quantity: Number(q) || 1, price: Number(price) || 0 })),
    };
    if (can('tickets:write')) { body.technicianId = f.get('technicianId') || null; body.priority = f.get('priority'); }
    if (await run(() => api(`/admin/tickets/${id}`, { method: 'PATCH', body }), 'Đã cập nhật phiếu')) { techCache = null; showTicket(id); if (current === 'tickets') VIEWS.tickets(); }
  };
  if ($('#tkDel')) $('#tkDel').onclick = async () => { if (await confirmBox(`Xóa phiếu ${t.code}?`) && await run(() => api(`/admin/tickets/${id}`, { method: 'DELETE' }), 'Đã xóa')) { closeDrawer(); go('tickets'); } };
}

// ===== 4. BẢO TRÌ ĐỊNH KỲ =====
VIEWS.maintenance = async () => {
  const [rules, due] = await Promise.all([api('/admin/maintenance/rules'), api('/admin/maintenance/due')]);
  $('#view').innerHTML = `
    <div class="glass card"><div class="card-head"><h3>${icon('cal')}Chu kỳ bảo dưỡng theo loại máy</h3><span class="spacer"></span>${can('tickets:write') ? `<button class="btn" id="addRule">${icon('plus')}Thêm / sửa quy tắc</button>` : ''}</div>
      ${tableHTML([
        { label: 'Loại máy', render: (r) => `<b>${esc(L.deviceType[r.deviceType])}</b>` },
        { label: 'Chu kỳ', render: (r) => `${r.intervalMonths} tháng/lần` },
        { label: 'Nội dung nhắc', render: (r) => `<span class="small">${esc(r.message)}</span>` },
        { label: 'Bật', render: (r) => (r.isActive ? badge('ACTIVE', { ACTIVE: 'Đang bật' }) : badge('INACTIVE', { INACTIVE: 'Tắt' })) },
        { label: 'Chạy lần cuối', render: (r) => dt(r.lastRunAt) },
      ], rules)}</div>
    <div class="glass card"><div class="card-head"><h3>${icon('bell')}Thiết bị đến hạn bảo trì (${due.length})</h3><span class="spacer"></span>${can('notifications:write') ? `<button class="btn primary" id="runMt">${icon('send')}Gửi nhắc cho khách hàng</button>` : ''}</div>
      ${tableHTML([
        { label: 'Serial', render: (r) => `<b class="mono">${esc(r.serial)}</b>` },
        { label: 'Thiết bị', render: (r) => `${esc(r.name || '')}<div class="small muted">${esc(L.deviceType[r.deviceType])}</div>` },
        { label: 'Chủ máy', render: (r) => esc(r.owner?.email || '') },
        { label: 'Khu vực', render: (r) => esc(r.region) },
        { label: 'Bảo trì cuối', render: (r) => d(r.lastServiceAt || r.installedAt) },
        { label: 'Đến hạn', render: (r) => `<b>${d(r.dueAt)}</b>` },
      ], due, { empty: 'Không có thiết bị nào đến hạn' })}</div>`;
  if ($('#addRule')) $('#addRule').onclick = async () => {
    const v = await formModal('Quy tắc bảo trì', [
      { name: 'deviceType', label: 'Loại máy', type: 'select', options: Object.entries(L.deviceType) },
      { name: 'intervalMonths', label: 'Chu kỳ (tháng)', type: 'number', value: 6, required: true },
      { name: 'message', label: 'Nội dung thông báo', type: 'textarea', full: true, required: true },
      { name: 'isActive', label: 'Bật quy tắc', type: 'checkbox', value: true },
    ], { note: 'Mỗi loại máy có một quy tắc; lưu lại sẽ ghi đè quy tắc cũ.' });
    if (v && await run(() => api('/admin/maintenance/rules', { method: 'PUT', body: v }), 'Đã lưu quy tắc')) go('maintenance');
  };
  if ($('#runMt')) $('#runMt').onclick = async () => { const r = await run(() => api('/admin/maintenance/run', { method: 'POST' })); if (r) { toast(`Đã gửi ${r.sent}/${r.due} lời nhắc (bỏ qua máy đã nhắc trong 7 ngày)`); go('maintenance'); } };
};

// ===== 5a. SẢN PHẨM & GIÁ =====
const productFilter = { q: '', deviceType: '', brand: '', status: 'active', sort: 'newest', page: 1 };
let brandCache = null;
async function brandsAll(force) { if (!brandCache || force) brandCache = await api('/brands'); return brandCache; }
const typeIcon = { AIR_CONDITIONER: 'snow', REFRIGERATOR: 'fridge', FREEZER: 'box' };
const safeImg = (u) => (/^https?:\/\//i.test(u || '') ? esc(u) : '');

async function productForm(p = {}) {
  const brands = await brandsAll();
  if (!brands.length) { toast('Chưa có hãng nào. Hãy thêm hãng trước.', true); return null; }
  return formModal(p.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm', [
    { name: 'name', label: 'Tên sản phẩm', required: true, value: p.name, full: true, placeholder: 'Máy lạnh Daikin Inverter 1.5 HP' },
    { name: 'brandId', label: 'Hãng', type: 'select', options: brands.map((x) => [x.id, x.name]), value: p.brand?.id },
    { name: 'deviceType', label: 'Loại sản phẩm', type: 'select', options: Object.entries(L.deviceType), value: p.deviceType },
    { name: 'model', label: 'Mã model', required: true, value: p.model, placeholder: 'FTKB35XVMV' },
    { name: 'capacity', label: 'Công suất / dung tích', required: true, value: p.capacity, placeholder: '1.5 HP hoặc 335 lít' },
    { name: 'price', label: 'Giá bán (đ)', type: 'number', required: true, value: p.price, step: '1000' },
    { name: 'installationCost', label: 'Phí lắp đặt (đ)', type: 'number', value: p.installationCost, step: '1000' },
    { name: 'coolingCapacity', label: 'Công suất lạnh (BTU)', type: 'number', value: p.coolingCapacity },
    { name: 'powerConsumption', label: 'Điện năng (kW)', type: 'number', step: '0.01', value: p.powerConsumption },
    { name: 'energyRating', label: 'Nhãn năng lượng', value: p.energyRating, placeholder: '5 sao', nullable: true },
    { name: 'warrantyMonths', label: 'Bảo hành (tháng)', type: 'number', value: p.warrantyMonths },
    { name: 'origin', label: 'Xuất xứ', value: p.origin, placeholder: 'Việt Nam', nullable: true },
    { name: 'suitableRoomArea', label: 'Diện tích phù hợp', value: p.suitableRoomArea, placeholder: '15 - 20 m²', nullable: true },
    { name: 'imageUrl', label: 'Link ảnh sản phẩm (https://…)', type: 'url', value: p.imageUrl, full: true, nullable: true },
    { name: 'features', label: 'Tính năng (phẩy ngăn cách)', type: 'list', value: (p.features || []).join(', '), full: true },
    { name: 'advantages', label: 'Ưu điểm (phẩy ngăn cách)', type: 'list', value: (p.advantages || []).join(', '), full: true },
    { name: 'disadvantages', label: 'Nhược điểm (phẩy ngăn cách)', type: 'list', value: (p.disadvantages || []).join(', '), full: true },
    { name: 'description', label: 'Mô tả sản phẩm', type: 'textarea', value: p.description, full: true, nullable: true },
    { name: 'inverter', label: 'Có Inverter', type: 'checkbox', value: p.inverter },
    { name: 'isActive', label: 'Đang bán (hiện trên web)', type: 'checkbox', value: p.id ? p.isActive : true },
  ], { note: 'Giá và thông tin lưu vào database. Trang web chính (So sánh, Dự toán) đọc trực tiếp dữ liệu này.' });
}

function showProduct(p, reload) {
  const rows = [
    ['Hãng', esc(p.brand.name)], ['Loại', esc(L.deviceType[p.deviceType])], ['Mã model', `<span class="mono">${esc(p.model)}</span>`],
    ['Công suất / dung tích', esc(p.capacity) + (p.inverter ? ' · Inverter' : '')],
    ['Công suất lạnh', p.coolingCapacity ? `${p.coolingCapacity.toLocaleString('vi-VN')} BTU` : '—'],
    ['Điện năng', p.powerConsumption ? `${p.powerConsumption} kW` : '—'], ['Nhãn năng lượng', esc(p.energyRating || '—')],
    ['Bảo hành', p.warrantyMonths ? `${p.warrantyMonths} tháng` : '—'], ['Xuất xứ', esc(p.origin || '—')],
    ['Diện tích phù hợp', esc(p.suitableRoomArea || '—')], ['Cập nhật', dt(p.updatedAt)],
  ];
  const list = (title, arr) => (arr?.length ? `<h4>${title}</h4><ul class="small">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
  openDrawer(`
    <div class="p-hero">${safeImg(p.imageUrl) ? `<img src="${safeImg(p.imageUrl)}" alt="" loading="lazy">` : `<div class="p-ph">${icon(typeIcon[p.deviceType])}</div>`}</div>
    <h3>${esc(p.name)}</h3>
    <div class="pill-row">${p.isActive ? badge('ACTIVE', { ACTIVE: 'Đang bán' }) : badge('INACTIVE', { INACTIVE: 'Đang ẩn' })}${p.isDemo ? '<span class="badge b-dim">Dữ liệu mẫu</span>' : ''}</div>
    <div class="p-price">${money(p.price)}${p.installationCost != null ? `<small>+ lắp đặt ${money(p.installationCost)}</small>` : ''}</div>
    <dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
    ${p.description ? `<p class="small">${esc(p.description)}</p>` : ''}
    ${list('Tính năng', p.features)}${list('Ưu điểm', p.advantages)}${list('Nhược điểm', p.disadvantages)}
    ${can('catalog:write') ? `<div class="row" style="margin-top:14px"><button class="btn primary" id="pEdit">${icon('edit')}Sửa</button>
      ${p.isActive ? `<button class="btn" id="pHide">Ẩn khỏi web</button>` : `<button class="btn" id="pShow">Bán lại</button>`}
      <button class="btn danger" id="pDel">${icon('trash')}Xóa hẳn</button></div>` : ''}`);
  if (!can('catalog:write')) return;
  $('#pEdit').onclick = async () => { const v = await productForm(p); if (v && await run(() => api(`/products/${p.id}`, { method: 'PATCH', body: v }), 'Đã lưu sản phẩm')) { closeDrawer(); reload(); } };
  if ($('#pHide')) $('#pHide').onclick = async () => { if (await run(() => api(`/products/${p.id}`, { method: 'PATCH', body: { isActive: false } }), 'Đã ẩn khỏi web')) { closeDrawer(); reload(); } };
  if ($('#pShow')) $('#pShow').onclick = async () => { if (await run(() => api(`/products/${p.id}`, { method: 'PATCH', body: { isActive: true } }), 'Đã bán lại')) { closeDrawer(); reload(); } };
  $('#pDel').onclick = async () => {
    if (!await confirmBox('Xóa hẳn sản phẩm này khỏi database? Nếu sản phẩm đã có thiết bị/dự toán liên quan thì không xóa được, hãy dùng "Ẩn khỏi web".')) return;
    if (await run(() => api(`/products/${p.id}?hard=true`, { method: 'DELETE' }), 'Đã xóa sản phẩm')) { closeDrawer(); reload(); }
  };
}

VIEWS.products = async () => {
  const brands = await brandsAll(true);
  $('#view').innerHTML = `<div class="glass card">
    <div class="card-head"><div class="toolbar">
      <input type="search" id="pq" placeholder="Tìm tên, model, hãng…" value="${esc(productFilter.q)}">
      <select id="pt">${opts(L.deviceType, productFilter.deviceType, 'Mọi loại')}</select>
      <select id="pb"><option value="">Mọi hãng</option>${brands.map((x) => `<option value="${esc(x.slug)}"${x.slug === productFilter.brand ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
      <select id="pst">${opts({ active: 'Đang bán', hidden: 'Đang ẩn', all: 'Tất cả' }, productFilter.status)}</select>
      <select id="pso">${opts({ newest: 'Mới thêm', price_asc: 'Giá tăng dần', price_desc: 'Giá giảm dần', name: 'Tên A–Z' }, productFilter.sort)}</select>
    </div><span class="spacer"></span>${can('catalog:write') ? `<button class="btn" id="addBrand">${icon('plus')}Thêm hãng</button><button class="btn primary" id="addProd">${icon('plus')}Thêm sản phẩm</button>` : ''}</div>
    <div id="prodBody"><div class="empty">Đang tải…</div></div></div>`;
  const load = async () => {
    // Lấy toàn bộ (tối đa 100/trang theo API) rồi lọc trạng thái tại chỗ
    const q = { q: productFilter.q, deviceType: productFilter.deviceType, brand: productFilter.brand, sort: productFilter.sort, page: productFilter.page, limit: 100 };
    const res = await api('/products' + qs(q));
    const items = res.items.filter((p) => (productFilter.status === 'all' ? true : productFilter.status === 'hidden' ? !p.isActive : p.isActive));
    $('#prodBody').innerHTML = items.length ? `<div class="p-grid">${items.map((p, i) => `
      <button class="p-card glass ${p.isActive ? '' : 'off'}" data-i="${i}">
        <div class="p-img">${safeImg(p.imageUrl) ? `<img src="${safeImg(p.imageUrl)}" alt="" loading="lazy">` : icon(typeIcon[p.deviceType])}</div>
        <div class="p-body"><span class="small muted">${esc(p.brand.name)} · ${esc(L.deviceType[p.deviceType])}</span>
          <b>${esc(p.name)}</b><span class="small dim mono">${esc(p.model)} · ${esc(p.capacity)}${p.inverter ? ' · Inverter' : ''}</span>
          <span class="p-pr">${money(p.price)}</span>
          <span class="small muted">${p.installationCost != null ? `Lắp đặt ${money(p.installationCost)}` : 'Chưa có phí lắp đặt'}${p.warrantyMonths ? ` · BH ${p.warrantyMonths} th` : ''}</span>
          ${p.isActive ? '' : '<span class="badge b-dim">Đang ẩn</span>'}</div>
      </button>`).join('')}</div>${pagerHTML(res.pagination)}` : '<div class="empty">Không có sản phẩm phù hợp</div>';
    $('#prodBody').querySelectorAll('.p-card').forEach((el) => { el.onclick = () => showProduct(items[el.dataset.i], load); });
    $('#prodBody').querySelectorAll('[data-pg]').forEach((el) => { el.onclick = () => { productFilter.page = +el.dataset.pg; load(); }; });
  };
  let t;
  $('#pq').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { productFilter.q = e.target.value.trim(); productFilter.page = 1; load(); }, 300); };
  $('#pt').onchange = (e) => { productFilter.deviceType = e.target.value; productFilter.page = 1; load(); };
  $('#pb').onchange = (e) => { productFilter.brand = e.target.value; productFilter.page = 1; load(); };
  $('#pst').onchange = (e) => { productFilter.status = e.target.value; load(); };
  $('#pso').onchange = (e) => { productFilter.sort = e.target.value; productFilter.page = 1; load(); };
  if ($('#addProd')) $('#addProd').onclick = async () => { const v = await productForm(); if (v && await run(() => api('/products', { method: 'POST', body: v }), 'Đã thêm sản phẩm')) load(); };
  if ($('#addBrand')) $('#addBrand').onclick = async () => {
    const v = await formModal('Thêm hãng', [
      { name: 'name', label: 'Tên hãng', required: true, placeholder: 'Midea' },
      { name: 'country', label: 'Quốc gia', placeholder: 'Trung Quốc' },
      { name: 'description', label: 'Giới thiệu', type: 'textarea', full: true },
    ]);
    if (v && await run(() => api('/brands', { method: 'POST', body: v }), 'Đã thêm hãng')) VIEWS.products();
  };
  await load();
};

// ===== 5. MODEL & MÃ LỖI =====
let catalogTab = 'codes'; // sản phẩm đã chuyển sang trang "Sản phẩm & giá"
VIEWS.catalog = async () => {
  $('#view').innerHTML = `<div class="glass card"><div class="card-head"><h3 id="ctabs">${icon('alert')}Bảng mã lỗi</h3>
      <span class="spacer"></span>${can('catalog:write') ? `<button class="btn primary" id="addCat">${icon('plus')}Thêm</button>` : ''}</div><div id="catBody"></div></div>`;
  $('#ctabs').onclick = (e) => { const b = e.target.closest('[data-t]'); if (b) { catalogTab = b.dataset.t; VIEWS.catalog(); } };
  if (catalogTab === 'products') {
    const res = await api('/products?limit=100&sort=name');
    const brands = await api('/brands');
    $('#catBody').innerHTML = tableHTML([
      { label: 'Model', render: (r) => `<b>${esc(r.name)}</b><div class="small mono dim">${esc(r.model)}</div>` },
      { label: 'Hãng', render: (r) => esc(r.brand.name) },
      { label: 'Loại', render: (r) => esc(L.deviceType[r.deviceType]) },
      { label: 'Công suất', render: (r) => `${esc(r.capacity)}${r.inverter ? ' · Inverter' : ''}` },
      { label: 'Điện năng', num: true, render: (r) => (r.powerConsumption ? `${r.powerConsumption} kW` : '—') },
      { label: 'Bảo hành', num: true, render: (r) => (r.warrantyMonths ? `${r.warrantyMonths} th` : '—') },
      { label: 'Giá', num: true, render: (r) => money(r.price) },
      { label: '', render: (r) => (can('catalog:write') ? `<div class="actions"><button class="btn sm" data-edit="${r.id}">${icon('edit')}</button><button class="btn sm danger" data-del="${r.id}">${icon('trash')}</button></div>` : '') },
    ], res.items);
    const productForm = (p = {}) => formModal(p.id ? 'Sửa model' : 'Thêm model', [
      { name: 'brandId', label: 'Hãng', type: 'select', options: brands.map((b) => [b.id, b.name]), value: p.brand?.id },
      { name: 'deviceType', label: 'Loại máy', type: 'select', options: Object.entries(L.deviceType), value: p.deviceType },
      { name: 'name', label: 'Tên', required: true, value: p.name, full: true },
      { name: 'model', label: 'Mã model', required: true, value: p.model },
      { name: 'capacity', label: 'Công suất / dung tích', required: true, value: p.capacity },
      { name: 'price', label: 'Giá (đ)', type: 'number', required: true, value: p.price },
      { name: 'powerConsumption', label: 'Điện năng (kW)', type: 'number', step: '0.01', value: p.powerConsumption },
      { name: 'energyRating', label: 'Nhãn năng lượng', value: p.energyRating, placeholder: '5 sao' },
      { name: 'warrantyMonths', label: 'Bảo hành (tháng)', type: 'number', value: p.warrantyMonths },
      { name: 'features', label: 'Tính năng (phẩy ngăn cách)', type: 'list', value: (p.features || []).join(', '), full: true },
      { name: 'description', label: 'Mô tả / thông số', type: 'textarea', value: p.description, full: true },
      { name: 'inverter', label: 'Inverter', type: 'checkbox', value: p.inverter },
    ]);
    $('#catBody').onclick = async (e) => {
      const ed = e.target.closest('[data-edit]'); const del = e.target.closest('[data-del]');
      if (ed) { const p = res.items.find((x) => x.id === ed.dataset.edit); const v = await productForm(p); if (v && await run(() => api(`/products/${p.id}`, { method: 'PATCH', body: v }), 'Đã lưu')) VIEWS.catalog(); }
      if (del && await confirmBox('Ẩn model này khỏi danh mục? (xóa mềm)') && await run(() => api(`/products/${del.dataset.del}`, { method: 'DELETE' }), 'Đã ẩn')) VIEWS.catalog();
    };
    if ($('#addCat')) $('#addCat').onclick = async () => { const v = await productForm(); if (v && await run(() => api('/products', { method: 'POST', body: v }), 'Đã thêm')) VIEWS.catalog(); };
  } else {
    const res = await api('/admin/error-codes?limit=100');
    $('#catBody').innerHTML = tableHTML([
      { label: 'Mã', render: (r) => `<b class="mono">${esc(r.code)}</b>` },
      { label: 'Loại / hãng', render: (r) => `${esc(L.deviceType[r.deviceType])}<div class="small dim">${esc(r.brand || 'Mọi hãng')}</div>` },
      { label: 'Mô tả', render: (r) => `<b>${esc(r.title)}</b><div class="small muted">${esc(r.causes.join(' · '))}</div>` },
      { label: 'Mức độ', render: (r) => badge(r.severity, L.severity) },
      { label: 'Hướng dẫn khắc phục', render: (r) => `<span class="small">${esc(r.solution)}</span>` },
      { label: '', render: (r) => (can('catalog:write') ? `<div class="actions"><button class="btn sm" data-edit="${r.id}">${icon('edit')}</button><button class="btn sm danger" data-del="${r.id}">${icon('trash')}</button></div>` : '') },
    ], res.items);
    const codeForm = (c = {}) => formModal(c.id ? 'Sửa mã lỗi' : 'Thêm mã lỗi', [
      { name: 'code', label: 'Mã lỗi', required: true, value: c.code, placeholder: 'E4' },
      { name: 'deviceType', label: 'Loại máy', type: 'select', options: Object.entries(L.deviceType), value: c.deviceType },
      { name: 'brand', label: 'Hãng (bỏ trống = mọi hãng)', value: c.brand },
      { name: 'severity', label: 'Mức độ', type: 'select', options: Object.entries(L.severity), value: c.severity || 'WARNING' },
      { name: 'title', label: 'Tên lỗi', required: true, value: c.title, full: true },
      { name: 'causes', label: 'Nguyên nhân (phẩy ngăn cách)', type: 'list', value: (c.causes || []).join(', '), full: true },
      { name: 'solution', label: 'Hướng dẫn khắc phục', type: 'textarea', required: true, value: c.solution, full: true },
    ]);
    $('#catBody').onclick = async (e) => {
      const ed = e.target.closest('[data-edit]'); const del = e.target.closest('[data-del]');
      if (ed) { const c = res.items.find((x) => x.id === ed.dataset.edit); const v = await codeForm(c); if (v && await run(() => api(`/admin/error-codes/${c.id}`, { method: 'PATCH', body: { ...v, brand: v.brand ?? '' } }), 'Đã lưu')) VIEWS.catalog(); }
      if (del && await confirmBox('Xóa mã lỗi này?') && await run(() => api(`/admin/error-codes/${del.dataset.del}`, { method: 'DELETE' }), 'Đã xóa')) VIEWS.catalog();
    };
    if ($('#addCat')) $('#addCat').onclick = async () => { const v = await codeForm(); if (v && await run(() => api('/admin/error-codes', { method: 'POST', body: v }), 'Đã thêm')) VIEWS.catalog(); };
  }
};

// ===== 6. FIRMWARE / OTA =====
VIEWS.firmware = async () => {
  const list = await api('/admin/firmware');
  $('#view').innerHTML = `<div class="glass card"><div class="card-head"><h3>${icon('chip')}Phiên bản firmware</h3><span class="spacer"></span>${can('firmware:write') ? `<button class="btn primary" id="addFw">${icon('plus')}Phát hành bản mới</button>` : ''}</div>
    ${tableHTML([
      { label: 'Phiên bản', render: (r) => `<b class="mono">${esc(r.version)}</b> ${r.isStable ? '' : '<span class="badge b-warn">Beta</span>'}` },
      { label: 'Loại máy', render: (r) => esc(L.deviceType[r.deviceType]) },
      { label: 'Ghi chú', render: (r) => `<span class="small">${esc(r.notes || '')}</span>` },
      { label: 'OTA', render: (r) => `<span class="badge b-ok">${r.rollout.SUCCESS} thành công</span> <span class="badge b-bad">${r.rollout.FAILED} lỗi</span>` },
      { label: 'Ngày', render: (r) => d(r.createdAt) },
      { label: '', render: (r) => `<div class="actions"><button class="btn sm" data-ro="${r.id}">Lịch sử</button>${can('firmware:write') ? `<button class="btn sm primary" data-push="${r.id}">${icon('upload')}Đẩy OTA</button>` : ''}</div>` },
    ], list)}</div>`;
  if ($('#addFw')) $('#addFw').onclick = async () => {
    const v = await formModal('Phát hành firmware', [
      { name: 'version', label: 'Phiên bản', required: true, placeholder: '1.4.0' },
      { name: 'deviceType', label: 'Loại máy', type: 'select', options: Object.entries(L.deviceType) },
      { name: 'fileUrl', label: 'Link file (tuỳ chọn)', full: true },
      { name: 'notes', label: 'Ghi chú thay đổi', type: 'textarea', full: true },
      { name: 'isStable', label: 'Bản ổn định', type: 'checkbox', value: true },
    ]);
    if (v && await run(() => api('/admin/firmware', { method: 'POST', body: v }), 'Đã phát hành')) go('firmware');
  };
  $('#view').onclick = async (e) => {
    const push = e.target.closest('[data-push]'); const ro = e.target.closest('[data-ro]');
    if (push) {
      const fw = list.find((x) => x.id === push.dataset.push);
      const v = await formModal(`Đẩy firmware ${fw.version}`, [
        { name: 'scope', label: 'Phạm vi', type: 'select', options: [['ALL', 'Toàn bộ thiết bị cùng loại'], ['REGION', 'Theo khu vực'], ['DEVICES', 'Danh sách Serial']], full: true },
        { name: 'region', label: 'Khu vực (nếu chọn theo khu vực)', type: 'select', options: ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Bình Dương'].map((r) => [r, r]), empty: '—', full: true },
        { name: 'serials', label: 'Serial (nếu chọn danh sách, phẩy ngăn cách)', type: 'list', full: true },
      ], { submit: 'Đẩy cập nhật', note: `Chỉ áp dụng cho <b>${esc(L.deviceType[fw.deviceType])}</b> đang khác phiên bản ${esc(fw.version)}. Đây là mô phỏng: máy offline sẽ thất bại.` });
      if (!v) return;
      const body = { scope: v.scope, ...(v.scope === 'REGION' ? { region: v.region } : {}) };
      if (v.scope === 'DEVICES') {
        const ids = [];
        for (const s of v.serials) { const r = await api('/admin/devices' + qs({ q: s, limit: 1 })); if (r.items[0]) ids.push(r.items[0].id); }
        body.deviceIds = ids;
      }
      const r = await run(() => api(`/admin/firmware/${fw.id}/rollout`, { method: 'POST', body }));
      if (r) { toast(`OTA: ${r.success}/${r.total} thành công, ${r.failed} thất bại`); go('firmware'); }
    }
    if (ro) {
      const rows = await api(`/admin/firmware/${ro.dataset.ro}/rollouts`);
      openDrawer(`<h3>Lịch sử đẩy OTA</h3><section>${tableHTML([
        { label: 'Thiết bị', render: (r) => `<b class="mono">${esc(r.device.serial)}</b><div class="small dim">${esc(r.device.region)}</div>` },
        { label: 'Kết quả', render: (r) => badge(r.status, L.rollout) },
        { label: 'Ghi chú', render: (r) => `<span class="small">${esc(r.message || '')}</span>` },
        { label: 'Thời gian', render: (r) => dt(r.startedAt) },
      ], rows, { empty: 'Chưa đẩy lần nào' })}</section>`);
    }
  };
};

// ===== 7. NGƯỜI DÙNG & PHÂN QUYỀN =====
const userFilter = { q: '', staff: 'false', role: '', status: '', page: 1 };
VIEWS.users = async () => {
  $('#view').innerHTML = `<div class="glass card">
    <div class="card-head"><div class="tabs" id="utabs"><button data-s="false" class="${userFilter.staff === 'false' ? 'active' : ''}">Khách hàng</button><button data-s="true" class="${userFilter.staff === 'true' ? 'active' : ''}">Nhân viên</button></div>
      <div class="toolbar"><input type="search" id="uq" placeholder="Email / tên / SĐT…" value="${esc(userFilter.q)}"><select id="us">${opts(L.userStatus, userFilter.status, 'Mọi trạng thái')}</select></div></div>
    <div class="muted small" style="margin-bottom:10px">Vai trò: ${me.roles.map((r) => `<b>${esc(r.label)}</b>`).join(' · ')}. Chỉ Super Admin đổi được vai trò; đổi vai trò sẽ buộc đăng nhập lại.</div>
    <div id="uTable"></div></div>`;
  const load = async () => {
    const res = await api('/admin/users' + qs({ ...userFilter, limit: 15 }));
    const canWrite = can('users:write');
    const cols = [
      { label: 'Tài khoản', render: (r) => `<b>${esc(r.profile?.fullName || '—')}</b><div class="small muted">${esc(r.email)}${r.authProvider === 'GOOGLE' ? ' · Google' : ''}</div>` },
      { label: 'SĐT', render: (r) => esc(r.profile?.phone || '—') },
      { label: 'Vai trò', render: (r) => (canWrite && r.id !== me.id ? `<select data-role="${r.id}">${me.roles.map((x) => `<option value="${x.value}"${x.value === r.role ? ' selected' : ''}>${esc(x.label)}</option>`).join('')}</select>` : esc(me.roles.find((x) => x.value === r.role)?.label || r.role)) },
      { label: userFilter.staff === 'true' ? 'Phiếu được giao' : 'Thiết bị / yêu cầu', num: true, render: (r) => (userFilter.staff === 'true' ? r._count.assignedTickets : `${r._count.devices} / ${r._count.customerTickets}`) },
      { label: 'Trạng thái', render: (r) => badge(r.status, L.userStatus) },
      { label: 'Đăng nhập cuối', render: (r) => ago(r.lastLogin) },
      { label: '', render: (r) => (canWrite && r.id !== me.id ? `<div class="actions"><button class="btn sm ${r.status === 'BLOCKED' ? '' : 'danger'}" data-lock="${r.id}" data-st="${r.status}">${r.status === 'BLOCKED' ? 'Mở khóa' : 'Khóa'}</button></div>` : '') },
    ];
    const box = $('#uTable');
    box.innerHTML = tableHTML(cols, res.items, { onRow: true }) + pagerHTML(res.pagination);
    bindRows(box, res.items, (r) => showUser(r.id));
    box.querySelectorAll('[data-pg]').forEach((b) => (b.onclick = () => { userFilter.page = Number(b.dataset.pg); load(); }));
    box.querySelectorAll('[data-role]').forEach((s) => (s.onchange = async () => { if (await run(() => api(`/admin/users/${s.dataset.role}/role`, { method: 'PATCH', body: { role: s.value } }), 'Đã đổi vai trò')) { techCache = null; load(); } else load(); }));
    box.querySelectorAll('[data-lock]').forEach((b) => (b.onclick = async () => {
      const status = b.dataset.st === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
      if (status === 'BLOCKED' && !(await confirmBox('Khóa tài khoản này? Người dùng sẽ bị đăng xuất khỏi mọi thiết bị.'))) return;
      if (await run(() => api(`/admin/users/${b.dataset.lock}/status`, { method: 'PATCH', body: { status } }), 'Đã cập nhật')) load();
    }));
  };
  $('#utabs').onclick = (e) => { const b = e.target.closest('[data-s]'); if (b) { userFilter.staff = b.dataset.s; userFilter.page = 1; VIEWS.users(); } };
  let t;
  $('#uq').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { userFilter.q = e.target.value; userFilter.page = 1; load(); }, 300); };
  $('#us').onchange = (e) => { userFilter.status = e.target.value; userFilter.page = 1; load(); };
  await load();
};

async function showUser(id) {
  const u = await run(() => api(`/admin/users/${id}`));
  if (!u) return;
  openDrawer(`<h3>${esc(u.profile?.fullName || u.email)}</h3><div class="pill-row">${badge(u.status, L.userStatus)} <span class="badge b-vio">${esc(me.roles.find((r) => r.value === u.role)?.label)}</span></div>
    <section><h4>Thông tin</h4><dl class="kv"><dt>Email</dt><dd>${esc(u.email)}</dd><dt>SĐT</dt><dd>${esc(u.profile?.phone || '—')}</dd><dt>Địa chỉ</dt><dd>${esc(u.profile?.address || '—')}</dd>
      <dt>Đăng nhập bằng</dt><dd>${u.authProvider === 'GOOGLE' || u.googleId ? 'Google' : 'Email & mật khẩu'}</dd><dt>Tạo lúc</dt><dd>${dt(u.createdAt)}</dd>
      ${u.role === 'TECHNICIAN' ? `<dt>Khu vực</dt><dd>${esc(u.profile?.region || '—')}</dd><dt>Kỹ năng</dt><dd>${esc((u.profile?.skills || []).join(', '))}</dd><dt>Nhận việc</dt><dd>${u.profile?.isAvailable ? 'Sẵn sàng' : 'Đang bận'}</dd>` : ''}</dl></section>
    ${u.devices.length ? `<section><h4>Thiết bị đã đăng ký & bảo hành</h4>${tableHTML([
      { label: 'Serial', render: (x) => `<b class="mono">${esc(x.serial)}</b>` }, { label: 'Model', render: (x) => esc(x.product.name) },
      { label: 'Bảo hành đến', render: (x) => (x.warrantyUntil ? `${d(x.warrantyUntil)} ${new Date(x.warrantyUntil) > new Date() ? badge('ACTIVE', { ACTIVE: 'Còn hạn' }) : badge('INACTIVE', { INACTIVE: 'Hết hạn' })}` : '—') },
      { label: 'Trạng thái', render: (x) => badge(x.status, L.status) }], u.devices)}</section>` : ''}
    <section><h4>${u.role === 'TECHNICIAN' ? 'Phiếu được giao' : 'Lịch sử yêu cầu hỗ trợ'}</h4>${tableHTML([
      { label: 'Mã', render: (x) => `<b class="mono">${esc(x.code)}</b>` }, { label: 'Nội dung', render: (x) => `${esc(x.title)}<div class="small dim">${esc(L.ticketType[x.type])} · ${d(x.createdAt)}</div>` },
      { label: 'Trạng thái', render: (x) => badge(x.status, L.ticketStatus) }], u.role === 'TECHNICIAN' ? u.assignedTickets : u.customerTickets, { empty: 'Chưa có' })}</section>`);
}

// ===== 8. KỸ THUẬT VIÊN =====
VIEWS.technicians = async () => {
  techCache = null;
  const list = await techOptions();
  $('#view').innerHTML = `<div class="glass card"><div class="card-head"><h3>${icon('wrench')}Đội ngũ kỹ thuật (${list.length})</h3><span class="spacer"></span><span class="muted small">Muốn thêm kỹ thuật viên: vào "Người dùng & phân quyền" và đổi vai trò.</span></div>
    ${tableHTML([
      { label: 'Kỹ thuật viên', render: (r) => `<b>${esc(r.profile?.fullName)}</b><div class="small muted">${esc(r.email)} · ${esc(r.profile?.phone || '')}</div>` },
      { label: 'Khu vực phụ trách', render: (r) => esc(r.profile?.region || '—') },
      { label: 'Kỹ năng', render: (r) => `<div class="pill-row">${(r.profile?.skills || []).map((s) => `<span class="badge b-info">${esc(s)}</span>`).join('')}</div>` },
      { label: 'Đang nhận', num: true, render: (r) => r.openTickets },
      { label: 'Đã xong', num: true, render: (r) => r.doneTickets },
      { label: 'Tình trạng', render: (r) => (r.status !== 'ACTIVE' ? badge(r.status, L.userStatus) : r.profile?.isAvailable ? badge('ONLINE', { ONLINE: 'Sẵn sàng' }) : badge('PENDING', { PENDING: 'Đang bận' })) },
      { label: '', render: (r) => (can('users:write') ? `<div class="actions"><button class="btn sm" data-ed="${r.id}">${icon('edit')}</button></div>` : '') },
    ], list)}</div>`;
  $('#view').onclick = async (e) => {
    const b = e.target.closest('[data-ed]'); if (!b) return;
    const t = list.find((x) => x.id === b.dataset.ed);
    const v = await formModal(`Cập nhật ${t.profile?.fullName}`, [
      { name: 'region', label: 'Khu vực', type: 'select', options: ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Bình Dương'].map((r) => [r, r]), value: t.profile?.region },
      { name: 'phone', label: 'SĐT', value: t.profile?.phone },
      { name: 'skills', label: 'Kỹ năng (phẩy ngăn cách)', type: 'list', value: (t.profile?.skills || []).join(', '), full: true },
      { name: 'isAvailable', label: 'Sẵn sàng nhận việc', type: 'checkbox', value: t.profile?.isAvailable },
    ]);
    if (v && await run(() => api(`/admin/users/${t.id}/staff-profile`, { method: 'PATCH', body: v }), 'Đã lưu')) VIEWS.technicians();
  };
};

// ===== 9. THÔNG BÁO =====
VIEWS.notifications = async () => {
  const res = await api('/admin/notifications?limit=50');
  $('#view').innerHTML = `<div class="glass card"><div class="card-head"><h3>${icon('bell')}Thông báo đã gửi</h3><span class="spacer"></span><button class="btn primary" id="addNt">${icon('send')}Soạn thông báo</button></div>
    ${tableHTML([
      { label: 'Tiêu đề', render: (r) => `<b>${esc(r.title)}</b><div class="small muted">${esc(r.body)}</div>` },
      { label: 'Loại', render: (r) => `<span class="badge b-info">${esc(L.notifType[r.type])}</span>` },
      { label: 'Gửi tới', render: (r) => esc(r.target === 'ROLE' ? `Vai trò ${r.targetValue}` : r.target === 'USER' ? r.recipient?.email || 'Một người' : 'Tất cả') },
      { label: 'Thời gian', render: (r) => (r.sentAt ? dt(r.sentAt) : `<span class="badge b-warn">Hẹn ${dt(r.scheduledAt)}</span>`) },
      { label: '', render: (r) => `<div class="actions"><button class="btn sm danger" data-del="${r.id}">${icon('trash')}</button></div>` },
    ], res.items)}</div>`;
  $('#view').onclick = async (e) => { const b = e.target.closest('[data-del]'); if (b && await confirmBox('Xóa thông báo này?') && await run(() => api(`/admin/notifications/${b.dataset.del}`, { method: 'DELETE' }), 'Đã xóa')) go('notifications'); };
  $('#addNt').onclick = async () => {
    const customers = await customerOptions().catch(() => []);
    const v = await formModal('Soạn thông báo đẩy', [
      { name: 'title', label: 'Tiêu đề', required: true, full: true },
      { name: 'body', label: 'Nội dung', type: 'textarea', required: true, full: true },
      { name: 'type', label: 'Loại', type: 'select', options: Object.entries(L.notifType) },
      { name: 'target', label: 'Gửi tới', type: 'select', options: Object.entries(L.target) },
      { name: 'targetValue', label: 'Vai trò (nếu gửi theo vai trò)', type: 'select', options: me.roles.map((r) => [r.value, r.label]), empty: '—' },
      { name: 'recipientId', label: 'Người nhận (nếu gửi 1 người)', type: 'select', options: customers, empty: '—' },
      { name: 'scheduledAt', label: 'Hẹn giờ gửi (tuỳ chọn)', type: 'datetime-local', full: true },
    ], { submit: 'Gửi' });
    if (v && await run(() => api('/admin/notifications', { method: 'POST', body: v }), 'Đã gửi thông báo')) go('notifications');
  };
};

// ===== 10. TÀI LIỆU / FAQ (CMS) =====
VIEWS.content = async () => {
  const res = await api('/articles?limit=100');
  $('#view').innerHTML = `<div class="glass card"><div class="card-head"><h3>${icon('book')}Kho tài liệu, hướng dẫn, FAQ</h3><span class="spacer"></span><button class="btn primary" id="addAr">${icon('plus')}Thêm bài</button></div>
    ${tableHTML([
      { label: 'Tiêu đề', render: (r) => `<b>${esc(r.title)}</b><div class="small muted">${esc(r.summary || '')}</div>` },
      { label: 'Chuyên mục', render: (r) => esc(L.category[r.category]) },
      { label: 'Dạng', render: (r) => (r.isGuide ? '<span class="badge b-vio">Hướng dẫn từng bước</span>' : '<span class="badge b-info">Bài viết</span>') },
      { label: 'Hiển thị', render: (r) => (r.isPublished ? badge('ACTIVE', { ACTIVE: 'Đã xuất bản' }) : badge('INACTIVE', { INACTIVE: 'Bản nháp' })) },
      { label: '', render: (r) => `<div class="actions"><button class="btn sm" data-edit="${r.id}">${icon('edit')}</button><button class="btn sm danger" data-del="${r.id}">${icon('trash')}</button></div>` },
    ], res.items)}</div>`;
  const articleForm = async (a = {}) => {
    const full = a.id ? await api(`/articles/${a.id}`) : {};
    return formModal(a.id ? 'Sửa bài' : 'Thêm bài', [
      { name: 'title', label: 'Tiêu đề', required: true, value: full.title, full: true },
      { name: 'category', label: 'Chuyên mục', type: 'select', options: Object.entries(L.category), value: full.category },
      { name: 'readingTime', label: 'Phút đọc', type: 'number', value: full.readingTime || 5 },
      { name: 'summary', label: 'Tóm tắt', value: full.summary, full: true },
      { name: 'content', label: 'Nội dung', type: 'textarea', required: true, value: full.content, full: true },
      { name: 'tags', label: 'Thẻ (phẩy ngăn cách)', type: 'list', value: (full.tags || []).join(', '), full: true },
      { name: 'isPublished', label: 'Xuất bản', type: 'checkbox', value: full.isPublished },
      { name: 'isGuide', label: 'Là hướng dẫn từng bước', type: 'checkbox', value: full.isGuide },
    ]);
  };
  $('#addAr').onclick = async () => { const v = await articleForm(); if (v && await run(() => api('/articles', { method: 'POST', body: v }), 'Đã thêm')) go('content'); };
  $('#view').onclick = async (e) => {
    const ed = e.target.closest('[data-edit]'); const del = e.target.closest('[data-del]');
    if (ed) { const v = await articleForm({ id: ed.dataset.edit }); if (v && await run(() => api(`/articles/${ed.dataset.edit}`, { method: 'PATCH', body: v }), 'Đã lưu')) go('content'); }
    if (del && await confirmBox('Xóa bài viết này?') && await run(() => api(`/articles/${del.dataset.del}`, { method: 'DELETE' }), 'Đã xóa')) go('content');
  };
};

// ===== 11. CẤU HÌNH =====
VIEWS.settings = async () => {
  const list = await api('/admin/settings');
  const editable = can('settings:write');
  $('#view').innerHTML = `<form class="glass card" id="setForm"><div class="card-head"><h3>${icon('gear')}Tham số hệ thống</h3><span class="spacer"></span>${editable ? `<button class="btn primary">${icon('check')}Lưu cấu hình</button>` : '<span class="muted small">Chỉ Super Admin được sửa</span>'}</div>
    <div class="form-grid">${list.map((s) => typeof s.value === 'boolean'
      ? `<label class="check"><input type="checkbox" name="${esc(s.key)}" ${s.value ? 'checked' : ''} ${editable ? '' : 'disabled'}>${esc(s.description || s.key)}</label>`
      : `<label>${esc(s.description || s.key)}<input name="${esc(s.key)}" type="number" step="any" value="${esc(s.value)}" ${editable ? '' : 'disabled'}><span class="small dim mono">${esc(s.key)}</span></label>`).join('')}</div></form>`;
  $('#setForm').onsubmit = async (e) => {
    e.preventDefault();
    const body = {};
    for (const s of list) { const el = e.target.elements[s.key]; body[s.key] = typeof s.value === 'boolean' ? el.checked : Number(el.value); }
    await run(() => api('/admin/settings', { method: 'PUT', body }), 'Đã lưu cấu hình – mọi thay đổi được ghi vào nhật ký');
  };
  // ----- Dữ liệu mẫu -----
  const demo = await api('/admin/demo-data');
  const isSuper = me.role === 'ADMIN';
  const items = [['Thiết bị IoT mẫu', demo.devices], ['Phiếu dịch vụ mẫu', demo.tickets], ['Khách hàng mẫu', demo.customers], ['Thông báo mẫu', demo.notifications], ['Dự toán / chẩn đoán mẫu', demo.estimates + demo.diagnoses], ['So sánh / hội thoại mẫu', demo.comparisons + demo.conversations]];
  $('#view').insertAdjacentHTML('beforeend', `<div class="glass card" id="demoCard" style="margin-top:16px"><div class="card-head"><h3>${icon('trash')}Dữ liệu mẫu (để demo)</h3><span class="spacer"></span>
    ${demo.total && isSuper ? `<button class="btn danger" id="clearDemo">${icon('trash')}Xóa toàn bộ dữ liệu mẫu</button>` : ''}</div>
    ${demo.total ? `<p class="muted small" style="margin-bottom:10px">Các bản ghi do lệnh seed tạo ra. Xóa đi thì Admin chỉ còn dữ liệu thật. <b>Vẫn giữ</b>: sản phẩm & giá, hãng, mã lỗi, bài viết, cấu hình, tài khoản admin/nhân viên và tài khoản demo@smartcool.vn.${isSuper ? '' : ' Chỉ Super Admin được xóa.'}</p>
      <dl class="kv">${items.map(([k, v]) => `<dt>${k}</dt><dd><b>${v}</b></dd>`).join('')}</dl>`
    : `<div class="empty">Không còn dữ liệu mẫu – mọi số liệu trên Admin là dữ liệu thật ✅</div>`}</div>`);
  if ($('#clearDemo')) $('#clearDemo').onclick = async () => {
    const v = await formModal('Xóa toàn bộ dữ liệu mẫu?', [{ name: 'confirm', label: 'Gõ XOA để xác nhận', required: true, placeholder: 'XOA', full: true }],
      { submit: 'Xóa vĩnh viễn', note: `Sẽ xóa ${demo.total} bản ghi mẫu (thiết bị, thông số, phiếu, khách hàng mẫu…). <b>Không hoàn tác được.</b>` });
    if (!v) return;
    const r = await run(() => api('/admin/demo-data/clear', { method: 'POST', body: { confirm: String(v.confirm).trim().toUpperCase() } }));
    if (r) { toast(`Đã xóa: ${r.deleted.devices} thiết bị, ${r.deleted.tickets} phiếu, ${r.deleted.customers} khách hàng mẫu`); go('settings'); }
  };
};

// ===== 12. NHẬT KÝ =====
const auditFilter = { entity: '', action: '', page: 1 };
VIEWS.audit = async () => {
  $('#view').innerHTML = `<div class="glass card"><div class="card-head"><div class="toolbar">
      <select id="ae"><option value="">Mọi đối tượng</option>${['device', 'ticket', 'firmware', 'setting', 'user', 'product', 'article', 'error_code', 'notification', 'maintenance_rule'].map((x) => `<option${x === auditFilter.entity ? ' selected' : ''}>${x}</option>`).join('')}</select>
      <select id="aa"><option value="">Mọi hành động</option>${['CREATE', 'UPDATE', 'DELETE', 'OTA_PUSH', 'ASSIGN', 'UPDATE_ROLE', 'UPDATE_STATUS', 'SEND', 'RUN', 'LOGIN_GOOGLE'].map((x) => `<option${x === auditFilter.action ? ' selected' : ''}>${x}</option>`).join('')}</select>
    </div></div><div id="aTable"></div></div>`;
  const load = async () => {
    const res = await api('/admin/audit-logs' + qs({ ...auditFilter, limit: 20 }));
    const box = $('#aTable');
    box.innerHTML = tableHTML([
      { label: 'Thời gian', render: (r) => `<span class="mono small">${dt(r.createdAt)}</span>` },
      { label: 'Người thực hiện', render: (r) => `${esc(r.actor?.profile?.fullName || r.actor?.email || 'Hệ thống')}<div class="small dim">${esc(r.actor?.role || '')} · ${esc(r.ip || '')}</div>` },
      { label: 'Hành động', render: (r) => `<span class="badge b-${r.action === 'DELETE' ? 'bad' : r.action === 'OTA_PUSH' ? 'vio' : 'info'}">${esc(r.action)}</span>` },
      { label: 'Đối tượng', render: (r) => `<b>${esc(r.entity)}</b><div class="small mono dim">${esc(r.entityId || '')}</div>` },
      { label: 'Chi tiết', render: (r) => `<span class="small mono">${esc(r.detail ? JSON.stringify(r.detail).slice(0, 160) : '')}</span>` },
    ], res.items) + pagerHTML(res.pagination);
    box.querySelectorAll('[data-pg]').forEach((b) => (b.onclick = () => { auditFilter.page = Number(b.dataset.pg); load(); }));
  };
  $('#ae').onchange = (e) => { auditFilter.entity = e.target.value; auditFilter.page = 1; load(); };
  $('#aa').onchange = (e) => { auditFilter.action = e.target.value; auditFilter.page = 1; load(); };
  await load();
};

boot();
