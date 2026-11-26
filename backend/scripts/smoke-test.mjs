// Kiểm tra nhanh toàn bộ API: node scripts/smoke-test.mjs [http://localhost:5000]
// Cần server đang chạy và đã seed dữ liệu (npm run db:seed).
const BASE = (process.argv[2] || process.env.API_URL || 'http://localhost:5000').replace(/\/+$/, '') + '/api';
let passed = 0;
let failed = 0;

async function call(method, path, { token, body, expect = [200] } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  const ok = expect.includes(res.status);
  ok ? passed++ : failed++;
  console.log(`${ok ? '✅' : '❌'} ${method.padEnd(6)} ${path.padEnd(42)} ${res.status}${ok ? '' : ' ' + JSON.stringify(json).slice(0, 200)}`);
  return json.data;
}

const email = `test${Date.now()}@smartcool.vn`;

await call('GET', '/health');
// --- AUTH + JWT ---
const reg = await call('POST', '/auth/register', { body: { fullName: 'Sinh Viên Test', email, password: 'Test@12345' }, expect: [201] });
const login = await call('POST', '/auth/login', { body: { email, password: 'Test@12345' } });
const token = login?.accessToken;
await call('POST', '/auth/login', { body: { email, password: 'sai-mat-khau' }, expect: [401] });
await call('GET', '/auth/me', { token });
await call('GET', '/auth/me', { expect: [401] });
const refreshed = await call('POST', '/auth/refresh', { body: { refreshToken: login?.refreshToken } });
await call('POST', '/auth/refresh', { body: { refreshToken: login?.refreshToken }, expect: [401] }); // token cũ không dùng lại được
const user = refreshed?.accessToken || token;

const admin = await call('POST', '/auth/login', { body: { email: 'admin@smartcool.vn', password: 'Admin@123456' } });
const adminToken = admin?.accessToken;

// --- PRODUCTS (public read, admin write) ---
const list = await call('GET', '/products?deviceType=AIR_CONDITIONER&sort=price_asc&limit=5');
const brands = await call('GET', '/brands');
await call('GET', '/products?q=daikin');
await call('POST', '/products', { token: user, body: {}, expect: [403] });
const created = await call('POST', '/products', { token: adminToken, expect: [201], body: {
  brandId: brands?.[0]?.id, name: 'Sản phẩm test', model: `TEST-${Date.now()}`, deviceType: 'AIR_CONDITIONER', price: 7000000, capacity: '1 HP', inverter: true,
} });
await call('PATCH', `/products/${created?.id}`, { token: adminToken, body: { price: 6500000 } });
await call('GET', `/products/${created?.id}`);
await call('DELETE', `/products/${created?.id}?hard=true`, { token: adminToken });
await call('GET', `/products/${created?.id}`, { expect: [404] });

// --- ARTICLES ---
const articles = await call('GET', '/articles?guide=true');
const guide = articles?.items?.[0];
await call('GET', '/articles/ve-sinh-may-lanh-tai-nha');
await call('POST', `/articles/${guide?.id}/favorite`, { token: user });
await call('GET', '/articles/me/favorites', { token: user });
await call('PUT', `/articles/${guide?.id}/progress`, { token: user, body: { completedSteps: ['step-1', 'step-2'] } });
const art = await call('POST', '/articles', { token: adminToken, expect: [201], body: { title: 'Bài test ' + Date.now(), category: 'SAFETY', content: 'Nội dung', isPublished: true } });
await call('PATCH', `/articles/${art?.id}`, { token: adminToken, body: { summary: 'Đã sửa' } });
await call('DELETE', `/articles/${art?.id}`, { token: adminToken });

// --- DIAGNOSES (lỗi "chảy" ≠ "cháy") ---
const leak = await call('POST', '/diagnoses/analyze', { body: { deviceType: 'AIR_CONDITIONER', description: 'Máy lạnh bị chảy nước' } });
const fire = await call('POST', '/diagnoses/analyze', { body: { deviceType: 'AIR_CONDITIONER', description: 'Máy lạnh có mùi cháy khét' } });
const plain = await call('POST', '/diagnoses/analyze', { body: { deviceType: 'AIR_CONDITIONER', description: 'may lanh chay nuoc' } });
const check = (label, cond) => { cond ? passed++ : failed++; console.log(`${cond ? '✅' : '❌'} ${label}`); };
check(`"chảy nước" → ${leak?.riskLevel} (không được là DANGER)`, leak?.riskLevel !== 'DANGER');
check(`"mùi cháy khét" → ${fire?.riskLevel} (phải là DANGER)`, fire?.riskLevel === 'DANGER');
check(`"chay nuoc" (không dấu) → ${plain?.riskLevel} (không được là DANGER)`, plain?.riskLevel !== 'DANGER');
const diag = await call('POST', '/diagnoses', { token: user, expect: [201], body: { deviceType: 'REFRIGERATOR', description: 'Tủ lạnh không đông đá', symptoms: ['đóng tuyết'] } });
await call('GET', '/diagnoses', { token: user });
await call('PATCH', `/diagnoses/${diag?.id}`, { token: user, body: { description: 'Tủ lạnh không đông đá và có mùi hôi', reanalyze: true } });
await call('GET', `/diagnoses/${diag?.id}`, { token: adminToken, expect: [404] }); // người khác không xem được
await call('DELETE', `/diagnoses/${diag?.id}`, { token: user });

// --- ESTIMATES ---
const productId = list?.items?.[0]?.id;
const est = await call('POST', '/estimates', { token: user, expect: [201], body: { deviceType: 'AIR_CONDITIONER', serviceType: 'INSTALLATION', productId, budget: 10000000, items: [{ name: 'Ống đồng', quantity: 4, unitPrice: 180000 }] } });
check(`Dự toán: subtotal ${est?.subtotal} + dự phòng ${est?.reserveCost} = ${est?.totalCost}`, est && est.subtotal + est.reserveCost === est.totalCost);
const est2 = await call('PATCH', `/estimates/${est?.id}`, { token: user, body: { quantity: 2 } });
check(`Sửa số lượng 2 → tổng tăng (${est?.totalCost} → ${est2?.totalCost})`, est2?.totalCost > est?.totalCost);
await call('GET', '/estimates', { token: user });
await call('DELETE', `/estimates/${est?.id}`, { token: user });

// --- COMPARISONS ---
const cmp = await call('POST', '/comparisons', { token: user, expect: [201], body: { firstProductId: list?.items?.[0]?.id, secondProductId: list?.items?.[1]?.id, userNeeds: { priority: 'price' } } });
console.log('   →', cmp?.conclusion);
await call('GET', '/comparisons', { token: user });
await call('DELETE', `/comparisons/${cmp?.id}`, { token: user });

// --- CONVERSATIONS ---
const conv = await call('POST', '/conversations', { token: user, body: {}, expect: [201] });
check(`Tiêu đề mặc định: "${conv?.title}"`, conv?.title === 'Cuộc trò chuyện mới');
await call('POST', `/conversations/${conv?.id}/messages`, { token: user, expect: [201], body: { role: 'USER', content: 'Xin chào' } });
await call('DELETE', `/conversations/${conv?.id}`, { token: user });

// --- ADMIN ---
await call('GET', '/admin/stats', { token: adminToken });
await call('GET', '/admin/stats', { token: user, expect: [403] });
await call('GET', '/admin/users?q=test', { token: adminToken });

// --- GOOGLE LOGIN (chưa cấu hình thì phải báo rõ, không crash) ---
const gcfg = await call('GET', '/auth/google/config');
console.log('   → Google enabled:', gcfg?.enabled);
await call('POST', '/auth/google', { body: { idToken: 'gia-mao' }, expect: gcfg?.enabled ? [401] : [503] });

// --- ADMIN: dashboard, IoT, ticket, RBAC ---
const staff = async (e) => (await call('POST', '/auth/login', { body: { email: e, password: 'Staff@123456' } }))?.accessToken;
const kho = await staff('kho@smartcool.vn');
const cskh = await staff('cskh@smartcool.vn');
const ktv = await staff('ktv.hung@smartcool.vn');
const dash = await call('GET', '/admin/dashboard', { token: adminToken });
check(`Dashboard: ${dash?.kpi?.totalDevices} thiết bị, ${dash?.kpi?.error} lỗi, ${dash?.urgentAlerts?.length} cảnh báo`, dash?.kpi?.totalDevices > 0);
const meKtv = await call('GET', '/admin/me', { token: ktv });
check(`Kỹ thuật viên có quyền: ${meKtv?.permissions?.join(', ')}`, meKtv?.permissions?.includes('tickets:work') && !meKtv?.permissions?.includes('users:read'));
await call('GET', '/admin/dashboard', { token: user, expect: [403] });         // khách hàng không vào admin
await call('PUT', '/admin/settings', { token: cskh, body: { 'alert.maxTemperature': 40 }, expect: [403] }); // CSKH không sửa cấu hình
await call('GET', '/admin/users', { token: ktv, expect: [403] });              // KTV không xem danh sách người dùng
await call('POST', '/admin/firmware', { token: cskh, body: {}, expect: [403] }); // CSKH không phát hành firmware
await call('GET', '/admin/error-codes?q=E5', { token: kho });

const devs = await call('GET', '/admin/devices?status=ONLINE&limit=1', { token: adminToken });
const dev = devs?.items?.[0];
await call('GET', `/admin/devices/${dev?.id}`, { token: kho });
const sim = await call('POST', `/admin/devices/${dev?.id}/simulate`, { token: adminToken, body: { scenario: 'gas' } });
check(`Giả lập rò gas → mã lỗi ${sim?.errorCode} (${sim?.severity}), phiếu ${sim?.ticket?.code}`, sim?.errorCode === 'GAS-LOW' && sim?.severity === 'CRITICAL');
const auto = await call('GET', `/admin/tickets?q=${encodeURIComponent(dev?.serial ?? '')}`, { token: adminToken });
check(`Lỗi nghiêm trọng tự tạo phiếu khẩn: ${auto?.items?.[0]?.code}`, auto?.items?.some((t) => t.priority === 'URGENT'));
await call('POST', `/admin/devices/${dev?.id}/simulate`, { token: adminToken, body: { scenario: 'normal' } });

const techs = await call('GET', '/admin/technicians', { token: adminToken });
const hung = techs?.find?.((t) => t.email === 'ktv.hung@smartcool.vn') ?? techs?.items?.find?.((t) => t.email === 'ktv.hung@smartcool.vn');
const tk = await call('POST', '/admin/tickets', { token: cskh, expect: [201], body: { customerId: dev?.ownerId ?? dev?.owner?.id, deviceId: dev?.id, type: 'REPAIR', priority: 'HIGH', title: 'Phiếu test tự động' } });
const asg = await call('PATCH', `/admin/tickets/${tk?.id}`, { token: cskh, body: { technicianId: hung?.id } });
check(`Gán kỹ thuật viên → ${asg?.status}`, asg?.status === 'ASSIGNED');
await call('PATCH', `/admin/tickets/${tk?.id}`, { token: ktv, body: { priority: 'LOW' }, expect: [403] }); // KTV không đổi ưu tiên
const done = await call('PATCH', `/admin/tickets/${tk?.id}`, { token: ktv, body: { status: 'DONE', laborCost: 200000, partsUsed: [{ name: 'Gas R32', quantity: 1, price: 350000 }] } });
check(`KTV hoàn thành phiếu: tổng ${done?.totalCost}`, done?.status === 'DONE' && done?.totalCost === 550000);
const mine = await call('GET', '/admin/tickets?limit=100', { token: ktv });
check(`KTV chỉ thấy phiếu của mình (${mine?.items?.length} phiếu)`, mine?.items?.every((t) => t.technicianId === hung?.id || t.technician?.id === hung?.id));
await call('DELETE', `/admin/tickets/${tk?.id}`, { token: adminToken });
await call('GET', '/admin/audit-logs?limit=5', { token: adminToken });
await call('GET', '/admin/audit-logs', { token: kho, expect: [403] });
await call('GET', '/me/notifications', { token: user });

await call('POST', '/auth/logout', { body: { refreshToken: refreshed?.refreshToken } });
void reg;
console.log(`\nKết quả: ${passed} đạt, ${failed} lỗi`);
process.exit(failed ? 1 : 0);
