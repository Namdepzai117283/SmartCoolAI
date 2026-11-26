// ==========================================
// BỘ LUẬT CHẨN ĐOÁN (rule-based)
// Đặt ở server để mọi client (web, app) cho cùng một kết quả.
// ==========================================

type DeviceType = 'AIR_CONDITIONER' | 'REFRIGERATOR' | 'FREEZER';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'DANGER';

export interface DiagnosisResult {
  possibleCauses: string[];
  recommendedActions: string[];
  safetyWarnings: string[];
  riskLevel: RiskLevel;
  requiresTechnician: boolean;
  estimatedMinCost: number;
  estimatedMaxCost: number;
  matchedRules: string[];
}

// Bỏ dấu tiếng Việt: "Không lạnh" → "khong lanh"
export function stripAccents(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
}

const VIETNAMESE_MARKS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

/**
 * So khớp từ khóa có xét dấu.
 *
 * Lỗi cũ: bỏ dấu cả câu lẫn từ khóa, nên "chảy nước" → "chay nuoc"
 * chứa "chay" = "cháy" → báo nhầm nguy hiểm cháy nổ.
 *
 * Cách sửa: nếu người dùng gõ CÓ dấu thì so khớp nguyên dấu
 * (theo ranh giới từ). Chỉ khi người dùng gõ KHÔNG dấu mới so khớp bỏ dấu.
 *
 * Khi gõ không dấu, các từ ngắn bị trùng nghĩa ("chay" = chạy/chảy/cháy,
 * "on" = ồn/ổn, "hoi" = hôi/hỏi) bị bỏ qua để tránh báo nhầm.
 */
const AMBIGUOUS_WITHOUT_MARKS = new Set(['chay', 'on', 'hoi']);

export function matchesKeyword(text: string, keyword: string): boolean {
  const hasMarks = VIETNAMESE_MARKS.test(text);
  if (!hasMarks && AMBIGUOUS_WITHOUT_MARKS.has(stripAccents(keyword))) return false;
  const source = hasMarks ? text.toLowerCase().normalize('NFC') : stripAccents(text);
  const target = hasMarks ? keyword.toLowerCase().normalize('NFC') : stripAccents(keyword);
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'u').test(source);
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => matchesKeyword(text, keyword));
}

interface Rule {
  id: string;
  devices: DeviceType[];
  keywords: string[];
  causes: string[];
  actions: string[];
  warnings?: string[];
  risk: RiskLevel;
  technician: boolean;
  cost: [number, number];
}

const ALL: DeviceType[] = ['AIR_CONDITIONER', 'REFRIGERATOR', 'FREEZER'];
const COLD: DeviceType[] = ['REFRIGERATOR', 'FREEZER'];

const RULES: Rule[] = [
  {
    id: 'fire',
    devices: ALL,
    keywords: ['cháy', 'mùi khét', 'phát khói', 'bốc khói', 'tia lửa', 'chập điện'],
    causes: ['Chập mạch hoặc quá nhiệt ở bo mạch/dây nguồn', 'Tụ điện hoặc máy nén bị hỏng gây quá nhiệt'],
    actions: ['Ngắt cầu dao điện ngay lập tức', 'Không tự tháo máy, gọi kỹ thuật viên', 'Nếu có lửa, rời khỏi khu vực và gọi 114'],
    warnings: ['Nguy cơ cháy nổ – ngừng sử dụng thiết bị ngay'],
    risk: 'DANGER', technician: true, cost: [500_000, 3_000_000],
  },
  {
    id: 'electric-shock',
    devices: ALL,
    keywords: ['rò điện', 'giật điện', 'chạm điện', 'tê tay'],
    causes: ['Dây nguồn bị hở hoặc thiết bị không nối đất', 'Nước lọt vào bộ phận điện'],
    actions: ['Ngắt điện trước khi chạm vào thiết bị', 'Kiểm tra dây tiếp địa', 'Gọi thợ điện kiểm tra cách điện'],
    warnings: ['Nguy cơ điện giật – không chạm tay ướt vào thiết bị'],
    risk: 'DANGER', technician: true, cost: [200_000, 1_500_000],
  },
  {
    id: 'ac-not-cold',
    devices: ['AIR_CONDITIONER'],
    keywords: ['không lạnh', 'không mát', 'kém lạnh', 'yếu lạnh', 'lạnh yếu'],
    causes: ['Lưới lọc bụi bẩn làm giảm lưu lượng gió', 'Thiếu hoặc rò rỉ gas', 'Dàn nóng bẩn hoặc quạt dàn nóng hỏng', 'Chọn sai công suất so với diện tích phòng'],
    actions: ['Vệ sinh lưới lọc', 'Kiểm tra chế độ Cool và nhiệt độ cài đặt (24–26°C)', 'Gọi thợ đo áp suất gas nếu vẫn không mát'],
    risk: 'MEDIUM', technician: true, cost: [150_000, 800_000],
  },
  {
    id: 'water-leak',
    devices: ['AIR_CONDITIONER'],
    keywords: ['chảy nước', 'rỉ nước', 'nhỏ nước', 'rò nước'],
    causes: ['Ống thoát nước bị tắc hoặc gãy', 'Máng nước dàn lạnh đầy bụi bẩn', 'Lắp dàn lạnh không cân bằng'],
    actions: ['Tắt máy, lau khô khu vực', 'Thông ống thoát nước', 'Vệ sinh dàn lạnh'],
    warnings: ['Ngừng sử dụng nếu nước chảy gần ổ cắm hoặc bộ phận điện'],
    risk: 'LOW', technician: false, cost: [150_000, 400_000],
  },
  {
    id: 'noise',
    devices: ALL,
    keywords: ['kêu to', 'tiếng ồn', 'rung mạnh', 'rung lắc', 'kêu lạch cạch', 'ồn'],
    causes: ['Ốc vít hoặc giá đỡ bị lỏng', 'Cánh quạt chạm vỏ hoặc bám bụi lệch tâm', 'Máy nén hoặc bạc đạn quạt bị mòn'],
    actions: ['Kiểm tra và siết lại giá đỡ, ốc vít', 'Vệ sinh cánh quạt', 'Gọi thợ nếu tiếng kêu phát ra từ máy nén'],
    risk: 'MEDIUM', technician: false, cost: [100_000, 1_200_000],
  },
  {
    id: 'not-start',
    devices: ALL,
    keywords: ['không chạy', 'không lên nguồn', 'không khởi động', 'không hoạt động', 'tắt đột ngột'],
    causes: ['Mất nguồn hoặc nhảy CB', 'Remote hết pin (máy lạnh)', 'Hỏng bo mạch điều khiển hoặc tụ khởi động'],
    actions: ['Kiểm tra ổ cắm, cầu dao', 'Thay pin remote', 'Gọi thợ kiểm tra bo mạch'],
    risk: 'MEDIUM', technician: true, cost: [200_000, 2_000_000],
  },
  {
    id: 'fridge-not-cold',
    devices: COLD,
    keywords: ['không lạnh', 'không đông đá', 'kém lạnh', 'không đông', 'thực phẩm bị hỏng'],
    causes: ['Gioăng cửa hở', 'Dàn lạnh bị đóng tuyết dày', 'Hỏng quạt, cảm biến xả đá hoặc thiếu gas'],
    actions: ['Kiểm tra gioăng cửa và không để cửa mở lâu', 'Không xếp đồ chắn cửa gió', 'Rút điện xả đá 4–6 giờ rồi chạy lại'],
    risk: 'MEDIUM', technician: true, cost: [200_000, 1_500_000],
  },
  {
    id: 'frost',
    devices: COLD,
    keywords: ['đóng tuyết', 'bám tuyết', 'đóng băng'],
    causes: ['Hỏng hệ thống xả đá (timer, sò nóng, điện trở)', 'Gioăng cửa không kín'],
    actions: ['Xả đá thủ công', 'Kiểm tra gioăng cửa', 'Gọi thợ kiểm tra bộ xả đá'],
    risk: 'LOW', technician: true, cost: [200_000, 700_000],
  },
  {
    id: 'smell',
    devices: ALL,
    keywords: ['mùi hôi', 'mùi lạ', 'hôi'],
    causes: ['Nấm mốc, vi khuẩn trong dàn lạnh hoặc khay nước', 'Thực phẩm hỏng (tủ lạnh)'],
    actions: ['Vệ sinh dàn lạnh / khoang tủ', 'Dùng than hoạt tính hoặc baking soda khử mùi'],
    risk: 'LOW', technician: false, cost: [0, 300_000],
  },
];

const ERROR_CODE_HINTS: Record<string, string> = {
  E1: 'Lỗi cảm biến nhiệt độ phòng',
  E4: 'Lỗi cảm biến dàn lạnh / thiếu gas',
  E5: 'Lỗi quá tải máy nén',
  H6: 'Lỗi động cơ quạt dàn lạnh',
  U4: 'Lỗi giao tiếp giữa dàn nóng và dàn lạnh',
  A5: 'Bảo vệ chống đóng băng / quá nhiệt dàn lạnh',
};

const RISK_ORDER: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'DANGER'];

export function analyzeDiagnosis(input: {
  deviceType: DeviceType;
  description?: string | null;
  symptoms?: string[];
  errorCode?: string | null;
}): DiagnosisResult {
  const text = [input.description ?? '', ...(input.symptoms ?? [])].join('. ');
  const matched = RULES.filter((rule) => rule.devices.includes(input.deviceType) && matchesAny(text, rule.keywords));

  const unique = (values: string[]) => [...new Set(values)];
  const causes = unique(matched.flatMap((r) => r.causes));
  const code = input.errorCode?.trim().toUpperCase();
  if (code && ERROR_CODE_HINTS[code]) causes.unshift(`Mã lỗi ${code}: ${ERROR_CODE_HINTS[code]}`);
  else if (code) causes.push(`Mã lỗi ${code}: tra cứu theo sách hướng dẫn của hãng`);

  const risk = matched.reduce<RiskLevel>(
    (acc, r) => (RISK_ORDER.indexOf(r.risk) > RISK_ORDER.indexOf(acc) ? r.risk : acc),
    matched.length ? 'LOW' : 'MEDIUM',
  );

  return {
    possibleCauses: causes.length ? causes : ['Chưa đủ thông tin, cần kỹ thuật viên kiểm tra trực tiếp'],
    recommendedActions: matched.length ? unique(matched.flatMap((r) => r.actions)) : ['Mô tả thêm triệu chứng hoặc mã lỗi để chẩn đoán chính xác hơn'],
    safetyWarnings: unique(matched.flatMap((r) => r.warnings ?? [])),
    riskLevel: risk,
    requiresTechnician: matched.length ? matched.some((r) => r.technician) : true,
    estimatedMinCost: matched.length ? Math.max(...matched.map((r) => r.cost[0])) : 150_000,
    estimatedMaxCost: matched.length ? Math.max(...matched.map((r) => r.cost[1])) : 1_000_000,
    matchedRules: matched.map((r) => r.id),
  };
}
