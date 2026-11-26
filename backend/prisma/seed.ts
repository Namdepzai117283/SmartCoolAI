// ==========================================
// DỮ LIỆU MẪU – chạy: npm run db:seed
// Chạy lại nhiều lần vẫn an toàn (upsert theo email / slug / brandId+model).
// ==========================================
import 'dotenv/config';
import { prisma } from '../src/config/database';
import { hashPassword } from '../src/utils/password';
import { analyzeDiagnosis } from '../src/services/diagnosis.rules';
import { calculateCost } from '../src/services/estimate.service';

type DeviceType = 'AIR_CONDITIONER' | 'REFRIGERATOR' | 'FREEZER';

const BRANDS = [
  { name: 'Daikin', slug: 'daikin', country: 'Nhật Bản', description: 'Chuyên gia điều hòa không khí hàng đầu Nhật Bản.' },
  { name: 'Panasonic', slug: 'panasonic', country: 'Nhật Bản', description: 'Nổi bật với công nghệ lọc khí Nanoe-X.' },
  { name: 'LG', slug: 'lg', country: 'Hàn Quốc', description: 'Máy nén Dual Inverter tiết kiệm điện.' },
  { name: 'Samsung', slug: 'samsung', country: 'Hàn Quốc', description: 'Công nghệ WindFree và Digital Inverter.' },
  { name: 'Toshiba', slug: 'toshiba', country: 'Nhật Bản', description: 'Bền bỉ, giá hợp lý.' },
  { name: 'Aqua', slug: 'aqua', country: 'Nhật Bản', description: 'Tủ lạnh, tủ đông giá tốt cho gia đình.' },
  { name: 'Sharp', slug: 'sharp', country: 'Nhật Bản', description: 'Công nghệ Plasmacluster ion.' },
  { name: 'Casper', slug: 'casper', country: 'Thái Lan', description: 'Điều hòa phổ thông giá rẻ.' },
  { name: 'Hitachi', slug: 'hitachi', country: 'Nhật Bản', description: 'Tủ lạnh cao cấp, nhiều cửa.' },
  { name: 'Sanaky', slug: 'sanaky', country: 'Việt Nam', description: 'Tủ đông, tủ mát thương mại.' },
];

interface ProductSeed {
  brand: string; name: string; model: string; deviceType: DeviceType; price: number; capacity: string;
  inverter: boolean; coolingCapacity?: number; powerConsumption: number; energyRating: string;
  warrantyMonths: number; origin: string; suitableRoomArea?: string; installationCost?: number;
  features: string[]; advantages: string[]; disadvantages: string[]; description: string;
}

const PRODUCTS: ProductSeed[] = [
  // ---------- MÁY LẠNH ----------
  { brand: 'daikin', name: 'Máy lạnh Daikin Inverter 1 HP', model: 'FTKB25XVMV', deviceType: 'AIR_CONDITIONER', price: 10_490_000, capacity: '1 HP', inverter: true, coolingCapacity: 9000, powerConsumption: 0.75, energyRating: '5 sao', warrantyMonths: 12, origin: 'Việt Nam', suitableRoomArea: 'Dưới 15 m²', installationCost: 450_000, features: ['Inverter', 'Coanda', 'Chế độ ngủ đêm'], advantages: ['Bền, ít hỏng vặt', 'Tiết kiệm điện'], disadvantages: ['Giá cao hơn mặt bằng'], description: 'Máy lạnh 1 chiều cho phòng ngủ nhỏ.' },
  { brand: 'daikin', name: 'Máy lạnh Daikin Inverter 1.5 HP', model: 'FTKB35XVMV', deviceType: 'AIR_CONDITIONER', price: 12_890_000, capacity: '1.5 HP', inverter: true, coolingCapacity: 12000, powerConsumption: 1.05, energyRating: '5 sao', warrantyMonths: 12, origin: 'Việt Nam', suitableRoomArea: '15 - 20 m²', installationCost: 500_000, features: ['Inverter', 'Coanda', 'Hẹn giờ'], advantages: ['Làm lạnh nhanh', 'Vận hành êm'], disadvantages: ['Chưa có Wi-Fi'], description: 'Phù hợp phòng khách nhỏ hoặc phòng ngủ lớn.' },
  { brand: 'panasonic', name: 'Máy lạnh Panasonic Inverter 1 HP', model: 'CU/CS-XU9ZKH-8', deviceType: 'AIR_CONDITIONER', price: 13_290_000, capacity: '1 HP', inverter: true, coolingCapacity: 9000, powerConsumption: 0.69, energyRating: '5 sao', warrantyMonths: 12, origin: 'Malaysia', suitableRoomArea: 'Dưới 15 m²', installationCost: 450_000, features: ['Nanoe-X', 'Wi-Fi', 'iAUTO-X'], advantages: ['Lọc khí tốt', 'Điều khiển qua điện thoại'], disadvantages: ['Giá cao'], description: 'Máy lạnh cao cấp có lọc không khí Nanoe-X.' },
  { brand: 'panasonic', name: 'Máy lạnh Panasonic 1.5 HP', model: 'CU/CS-N12ZKH-8', deviceType: 'AIR_CONDITIONER', price: 9_690_000, capacity: '1.5 HP', inverter: false, coolingCapacity: 12000, powerConsumption: 1.2, energyRating: '3 sao', warrantyMonths: 12, origin: 'Malaysia', suitableRoomArea: '15 - 20 m²', installationCost: 500_000, features: ['Powerful', 'Lọc bụi'], advantages: ['Giá dễ tiếp cận'], disadvantages: ['Tốn điện hơn bản Inverter'], description: 'Máy lạnh thường (non-inverter) giá tốt.' },
  { brand: 'lg', name: 'Máy lạnh LG Dual Inverter 1 HP', model: 'V10WIN', deviceType: 'AIR_CONDITIONER', price: 8_490_000, capacity: '1 HP', inverter: true, coolingCapacity: 9200, powerConsumption: 0.8, energyRating: '5 sao', warrantyMonths: 24, origin: 'Thái Lan', suitableRoomArea: 'Dưới 15 m²', installationCost: 450_000, features: ['Dual Inverter', 'ThinQ Wi-Fi', 'Làm lạnh nhanh Jet Cool'], advantages: ['Bảo hành máy nén 10 năm', 'Giá tốt'], disadvantages: ['Hơi ồn ở chế độ Jet'], description: 'Máy lạnh Inverter giá hợp lý, bảo hành dài.' },
  { brand: 'samsung', name: 'Máy lạnh Samsung WindFree 1.5 HP', model: 'AR13CYFAAWKNSV', deviceType: 'AIR_CONDITIONER', price: 11_990_000, capacity: '1.5 HP', inverter: true, coolingCapacity: 12000, powerConsumption: 0.98, energyRating: '5 sao', warrantyMonths: 24, origin: 'Thái Lan', suitableRoomArea: '15 - 20 m²', installationCost: 500_000, features: ['WindFree', 'AI Auto Cooling', 'Wi-Fi'], advantages: ['Không gió buốt', 'Tiết kiệm điện'], disadvantages: ['Linh kiện thay thế đắt'], description: 'Công nghệ làm lạnh không gió thổi trực tiếp.' },
  { brand: 'casper', name: 'Máy lạnh Casper 1 HP', model: 'SC-09FS33', deviceType: 'AIR_CONDITIONER', price: 5_290_000, capacity: '1 HP', inverter: false, coolingCapacity: 9000, powerConsumption: 0.85, energyRating: '3 sao', warrantyMonths: 36, origin: 'Thái Lan', suitableRoomArea: 'Dưới 15 m²', installationCost: 400_000, features: ['Turbo', 'Hẹn giờ'], advantages: ['Giá rẻ', 'Bảo hành 3 năm'], disadvantages: ['Không Inverter'], description: 'Lựa chọn tiết kiệm cho phòng trọ.' },
  { brand: 'toshiba', name: 'Máy lạnh Toshiba Inverter 2 HP', model: 'RAS-H18C4KCVG-V', deviceType: 'AIR_CONDITIONER', price: 17_490_000, capacity: '2 HP', inverter: true, coolingCapacity: 18000, powerConsumption: 1.6, energyRating: '4 sao', warrantyMonths: 24, origin: 'Thái Lan', suitableRoomArea: '20 - 30 m²', installationCost: 600_000, features: ['Hybrid Inverter', 'Lọc bụi mịn PM2.5'], advantages: ['Công suất lớn cho phòng khách'], disadvantages: ['Kích thước dàn nóng lớn'], description: 'Phù hợp phòng khách rộng.' },
  // ---------- TỦ LẠNH ----------
  { brand: 'samsung', name: 'Tủ lạnh Samsung Inverter 236 lít', model: 'RT22M4032BY', deviceType: 'REFRIGERATOR', price: 6_290_000, capacity: '236 lít', inverter: true, powerConsumption: 0.85, energyRating: '4 sao', warrantyMonths: 24, origin: 'Việt Nam', features: ['Digital Inverter', 'Làm lạnh vòng cung'], advantages: ['Vừa túi tiền', 'Tiết kiệm điện'], disadvantages: ['Dung tích nhỏ cho gia đình đông người'], description: 'Tủ lạnh 2 cửa cho gia đình 2–3 người.' },
  { brand: 'lg', name: 'Tủ lạnh LG Inverter 335 lít', model: 'GN-D332BL', deviceType: 'REFRIGERATOR', price: 9_990_000, capacity: '335 lít', inverter: true, powerConsumption: 1.0, energyRating: '5 sao', warrantyMonths: 24, origin: 'Indonesia', features: ['Smart Inverter', 'Door Cooling+', 'Ngăn rau giữ ẩm'], advantages: ['Làm lạnh đều', 'Máy nén bền'], disadvantages: ['Không có lấy nước ngoài'], description: 'Tủ lạnh ngăn đá trên cho gia đình 3–4 người.' },
  { brand: 'panasonic', name: 'Tủ lạnh Panasonic Inverter 255 lít', model: 'NR-BV281BVKV', deviceType: 'REFRIGERATOR', price: 10_490_000, capacity: '255 lít', inverter: true, powerConsumption: 0.9, energyRating: '5 sao', warrantyMonths: 24, origin: 'Việt Nam', features: ['Ngăn đá dưới', 'Prime Fresh', 'Kháng khuẩn Ag+'], advantages: ['Ngăn đá dưới tiện lợi', 'Giữ thực phẩm tươi'], disadvantages: ['Giá cao so với dung tích'], description: 'Ngăn đá dưới, cấp đông mềm Prime Fresh.' },
  { brand: 'aqua', name: 'Tủ lạnh Aqua Inverter 189 lít', model: 'AQR-T219FA', deviceType: 'REFRIGERATOR', price: 4_690_000, capacity: '189 lít', inverter: true, powerConsumption: 0.8, energyRating: '4 sao', warrantyMonths: 24, origin: 'Việt Nam', features: ['Inverter', 'Khử mùi Nano Ag+'], advantages: ['Giá rẻ'], disadvantages: ['Thiết kế đơn giản'], description: 'Tủ lạnh nhỏ gọn cho sinh viên, gia đình trẻ.' },
  { brand: 'hitachi', name: 'Tủ lạnh Hitachi Inverter 569 lít Side by Side', model: 'R-MY800GVGV0', deviceType: 'REFRIGERATOR', price: 32_990_000, capacity: '569 lít', inverter: true, powerConsumption: 1.4, energyRating: '5 sao', warrantyMonths: 24, origin: 'Thái Lan', features: ['Side by Side', 'Lấy nước ngoài', 'Cảm biến Eco'], advantages: ['Dung tích lớn', 'Sang trọng'], disadvantages: ['Giá cao, chiếm diện tích'], description: 'Tủ lạnh cao cấp cho gia đình đông người.' },
  // ---------- TỦ ĐÔNG ----------
  { brand: 'sanaky', name: 'Tủ đông Sanaky 1 ngăn 280 lít', model: 'VH-3699A1', deviceType: 'FREEZER', price: 6_190_000, capacity: '280 lít', inverter: false, powerConsumption: 1.1, energyRating: '3 sao', warrantyMonths: 24, origin: 'Việt Nam', features: ['Dàn lạnh đồng', 'Khóa cửa'], advantages: ['Làm đông nhanh', 'Giá hợp lý'], disadvantages: ['Tốn điện hơn bản Inverter'], description: 'Tủ đông 1 ngăn cho cửa hàng nhỏ.' },
  { brand: 'sanaky', name: 'Tủ đông Sanaky Inverter 2 ngăn 400 lít', model: 'VH-5699W3', deviceType: 'FREEZER', price: 9_490_000, capacity: '400 lít', inverter: true, powerConsumption: 0.9, energyRating: '4 sao', warrantyMonths: 24, origin: 'Việt Nam', features: ['Inverter', '1 ngăn đông + 1 ngăn mát'], advantages: ['Tiết kiệm điện', 'Linh hoạt 2 ngăn'], disadvantages: ['Kích thước lớn'], description: 'Tủ đông mát 2 ngăn cho kinh doanh.' },
  { brand: 'aqua', name: 'Tủ đông Aqua 211 lít', model: 'AQF-C3102S', deviceType: 'FREEZER', price: 5_390_000, capacity: '211 lít', inverter: false, powerConsumption: 1.0, energyRating: '3 sao', warrantyMonths: 24, origin: 'Việt Nam', features: ['Chuyển đổi đông/mát'], advantages: ['Nhỏ gọn cho gia đình'], disadvantages: ['Không Inverter'], description: 'Tủ đông gia đình, chuyển đổi 2 chế độ.' },
];

const ARTICLES = [
  {
    title: 'Cách chọn công suất máy lạnh theo diện tích phòng', slug: 'chon-cong-suat-may-lanh', category: 'AIR_CONDITIONER' as const,
    summary: 'Công thức BTU đơn giản giúp chọn đúng máy, không tốn điện.', readingTime: 4, tags: ['máy lạnh', 'mua sắm', 'BTU'],
    content: 'Quy tắc nhanh: 1 HP ≈ 9.000 BTU cho phòng dưới 15 m², 1.5 HP ≈ 12.000 BTU cho 15–20 m², 2 HP ≈ 18.000 BTU cho 20–30 m². Phòng hướng Tây, tầng thượng hoặc nhiều người nên tăng thêm 1 cấp công suất.',
  },
  {
    title: 'Hướng dẫn vệ sinh máy lạnh tại nhà', slug: 've-sinh-may-lanh-tai-nha', category: 'MAINTENANCE' as const,
    summary: 'Tự vệ sinh lưới lọc 2 tuần/lần giúp máy mát hơn và bền hơn.', readingTime: 6, tags: ['máy lạnh', 'vệ sinh', 'bảo dưỡng'],
    isGuide: true,
    steps: [
      { id: 'step-1', title: 'Ngắt nguồn điện', content: 'Tắt máy và rút điện/ngắt CB trước khi vệ sinh.' },
      { id: 'step-2', title: 'Tháo lưới lọc', content: 'Mở mặt nạ dàn lạnh, kéo nhẹ lưới lọc xuống.' },
      { id: 'step-3', title: 'Rửa lưới lọc', content: 'Rửa bằng nước sạch, dùng bàn chải mềm, phơi khô nơi thoáng.' },
      { id: 'step-4', title: 'Lau mặt nạ và cánh đảo gió', content: 'Dùng khăn ẩm lau sạch bụi.' },
      { id: 'step-5', title: 'Lắp lại và chạy thử', content: 'Lắp lưới lọc khô, bật máy chế độ Cool 25°C trong 10 phút.' },
    ],
    content: 'Vệ sinh lưới lọc định kỳ giúp máy lạnh mát nhanh hơn và tiết kiệm 5–15% điện năng. Vệ sinh toàn bộ dàn nóng, dàn lạnh nên gọi thợ 6 tháng/lần.',
  },
  {
    title: 'Máy lạnh chảy nước: nguyên nhân và cách xử lý', slug: 'may-lanh-chay-nuoc', category: 'AIR_CONDITIONER' as const,
    summary: 'Phần lớn do tắc ống thoát nước – có thể tự xử lý.', readingTime: 5, tags: ['máy lạnh', 'sự cố', 'chảy nước'],
    content: 'Nguyên nhân thường gặp: ống thoát nước bị tắc/gãy, máng nước bẩn, dàn lạnh lắp nghiêng. Cách xử lý: tắt máy, thông ống thoát bằng máy hút bụi, vệ sinh máng nước. Nếu nước chảy gần ổ điện, ngừng dùng ngay.',
  },
  {
    title: 'Dấu hiệu nguy hiểm: mùi khét, khói, rò điện', slug: 'dau-hieu-nguy-hiem-dien-lanh', category: 'SAFETY' as const,
    summary: 'Khi thấy các dấu hiệu này phải ngắt điện ngay.', readingTime: 3, tags: ['an toàn', 'cháy nổ', 'rò điện'],
    content: 'Mùi khét, khói, tia lửa hoặc cảm giác tê khi chạm vào thiết bị là dấu hiệu chập điện. Ngắt cầu dao, không dùng nước dập lửa điện, gọi 114 nếu có cháy và gọi kỹ thuật viên kiểm tra.',
  },
  {
    title: '7 mẹo dùng tủ lạnh tiết kiệm điện', slug: 'meo-tu-lanh-tiet-kiem-dien', category: 'ENERGY_SAVING' as const,
    summary: 'Đặt nhiệt độ đúng và không mở cửa lâu.', readingTime: 4, tags: ['tủ lạnh', 'tiết kiệm điện'],
    content: '1) Ngăn mát 3–5°C, ngăn đá -18°C. 2) Để tủ cách tường 10 cm. 3) Không cho đồ nóng vào tủ. 4) Không mở cửa quá lâu. 5) Không xếp quá đầy. 6) Kiểm tra gioăng cửa. 7) Xả đá định kỳ với tủ đóng tuyết.',
  },
  {
    title: 'Tủ lạnh không đông đá – tự kiểm tra trước khi gọi thợ', slug: 'tu-lanh-khong-dong-da', category: 'REFRIGERATOR' as const,
    summary: 'Kiểm tra gioăng, nút chỉnh nhiệt và dàn lạnh.', readingTime: 5, tags: ['tủ lạnh', 'sự cố'],
    content: 'Kiểm tra nút chỉnh nhiệt độ, gioăng cửa có kín không, dàn lạnh có bị đóng tuyết dày không. Rút điện xả đá 4–6 giờ. Nếu vẫn không đông, có thể hỏng quạt, cảm biến hoặc thiếu gas – cần thợ.',
  },
  {
    title: 'Hướng dẫn sử dụng tủ đông đúng cách', slug: 'su-dung-tu-dong-dung-cach', category: 'FREEZER' as const,
    summary: 'Nhiệt độ, cách xếp và xả đá tủ đông.', readingTime: 4, tags: ['tủ đông', 'hướng dẫn'],
    isGuide: true,
    steps: [
      { id: 'step-1', title: 'Chạy không tải 2–4 giờ', content: 'Lần đầu dùng, cắm điện chạy không tải trước khi cho thực phẩm.' },
      { id: 'step-2', title: 'Đặt nhiệt độ -18°C', content: 'Mức tiêu chuẩn để bảo quản thực phẩm đông lạnh.' },
      { id: 'step-3', title: 'Xếp thực phẩm có khoảng hở', content: 'Không xếp kín để khí lạnh lưu thông.' },
      { id: 'step-4', title: 'Xả đá khi lớp tuyết dày 5 mm', content: 'Rút điện, mở cửa, lau khô rồi chạy lại.' },
    ],
    content: 'Tủ đông cần đặt nơi thoáng, cách tường 10–15 cm, tránh ánh nắng trực tiếp.',
  },
  {
    title: 'Bản nháp: So sánh gas R32 và R410A', slug: 'so-sanh-gas-r32-r410a', category: 'AIR_CONDITIONER' as const,
    summary: 'Bài viết chưa xuất bản (chỉ ADMIN xem được).', readingTime: 5, tags: ['máy lạnh', 'gas'], isPublished: false,
    content: 'R32 có hiệu suất cao hơn và ít ảnh hưởng môi trường hơn R410A...',
  },
];

async function upsertUser(email: string, password: string, fullName: string, role: 'USER' | 'ADMIN', phone: string) {
  const passwordHash = await hashPassword(password);
  return prisma.user.upsert({
    where: { email },
    update: { role, status: 'ACTIVE' },
    create: { email, passwordHash, role, profile: { create: { fullName, phone, address: 'TP. Hồ Chí Minh' } } },
  });
}

async function main() {
  console.log('🌱 Đang tạo dữ liệu mẫu SmartCool AI...');

  // 1. Tài khoản
  const admin = await upsertUser('admin@smartcool.vn', 'Admin@123456', 'Quản trị viên', 'ADMIN', '0900000001');
  const demo = await upsertUser('demo@smartcool.vn', 'Demo@123456', 'Người dùng Demo', 'USER', '0900000002');

  // 2. Thương hiệu
  const brandIds: Record<string, string> = {};
  for (const brand of BRANDS) {
    const row = await prisma.brand.upsert({ where: { slug: brand.slug }, update: brand, create: brand });
    brandIds[brand.slug] = row.id;
  }

  // 3. Sản phẩm
  const productIds: Record<string, string> = {};
  for (const { brand, ...product } of PRODUCTS) {
    const brandId = brandIds[brand]!;
    const row = await prisma.product.upsert({
      where: { brandId_model: { brandId, model: product.model } },
      update: { ...product, isActive: true },
      create: { ...product, brandId, isDemo: true },
    });
    productIds[product.model] = row.id;
  }

  // 4. Bài viết
  for (const article of ARTICLES) {
    const { steps, ...rest } = article as typeof article & { steps?: object[]; isGuide?: boolean; isPublished?: boolean };
    const data = { isPublished: true, isGuide: false, ...rest, ...(steps ? { steps } : {}) };
    await prisma.knowledgeArticle.upsert({ where: { slug: article.slug }, update: data, create: data });
  }

  // 5. Lịch sử mẫu cho tài khoản demo (xóa cũ để không nhân bản khi seed lại)
  await prisma.$transaction([
    prisma.diagnosis.deleteMany({ where: { userId: demo.id, isDemo: true } }),
    prisma.costEstimate.deleteMany({ where: { userId: demo.id, isDemo: true } }),
    prisma.comparison.deleteMany({ where: { userId: demo.id } }),
    prisma.conversation.deleteMany({ where: { userId: demo.id, title: 'Tư vấn máy lạnh phòng 18m²' } }),
  ]);

  const diagnosisInputs = [
    { deviceType: 'AIR_CONDITIONER' as const, brand: 'Daikin', description: 'Máy lạnh chảy nước ở dàn lạnh', symptoms: ['chảy nước'] },
    { deviceType: 'AIR_CONDITIONER' as const, brand: 'LG', description: 'Máy chạy nhưng không mát, báo lỗi', errorCode: 'E4', symptoms: ['không mát'] },
    { deviceType: 'REFRIGERATOR' as const, brand: 'Samsung', description: 'Tủ lạnh không đông đá, ngăn đá đóng tuyết', symptoms: ['không đông đá', 'đóng tuyết'] },
    { deviceType: 'AIR_CONDITIONER' as const, brand: 'Casper', description: 'Có mùi khét và phát khói ở dàn lạnh', symptoms: ['mùi khét'] },
  ];
  for (const input of diagnosisInputs) {
    const a = analyzeDiagnosis(input);
    await prisma.diagnosis.create({
      data: {
        userId: demo.id, ...input, errorCode: input.errorCode ?? null,
        possibleCauses: a.possibleCauses, recommendedActions: a.recommendedActions, safetyWarnings: a.safetyWarnings,
        riskLevel: a.riskLevel, requiresTechnician: a.requiresTechnician,
        estimatedMinCost: a.estimatedMinCost, estimatedMaxCost: a.estimatedMaxCost, isDemo: true,
      },
    });
  }

  const daikin = PRODUCTS.find((p) => p.model === 'FTKB35XVMV')!;
  const items = [{ name: 'Ống đồng (mét)', quantity: 5, unitPrice: 180_000 }, { name: 'Giá đỡ dàn nóng', quantity: 1, unitPrice: 250_000 }, { name: 'CB 20A', quantity: 1, unitPrice: 120_000 }];
  const cost = calculateCost({ quantity: 1, unitPrice: daikin.price, materialCost: 0, laborCost: daikin.installationCost!, extraCost: 0, reservePercent: 10, items });
  await prisma.costEstimate.create({
    data: {
      userId: demo.id, productId: productIds[daikin.model], deviceType: 'AIR_CONDITIONER', serviceType: 'INSTALLATION',
      productName: daikin.name, quantity: 1, unitPrice: daikin.price, materialCost: cost.itemsCost,
      laborCost: daikin.installationCost!, reservePercent: 10, reserveCost: cost.reserveCost, subtotal: cost.subtotal,
      totalCost: cost.totalCost, budget: 15_000_000, items, assumptions: ['Dữ liệu mẫu'], isDemo: true,
    },
  });

  await prisma.comparison.create({
    data: {
      userId: demo.id, firstProductId: productIds['FTKB35XVMV']!, secondProductId: productIds['AR13CYFAAWKNSV']!,
      title: 'Daikin FTKB35XVMV vs Samsung AR13CYFAAWKNSV', userNeeds: { roomArea: 18, priority: 'energy' },
      conclusion: 'Dữ liệu mẫu – tạo so sánh mới qua POST /api/comparisons để xem kết quả tính điểm.',
    },
  });

  await prisma.conversation.create({
    data: {
      userId: demo.id, title: 'Tư vấn máy lạnh phòng 18m²',
      messages: { create: [
        { role: 'USER', content: 'Tư vấn máy lạnh cho phòng 18m², ngân sách 13 triệu', isDemo: true },
        { role: 'ASSISTANT', content: 'Phòng 18 m² nên dùng máy 1.5 HP (12.000 BTU). Gợi ý: Daikin FTKB35XVMV hoặc Samsung WindFree AR13CYFAAWKNSV.', isDemo: true },
      ] },
    },
  });

  const counts = {
    users: await prisma.user.count(), brands: await prisma.brand.count(), products: await prisma.product.count(),
    articles: await prisma.knowledgeArticle.count(), diagnoses: await prisma.diagnosis.count(),
    estimates: await prisma.costEstimate.count(), comparisons: await prisma.comparison.count(),
  };
  console.log('✅ Xong:', counts);
  console.log('👤 ADMIN: admin@smartcool.vn / Admin@123456');
  console.log('👤 USER : demo@smartcool.vn  / Demo@123456');
  void admin;
}

main()
  .catch((error) => { console.error('❌ Seed lỗi:', error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
