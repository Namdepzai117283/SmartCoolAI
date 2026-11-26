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

await call('POST', '/auth/logout', { body: { refreshToken: refreshed?.refreshToken } });
void reg;
console.log(`\nKết quả: ${passed} đạt, ${failed} lỗi`);
process.exit(failed ? 1 : 0);
