
/* ==================================================
   SMARTCOOL AI
   KHAI BÁO KIỂU DỮ LIỆU TOÀN HỆ THỐNG
================================================== */

// ==================================================
// LOẠI THIẾT BỊ
// ==================================================

export type DeviceType =
  | 'air-conditioner'
  | 'refrigerator'
  | 'freezer';

// ==================================================
// CHỨC NĂNG
// ==================================================

export type FeatureId =
  | 'chat'
  | 'camera'
  | 'budget'
  | 'compare'
  | 'library'
  | 'diagnosis'
  | 'estimate'
  | 'guide';

// Nguồn mở chức năng

export type FeatureSource =
  | 'home'
  | 'ai-chat'
  | 'account'
  | 'history';

// ==================================================
// VAI TRÒ TIN NHẮN
// ==================================================

export type MessageRole =
  | 'user'
  | 'assistant';

// ==================================================
// LOẠI DỊCH VỤ
// ==================================================

export type ServiceType =
  | 'installation'
  | 'maintenance'
  | 'repair';

// ==================================================
// MỨC ĐỘ RỦI RO
// ==================================================

export type RiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'danger';

// ==================================================
// MỤC ĐÍCH HỘI THOẠI
// ==================================================

export type AIIntent =
  | 'general'
  | 'buying'
  | 'compare'
  | 'estimate'
  | 'diagnosis'
  | 'maintenance'
  | 'repair'
  | 'image-analysis'
  | 'guide';

// ==================================================
// TRẠNG THÁI THU THẬP THÔNG TIN
// ==================================================

export type ConversationStage =
  | 'initial'
  | 'collecting-information'
  | 'recommending'
  | 'waiting-confirmation'
  | 'completed';

// ==================================================
// NGUỒN HÌNH ẢNH
// ==================================================

export type ImageSource =
  | 'camera'
  | 'library';

// ==================================================
// HÌNH ẢNH ĐÍNH KÈM TIN NHẮN
// ==================================================

export interface AIImageAttachment {
  id: string;

  uri: string;

  source: ImageSource;

  fileName?: string;

  mimeType?: string;

  width?: number;

  height?: number;

  fileSize?: number;

  createdAt: number;
}

// ==================================================
// NHU CẦU CỦA NGƯỜI DÙNG
// ==================================================

export interface UserNeeds {
  deviceType?: DeviceType;

  budget?: number;

  roomArea?: number;

  householdSize?: number;

  preferredBrands?: string[];

  energySaving?: boolean;

  purpose?: string;

  symptoms?: string[];

  brand?: string;

  model?: string;

  errorCode?: string;

  // Thông tin bổ sung

  roomType?: string;

  roomHeight?: number;

  sunlightExposure?: boolean;

  usageHoursPerDay?: number;

  numberOfPeople?: number;

  preferredCapacity?: string;

  preferredInverter?: boolean;

  installationLocation?: string;

  serviceType?: ServiceType;

  quantity?: number;

  description?: string;

  imageUri?: string;

  attachments?: AIImageAttachment[];
}

// ==================================================
// SẢN PHẨM AI ĐỀ XUẤT
// ==================================================

export interface ProductRecommendation {
  id: string;

  name: string;

  brand: string;

  model?: string;

  deviceType: DeviceType;

  price: number;

  capacity: string;

  inverter: boolean;

  description: string;

  image?: string;

  // Thông tin chi tiết

  coolingCapacity?: number;

  powerConsumption?: number;

  energyRating?: string;

  warranty?: string;

  origin?: string;

  suitableRoomArea?: string;

  advantages?: string[];

  disadvantages?: string[];

  features?: string[];

  recommendationReason?: string;

  installationCost?: number;

  estimatedTotal?: number;

  isDemo?: boolean;
}

// ==================================================
// NGỮ CẢNH CHUYỂN DỮ LIỆU TỪ AI
// ==================================================

export interface FeatureTransferContext {
  source?: FeatureSource;

  conversationId?: string;

  messageId?: string;

  question?: string;

  summary?: string;

  createdAt?: number;
}

// ==================================================
// DỮ LIỆU SO SÁNH THIẾT BỊ
// ==================================================

export interface ComparePayload
  extends FeatureTransferContext {
  firstProduct: ProductRecommendation;

  secondProduct: ProductRecommendation;

  userNeeds?: UserNeeds;

  comparisonReason?: string;

  recommendedProductId?: string;

  comparisonCriteria?: string[];
}

// ==================================================
// DỮ LIỆU DỰ TOÁN CHI PHÍ
// ==================================================

export interface EstimatePayload
  extends FeatureTransferContext {
  deviceType: DeviceType;

  serviceType: ServiceType;

  productName?: string;

  quantity: number;

  unitPrice: number;

  materialCost: number;

  laborCost: number;

  extraCost: number;

  reservePercent: number;

  note?: string;

  // Dữ liệu AI bổ sung

  product?: ProductRecommendation;

  userNeeds?: UserNeeds;

  budget?: number;

  explanation?: string;

  assumptions?: string[];

  isDemo?: boolean;
}

// ==================================================
// KẾT QUẢ TÍNH CHI PHÍ
// ==================================================

export interface EstimateResult {
  deviceCost: number;

  subtotal: number;

  reserveCost: number;

  total: number;
}

// ==================================================
// CHI TIẾT KHOẢN CHI
// ==================================================

export interface EstimateCostItem {
  id: string;

  name: string;

  quantity: number;

  unitPrice: number;

  total: number;

  description?: string;
}

// ==================================================
// DỮ LIỆU CHẨN ĐOÁN
// ==================================================

export interface DiagnosisPayload
  extends FeatureTransferContext {
  deviceType: DeviceType;

  brand?: string;

  model?: string;

  errorCode?: string;

  symptoms: string[];

  description?: string;

  riskLevel?: RiskLevel;

  imageUri?: string;

  attachments?: AIImageAttachment[];

  possibleCauses?: string[];

  recommendedActions?: string[];

  safetyWarnings?: string[];

  requiresTechnician?: boolean;

  estimatedRepairCost?: {
    min: number;
    max: number;
  };

  isDemo?: boolean;
}

// ==================================================
// DỮ LIỆU AI CAMERA
// ==================================================

export interface CameraPayload
  extends FeatureTransferContext {
  imageUri?: string;

  attachments?: AIImageAttachment[];

  deviceType?: DeviceType;

  brand?: string;

  model?: string;

  errorCode?: string;

  question?: string;
}

// ==================================================
// DỮ LIỆU TƯ VẤN MUA THIẾT BỊ
// ==================================================

export interface BuyingPayload
  extends FeatureTransferContext {
  userNeeds: UserNeeds;

  recommendations?: ProductRecommendation[];

  selectedProductId?: string;

  recommendedProductId?: string;

  adviceSummary?: string;

  recommendationReason?: string;

  budget?: number;

  isDemo?: boolean;
}

// ==================================================
// DỮ LIỆU THƯ VIỆN VÀ HƯỚNG DẪN
// ==================================================

export interface KnowledgePayload
  extends FeatureTransferContext {
  question?: string;

  keyword?: string;

  deviceType?: DeviceType;

  articleId?: string;
}

// ==================================================
// HÀNH ĐỘNG DO TRỢ LÝ AI TẠO RA
// ==================================================

export type AIAction =
  | {
      id: string;

      label: string;

      feature: 'compare';

      payload: ComparePayload;
    }
  | {
      id: string;

      label: string;

      feature: 'estimate';

      payload: EstimatePayload;
    }
  | {
      id: string;

      label: string;

      feature: 'diagnosis';

      payload: DiagnosisPayload;
    }
  | {
      id: string;

      label: string;

      feature: 'budget';

      payload: BuyingPayload;
    }
  | {
      id: string;

      label: string;

      feature: 'camera';

      payload?: CameraPayload;
    }
  | {
      id: string;

      label: string;

      feature: 'library' | 'guide' | 'chat';

      payload?: KnowledgePayload;
    };

// ==================================================
// NGỮ CẢNH HỘI THOẠI
// ==================================================

export interface AIConversationContext {
  intent?: AIIntent;

  stage?: ConversationStage;

  userNeeds?: UserNeeds;

  recommendations?: ProductRecommendation[];

  selectedProductId?: string;

  comparePayload?: ComparePayload;

  estimatePayload?: EstimatePayload;

  diagnosisPayload?: DiagnosisPayload;

  lastQuestion?: string;

  lastAnswer?: string;

  missingInformation?: string[];

  waitingFor?: keyof UserNeeds;

  updatedAt?: number;
}

// ==================================================
// TIN NHẮN TRONG ĐOẠN CHAT
// ==================================================

export interface AIMessage {
  id: string;

  role: MessageRole;

  content: string;

  createdAt: number;

  // Giữ tương thích với phiên bản cũ

  imageUri?: string;

  // Hỗ trợ nhiều hình ảnh

  attachments?: AIImageAttachment[];

  // Hành động chuyển chức năng

  actions?: AIAction[];

  // Danh sách sản phẩm được đề xuất

  recommendations?: ProductRecommendation[];

  // Kết quả dự toán

  estimate?: EstimatePayload;

  // Kết quả chẩn đoán

  diagnosis?: DiagnosisPayload;

  // Mục đích tin nhắn

  intent?: AIIntent;

  // Đánh dấu phản hồi mô phỏng

  isDemo?: boolean;
}

// ==================================================
// DỮ LIỆU GỬI TIN NHẮN
// ==================================================

export interface AISendMessageInput {
  content: string;

  attachments?: AIImageAttachment[];

  imageUri?: string;
}

// ==================================================
// TÙY CHỌN TẠO TIN NHẮN
// ==================================================

export interface AIMessageOptions {
  imageUri?: string;

  attachments?: AIImageAttachment[];

  recommendations?: ProductRecommendation[];

  estimate?: EstimatePayload;

  diagnosis?: DiagnosisPayload;

  intent?: AIIntent;

  isDemo?: boolean;
}

// ==================================================
// CUỘC TRÒ CHUYỆN
// ==================================================

export interface AIConversation {
  id: string;

  title: string;

  updatedAt: number;

  messages: AIMessage[];

  userNeeds?: UserNeeds;

  // Thời điểm tạo hội thoại

  createdAt?: number;

  // Ghi nhớ ngữ cảnh

  context?: AIConversationContext;

  // Danh sách thiết bị gần nhất

  recommendations?: ProductRecommendation[];

  // Bảng dự toán gần nhất

  lastEstimate?: EstimatePayload;

  // Kết quả chẩn đoán gần nhất

  lastDiagnosis?: DiagnosisPayload;
}

// ==================================================
// PHẢN HỒI TỪ TRỢ LÝ AI
// ==================================================

export interface AIResponse {
  content: string;

  actions?: AIAction[];

  recommendations?: ProductRecommendation[];

  userNeeds?: UserNeeds;

  context?: AIConversationContext;

  estimate?: EstimatePayload;

  diagnosis?: DiagnosisPayload;

  intent?: AIIntent;

  isDemo?: boolean;
}

// ==================================================
// DỮ LIỆU ĐIỀU HƯỚNG CHỨC NĂNG
// ==================================================

export interface FeatureNavigationData {
  feature: FeatureId;

  source: FeatureSource;

  action?: AIAction;

  conversationId?: string;

  messageId?: string;
}

// ==================================================
// TÊN THIẾT BỊ TIẾNG VIỆT
// ==================================================

export const DEVICE_LABELS: Record<
  DeviceType,
  string
> = {
  'air-conditioner': 'Máy lạnh',

  refrigerator: 'Tủ lạnh',

  freezer: 'Tủ đông',
};

// ==================================================
// TÊN DỊCH VỤ TIẾNG VIỆT
// ==================================================

export const SERVICE_LABELS: Record<
  ServiceType,
  string
> = {
  installation: 'Mua và lắp đặt mới',

  maintenance: 'Bảo dưỡng',

  repair: 'Sửa chữa',
};

// ==================================================
// TÊN CHỨC NĂNG TIẾNG VIỆT
// ==================================================

export const FEATURE_LABELS: Record<
  FeatureId,
  string
> = {
  chat: 'Trợ lý AI',

  camera: 'AI Camera',

  budget: 'Tư vấn mua thiết bị',

  compare: 'So sánh thiết bị',

  library: 'Thư viện kiến thức',

  diagnosis: 'Chẩn đoán sự cố',

  estimate: 'Dự toán chi phí',

  guide: 'Hướng dẫn sử dụng',
};

// ==================================================
// TÊN MỨC ĐỘ RỦI RO
// ==================================================

export const RISK_LABELS: Record<
  RiskLevel,
  string
> = {
  low: 'Thấp',

  medium: 'Trung bình',

  high: 'Cao',

  danger: 'Nguy hiểm',
};

// ==================================================
// ĐỊNH DẠNG TIỀN VIỆT NAM
// ==================================================

export function formatCurrency(
  value: number
): string {
  const safeValue = Number.isFinite(value)
    ? value
    : 0;

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',

    currency: 'VND',

    maximumFractionDigits: 0,
  }).format(safeValue);
}

// ==================================================
// KIỂM TRA GIÁ TRỊ SỐ
// ==================================================

export function safeNumber(
  value: number | undefined
): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(0, value);
}

// ==================================================
// TÍNH DỰ TOÁN CHI PHÍ
// ==================================================

export function calculateEstimate(
  data: EstimatePayload
): EstimateResult {
  const quantity = safeNumber(
    data.quantity
  );

  const unitPrice = safeNumber(
    data.unitPrice
  );

  const materialCost = safeNumber(
    data.materialCost
  );

  const laborCost = safeNumber(
    data.laborCost
  );

  const extraCost = safeNumber(
    data.extraCost
  );

  const reservePercent = safeNumber(
    data.reservePercent
  );

  const deviceCost =
    quantity * unitPrice;

  const subtotal =
    deviceCost +
    materialCost +
    laborCost +
    extraCost;

  const reserveCost = Math.round(
    subtotal * (reservePercent / 100)
  );

  return {
    deviceCost,

    subtotal,

    reserveCost,

    total: subtotal + reserveCost,
  };
}

// ==================================================
// TÍNH CHÊNH LỆCH NGÂN SÁCH
// ==================================================

export function calculateBudgetDifference(
  budget: number,
  total: number
): number {
  return (
    safeNumber(budget) -
    safeNumber(total)
  );
}

// ==================================================
// TẠO ID
// ==================================================

export function createId(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

// ==================================================
// TẠO HÌNH ẢNH ĐÍNH KÈM
// ==================================================

export function createImageAttachment(
  uri: string,

  source: ImageSource,

  options?: {
    fileName?: string;

    mimeType?: string;

    width?: number;

    height?: number;

    fileSize?: number;
  }
): AIImageAttachment {
  return {
    id: createId(),

    uri,

    source,

    fileName: options?.fileName,

    mimeType: options?.mimeType,

    width: options?.width,

    height: options?.height,

    fileSize: options?.fileSize,

    createdAt: Date.now(),
  };
}

// ==================================================
// LẤY DANH SÁCH ẢNH TRONG TIN NHẮN
// ==================================================

export function getMessageAttachments(
  message: AIMessage
): AIImageAttachment[] {
  if (
    message.attachments &&
    message.attachments.length > 0
  ) {
    return message.attachments;
  }

  // Hỗ trợ tin nhắn của phiên bản cũ

  if (message.imageUri) {
    return [
      {
        id: `${message.id}-image`,

        uri: message.imageUri,

        source: 'library',

        createdAt: message.createdAt,
      },
    ];
  }

  return [];
}

// ==================================================
// KIỂM TRA TIN NHẮN CÓ HÌNH ẢNH
// ==================================================

export function hasMessageImages(
  message: AIMessage
): boolean {
  return (
    getMessageAttachments(message)
      .length > 0
  );
}

// ==================================================
// KIỂM TRA NỘI DUNG GỬI
// ==================================================

export function canSendAIMessage(
  input: AISendMessageInput
): boolean {
  const hasText =
    input.content.trim().length > 0;

  const hasAttachments =
    (input.attachments?.length ?? 0) > 0;

  const hasLegacyImage =
    Boolean(input.imageUri);

  return (
    hasText ||
    hasAttachments ||
    hasLegacyImage
  );
}

// ==================================================
// TẠO TIN NHẮN AI
// ==================================================

export function createAIMessage(
  role: MessageRole,

  content: string,

  actions?: AIAction[],

  options?: AIMessageOptions
): AIMessage {
  return {
    id: createId(),

    role,

    content,

    createdAt: Date.now(),

    actions,

    imageUri:
      options?.imageUri ??
      options?.attachments?.[0]?.uri,

    attachments: options?.attachments,

    recommendations:
      options?.recommendations,

    estimate: options?.estimate,

    diagnosis: options?.diagnosis,

    intent: options?.intent,

    isDemo: options?.isDemo,
  };
}

// ==================================================
// GỘP NHU CẦU QUA NHIỀU LƯỢT CHAT
// ==================================================

export function mergeUserNeeds(
  previous?: UserNeeds,

  incoming?: UserNeeds
): UserNeeds {
  const result: UserNeeds = {
    ...previous,
  };

  if (!incoming) {
    return result;
  }

  // Không ghi đè thông tin cũ bằng undefined

  Object.assign(
    result,
    Object.fromEntries(
      Object.entries(incoming).filter(
        ([, value]) =>
          value !== undefined &&
          value !== null
      )
    )
  );

  if (
    previous?.symptoms ||
    incoming.symptoms
  ) {
    result.symptoms = Array.from(
      new Set([
        ...(previous?.symptoms ?? []),

        ...(incoming.symptoms ?? []),
      ])
    );
  }

  if (
    previous?.preferredBrands ||
    incoming.preferredBrands
  ) {
    result.preferredBrands = Array.from(
      new Set([
        ...(previous?.preferredBrands ?? []),

        ...(incoming.preferredBrands ?? []),
      ])
    );
  }

  if (
    previous?.attachments ||
    incoming.attachments
  ) {
    const attachments = [
      ...(previous?.attachments ?? []),

      ...(incoming.attachments ?? []),
    ];

    result.attachments = Array.from(
      new Map(
        attachments.map((item) => [
          item.id,
          item,
        ])
      ).values()
    );
  }

  return result;
}

// ==================================================
// TẠO NGỮ CẢNH HỘI THOẠI BAN ĐẦU
// ==================================================

export function createConversationContext():
  AIConversationContext {
  return {
    intent: 'general',

    stage: 'initial',

    userNeeds: {},

    recommendations: [],

    missingInformation: [],

    updatedAt: Date.now(),
  };
}

// ==================================================
// TẠO TIÊU ĐỀ HỘI THOẠI
// ==================================================

export function createConversationTitle(
  content: string,

  attachments?: AIImageAttachment[]
): string {
  const cleanContent = content.trim();

  if (!cleanContent) {
    if (
      attachments &&
      attachments.length > 0
    ) {
      return 'Trao đổi về hình ảnh';
    }

    return 'Cuộc trò chuyện mới';
  }

  if (cleanContent.length <= 45) {
    return cleanContent;
  }

  return `${cleanContent.slice(0, 45)}...`;
}

// ==================================================
// LẤY SẢN PHẨM THEO ID
// ==================================================

export function findRecommendedProduct(
  products: ProductRecommendation[],

  productId: string
): ProductRecommendation | undefined {
  return products.find(
    (product) => product.id === productId
  );
}

// ==================================================
// KIỂM TRA HAI SẢN PHẨM CÓ THỂ SO SÁNH
// ==================================================

export function canCompareProducts(
  firstProduct?: ProductRecommendation,

  secondProduct?: ProductRecommendation
): boolean {
  if (
    !firstProduct ||
    !secondProduct
  ) {
    return false;
  }

  return (
    firstProduct.id !== secondProduct.id &&
    firstProduct.deviceType ===
      secondProduct.deviceType
  );
}

// ==================================================
// TẠO DỮ LIỆU CHUYỂN TỪ AI
// ==================================================

export function createTransferContext(
  conversationId?: string,

  messageId?: string,

  question?: string,

  summary?: string
): FeatureTransferContext {
  return {
    source: 'ai-chat',

    conversationId,

    messageId,

    question,

    summary,

    createdAt: Date.now(),
  };
}
