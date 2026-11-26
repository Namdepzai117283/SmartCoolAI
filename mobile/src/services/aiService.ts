
import {
  AIAction,
  AIConversation,
  AIConversationContext,
  AIImageAttachment,
  AIIntent,
  AIResponse,
  AISendMessageInput,
  DeviceType,
  DiagnosisPayload,
  EstimatePayload,
  ProductRecommendation,
  ServiceType,
  UserNeeds,
  DEVICE_LABELS,
  SERVICE_LABELS,
  calculateEstimate,
  createId,
  createAIMessage,
  createConversationContext,
  createConversationTitle,
  createTransferContext,
  canSendAIMessage,
  formatCurrency,
} from '../types/smartcool';

// ==================================================
// SMARTCOOL AI - AI SERVICE
// ==================================================

type Intent =
  | 'greeting'
  | 'buying'
  | 'compare'
  | 'estimate'
  | 'diagnosis'
  | 'camera'
  | 'knowledge'
  | 'guide'
  | 'energy'
  | 'safety'
  | 'unknown';

// ==================================================
// DỮ LIỆU SẢN PHẨM DEMO
// ==================================================

export const DEMO_PRODUCTS: ProductRecommendation[] = [
  {
    id: 'ac-daikin-10',
    name: 'Daikin Inverter 1 HP',
    brand: 'Daikin',
    deviceType: 'air-conditioner',
    price: 8900000,
    capacity: '1 HP - 9.000 BTU',
    inverter: true,
    description: 'Phù hợp phòng nhỏ, ưu tiên tiết kiệm điện.',
    suitableRoomArea: 'Dưới 15 m²',
    isDemo: true,
  },
  {
    id: 'ac-panasonic-10',
    name: 'Panasonic Inverter 1 HP',
    brand: 'Panasonic',
    deviceType: 'air-conditioner',
    price: 9500000,
    capacity: '1 HP - 9.000 BTU',
    inverter: true,
    description: 'Phù hợp phòng ngủ và phòng làm việc nhỏ.',
    suitableRoomArea: 'Dưới 15 m²',
    isDemo: true,
  },
  {
    id: 'ac-lg-10',
    name: 'LG Dual Inverter 1 HP',
    brand: 'LG',
    deviceType: 'air-conditioner',
    price: 7900000,
    capacity: '1 HP - 9.000 BTU',
    inverter: true,
    description: 'Lựa chọn tham khảo cho ngân sách vừa phải.',
    suitableRoomArea: 'Dưới 15 m²',
    isDemo: true,
  },
  {
    id: 'ac-casper-10',
    name: 'Casper Inverter 1 HP',
    brand: 'Casper',
    deviceType: 'air-conditioner',
    price: 5900000,
    capacity: '1 HP - 9.000 BTU',
    inverter: true,
    description: 'Phù hợp nhu cầu làm lạnh cơ bản.',
    suitableRoomArea: 'Dưới 15 m²',
    isDemo: true,
  },
  {
    id: 'ac-daikin-15',
    name: 'Daikin Inverter 1.5 HP',
    brand: 'Daikin',
    deviceType: 'air-conditioner',
    price: 10500000,
    capacity: '1.5 HP - 12.000 BTU',
    inverter: true,
    description: 'Phù hợp phòng có diện tích trung bình.',
    suitableRoomArea: '15 - 20 m²',
    isDemo: true,
  },
  {
    id: 'ac-panasonic-15',
    name: 'Panasonic Inverter 1.5 HP',
    brand: 'Panasonic',
    deviceType: 'air-conditioner',
    price: 11200000,
    capacity: '1.5 HP - 12.000 BTU',
    inverter: true,
    description: 'Lựa chọn tham khảo cho phòng ngủ và gia đình.',
    suitableRoomArea: '15 - 20 m²',
    isDemo: true,
  },
  {
    id: 'ac-lg-15',
    name: 'LG Dual Inverter 1.5 HP',
    brand: 'LG',
    deviceType: 'air-conditioner',
    price: 9200000,
    capacity: '1.5 HP - 12.000 BTU',
    inverter: true,
    description: 'Phù hợp nhu cầu sử dụng thường xuyên.',
    suitableRoomArea: '15 - 20 m²',
    isDemo: true,
  },
  {
    id: 'ac-casper-15',
    name: 'Casper Inverter 1.5 HP',
    brand: 'Casper',
    deviceType: 'air-conditioner',
    price: 7500000,
    capacity: '1.5 HP - 12.000 BTU',
    inverter: true,
    description: 'Lựa chọn tham khảo trong phân khúc phổ thông.',
    suitableRoomArea: '15 - 20 m²',
    isDemo: true,
  },
  {
    id: 'ac-daikin-20',
    name: 'Daikin Inverter 2 HP',
    brand: 'Daikin',
    deviceType: 'air-conditioner',
    price: 15900000,
    capacity: '2 HP - 18.000 BTU',
    inverter: true,
    description: 'Phù hợp không gian có nhu cầu làm lạnh lớn.',
    suitableRoomArea: '20 - 30 m²',
    isDemo: true,
  },
  {
    id: 'ac-panasonic-20',
    name: 'Panasonic Inverter 2 HP',
    brand: 'Panasonic',
    deviceType: 'air-conditioner',
    price: 16900000,
    capacity: '2 HP - 18.000 BTU',
    inverter: true,
    description: 'Phù hợp phòng khách hoặc không gian rộng.',
    suitableRoomArea: '20 - 30 m²',
    isDemo: true,
  },
  {
    id: 'fr-samsung-236',
    name: 'Samsung Inverter 236 lít',
    brand: 'Samsung',
    deviceType: 'refrigerator',
    price: 6900000,
    capacity: '236 lít',
    inverter: true,
    description: 'Phù hợp gia đình nhỏ.',
    isDemo: true,
  },
  {
    id: 'fr-lg-255',
    name: 'LG Inverter 255 lít',
    brand: 'LG',
    deviceType: 'refrigerator',
    price: 7900000,
    capacity: '255 lít',
    inverter: true,
    description: 'Phù hợp nhu cầu bảo quản thực phẩm hằng ngày.',
    isDemo: true,
  },
  {
    id: 'fr-panasonic-322',
    name: 'Panasonic Inverter 322 lít',
    brand: 'Panasonic',
    deviceType: 'refrigerator',
    price: 10900000,
    capacity: '322 lít',
    inverter: true,
    description: 'Phù hợp gia đình có nhiều thành viên.',
    isDemo: true,
  },
  {
    id: 'fr-toshiba-365',
    name: 'Toshiba Inverter 365 lít',
    brand: 'Toshiba',
    deviceType: 'refrigerator',
    price: 11900000,
    capacity: '365 lít',
    inverter: true,
    description: 'Dung tích lớn, phù hợp nhu cầu lưu trữ nhiều.',
    isDemo: true,
  },
  {
    id: 'fr-samsung-500',
    name: 'Samsung Inverter 500 lít',
    brand: 'Samsung',
    deviceType: 'refrigerator',
    price: 18900000,
    capacity: '500 lít',
    inverter: true,
    description: 'Phù hợp gia đình đông thành viên.',
    isDemo: true,
  },
  {
    id: 'fz-sanaky-220',
    name: 'Sanaky Inverter 220 lít',
    brand: 'Sanaky',
    deviceType: 'freezer',
    price: 6500000,
    capacity: '220 lít',
    inverter: true,
    description: 'Phù hợp nhu cầu bảo quản thực phẩm đông lạnh.',
    isDemo: true,
  },
  {
    id: 'fz-alaska-250',
    name: 'Alaska 250 lít',
    brand: 'Alaska',
    deviceType: 'freezer',
    price: 7200000,
    capacity: '250 lít',
    inverter: false,
    description: 'Phù hợp gia đình hoặc cửa hàng nhỏ.',
    isDemo: true,
  },
  {
    id: 'fz-sanaky-400',
    name: 'Sanaky Inverter 400 lít',
    brand: 'Sanaky',
    deviceType: 'freezer',
    price: 10900000,
    capacity: '400 lít',
    inverter: true,
    description: 'Phù hợp nhu cầu lưu trữ số lượng lớn.',
    isDemo: true,
  },
];

// ==================================================
// CHUẨN HÓA VĂN BẢN
// ==================================================

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

function containsAny(
  text: string,
  keywords: string[]
): boolean {
  const normalized = normalizeText(text);

  return keywords.some((keyword) =>
    normalized.includes(normalizeText(keyword))
  );
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

// ==================================================
// NHẬN BIẾT THIẾT BỊ
// ==================================================

function detectDevice(
  text: string
): DeviceType | undefined {
  if (containsAny(text, ['tủ đông', 'freezer'])) {
    return 'freezer';
  }

  if (containsAny(text, ['tủ lạnh', 'refrigerator'])) {
    return 'refrigerator';
  }

  if (
    containsAny(text, [
      'máy lạnh',
      'điều hòa',
      'điều hoà',
      'air conditioner',
    ])
  ) {
    return 'air-conditioner';
  }

  return undefined;
}

// ==================================================
// NHẬN BIẾT NGÂN SÁCH
// ==================================================

function detectBudget(
  text: string
): number | undefined {
  const normalized = normalizeText(text);

  const million = normalized.match(
    /(\d+(?:[.,]\d+)?)\s*(?:trieu|tr\b|million)/
  );

  if (million) {
    const value = Number(
      million[1].replace(',', '.')
    );

    if (Number.isFinite(value) && value > 0) {
      return Math.round(value * 1000000);
    }
  }

  const thousand = normalized.match(
    /(\d+(?:[.,]\d+)?)\s*(?:nghin|ngan|k\b)/
  );

  if (thousand) {
    const value = Number(
      thousand[1].replace(',', '.')
    );

    if (Number.isFinite(value) && value > 0) {
      return Math.round(value * 1000);
    }
  }

  const currency = normalized.match(
    /(\d[\d.,\s]*\d|\d)\s*(?:vnd|dong|d\b)/
  );

  if (currency) {
    const value = Number(
      currency[1].replace(/[.,\s]/g, '')
    );

    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  const plain = normalized.replace(/[.,\s]/g, '');

  if (/^\d{5,10}$/.test(plain)) {
    return Number(plain);
  }

  return undefined;
}

// ==================================================
// NHẬN BIẾT DIỆN TÍCH
// ==================================================

function detectRoomArea(
  text: string
): number | undefined {
  const match = normalizeText(text).match(
    /(\d+(?:[.,]\d+)?)\s*(?:m2|m²|met vuong)/
  );

  if (!match) return undefined;

  const value = Number(
    match[1].replace(',', '.')
  );

  return value > 0 ? value : undefined;
}

// ==================================================
// NHẬN BIẾT SỐ NGƯỜI
// ==================================================

function detectHouseholdSize(
  text: string
): number | undefined {
  const match = normalizeText(text).match(
    /(\d+)\s*(?:nguoi|thanh vien)/
  );

  if (!match) return undefined;

  const value = Number(match[1]);

  return value > 0 ? value : undefined;
}

// ==================================================
// NHẬN BIẾT CÔNG SUẤT
// ==================================================

function detectCapacity(
  text: string
): string | undefined {
  const normalized = normalizeText(text);

  const hp = normalized.match(
    /(\d+(?:[.,]\d+)?)\s*(?:hp|ngua)\b/
  );

  if (hp) {
    return `${Number(
      hp[1].replace(',', '.')
    )} HP`;
  }

  const btu = normalized.match(
    /(\d[\d.,]*)\s*btu/
  );

  if (btu) {
    const value = Number(
      btu[1].replace(/[.,]/g, '')
    );

    if (value === 9000) return '1 HP';
    if (value === 12000) return '1.5 HP';
    if (value === 18000) return '2 HP';
  }

  return undefined;
}

// ==================================================
// NHẬN BIẾT THƯƠNG HIỆU
// ==================================================

function detectBrands(text: string): string[] {
  const normalized = normalizeText(text);

  const brands = [
    'Daikin',
    'Panasonic',
    'LG',
    'Samsung',
    'Toshiba',
    'Casper',
    'Sharp',
    'Aqua',
    'Mitsubishi',
    'Gree',
    'Midea',
    'Sanaky',
    'Alaska',
    'Electrolux',
    'Hitachi',
  ];

  return brands
    .filter((brand) =>
      new RegExp(
        `\\b${normalizeText(brand)}\\b`,
        'i'
      ).test(normalized)
    )
    .sort(
      (a, b) =>
        normalized.indexOf(normalizeText(a)) -
        normalized.indexOf(normalizeText(b))
    );
}

// ==================================================
// NHẬN BIẾT LOẠI DỊCH VỤ
// ==================================================

function detectService(
  text: string
): ServiceType | undefined {
  if (
    containsAny(text, [
      'sửa chữa',
      'sửa máy',
      'sửa tủ',
      'giá sửa',
      'thay linh kiện',
      'khắc phục',
    ])
  ) {
    return 'repair';
  }

  if (
    containsAny(text, [
      'bảo dưỡng',
      'bảo trì',
      'vệ sinh',
    ])
  ) {
    return 'maintenance';
  }

  if (
    containsAny(text, [
      'mua mới',
      'lắp đặt',
      'lắp máy',
      'mua máy',
      'mua tủ',
      'mua và lắp',
    ])
  ) {
    return 'installation';
  }

  return undefined;
}

// ==================================================
// NHẬN BIẾT TRIỆU CHỨNG
// ==================================================

function detectSymptoms(text: string): string[] {
  const rules = [
    {
      keywords: [
        'không mát',
        'không lạnh',
        'không làm lạnh',
      ],
      label: 'Không làm lạnh',
    },
    {
      keywords: [
        'lạnh yếu',
        'mát yếu',
        'không đủ lạnh',
      ],
      label: 'Làm lạnh yếu',
    },
    {
      keywords: [
        'không đông',
        'không đông đá',
      ],
      label: 'Không đông đá',
    },
    {
      keywords: [
        'chảy nước',
        'rỉ nước',
        'rò nước',
      ],
      label: 'Chảy nước',
    },
    {
      keywords: [
        'tiếng ồn',
        'kêu to',
        'kêu lớn',
        'rung mạnh',
      ],
      label: 'Tiếng ồn hoặc rung bất thường',
    },
    {
      keywords: [
        'không chạy',
        'không lên nguồn',
        'không khởi động',
        'không bật được',
      ],
      label: 'Không khởi động',
    },
    {
      keywords: [
        'đóng tuyết',
        'đóng đá bất thường',
      ],
      label: 'Đóng tuyết bất thường',
    },
    {
      keywords: ['mùi hôi'],
      label: 'Có mùi khó chịu',
    },
    {
      keywords: [
        'mùi khét',
        'phát khói',
        'bốc khói',
        'cháy',
      ],
      label: 'Có dấu hiệu cháy hoặc quá nhiệt',
    },
    {
      keywords: [
        'rò điện',
        'giật điện',
        'chạm điện',
      ],
      label: 'Có nguy cơ điện giật',
    },
    {
      keywords: ['báo lỗi', 'mã lỗi'],
      label: 'Hiển thị mã lỗi',
    },
  ];

  return rules
    .filter((rule) =>
      containsAny(text, rule.keywords)
    )
    .map((rule) => rule.label);
}

function detectErrorCode(
  text: string
): string | undefined {
  const normalized = normalizeText(text);

  const match = normalized.match(
    /\b(?:[a-z]{1,2}\d{1,3})\b/i
  );

  if (!match) return undefined;

  const value = match[0].toUpperCase();

  if (/^(M2|M3|HP|BTU)$/.test(value)) {
    return undefined;
  }

  return value;
}

// ==================================================
// NHẬN BIẾT Ý ĐỊNH
// ==================================================

export function detectIntent(
  question: string
): Intent {
  const text = normalizeText(question);

  if (
    containsAny(text, [
      'rò điện',
      'giật điện',
      'mùi khét',
      'phát khói',
      'bốc khói',
      'cháy',
    ])
  ) {
    return 'safety';
  }

  if (
    containsAny(text, [
      'so sánh',
      'khác nhau',
      'loại nào tốt hơn',
      'hãng nào tốt hơn',
      'nên chọn loại nào',
    ])
  ) {
    return 'compare';
  }

  if (
    containsAny(text, [
      'dự toán',
      'dự đoán chi phí',
      'ước tính',
      'chi phí',
      'bao nhiêu tiền',
      'giá sửa',
      'giá lắp',
      'giá thành',
      'cần chuẩn bị bao nhiêu',
      'tính tiền',
      'tổng cộng',
      'tổng giá',
    ])
  ) {
    return 'estimate';
  }

  if (
    detectSymptoms(text).length > 0 ||
    detectErrorCode(text) ||
    containsAny(text, [
      'chẩn đoán',
      'chuẩn đoán',
      'bị hỏng',
      'bị lỗi',
      'sự cố',
      'trục trặc',
    ])
  ) {
    return 'diagnosis';
  }

  if (
    containsAny(text, [
      'chụp ảnh',
      'camera',
      'gửi ảnh',
      'hình ảnh',
      'nhận diện',
      'quét tem',
      'ảnh này',
    ])
  ) {
    return 'camera';
  }

  if (
    containsAny(text, [
      'mua',
      'tư vấn',
      'chọn máy',
      'chọn tủ',
      'ngân sách',
      'tầm giá',
      'lắp máy mới',
    ])
  ) {
    return 'buying';
  }

  if (
    containsAny(text, [
      'là gì',
      'nguyên lý',
      'hoạt động như thế nào',
      'kiến thức',
      'môi chất lạnh',
      'công nghệ inverter',
    ])
  ) {
    return 'knowledge';
  }

  if (
    containsAny(text, [
      'tiết kiệm điện',
      'tốn điện',
      'tiền điện',
      'điện năng',
    ])
  ) {
    return 'energy';
  }

  if (
    containsAny(text, [
      'vệ sinh',
      'bảo dưỡng',
      'bảo trì',
      'hướng dẫn',
      'cách sử dụng',
    ])
  ) {
    return 'guide';
  }

  if (
    ['hi', 'hello', 'chao', 'xin chao'].includes(
      text
    )
  ) {
    return 'greeting';
  }

  return 'unknown';
}

// ==================================================
// TRÍCH XUẤT THÔNG TIN NGƯỜI DÙNG
// ==================================================

export function extractUserNeeds(
  question: string,
  previousNeeds: UserNeeds = {}
): UserNeeds {
  const text = normalizeText(question);

  let needs: UserNeeds = {
    ...previousNeeds,
  };

  const deviceType = detectDevice(text);
  const budget = detectBudget(text);
  const roomArea = detectRoomArea(text);
  const householdSize = detectHouseholdSize(text);
  const capacity = detectCapacity(text);
  const brands = detectBrands(text);
  const symptoms = detectSymptoms(text);
  const errorCode = detectErrorCode(text);
  const serviceType = detectService(text);

  if (
    deviceType &&
    previousNeeds.deviceType &&
    deviceType !== previousNeeds.deviceType
  ) {
    needs = {};
  }

  if (deviceType) {
    needs.deviceType = deviceType;
  }

  if (budget !== undefined) {
    needs.budget = budget;
  }

  if (roomArea !== undefined) {
    needs.roomArea = roomArea;

    if (!capacity) {
      delete needs.preferredCapacity;
    }
  }

  if (householdSize !== undefined) {
    needs.householdSize = householdSize;
  }

  if (capacity) {
    needs.preferredCapacity = capacity;
  }

  if (brands.length > 0) {
    needs.preferredBrands = brands;
    needs.brand = brands[0];
  }

  if (
    containsAny(text, [
      'hãng nào cũng được',
      'không quan trọng hãng',
      'không giới hạn hãng',
    ])
  ) {
    needs.preferredBrands = [];
    delete needs.brand;
  }

  if (symptoms.length > 0) {
    needs.symptoms = uniqueStrings([
      ...(needs.symptoms ?? []),
      ...symptoms,
    ]);

    needs.description = question;
  }

  if (errorCode) {
    needs.errorCode = errorCode;
  }

  if (serviceType) {
    needs.serviceType = serviceType;
  }

  if (
    containsAny(text, [
      'không cần inverter',
      'không cần tiết kiệm điện',
    ])
  ) {
    needs.energySaving = false;
    needs.preferredInverter = undefined;
  } else if (
    containsAny(text, [
      'tiết kiệm điện',
      'ít tốn điện',
      'inverter',
    ])
  ) {
    needs.energySaving = true;
  }

  const roomTypes = [
    'phòng ngủ',
    'phòng khách',
    'phòng làm việc',
    'cửa hàng',
  ];

  const roomType = roomTypes.find((item) =>
    containsAny(text, [item])
  );

  if (roomType) {
    needs.roomType = roomType;
    needs.purpose = question;
  }

  const hours = text.match(
    /(\d+(?:[.,]\d+)?)\s*(?:gio|tieng)\s*(?:\/\s*ngay|moi ngay)/
  );

  if (hours) {
    const value = Number(
      hours[1].replace(',', '.')
    );

    if (value > 0 && value <= 24) {
      needs.usageHoursPerDay = value;
    }
  }

  const quantity = text.match(
    /(\d+)\s*(?:cai|chiec|bo|may)\b/
  );

  if (quantity) {
    const value = Number(quantity[1]);

    if (value > 0 && value <= 100) {
      needs.quantity = value;
    }
  }

  if (
    containsAny(text, [
      'nắng trực tiếp',
      'phòng nhiều nắng',
      'hướng tây',
    ])
  ) {
    needs.sunlightExposure = true;
  }

  return needs;
}

// ==================================================
// LẤY TIN NHẮN AI GẦN NHẤT
// ==================================================

function getLastAssistant(
  conversation?: AIConversation
) {
  return conversation?.messages
    .slice()
    .reverse()
    .find(
      (message) => message.role === 'assistant'
    );
}

// ==================================================
// KHÔI PHỤC NHU CẦU TỪ HỘI THOẠI
// ==================================================

function recoverUserNeeds(
  conversation?: AIConversation
): UserNeeds {
  if (!conversation) return {};

  let needs: UserNeeds = {};

  for (const message of conversation.messages) {
    if (message.role === 'user') {
      needs = extractUserNeeds(
        message.content,
        needs
      );
    }
  }

  return {
    ...needs,
    ...conversation.userNeeds,
    ...conversation.context?.userNeeds,
  };
}

// ==================================================
// NHẬN BIẾT NGỮ CẢNH TRƯỚC ĐÓ
// ==================================================

function getPreviousIntent(
  conversation?: AIConversation
): Intent {
  const contextIntent =
    conversation?.context?.intent;

  if (
    contextIntent === 'buying' ||
    contextIntent === 'compare' ||
    contextIntent === 'estimate' ||
    contextIntent === 'diagnosis' ||
    contextIntent === 'guide'
  ) {
    return contextIntent;
  }

  if (contextIntent === 'image-analysis') {
    return 'camera';
  }

  const lastAssistant =
    getLastAssistant(conversation);

  if (
    lastAssistant?.intent === 'buying' ||
    lastAssistant?.intent === 'compare' ||
    lastAssistant?.intent === 'estimate' ||
    lastAssistant?.intent === 'diagnosis'
  ) {
    return lastAssistant.intent;
  }

  const messages =
    conversation?.messages
      .slice()
      .reverse() ?? [];

  for (const message of messages) {
    if (message.role !== 'user') continue;

    const intent = detectIntent(
      message.content
    );

    if (
      intent !== 'unknown' &&
      intent !== 'greeting'
    ) {
      return intent;
    }
  }

  return 'unknown';
}

// ==================================================
// CHUYỂN Ý ĐỊNH SANG KIỂU DỮ LIỆU CHUNG
// ==================================================

function toAIIntent(intent: Intent): AIIntent {
  switch (intent) {
    case 'buying':
      return 'buying';

    case 'compare':
      return 'compare';

    case 'estimate':
      return 'estimate';

    case 'diagnosis':
    case 'safety':
      return 'diagnosis';

    case 'camera':
      return 'image-analysis';

    case 'guide':
    case 'energy':
      return 'guide';

    default:
      return 'general';
  }
}

// ==================================================
// TẠO PHẢN HỒI HỎI THÊM THÔNG TIN
// ==================================================

function askForInformation(
  content: string,
  needs: UserNeeds,
  intent: AIIntent,
  waitingFor: keyof UserNeeds
): AIResponse {
  return {
    content,
    userNeeds: needs,
    intent,
    isDemo: true,
    context: {
      intent,
      stage: 'collecting-information',
      userNeeds: needs,
      waitingFor,
      missingInformation: [
        String(waitingFor),
      ],
      updatedAt: Date.now(),
    },
  };
}

// ==================================================
// XỬ LÝ CÂU TRẢ LỜI NGẮN
// ==================================================

function applyShortAnswer(
  question: string,
  needs: UserNeeds,
  conversation?: AIConversation
): UserNeeds {
  const text = normalizeText(question);

  const result: UserNeeds = {
    ...needs,
  };

  const waitingFor =
    conversation?.context?.waitingFor;

  const lastAssistant = normalizeText(
    getLastAssistant(conversation)?.content ?? ''
  );

  const numericText = text.replace(',', '.');

  const number = /^\d+(?:\.\d+)?$/.test(
    numericText
  )
    ? Number(numericText)
    : undefined;

  if (
    number !== undefined &&
    number > 0
  ) {
    if (
      waitingFor === 'roomArea' ||
      (
        !waitingFor &&
        lastAssistant.includes('dien tich')
      )
    ) {
      if (number <= 10000) {
        result.roomArea = number;
        delete result.preferredCapacity;
      }
    } else if (
      waitingFor === 'householdSize' ||
      (
        !waitingFor &&
        lastAssistant.includes('bao nhieu nguoi')
      )
    ) {
      if (
        Number.isInteger(number) &&
        number <= 100
      ) {
        result.householdSize = number;
      }
    } else if (
      waitingFor === 'budget' ||
      (
        !waitingFor &&
        lastAssistant.includes('ngan sach')
      )
    ) {
      result.budget =
        number < 1000
          ? number * 1000000
          : number;
    } else if (
      waitingFor === 'quantity'
    ) {
      if (
        Number.isInteger(number) &&
        number <= 100
      ) {
        result.quantity = number;
      }
    }
  }

  if (waitingFor === 'serviceType') {
    if (
      containsAny(text, [
        'mua mới',
        'mua',
        'lắp mới',
      ])
    ) {
      result.serviceType = 'installation';
    } else if (
      containsAny(text, [
        'sửa',
        'sửa chữa',
      ])
    ) {
      result.serviceType = 'repair';
    } else if (
      containsAny(text, [
        'vệ sinh',
        'bảo dưỡng',
      ])
    ) {
      result.serviceType = 'maintenance';
    }
  }

  if (waitingFor === 'symptoms') {
    if (
      question.trim() &&
      !(result.symptoms?.length)
    ) {
      result.symptoms = [
        question.trim(),
      ];
      result.description = question;
    }
  }

  return result;
}

// ==================================================
// CÔNG SUẤT MÁY LẠNH THAM KHẢO
// ==================================================

function getRecommendedCapacity(
  area: number
): string | undefined {
  if (area <= 0) return undefined;

  if (area <= 15) return '1 HP';

  if (area <= 20) return '1.5 HP';

  if (area <= 30) return '2 HP';

  return undefined;
}

// ==================================================
// ĐỀ XUẤT SẢN PHẨM
// ==================================================

export function recommendProducts(
  needs: UserNeeds
): ProductRecommendation[] {
  if (!needs.deviceType) return [];

  let products = DEMO_PRODUCTS.filter(
    (product) =>
      product.deviceType === needs.deviceType
  );

  if (
    needs.deviceType === 'air-conditioner'
  ) {
    const capacity =
      needs.preferredCapacity ??
      (
        needs.roomArea
          ? getRecommendedCapacity(
              needs.roomArea
            )
          : undefined
      );

    if (
      needs.roomArea &&
      needs.roomArea > 30 &&
      !needs.preferredCapacity
    ) {
      return [];
    }

    if (capacity) {
      products = products.filter(
        (product) =>
          product.capacity.startsWith(
            `${capacity} -`
          )
      );
    }
  }

  if (
    needs.deviceType === 'refrigerator' &&
    needs.householdSize
  ) {
    const minimumCapacity =
      needs.householdSize <= 2
        ? 150
        : needs.householdSize <= 4
        ? 250
        : 350;

    products = products.filter(
      (product) =>
        parseInt(product.capacity, 10) >=
        minimumCapacity
    );
  }

  if (needs.budget !== undefined) {
    const budget = needs.budget;

    products = products.filter(
      (product) => product.price <= budget
    );
  }

  if (
    needs.energySaving ||
    needs.preferredInverter
  ) {
    products = products.filter(
      (product) => product.inverter
    );
  }

  const preferredBrands =
    needs.preferredBrands ?? [];

  if (preferredBrands.length > 0) {
    products = products.filter(
      (product) =>
        preferredBrands.includes(product.brand)
    );
  }

  return [...products]
    .sort((a, b) => a.price - b.price)
    .slice(0, 3)
    .map((product) => ({
      ...product,
      recommendationReason:
        'Phù hợp các tiêu chí hiện tại trong danh mục demo.',
      isDemo: true,
    }));
}

// ==================================================
// LẤY SẢN PHẨM TỪ HỘI THOẠI
// ==================================================

function getPreviousProducts(
  conversation?: AIConversation,
  needs?: UserNeeds
): ProductRecommendation[] {
  const products =
    conversation?.context?.recommendations ??
    conversation?.recommendations ??
    conversation?.messages
      .slice()
      .reverse()
      .find(
        (message) =>
          (message.recommendations?.length ?? 0) > 0
      )?.recommendations ??
    [];

  return products.filter((product) => {
    if (
      needs?.deviceType &&
      product.deviceType !== needs.deviceType
    ) {
      return false;
    }

    if (
      needs?.budget !== undefined &&
      product.price > needs.budget
    ) {
      return false;
    }

    if (
      needs?.preferredBrands?.length &&
      !needs.preferredBrands.includes(
        product.brand
      )
    ) {
      return false;
    }

    const capacity =
      needs?.preferredCapacity ??
      (
        needs?.roomArea
          ? getRecommendedCapacity(
              needs.roomArea
            )
          : undefined
      );

    if (
      product.deviceType === 'air-conditioner' &&
      capacity &&
      !product.capacity.startsWith(
        `${capacity} -`
      )
    ) {
      return false;
    }

    if (
      needs?.energySaving &&
      !product.inverter
    ) {
      return false;
    }

    if (
      product.deviceType === 'refrigerator' &&
      needs?.householdSize
    ) {
      const minimum =
        needs.householdSize <= 2
          ? 150
          : needs.householdSize <= 4
          ? 250
          : 350;

      if (
        parseInt(product.capacity, 10) <
        minimum
      ) {
        return false;
      }
    }

    return true;
  });
}

// ==================================================
// NHẬN BIẾT SẢN PHẨM NGƯỜI DÙNG CHỌN
// ==================================================

function selectProductFromQuestion(
  question: string,
  products: ProductRecommendation[]
): ProductRecommendation | undefined {
  const text = normalizeText(question);

  const fullName = products.find(
    (product) =>
      text.includes(
        normalizeText(product.name)
      )
  );

  if (fullName) return fullName;

  const indexMatch = text.match(
    /(?:san pham|mau|loai|so|may)\s*(?:so\s*)?([1-3])\b/
  );

  if (indexMatch) {
    return products[
      Number(indexMatch[1]) - 1
    ];
  }

  if (
    containsAny(text, [
      'đầu tiên',
      'thứ nhất',
      'rẻ nhất',
    ])
  ) {
    if (containsAny(text, ['rẻ nhất'])) {
      return [...products].sort(
        (a, b) => a.price - b.price
      )[0];
    }

    return products[0];
  }

  if (containsAny(text, ['thứ hai'])) {
    return products[1];
  }

  if (containsAny(text, ['thứ ba'])) {
    return products[2];
  }

  const brands = detectBrands(text);

  if (brands.length === 1) {
    const matches = products.filter(
      (product) =>
        product.brand === brands[0]
    );

    if (matches.length === 1) {
      return matches[0];
    }
  }

  return undefined;
}

// ==================================================
// TẠO DỰ TOÁN CHI PHÍ
// ==================================================

export function createEstimate(
  needs: UserNeeds,
  question: string,
  product?: ProductRecommendation
): EstimatePayload | undefined {
  if (!needs.deviceType) {
    return undefined;
  }

  const serviceType =
    detectService(question) ??
    needs.serviceType ??
    (
      product
        ? 'installation'
        : needs.symptoms?.length
        ? 'repair'
        : undefined
    );

  const quantity = needs.quantity ?? 1;

  if (serviceType === 'repair') {
    return {
      source: 'ai-chat',
      deviceType: needs.deviceType,
      serviceType: 'repair',
      quantity,
      unitPrice: 0,
      materialCost: 350000 * quantity,
      laborCost: 250000 * quantity,
      extraCost: 100000 * quantity,
      reservePercent: 15,
      userNeeds: needs,
      budget: needs.budget,
      isDemo: true,
      assumptions: [
        'Chi phí minh họa cho tình huống sửa chữa giả định.',
        'Chưa xác định linh kiện hỏng thực tế.',
      ],
      note:
        'Cần kỹ thuật viên kiểm tra trước khi báo giá.',
    };
  }

  if (serviceType === 'maintenance') {
    return {
      source: 'ai-chat',
      deviceType: needs.deviceType,
      serviceType: 'maintenance',
      quantity,
      unitPrice: 0,
      materialCost: 50000 * quantity,
      laborCost: 200000 * quantity,
      extraCost: 50000 * quantity,
      reservePercent: 10,
      userNeeds: needs,
      budget: needs.budget,
      isDemo: true,
      note:
        'Chi phí bảo dưỡng minh họa, chưa phải báo giá thực tế.',
    };
  }

  if (!product) {
    return undefined;
  }

  const isAirConditioner =
    needs.deviceType === 'air-conditioner';

  return {
    source: 'ai-chat',
    deviceType: needs.deviceType,
    serviceType: 'installation',
    productName: product.name,
    product,
    quantity,
    unitPrice: product.price,
    materialCost:
      (isAirConditioner ? 750000 : 0) *
      quantity,
    laborCost:
      (isAirConditioner ? 350000 : 0) *
      quantity,
    extraCost: 200000 * quantity,
    reservePercent: 5,
    userNeeds: needs,
    budget: needs.budget,
    isDemo: true,
    assumptions: [
      'Giá thiết bị lấy từ danh mục demo.',
      'Điều kiện lắp đặt thông thường.',
      'Chưa khảo sát vị trí thi công.',
    ],
    note:
      'Chi phí thực tế phụ thuộc thiết bị, vật tư và điều kiện lắp đặt.',
  };
}

// ==================================================
// TẠO NÚT TƯ VẤN
// ==================================================

function createBuyingAction(
  needs: UserNeeds,
  products: ProductRecommendation[],
  conversation?: AIConversation
): AIAction {
  return {
    id: createId(),
    label: 'Xem thiết bị AI đã tư vấn',
    feature: 'budget',
    payload: {
      ...createTransferContext(
        conversation?.id
      ),
      userNeeds: needs,
      recommendations: products,
      recommendedProductId:
        products[0]?.id,
      budget: needs.budget,
      adviceSummary:
        'Danh sách thiết bị được đề xuất từ cuộc trò chuyện.',
      isDemo: true,
    },
  };
}

// ==================================================
// TẠO NÚT SO SÁNH
// ==================================================

function createCompareAction(
  first: ProductRecommendation,
  second: ProductRecommendation,
  needs: UserNeeds,
  conversation?: AIConversation
): AIAction {
  return {
    id: createId(),
    label: 'So sánh hai thiết bị này',
    feature: 'compare',
    payload: {
      ...createTransferContext(
        conversation?.id
      ),
      firstProduct: first,
      secondProduct: second,
      userNeeds: needs,
      comparisonReason:
        'Hai thiết bị được lựa chọn trong cuộc trò chuyện.',
      comparisonCriteria: [
        'Giá bán',
        'Công suất hoặc dung tích',
        'Công nghệ Inverter',
        'Mức độ phù hợp nhu cầu',
      ],
    },
  };
}

// ==================================================
// TẠO NÚT DỰ TOÁN
// ==================================================

function createEstimateAction(
  estimate: EstimatePayload,
  conversation?: AIConversation
): AIAction {
  return {
    id: createId(),
    label: 'Xem bảng dự toán AI đã tính',
    feature: 'estimate',
    payload: {
      ...estimate,
      ...createTransferContext(
        conversation?.id
      ),
    },
  };
}

// ==================================================
// TẠO NÚT CHẨN ĐOÁN
// ==================================================

function createDiagnosisAction(
  diagnosis: DiagnosisPayload,
  conversation?: AIConversation
): AIAction {
  return {
    id: createId(),
    label: 'Xem kết quả chẩn đoán chi tiết',
    feature: 'diagnosis',
    payload: {
      ...diagnosis,
      ...createTransferContext(
        conversation?.id
      ),
    },
  };
}

// ==================================================
// TẠO NÚT THƯ VIỆN
// ==================================================

function createLibraryAction(
  question: string
): AIAction {
  return {
    id: createId(),
    label: 'Xem thư viện kiến thức',
    feature: 'library',
    payload: {
      source: 'ai-chat',
      question,
      keyword: question,
    },
  };
}

// ==================================================
// TẠO NÚT HƯỚNG DẪN
// ==================================================

function createGuideAction(
  question: string
): AIAction {
  return {
    id: createId(),
    label: 'Xem hướng dẫn từng bước',
    feature: 'guide',
    payload: {
      source: 'ai-chat',
      question,
      keyword: question,
    },
  };
}

// ==================================================
// XỬ LÝ TƯ VẤN MUA THIẾT BỊ
// ==================================================

function handleBuying(
  needs: UserNeeds,
  conversation?: AIConversation
): AIResponse {
  if (!needs.deviceType) {
    return askForInformation(
      'Bạn đang muốn mua loại thiết bị nào?\n\n' +
        '• Máy lạnh\n' +
        '• Tủ lạnh\n' +
        '• Tủ đông',
      needs,
      'buying',
      'deviceType'
    );
  }

  if (
    needs.deviceType === 'air-conditioner' &&
    !needs.roomArea &&
    !needs.preferredCapacity
  ) {
    return askForInformation(
      'Bạn dự định sử dụng máy lạnh cho phòng có diện tích bao nhiêu m²?\n\n' +
        'Ví dụ: 15m2, 20m2 hoặc 25m2.',
      needs,
      'buying',
      'roomArea'
    );
  }

  if (
    needs.deviceType === 'refrigerator' &&
    !needs.householdSize
  ) {
    return askForInformation(
      'Gia đình bạn có khoảng bao nhiêu người?\n\n' +
        'Tôi sẽ dựa vào số thành viên để gợi ý dung tích phù hợp.',
      needs,
      'buying',
      'householdSize'
    );
  }

  if (!needs.budget) {
    const areaText = needs.roomArea
      ? `Với phòng ${needs.roomArea} m², tôi đã ghi nhận nhu cầu của bạn.\n\n`
      : '';

    return askForInformation(
      areaText +
        'Bạn dự kiến ngân sách mua thiết bị khoảng bao nhiêu?\n\n' +
        'Ví dụ: 8 triệu, 12 triệu hoặc 20 triệu.',
      needs,
      'buying',
      'budget'
    );
  }

  const products = recommendProducts(needs);

  if (products.length === 0) {
    return {
      content:
        'Danh mục demo hiện chưa có thiết bị đáp ứng đầy đủ các tiêu chí của bạn.\n\n' +
        'Bạn có thể điều chỉnh ngân sách, thương hiệu hoặc công suất.\n\n' +
        'Nếu phòng lớn hoặc có tải nhiệt cao, nên khảo sát trước khi chọn máy.',
      userNeeds: needs,
      recommendations: [],
      intent: 'buying',
      isDemo: true,
      context: {
        intent: 'buying',
        stage: 'collecting-information',
        userNeeds: needs,
        recommendations: [],
        updatedAt: Date.now(),
      },
    };
  }

  let content =
    'Dựa trên thông tin bạn đã cung cấp, tôi đã tìm được những thiết bị phù hợp để tham khảo.\n\n';

  content +=
    `Thiết bị: ${DEVICE_LABELS[needs.deviceType]}\n`;

  if (needs.roomArea) {
    content +=
      `Diện tích phòng: ${needs.roomArea} m²\n`;
  }

  if (needs.householdSize) {
    content +=
      `Số thành viên: ${needs.householdSize} người\n`;
  }

  content +=
    `Ngân sách mua thiết bị: ${formatCurrency(needs.budget)}\n\n`;

  products.forEach((product, index) => {
    content +=
      `${index + 1}. ${product.name}\n` +
      `Giá tham khảo: ${formatCurrency(product.price)}\n` +
      `Thông số: ${product.capacity}\n` +
      `${product.description}\n\n`;
  });

  content +=
    'Nếu ưu tiên giá mua thấp trong danh sách này, ' +
    `${products[0].name} là lựa chọn đáng xem xét.\n\n`;

  const actions: AIAction[] = [
    createBuyingAction(
      needs,
      products,
      conversation
    ),
  ];

  if (products.length >= 2) {
    content +=
      `Bạn có muốn so sánh ${products[0].name} ` +
      `với ${products[1].name} không?\n\n`;

    actions.push(
      createCompareAction(
        products[0],
        products[1],
        needs,
        conversation
      )
    );
  }

  content +=
    'Bạn cũng có thể chọn một sản phẩm để tôi tính tổng chi phí cần chuẩn bị, bao gồm cả lắp đặt.\n\n' +
    'Lưu ý: Sản phẩm và giá hiện sử dụng dữ liệu demo. Công suất chỉ mang tính tham khảo.';

  return {
    content,
    actions,
    recommendations: products,
    userNeeds: needs,
    intent: 'buying',
    isDemo: true,
    context: {
      intent: 'buying',
      stage: 'waiting-confirmation',
      userNeeds: needs,
      recommendations: products,
      updatedAt: Date.now(),
    },
  };
}

// ==================================================
// XỬ LÝ SO SÁNH
// ==================================================

function handleCompare(
  question: string,
  needs: UserNeeds,
  conversation?: AIConversation
): AIResponse {
  const previousProducts =
    getPreviousProducts(
      conversation,
      needs
    );

  if (
    !needs.deviceType &&
    previousProducts.length === 0
  ) {
    return askForInformation(
      'Bạn muốn so sánh máy lạnh, tủ lạnh hay tủ đông?',
      needs,
      'compare',
      'deviceType'
    );
  }

  const brands = detectBrands(question);

  const allBrands =
    brands.length >= 2
      ? brands
      : needs.preferredBrands ?? [];

  let products =
    previousProducts.length >= 2
      ? previousProducts
      : recommendProducts(needs);

  if (allBrands.length >= 2) {
    if (
      needs.deviceType === 'air-conditioner' &&
      !needs.roomArea &&
      !needs.preferredCapacity
    ) {
      return askForInformation(
        'Bạn muốn so sánh hai máy lạnh có công suất bao nhiêu HP, hoặc dùng cho phòng bao nhiêu m²?',
        needs,
        'compare',
        'roomArea'
      );
    }

    const candidates = DEMO_PRODUCTS.filter(
      (product) => {
        if (
          product.deviceType !==
          needs.deviceType
        ) {
          return false;
        }

        if (
          needs.budget !== undefined &&
          product.price > needs.budget
        ) {
          return false;
        }

        const capacity =
          needs.preferredCapacity ??
          (
            needs.roomArea
              ? getRecommendedCapacity(
                  needs.roomArea
                )
              : undefined
          );

        if (
          product.deviceType ===
            'air-conditioner' &&
          capacity
        ) {
          return product.capacity.startsWith(
            `${capacity} -`
          );
        }

        return true;
      }
    );

    const first =
      previousProducts.find(
        (product) =>
          product.brand === allBrands[0]
      ) ??
      candidates.find(
        (product) =>
          product.brand === allBrands[0]
      );

    const second =
      previousProducts.find(
        (product) =>
          product.brand === allBrands[1]
      ) ??
      candidates.find(
        (product) =>
          product.brand === allBrands[1]
      );

    if (!first || !second) {
      return {
        content:
          'Tôi chưa tìm được đủ hai thiết bị thuộc các thương hiệu bạn yêu cầu trong danh mục demo.\n\n' +
          'Bạn có thể cung cấp công suất, ngân sách hoặc chọn thương hiệu khác.',
        userNeeds: needs,
        intent: 'compare',
        isDemo: true,
      };
    }

    products = [first, second];
  }

  const positions = Array.from(
    normalizeText(question).matchAll(
      /\b(?:so|mau|loai|san pham)\s*([1-3])\b/g
    )
  ).map((match) => Number(match[1]) - 1);

  if (
    positions.length >= 2 &&
    previousProducts[positions[0]] &&
    previousProducts[positions[1]] &&
    positions[0] !== positions[1]
  ) {
    products = [
      previousProducts[positions[0]],
      previousProducts[positions[1]],
    ];
  }

  if (products.length < 2) {
    return askForInformation(
      'Bạn hãy cho tôi biết hai thương hiệu hoặc hai thiết bị muốn so sánh.\n\n' +
        'Ví dụ: Daikin và Panasonic 1.5 HP.',
      needs,
      'compare',
      'preferredBrands'
    );
  }

  const first = products[0];
  const second = products[1];

  if (
    first.id === second.id ||
    first.deviceType !== second.deviceType
  ) {
    return {
      content:
        'Bạn hãy chọn hai thiết bị khác nhau thuộc cùng một loại để so sánh.',
      userNeeds: needs,
      intent: 'compare',
      isDemo: true,
    };
  }

  const difference = Math.abs(
    first.price - second.price
  );

  const cheaper =
    first.price <= second.price
      ? first
      : second;

  const action = createCompareAction(
    first,
    second,
    needs,
    conversation
  );

  return {
    content:
      'Tôi sẽ so sánh đúng hai thiết bị bạn đang quan tâm.\n\n' +
      `1. ${first.name}\n` +
      `Giá: ${formatCurrency(first.price)}\n` +
      `Thông số: ${first.capacity}\n\n` +
      `2. ${second.name}\n` +
      `Giá: ${formatCurrency(second.price)}\n` +
      `Thông số: ${second.capacity}\n\n` +
      `Chênh lệch giá: ${formatCurrency(difference)}.\n\n` +
      `Nếu ưu tiên giá mua, bạn có thể cân nhắc ${cheaper.name}.\n\n` +
      'Để đánh giá chất lượng và mức tiêu thụ điện chính xác hơn, cần thông số của từng model thực tế.\n\n' +
      'Bạn có muốn mở bảng so sánh chi tiết hai thiết bị này không?',
    actions: [action],
    recommendations: [first, second],
    userNeeds: needs,
    intent: 'compare',
    isDemo: true,
    context: {
      intent: 'compare',
      stage: 'waiting-confirmation',
      userNeeds: needs,
      recommendations: [first, second],
      comparePayload:
        action.feature === 'compare'
          ? action.payload
          : undefined,
      updatedAt: Date.now(),
    },
  };
}

// ==================================================
// XỬ LÝ DỰ TOÁN
// ==================================================

function handleEstimate(
  question: string,
  needs: UserNeeds,
  conversation?: AIConversation
): AIResponse {
  if (!needs.deviceType) {
    return askForInformation(
      'Bạn muốn ước tính chi phí cho thiết bị nào?\n\n' +
        '• Máy lạnh\n' +
        '• Tủ lạnh\n' +
        '• Tủ đông',
      needs,
      'estimate',
      'deviceType'
    );
  }

  const previousProducts =
    getPreviousProducts(
      conversation,
      needs
    );

  const serviceType =
    detectService(question) ??
    needs.serviceType ??
    (
      needs.symptoms?.length
        ? 'repair'
        : previousProducts.length > 0
        ? 'installation'
        : undefined
    );

  if (!serviceType) {
    return askForInformation(
      'Bạn muốn tính chi phí cho nhu cầu nào?\n\n' +
        '1. Mua và lắp đặt mới\n' +
        '2. Bảo dưỡng\n' +
        '3. Sửa chữa\n\n' +
        'Bạn hãy nhập tên dịch vụ.',
      needs,
      'estimate',
      'serviceType'
    );
  }

  const updatedNeeds: UserNeeds = {
    ...needs,
    serviceType,
  };

  let product:
    | ProductRecommendation
    | undefined;

  if (serviceType === 'installation') {
    if (
      needs.deviceType === 'air-conditioner' &&
      !needs.roomArea &&
      !needs.preferredCapacity &&
      previousProducts.length === 0
    ) {
      return askForInformation(
        'Bạn dự định lắp máy lạnh cho phòng bao nhiêu m²?',
        updatedNeeds,
        'estimate',
        'roomArea'
      );
    }

    if (
      needs.deviceType === 'refrigerator' &&
      !needs.householdSize &&
      previousProducts.length === 0
    ) {
      return askForInformation(
        'Gia đình bạn có bao nhiêu thành viên?',
        updatedNeeds,
        'estimate',
        'householdSize'
      );
    }

    if (
      !needs.budget &&
      previousProducts.length === 0
    ) {
      return askForInformation(
        'Bạn dự kiến ngân sách khoảng bao nhiêu tiền để tôi lựa chọn thiết bị và tính chi phí lắp đặt?',
        updatedNeeds,
        'estimate',
        'budget'
      );
    }

    const products =
      previousProducts.length > 0
        ? previousProducts
        : recommendProducts(updatedNeeds);

    product = selectProductFromQuestion(
      question,
      products
    );

    if (!product) {
      const selectedId =
        conversation?.context
          ?.selectedProductId;

      product = products.find(
        (item) => item.id === selectedId
      );
    }

    if (
      !product &&
      products.length > 1
    ) {
      const content =
        'Bạn muốn tôi tính tổng chi phí cho thiết bị nào?\n\n' +
        products
          .map(
            (item, index) =>
              `${index + 1}. ${item.name}\n` +
              `${formatCurrency(item.price)}`
          )
          .join('\n\n') +
        '\n\nBạn có thể nhập tên hãng hoặc số thứ tự của sản phẩm.';

      return {
        content,
        recommendations: products,
        userNeeds: updatedNeeds,
        intent: 'estimate',
        isDemo: true,
        context: {
          intent: 'estimate',
          stage: 'collecting-information',
          userNeeds: updatedNeeds,
          recommendations: products,
          missingInformation: [
            'selectedProduct',
          ],
          updatedAt: Date.now(),
        },
      };
    }

    product = product ?? products[0];

    if (!product) {
      return {
        content:
          'Chưa có thiết bị phù hợp trong danh mục demo để lập dự toán.\n\n' +
          'Bạn hãy điều chỉnh ngân sách hoặc tiêu chí lựa chọn.',
        userNeeds: updatedNeeds,
        intent: 'estimate',
        isDemo: true,
      };
    }
  }

  if (
    serviceType === 'repair' &&
    !(updatedNeeds.symptoms?.length) &&
    !updatedNeeds.errorCode
  ) {
    return askForInformation(
      'Thiết bị đang gặp sự cố gì?\n\n' +
        'Ví dụ: không lạnh, chảy nước hoặc không khởi động.\n\n' +
        'Tôi cần thông tin này trước khi đưa ra dự toán minh họa.',
      updatedNeeds,
      'estimate',
      'symptoms'
    );
  }

  const estimate = createEstimate(
    updatedNeeds,
    SERVICE_LABELS[serviceType],
    product
  );

  if (!estimate) {
    return {
      content:
        'Tôi chưa có đủ thông tin để lập dự toán chi phí.',
      userNeeds: updatedNeeds,
      intent: 'estimate',
      isDemo: true,
    };
  }

  const result = calculateEstimate(estimate);

  let content =
    '🧮 Tôi đã tính bảng dự toán chi phí cho bạn.\n\n';

  content +=
    `Thiết bị: ${DEVICE_LABELS[estimate.deviceType]}\n` +
    `Dịch vụ: ${SERVICE_LABELS[estimate.serviceType]}\n`;

  if (estimate.productName) {
    content +=
      `Sản phẩm: ${estimate.productName}\n`;
  }

  content +=
    `Số lượng: ${estimate.quantity}\n\n` +
    'Các khoản chi phí dự kiến:\n\n' +
    `• Giá thiết bị: ${formatCurrency(result.deviceCost)}\n` +
    `• Vật tư: ${formatCurrency(estimate.materialCost)}\n` +
    `• Nhân công: ${formatCurrency(estimate.laborCost)}\n` +
    `• Phát sinh: ${formatCurrency(estimate.extraCost)}\n` +
    `• Dự phòng: ${formatCurrency(result.reserveCost)}\n\n` +
    `TỔNG CHI PHÍ CẦN CHUẨN BỊ:\n${formatCurrency(result.total)}\n\n`;

  if (updatedNeeds.budget !== undefined) {
    const difference =
      updatedNeeds.budget - result.total;

    if (difference >= 0) {
      content +=
        `Còn lại so với ngân sách: ${formatCurrency(difference)}.\n\n`;
    } else {
      content +=
        `Vượt ngân sách: ${formatCurrency(Math.abs(difference))}.\n\n`;
    }
  }

  content +=
    'Bạn có thể mở bảng dự toán bên dưới để xem, chỉnh sửa và lưu lại toàn bộ chi phí tôi vừa tính.\n\n' +
    'Đây là dự toán minh họa từ dữ liệu demo, không phải báo giá thực tế.';

  return {
    content,
    actions: [
      createEstimateAction(
        estimate,
        conversation
      ),
    ],
    estimate,
    userNeeds: updatedNeeds,
    intent: 'estimate',
    isDemo: true,
    context: {
      intent: 'estimate',
      stage: 'waiting-confirmation',
      userNeeds: updatedNeeds,
      selectedProductId: product?.id,
      estimatePayload: estimate,
      updatedAt: Date.now(),
    },
  };
}

// ==================================================
// XỬ LÝ CHẨN ĐOÁN SỰ CỐ
// ==================================================

function handleDiagnosis(
  question: string,
  needs: UserNeeds,
  conversation?: AIConversation
): AIResponse {
  if (!needs.deviceType) {
    return askForInformation(
      'Thiết bị nào của bạn đang gặp sự cố?\n\n' +
        '• Máy lạnh\n' +
        '• Tủ lạnh\n' +
        '• Tủ đông',
      needs,
      'diagnosis',
      'deviceType'
    );
  }

  const symptoms = needs.symptoms ?? [];

  if (
    symptoms.length === 0 &&
    !needs.errorCode
  ) {
    return askForInformation(
      'Bạn hãy mô tả triệu chứng mà thiết bị đang gặp phải.\n\n' +
        'Ví dụ: không lạnh, chảy nước, kêu to hoặc hiển thị mã lỗi.',
      needs,
      'diagnosis',
      'symptoms'
    );
  }

  const causes: string[] = [];
  const actions: string[] = [];

  if (
    symptoms.includes('Không làm lạnh') ||
    symptoms.includes('Làm lạnh yếu') ||
    symptoms.includes('Không đông đá')
  ) {
    causes.push(
      'Chế độ hoặc nhiệt độ cài đặt chưa phù hợp.',
      'Luồng không khí bị cản trở.',
      'Quạt hoặc hệ thống làm lạnh có thể gặp sự cố.'
    );

    actions.push(
      'Kiểm tra chế độ và nhiệt độ cài đặt.',
      'Quan sát các vị trí thông gió bên ngoài.',
      'Liên hệ kỹ thuật viên nếu tình trạng tiếp tục.'
    );
  }

  if (symptoms.includes('Chảy nước')) {
    causes.push(
      'Đường thoát nước có thể bị tắc.',
      'Ngưng tụ hơi nước hoặc đóng tuyết bất thường.'
    );

    actions.push(
      'Ngừng sử dụng nếu nước chảy gần bộ phận điện.',
      'Liên hệ kỹ thuật viên kiểm tra hệ thống thoát nước.'
    );
  }

  if (
    symptoms.includes(
      'Tiếng ồn hoặc rung bất thường'
    )
  ) {
    causes.push(
      'Thiết bị có thể đặt chưa cân bằng.',
      'Quạt hoặc bộ phận cơ khí có thể gặp sự cố.'
    );

    actions.push(
      'Quan sát vị trí đặt thiết bị từ bên ngoài.',
      'Ngừng sử dụng nếu tiếng ồn hoặc rung tăng mạnh.'
    );
  }

  if (
    symptoms.includes('Không khởi động')
  ) {
    causes.push(
      'Nguồn điện hoặc hệ thống điều khiển có thể gặp sự cố.'
    );

    actions.push(
      'Kiểm tra tình trạng cấp điện bằng cách quan sát an toàn.',
      'Không tự tháo bo mạch hoặc linh kiện điện.'
    );
  }

  if (
    symptoms.includes('Đóng tuyết bất thường')
  ) {
    causes.push(
      'Luồng không khí hoặc hệ thống xả đá có thể gặp vấn đề.'
    );

    actions.push(
      'Tham khảo hướng dẫn xả đá của nhà sản xuất.',
      'Không dùng vật sắc nhọn để cạy đá.'
    );
  }

  if (
    symptoms.includes('Có mùi khó chịu')
  ) {
    causes.push(
      'Bụi bẩn, độ ẩm hoặc thực phẩm có thể gây mùi.'
    );

    actions.push(
      'Vệ sinh những bộ phận người dùng được phép tiếp cận theo hướng dẫn của nhà sản xuất.'
    );
  }

  if (needs.errorCode) {
    causes.push(
      `Thiết bị hiển thị mã ${needs.errorCode}. Cần tra cứu theo đúng hãng và model.`
    );

    actions.push(
      'Ghi lại mã lỗi, tên hãng và model thiết bị.'
    );
  }

  if (causes.length === 0) {
    causes.push(
      'Chưa đủ thông tin để xác định nguyên nhân.'
    );

    actions.push(
      'Cần kiểm tra thực tế bởi kỹ thuật viên.'
    );
  }

  const diagnosis: DiagnosisPayload = {
    ...createTransferContext(
      conversation?.id
    ),
    deviceType: needs.deviceType,
    brand: needs.brand,
    model: needs.model,
    errorCode: needs.errorCode,
    symptoms,
    description:
      needs.description ?? question,
    riskLevel: 'medium',
    imageUri: needs.imageUri,
    attachments: needs.attachments,
    possibleCauses: uniqueStrings(causes),
    recommendedActions:
      uniqueStrings(actions),
    safetyWarnings: [
      'Không tự tháo linh kiện điện.',
      'Không tự can thiệp hệ thống môi chất lạnh.',
      'Ngừng sử dụng nếu có mùi khét, khói hoặc rò điện.',
    ],
    requiresTechnician: true,
    isDemo: true,
  };

  let content =
    '🔧 KẾT QUẢ CHẨN ĐOÁN SƠ BỘ\n\n' +
    `Thiết bị: ${DEVICE_LABELS[needs.deviceType]}\n`;

  if (needs.brand) {
    content += `Thương hiệu: ${needs.brand}\n`;
  }

  if (needs.errorCode) {
    content += `Mã lỗi: ${needs.errorCode}\n`;
  }

  content +=
    '\nTriệu chứng ghi nhận:\n' +
    symptoms
      .map((item) => `• ${item}`)
      .join('\n') +
    '\n\nNguyên nhân có thể xảy ra:\n' +
    diagnosis.possibleCauses!
      .map((item) => `• ${item}`)
      .join('\n') +
    '\n\nHướng xử lý an toàn:\n' +
    diagnosis.recommendedActions!
      .map(
        (item, index) =>
          `${index + 1}. ${item}`
      )
      .join('\n\n') +
    '\n\nĐây là nhận định sơ bộ từ dữ liệu demo, chưa phải kết luận kỹ thuật.';

  return {
    content,
    actions: [
      createDiagnosisAction(
        diagnosis,
        conversation
      ),
    ],
    diagnosis,
    userNeeds: needs,
    intent: 'diagnosis',
    isDemo: true,
    context: {
      intent: 'diagnosis',
      stage: 'waiting-confirmation',
      userNeeds: needs,
      diagnosisPayload: diagnosis,
      updatedAt: Date.now(),
    },
  };
}

// ==================================================
// XỬ LÝ TÌNH HUỐNG NGUY HIỂM
// ==================================================

function handleSafety(
  needs: UserNeeds
): AIResponse {
  return {
    content:
      '⚠️ CẢNH BÁO AN TOÀN\n\n' +
      'Thiết bị có dấu hiệu rò điện, cháy, phát khói hoặc mùi khét có thể gây nguy hiểm.\n\n' +
      '1. Ngừng sử dụng thiết bị ngay.\n\n' +
      '2. Không chạm vào thiết bị nếu có nguy cơ điện giật.\n\n' +
      '3. Ngắt nguồn điện từ vị trí an toàn nếu có thể.\n\n' +
      '4. Liên hệ kỹ thuật viên có chuyên môn.\n\n' +
      '5. Nếu xảy ra cháy, hãy rời khỏi khu vực nguy hiểm và gọi 114.\n\n' +
      'Không tự tháo hoặc tiếp tục vận hành thiết bị.',
    userNeeds: needs,
    intent: 'diagnosis',
    isDemo: true,
    context: {
      intent: 'diagnosis',
      stage: 'completed',
      userNeeds: needs,
      updatedAt: Date.now(),
    },
  };
}

// ==================================================
// XỬ LÝ HÌNH ẢNH TRONG ĐOẠN CHAT
// ==================================================

function handleImageMessage(
  question: string,
  attachments: AIImageAttachment[],
  needs: UserNeeds
): AIResponse {
  const updatedNeeds: UserNeeds = {
    ...needs,
    attachments: [
      ...(needs.attachments ?? []).filter(
        (oldImage) =>
          !attachments.some(
            (newImage) =>
              newImage.id === oldImage.id
          )
      ),
      ...attachments,
    ],
    imageUri:
      attachments[0]?.uri ??
      needs.imageUri,
  };

  let content =
    `📷 Tôi đã nhận được ${attachments.length} hình ảnh bạn gửi.\n\n`;

  if (question.trim()) {
    content +=
      `Nội dung bạn muốn trao đổi:\n“${question.trim()}”\n\n`;
  }

  content +=
    'Bạn có thể tiếp tục trao đổi về hình ảnh ngay trong cuộc trò chuyện này.\n\n' +
    'Ví dụ:\n' +
    '• Đây là thiết bị gì?\n' +
    '• Thiết bị đang gặp lỗi gì?\n' +
    '• Mã lỗi này có ý nghĩa gì?\n' +
    '• Chi phí sửa chữa khoảng bao nhiêu?\n\n' +
    'Hiện phiên bản demo chưa có khả năng phân tích nội dung hình ảnh thực tế. Bạn hãy mô tả thêm những gì nhìn thấy trong ảnh để tôi hỗ trợ dựa trên thông tin đó.';

  return {
    content,
    userNeeds: updatedNeeds,
    intent: 'image-analysis',
    isDemo: true,
    context: {
      intent: 'image-analysis',
      stage: 'collecting-information',
      userNeeds: updatedNeeds,
      updatedAt: Date.now(),
    },
  };
}

// ==================================================
// XỬ LÝ HƯỚNG DẪN
// ==================================================

function handleGuide(
  question: string,
  needs: UserNeeds
): AIResponse {
  return {
    content:
      '📋 Tôi có thể hỗ trợ bạn sử dụng và bảo dưỡng thiết bị điện lạnh.\n\n' +
      '• Sử dụng máy lạnh đúng cách.\n' +
      '• Vệ sinh lưới lọc theo hướng dẫn nhà sản xuất.\n' +
      '• Sắp xếp thực phẩm trong tủ lạnh.\n' +
      '• Bảo dưỡng thiết bị định kỳ.\n' +
      '• Kiểm tra dấu hiệu bất thường.\n\n' +
      'Bạn có thể mở phần hướng dẫn để thực hiện từng bước.',
    actions: [
      createGuideAction(question),
    ],
    userNeeds: needs,
    intent: 'guide',
    isDemo: true,
  };
}

// ==================================================
// XỬ LÝ KIẾN THỨC
// ==================================================

function handleKnowledge(
  question: string,
  needs: UserNeeds
): AIResponse {
  let content =
    'SmartCool AI có thư viện kiến thức về thiết bị và công nghệ điện lạnh.\n\n';

  if (
    containsAny(question, ['inverter'])
  ) {
    content =
      'Công nghệ Inverter giúp điều chỉnh tốc độ hoạt động của máy nén theo nhu cầu làm lạnh.\n\n' +
      'Máy có thể thay đổi công suất để duy trì nhiệt độ ổn định.\n\n' +
      'Mức tiết kiệm điện thực tế còn phụ thuộc model, cách sử dụng và điều kiện lắp đặt.\n\n';
  } else if (
    containsAny(question, [
      'nguyên lý',
      'hoạt động như thế nào',
    ])
  ) {
    content =
      'Hệ thống làm lạnh thường gồm máy nén, dàn ngưng tụ, bộ phận tiết lưu và dàn bay hơi.\n\n' +
      'Môi chất lạnh tuần hoàn để hấp thụ nhiệt tại khu vực cần làm lạnh và thải nhiệt ra môi trường.\n\n';
  }

  content +=
    'Bạn có thể xem thêm trong thư viện kiến thức.';

  return {
    content,
    actions: [
      createLibraryAction(question),
    ],
    userNeeds: needs,
    intent: 'general',
    isDemo: true,
  };
}

// ==================================================
// XỬ LÝ TIẾT KIỆM ĐIỆN
// ==================================================

function handleEnergy(
  question: string,
  needs: UserNeeds
): AIResponse {
  return {
    content:
      '⚡ Một số cách sử dụng thiết bị điện lạnh tiết kiệm điện:\n\n' +
      '1. Chọn công suất phù hợp nhu cầu.\n\n' +
      '2. Cài đặt nhiệt độ hợp lý.\n\n' +
      '3. Vệ sinh và bảo dưỡng định kỳ.\n\n' +
      '4. Hạn chế thất thoát nhiệt.\n\n' +
      '5. Tham khảo nhãn năng lượng của từng model.\n\n' +
      'Bạn có thể xem hướng dẫn chi tiết bên dưới.',
    actions: [
      createGuideAction(question),
      createLibraryAction(question),
    ],
    userNeeds: needs,
    intent: 'guide',
    isDemo: true,
  };
}

// ==================================================
// NHẬN BIẾT XÁC NHẬN CỦA NGƯỜI DÙNG
// ==================================================

function isConfirmation(
  question: string
): boolean {
  const text = normalizeText(question)
    .replace(/[.!?]+$/g, '');

  return [
    'ok',
    'oke',
    'okay',
    'dong y',
    'duoc',
    'co',
    'tiep tuc',
    'vang',
    'duoc nha',
    'ok nha',
    'dong y nha',
    'cho toi xem',
  ].includes(text);
}

// ==================================================
// XỬ LÝ KHI NGƯỜI DÙNG ĐỒNG Ý
// ==================================================

function handleConfirmation(
  question: string,
  needs: UserNeeds,
  conversation?: AIConversation
): AIResponse | undefined {
  if (!isConfirmation(question)) {
    return undefined;
  }

  const lastAssistant =
    getLastAssistant(conversation);

  const actions =
    lastAssistant?.actions ?? [];

  if (actions.length === 0) {
    return undefined;
  }

  const compareAction = actions.find(
    (action) => action.feature === 'compare'
  );

  const lastIntent =
    getPreviousIntent(conversation);

  if (
    compareAction &&
    (
      lastIntent === 'buying' ||
      lastIntent === 'compare'
    )
  ) {
    const first =
      compareAction.payload.firstProduct;

    const second =
      compareAction.payload.secondProduct;

    return {
      content:
        'Được rồi! Tôi đã chuẩn bị bảng so sánh hai thiết bị:\n\n' +
        `• ${first.name}\n` +
        `• ${second.name}\n\n` +
        'Bạn hãy nhấn nút bên dưới để xem bảng so sánh chi tiết.',
      actions: [compareAction],
      recommendations: [
        first,
        second,
      ],
      userNeeds: needs,
      intent: 'compare',
      isDemo: true,
      context: {
        intent: 'compare',
        stage: 'completed',
        userNeeds: needs,
        comparePayload:
          compareAction.payload,
        updatedAt: Date.now(),
      },
    };
  }

  return {
    content:
      'Được rồi! Tôi đã chuẩn bị đầy đủ thông tin từ cuộc trò chuyện.\n\n' +
      'Bạn hãy nhấn chức năng bên dưới để tiếp tục.',
    actions,
    recommendations:
      lastAssistant?.recommendations,
    estimate: lastAssistant?.estimate,
    diagnosis: lastAssistant?.diagnosis,
    userNeeds: needs,
    intent:
      lastAssistant?.intent ??
      toAIIntent(lastIntent),
    isDemo: true,
  };
}

// ==================================================
// BỘ XỬ LÝ AI CHÍNH
// ==================================================

export function generateAIResponse(
  question: string,
  conversation?: AIConversation,
  attachments: AIImageAttachment[] = []
): AIResponse {
  const cleanedQuestion = question.trim();

  if (
    !cleanedQuestion &&
    attachments.length === 0
  ) {
    return {
      content:
        'Bạn hãy nhập câu hỏi hoặc đính kèm hình ảnh cần hỗ trợ nhé.',
      userNeeds: conversation?.userNeeds,
      isDemo: true,
    };
  }

  const previousNeeds =
    recoverUserNeeds(conversation);

  let needs = extractUserNeeds(
    cleanedQuestion,
    previousNeeds
  );

  needs = applyShortAnswer(
    cleanedQuestion,
    needs,
    conversation
  );

  let intent = detectIntent(
    cleanedQuestion
  );

  if (intent === 'safety') {
    return handleSafety(needs);
  }

  if (attachments.length > 0) {
    return handleImageMessage(
      cleanedQuestion,
      attachments,
      needs
    );
  }

  const confirmation =
    handleConfirmation(
      cleanedQuestion,
      needs,
      conversation
    );

  if (confirmation) {
    return confirmation;
  }

  const previousIntent =
    getPreviousIntent(conversation);

  const waitingFor =
    conversation?.context?.waitingFor;

  const text = normalizeText(
    cleanedQuestion
  );

  const previousProducts =
    getPreviousProducts(
      conversation,
      needs
    );

  const selectedProduct =
    selectProductFromQuestion(
      cleanedQuestion,
      previousProducts
    );

  if (
    intent === 'unknown' &&
    selectedProduct &&
    previousIntent === 'buying' &&
    containsAny(text, [
      'chọn',
      'lấy',
      'tính',
      'mua',
    ])
  ) {
    intent = 'estimate';
  }

  if (
    previousIntent === 'estimate' &&
    (
      waitingFor === 'serviceType' ||
      waitingFor === 'symptoms' ||
      waitingFor === 'budget'
    ) &&
    intent !== 'compare' &&
    intent !== 'knowledge'
  ) {
    intent = 'estimate';
  }

  if (
    intent === 'unknown' &&
    (
      previousIntent === 'buying' ||
      previousIntent === 'estimate' ||
      previousIntent === 'diagnosis' ||
      previousIntent === 'compare'
    )
  ) {
    intent = previousIntent;
  }

  if (
    intent === 'unknown' &&
    needs.deviceType &&
    (
      needs.roomArea ||
      needs.budget ||
      needs.householdSize ||
      needs.preferredCapacity
    )
  ) {
    intent = 'buying';
  }

  if (
    intent === 'energy' &&
    previousIntent === 'buying' &&
    !containsAny(text, [
      'cách',
      'làm sao',
      'tại sao',
    ])
  ) {
    intent = 'buying';
  }

  if (
    intent === 'buying' &&
    previousIntent === 'estimate' &&
    !containsAny(text, [
      'tư vấn lại',
      'đổi thiết bị',
      'mua loại khác',
    ])
  ) {
    intent = 'estimate';
  }

  if (
    previousIntent === 'diagnosis' &&
    intent === 'unknown'
  ) {
    intent = 'diagnosis';
  }

  switch (intent) {
    case 'greeting':
      return {
        content:
          'Xin chào! Tôi là SmartCool AI ❄️\n\n' +
          'Tôi có thể hỗ trợ bạn:\n\n' +
          '• Tư vấn mua thiết bị điện lạnh.\n' +
          '• So sánh các sản phẩm.\n' +
          '• Ước tính chi phí.\n' +
          '• Chẩn đoán sự cố.\n' +
          '• Trao đổi về hình ảnh.\n' +
          '• Hướng dẫn sử dụng và bảo dưỡng.\n\n' +
          'Hôm nay bạn cần tôi hỗ trợ vấn đề gì?',
        userNeeds: needs,
        intent: 'general',
        isDemo: true,
      };

    case 'buying':
      return handleBuying(
        needs,
        conversation
      );

    case 'compare':
      return handleCompare(
        cleanedQuestion,
        needs,
        conversation
      );

    case 'estimate':
      return handleEstimate(
        cleanedQuestion,
        needs,
        conversation
      );

    case 'diagnosis':
      return handleDiagnosis(
        cleanedQuestion,
        needs,
        conversation
      );

    case 'camera':
      return {
        content:
          'Bạn có thể nhấn biểu tượng máy ảnh ngay cạnh ô nhập tin nhắn để chụp ảnh hoặc chọn ảnh từ thư viện.\n\n' +
          'Sau đó, hãy nhập câu hỏi và gửi ảnh trực tiếp trong cuộc trò chuyện.\n\n' +
          'Phiên bản demo chưa phân tích được nội dung ảnh thực tế.',
        userNeeds: needs,
        intent: 'image-analysis',
        isDemo: true,
      };

    case 'guide':
      return handleGuide(
        cleanedQuestion,
        needs
      );

    case 'knowledge':
      return handleKnowledge(
        cleanedQuestion,
        needs
      );

    case 'energy':
      return handleEnergy(
        cleanedQuestion,
        needs
      );

    default:
      return {
        content:
          'Tôi cần thêm một chút thông tin để hỗ trợ bạn chính xác hơn.\n\n' +
          'Bạn đang muốn mua thiết bị, so sánh sản phẩm, tính chi phí hay kiểm tra sự cố?\n\n' +
          'Bạn cũng có thể gửi ảnh kèm theo câu hỏi.',
        userNeeds: needs,
        intent: 'general',
        isDemo: true,
      };
  }
}

// ==================================================
// TẠO CUỘC TRÒ CHUYỆN MỚI
// ==================================================

export function createAIConversation():
  AIConversation {
  const now = Date.now();

  return {
    id: createId(),
    title: 'Cuộc trò chuyện mới',
    createdAt: now,
    updatedAt: now,
    userNeeds: {},
    context: createConversationContext(),
    recommendations: [],
    messages: [
      createAIMessage(
        'assistant',
        'Xin chào! Tôi là SmartCool AI ❄️\n\n' +
          'Trợ lý điện lạnh thông minh của bạn.\n\n' +
          'Tôi có thể tư vấn mua thiết bị, so sánh sản phẩm, dự toán chi phí và hỗ trợ chẩn đoán sự cố.\n\n' +
          'Bạn cũng có thể gửi hình ảnh trực tiếp trong cuộc trò chuyện.\n\n' +
          'Hôm nay bạn cần hỗ trợ vấn đề gì?',
        undefined,
        {
          intent: 'general',
          isDemo: true,
        }
      ),
    ],
  };
}

// ==================================================
// GỬI TIN NHẮN
// HỖ TRỢ CẢ CODE CŨ VÀ CODE MỚI
// ==================================================

export function sendAIMessage(
  conversation: AIConversation,
  question: string | AISendMessageInput,
  imageAttachments: AIImageAttachment[] = []
): AIConversation {
  const input: AISendMessageInput =
    typeof question === 'string'
      ? {
          content: question,
          attachments: imageAttachments,
        }
      : question;

  if (!canSendAIMessage(input)) {
    return conversation;
  }

  const content = input.content.trim();

  const attachments = [
    ...(input.attachments ?? []),
  ];

  if (
    input.imageUri &&
    !attachments.some(
      (item) => item.uri === input.imageUri
    )
  ) {
    attachments.push({
      id: createId(),
      uri: input.imageUri,
      source: 'library',
      createdAt: Date.now(),
    });
  }

  const userMessage = createAIMessage(
    'user',
    content,
    undefined,
    {
      attachments,
      imageUri: attachments[0]?.uri,
    }
  );

  const response = generateAIResponse(
    content,
    conversation,
    attachments
  );

  const assistantMessage = createAIMessage(
    'assistant',
    response.content,
    response.actions,
    {
      recommendations:
        response.recommendations,
      estimate: response.estimate,
      diagnosis: response.diagnosis,
      intent: response.intent,
      isDemo: true,
    }
  );

  const hasPreviousQuestion =
    conversation.messages.some(
      (message) => message.role === 'user'
    );

  const deviceChanged =
    Boolean(
      conversation.userNeeds?.deviceType &&
      response.userNeeds?.deviceType &&
      conversation.userNeeds.deviceType !==
        response.userNeeds.deviceType
    );

  const previousContext =
    deviceChanged
      ? createConversationContext()
      : conversation.context ??
        createConversationContext();

  const context: AIConversationContext = {
    ...previousContext,
    waitingFor: undefined,
    missingInformation: [],
    stage: 'completed',
    ...response.context,
    intent:
      response.intent ??
      response.context?.intent ??
      previousContext.intent,
    userNeeds:
      response.userNeeds ??
      conversation.userNeeds,
    recommendations:
      response.context?.recommendations ??
      response.recommendations ??
      (
        deviceChanged
          ? []
          : previousContext.recommendations
      ),
    lastQuestion: content,
    lastAnswer: response.content,
    updatedAt: Date.now(),
  };

  return {
    ...conversation,

    title: hasPreviousQuestion
      ? conversation.title
      : createConversationTitle(
          content,
          attachments
        ),

    updatedAt: Date.now(),

    userNeeds:
      response.userNeeds ??
      conversation.userNeeds,

    context,

    recommendations:
      response.recommendations ??
      (
        deviceChanged
          ? []
          : conversation.recommendations
      ),

    lastEstimate:
      response.estimate ??
      (
        deviceChanged
          ? undefined
          : conversation.lastEstimate
      ),

    lastDiagnosis:
      response.diagnosis ??
      (
        deviceChanged
          ? undefined
          : conversation.lastDiagnosis
      ),

    messages: [
      ...conversation.messages,
      userMessage,
      assistantMessage,
    ],
  };
}

// ==================================================
// CÂU HỎI GỢI Ý
// ==================================================

export const AI_SUGGESTIONS = [
  'Tư vấn mua máy lạnh cho phòng 20m²',
  'Tôi muốn mua tủ lạnh cho gia đình 4 người',
  'So sánh máy lạnh Daikin và Panasonic',
  'Ước tính chi phí lắp đặt máy lạnh',
  'Máy lạnh chạy nhưng không mát',
  'Tủ lạnh không đông đá',
  'Cách sử dụng máy lạnh tiết kiệm điện',
  'Hướng dẫn vệ sinh máy lạnh',
];

// ==================================================
// EXPORT
// ==================================================

export default {
  generateAIResponse,
  createAIConversation,
  sendAIMessage,
  recommendProducts,
  createEstimate,
  extractUserNeeds,
  detectIntent,
};
