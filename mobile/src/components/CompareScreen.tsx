
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  formatCurrency,
  calculateEstimate,
  createId,
} from '../types/smartcool';

import type {
  AIAction,
  ComparePayload,
  DeviceType,
  EstimatePayload,
  ProductRecommendation,
} from '../types/smartcool';

// ==================================================
// KIỂU DỮ LIỆU
// ==================================================

interface Props {
  onBack: () => void;
  initialData?: ComparePayload;
  payload?: ComparePayload;
  onAction?: (action: AIAction) => void;
  onEstimate?: (data: EstimatePayload) => void;
}

// ==================================================
// MÀU SẮC
// ==================================================

const BLUE = '#0878E8';
const DARK_BLUE = '#075BB5';
const LIGHT_BLUE = '#E7F2FF';
const BACKGROUND = '#F4F8FE';
const WHITE = '#FFFFFF';
const TEXT = '#193451';
const MUTED = '#64748B';
const BORDER = '#E3EBF5';
const GREEN = '#15803D';
const RED = '#DC2626';

const UNKNOWN = 'Chưa có dữ liệu';

// ==================================================
// DANH SÁCH THIẾT BỊ MẪU
// ==================================================

const DEVICES: ProductRecommendation[] = [
  {
    id: 'ac1',
    name: 'Daikin Inverter 1 HP',
    brand: 'Daikin',
    deviceType: 'air-conditioner',
    price: 9500000,
    capacity: '1 HP',
    inverter: true,
    suitableRoomArea: 'Phòng khoảng 15 m² trở xuống',
    warranty: 'Cần kiểm tra theo model',
    features: [
      'Công nghệ Inverter',
      'Làm lạnh ổn định',
      'Tiết kiệm điện',
    ],
    description:
      'Phù hợp phòng ngủ hoặc phòng làm việc nhỏ.',
    isDemo: true,
  },
  {
    id: 'ac2',
    name: 'Panasonic Inverter 1.5 HP',
    brand: 'Panasonic',
    deviceType: 'air-conditioner',
    price: 12500000,
    capacity: '1.5 HP',
    inverter: true,
    suitableRoomArea: 'Phòng khoảng 15–20 m²',
    warranty: 'Cần kiểm tra theo model',
    features: [
      'Công nghệ Inverter',
      'Làm lạnh nhanh',
      'Vận hành êm',
    ],
    description:
      'Phù hợp phòng ngủ lớn hoặc phòng sinh hoạt.',
    isDemo: true,
  },
  {
    id: 'ac3',
    name: 'LG Dual Inverter 2 HP',
    brand: 'LG',
    deviceType: 'air-conditioner',
    price: 15900000,
    capacity: '2 HP',
    inverter: true,
    suitableRoomArea: 'Phòng khoảng 20–30 m²',
    warranty: 'Cần kiểm tra theo model',
    features: [
      'Dual Inverter',
      'Làm lạnh nhanh',
      'Công suất lớn',
    ],
    description:
      'Phù hợp phòng khách hoặc không gian rộng.',
    isDemo: true,
  },
  {
    id: 'ac4',
    name: 'Casper Inverter 1 HP',
    brand: 'Casper',
    deviceType: 'air-conditioner',
    price: 6900000,
    capacity: '1 HP',
    inverter: true,
    suitableRoomArea: 'Phòng khoảng 15 m² trở xuống',
    warranty: 'Cần kiểm tra theo model',
    features: [
      'Công nghệ Inverter',
      'Ngân sách tiết kiệm',
    ],
    description:
      'Lựa chọn tham khảo cho phòng nhỏ.',
    isDemo: true,
  },
  {
    id: 'ac5',
    name: 'Samsung Inverter 1.5 HP',
    brand: 'Samsung',
    deviceType: 'air-conditioner',
    price: 10900000,
    capacity: '1.5 HP',
    inverter: true,
    suitableRoomArea: 'Phòng khoảng 15–20 m²',
    warranty: 'Cần kiểm tra theo model',
    features: [
      'Công nghệ Inverter',
      'Vận hành êm',
    ],
    description:
      'Phù hợp phòng diện tích trung bình.',
    isDemo: true,
  },
  {
    id: 'fr1',
    name: 'Panasonic Inverter 255 lít',
    brand: 'Panasonic',
    deviceType: 'refrigerator',
    price: 7900000,
    capacity: '255 lít',
    inverter: true,
    warranty: 'Cần kiểm tra theo model',
    features: [
      'Công nghệ Inverter',
      'Ngăn đá riêng',
    ],
    description:
      'Phù hợp gia đình khoảng 2–3 người.',
    isDemo: true,
  },
  {
    id: 'fr2',
    name: 'Samsung Inverter 307 lít',
    brand: 'Samsung',
    deviceType: 'refrigerator',
    price: 9900000,
    capacity: '307 lít',
    inverter: true,
    warranty: 'Cần kiểm tra theo model',
    features: [
      'Công nghệ Inverter',
      'Dung tích trung bình',
    ],
    description:
      'Phù hợp gia đình khoảng 3–4 người.',
    isDemo: true,
  },
  {
    id: 'fr3',
    name: 'LG Inverter 374 lít',
    brand: 'LG',
    deviceType: 'refrigerator',
    price: 12900000,
    capacity: '374 lít',
    inverter: true,
    warranty: 'Cần kiểm tra theo model',
    features: [
      'Công nghệ Inverter',
      'Dung tích lớn',
    ],
    description:
      'Phù hợp gia đình lưu trữ nhiều thực phẩm.',
    isDemo: true,
  },
  {
    id: 'fz1',
    name: 'Sanaky 220 lít',
    brand: 'Sanaky',
    deviceType: 'freezer',
    price: 5900000,
    capacity: '220 lít',
    inverter: false,
    warranty: 'Cần kiểm tra theo model',
    features: [
      'Trữ đông thực phẩm',
      'Dung tích vừa',
    ],
    description:
      'Lựa chọn tham khảo cho nhu cầu trữ đông nhỏ.',
    isDemo: true,
  },
  {
    id: 'fz2',
    name: 'Hòa Phát 350 lít',
    brand: 'Hòa Phát',
    deviceType: 'freezer',
    price: 8500000,
    capacity: '350 lít',
    inverter: false,
    warranty: 'Cần kiểm tra theo model',
    features: [
      'Dung tích lớn',
      'Trữ đông thực phẩm',
    ],
    description:
      'Lựa chọn tham khảo cho cửa hàng.',
    isDemo: true,
  },
];

// ==================================================
// DANH MỤC THIẾT BỊ
// ==================================================

const TYPES: {
  id: DeviceType;
  title: string;
  icon: string;
}[] = [
  {
    id: 'air-conditioner',
    title: 'Máy lạnh',
    icon: '❄️',
  },
  {
    id: 'refrigerator',
    title: 'Tủ lạnh',
    icon: '🧊',
  },
  {
    id: 'freezer',
    title: 'Tủ đông',
    icon: '📦',
  },
];

// ==================================================
// HÀM HỖ TRỢ
// ==================================================

function getDeviceIcon(type: DeviceType) {
  return (
    TYPES.find((item) => item.id === type)
      ?.icon ?? '❄️'
  );
}

function getDeviceLabel(type: DeviceType) {
  return (
    TYPES.find((item) => item.id === type)
      ?.title ?? 'Thiết bị điện lạnh'
  );
}

function isValidPair(
  first?: ProductRecommendation,
  second?: ProductRecommendation
): boolean {
  return Boolean(
    first &&
    second &&
    first.id !== second.id &&
    first.deviceType === second.deviceType
  );
}

function getCapacityNumber(
  product: ProductRecommendation
): number | null {
  const value = product.capacity.toLowerCase();

  if (
    product.deviceType === 'air-conditioner'
  ) {
    if (
      typeof product.coolingCapacity ===
        'number' &&
      product.coolingCapacity > 0
    ) {
      return product.coolingCapacity;
    }

    const btu = value.match(
      /(\d[\d.,\s]*)\s*btu/
    );

    if (btu) {
      const number = Number(
        btu[1].replace(/[.,\s]/g, '')
      );

      return Number.isFinite(number)
        ? number
        : null;
    }

    const hp = value.match(
      /(\d+(?:[.,]\d+)?)\s*hp/
    );

    if (hp) {
      const number = Number(
        hp[1].replace(',', '.')
      );

      return Number.isFinite(number)
        ? number * 9000
        : null;
    }

    return null;
  }

  const liters = value.match(
    /(\d+(?:[.,]\d+)?)\s*(?:lít|lit|l\b)/
  );

  if (!liters) {
    return null;
  }

  const number = Number(
    liters[1].replace(',', '.')
  );

  return Number.isFinite(number)
    ? number
    : null;
}

function getPower(
  product: ProductRecommendation
): string {
  if (
    typeof product.powerConsumption ===
      'number' &&
    product.powerConsumption > 0
  ) {
    return `${product.powerConsumption.toLocaleString(
      'vi-VN'
    )} W`;
  }

  return UNKNOWN;
}

function getFeatures(
  product: ProductRecommendation
): string[] {
  if (product.features?.length) {
    return product.features;
  }

  const features: string[] = [];

  if (product.inverter) {
    features.push('Công nghệ Inverter');
  }

  if (product.capacity) {
    features.push(product.capacity);
  }

  if (product.energyRating) {
    features.push(product.energyRating);
  }

  return features;
}

function getAdvantages(
  product: ProductRecommendation
): string[] {
  if (product.advantages?.length) {
    return product.advantages;
  }

  const advantages: string[] = [];

  if (product.inverter) {
    advantages.push(
      'Có công nghệ Inverter theo dữ liệu mẫu.'
    );
  }

  if (product.description) {
    advantages.push(product.description);
  }

  return advantages;
}

function getDisadvantages(
  product: ProductRecommendation
): string[] {
  if (product.disadvantages?.length) {
    return product.disadvantages;
  }

  const disadvantages: string[] = [];

  if (!product.inverter) {
    disadvantages.push(
      'Chưa xác minh công nghệ Inverter.'
    );
  }

  if (!product.powerConsumption) {
    disadvantages.push(
      'Chưa có thông số điện năng tiêu thụ.'
    );
  }

  if (!product.model) {
    disadvantages.push(
      'Cần kiểm tra mã model cụ thể.'
    );
  }

  return disadvantages;
}

// ==================================================
// TẠO DỮ LIỆU DỰ TOÁN
// ==================================================

function buildEstimate(
  product: ProductRecommendation,
  context?: ComparePayload
): EstimatePayload {
  const isAirConditioner =
    product.deviceType === 'air-conditioner';

  return {
    source: context?.source ?? 'home',

    conversationId:
      context?.conversationId,

    messageId:
      context?.messageId,

    question:
      context?.question,

    createdAt: Date.now(),

    deviceType: product.deviceType,

    serviceType: 'installation',

    productName: product.name,

    product,

    userNeeds: context?.userNeeds,

    budget: context?.userNeeds?.budget,

    quantity: 1,

    unitPrice: product.price,

    materialCost: isAirConditioner
      ? 650000
      : 0,

    laborCost:
      product.installationCost ??
      (isAirConditioner ? 350000 : 0),

    extraCost: isAirConditioner
      ? 200000
      : 150000,

    reservePercent: 5,

    note:
      'Dự toán tham khảo từ màn hình so sánh: ' +
      product.name,

    explanation:
      'Tổng chi phí bao gồm giá thiết bị, ' +
      'vật tư, công lắp đặt, phụ phí ' +
      'và khoản dự phòng.',

    assumptions: [
      'Giá thiết bị là dữ liệu mẫu.',
      'Chi phí lắp đặt được giả lập.',
      'Chưa khảo sát vị trí lắp đặt thực tế.',
    ],

    isDemo: true,
  };
}

// ==================================================
// GIAO DIỆN CHÍNH
// ==================================================

export default function CompareScreen({
  onBack,
  initialData,
  payload,
  onAction,
  onEstimate,
}: Props) {
  const incomingData =
    initialData ?? payload;

  const validIncoming = isValidPair(
    incomingData?.firstProduct,
    incomingData?.secondProduct
  );

  const [activeContext, setActiveContext] =
    useState<ComparePayload | undefined>(
      validIncoming ? incomingData : undefined
    );

  const [deviceType, setDeviceType] =
    useState<DeviceType>(
      validIncoming && incomingData
        ? incomingData.firstProduct.deviceType
        : 'air-conditioner'
    );

  const [leftId, setLeftId] = useState(
    validIncoming && incomingData
      ? incomingData.firstProduct.id
      : 'ac1'
  );

  const [rightId, setRightId] = useState(
    validIncoming && incomingData
      ? incomingData.secondProduct.id
      : 'ac2'
  );

  const [selectionSide, setSelectionSide] =
    useState<'left' | 'right' | null>(
      null
    );

  const [showComparison, setShowComparison] =
    useState(validIncoming);

  // ==================================================
  // NHẬN DỮ LIỆU TỪ AI HOẶC TRANG TƯ VẤN
  // ==================================================

  useEffect(() => {
    if (
      incomingData &&
      isValidPair(
        incomingData.firstProduct,
        incomingData.secondProduct
      )
    ) {
      setActiveContext(incomingData);

      setDeviceType(
        incomingData.firstProduct.deviceType
      );

      setLeftId(
        incomingData.firstProduct.id
      );

      setRightId(
        incomingData.secondProduct.id
      );

      setShowComparison(true);
      setSelectionSide(null);

      return;
    }

    setActiveContext(undefined);
    setDeviceType('air-conditioner');
    setLeftId('ac1');
    setRightId('ac2');
    setShowComparison(false);
    setSelectionSide(null);
  }, [incomingData]);

  // ==================================================
  // KẾT HỢP DỮ LIỆU MẪU VÀ THIẾT BỊ TỪ AI
  // ==================================================

  const allDevices =
    useMemo<ProductRecommendation[]>(() => {
      const devices = new Map<
        string,
        ProductRecommendation
      >();

      DEVICES.forEach((device) => {
        devices.set(device.id, device);
      });

      if (incomingData && validIncoming) {
        devices.set(
          incomingData.firstProduct.id,
          incomingData.firstProduct
        );

        devices.set(
          incomingData.secondProduct.id,
          incomingData.secondProduct
        );
      }

      return Array.from(devices.values());
    }, [incomingData, validIncoming]);

  const availableDevices = useMemo(
    () =>
      allDevices.filter(
        (device) =>
          device.deviceType === deviceType
      ),
    [allDevices, deviceType]
  );

  const left = availableDevices.find(
    (device) => device.id === leftId
  );

  const right = availableDevices.find(
    (device) => device.id === rightId
  );

  const canCompare = isValidPair(
    left,
    right
  );

  const isFromAI =
    Boolean(activeContext) &&
    activeContext?.source !== 'home' &&
    activeContext?.source !== 'account';

  const needs = activeContext?.userNeeds;

  const budget = needs?.budget ?? 0;

  const hasEstimateNavigation = Boolean(
    onAction || onEstimate
  );

  // ==================================================
  // THAY ĐỔI LOẠI THIẾT BỊ
  // ==================================================

  function changeType(type: DeviceType) {
    if (type === deviceType) {
      return;
    }

    const filtered = allDevices.filter(
      (device) =>
        device.deviceType === type
    );

    setDeviceType(type);

    setLeftId(
      filtered[0]?.id ?? ''
    );

    setRightId(
      filtered[1]?.id ?? ''
    );

    setSelectionSide(null);
    setShowComparison(false);
    setActiveContext(undefined);
  }

  // ==================================================
  // CHỌN THIẾT BỊ
  // ==================================================

  function selectDevice(id: string) {
    if (selectionSide === 'left') {
      if (id === rightId) {
        return;
      }

      if (id !== leftId) {
        setLeftId(id);
        setActiveContext(undefined);
        setShowComparison(false);
      }
    }

    if (selectionSide === 'right') {
      if (id === leftId) {
        return;
      }

      if (id !== rightId) {
        setRightId(id);
        setActiveContext(undefined);
        setShowComparison(false);
      }
    }

    setSelectionSide(null);
  }

  // ==================================================
  // KHÔI PHỤC KẾT QUẢ BAN ĐẦU
  // ==================================================

  function restoreOriginalComparison() {
    if (
      !incomingData ||
      !validIncoming
    ) {
      return;
    }

    setActiveContext(incomingData);

    setDeviceType(
      incomingData.firstProduct.deviceType
    );

    setLeftId(
      incomingData.firstProduct.id
    );

    setRightId(
      incomingData.secondProduct.id
    );

    setSelectionSide(null);
    setShowComparison(true);
  }

  // ==================================================
  // CHUYỂN SANG DỰ TOÁN CHI PHÍ
  // ==================================================

  function openEstimate(
    product: ProductRecommendation
  ) {
    const estimate = buildEstimate(
      product,
      activeContext
    );

    if (onEstimate) {
      onEstimate(estimate);
      return;
    }

    if (onAction) {
      onAction({
        id: createId(),

        label:
          'Dự toán chi phí ' + product.name,

        feature: 'estimate',

        payload: estimate,
      });
    }
  }

  // ==================================================
  // TÍNH TOÁN SO SÁNH
  // ==================================================

  const priceDifference =
    left && right
      ? Math.abs(left.price - right.price)
      : 0;

  const cheaper =
    left && right
      ? left.price < right.price
        ? left
        : right.price < left.price
          ? right
          : null
      : null;

  const leftCapacity = left
    ? getCapacityNumber(left)
    : null;

  const rightCapacity = right
    ? getCapacityNumber(right)
    : null;

  const comparableCapacity =
    leftCapacity !== null &&
    rightCapacity !== null;

  const larger =
    left &&
    right &&
    leftCapacity !== null &&
    rightCapacity !== null
      ? leftCapacity > rightCapacity
        ? left
        : rightCapacity > leftCapacity
          ? right
          : null
      : null;

  const leftEstimate = left
    ? calculateEstimate(
        buildEstimate(left, activeContext)
      )
    : null;

  const rightEstimate = right
    ? calculateEstimate(
        buildEstimate(right, activeContext)
      )
    : null;

  const recommendedProduct =
    activeContext?.recommendedProductId ===
    left?.id
      ? left
      : activeContext?.recommendedProductId ===
          right?.id
        ? right
        : undefined;

  // ==================================================
  // THÔNG TIN NHU CẦU TỪ AI
  // ==================================================

  function renderContext() {
    if (!activeContext) {
      return null;
    }

    return (
      <View style={styles.contextCard}>
        <View style={styles.contextHeader}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>
              ❄
            </Text>
          </View>

          <View style={styles.flex}>
            <Text style={styles.contextTitle}>
              {isFromAI
                ? 'So sánh từ SmartCool AI'
                : 'So sánh từ trang tư vấn'}
            </Text>

            <Text style={styles.contextSubtitle}>
              Đã tự động nhận hai thiết bị
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>
          Thông tin nhu cầu
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Loại thiết bị
          </Text>

          <Text style={styles.infoValue}>
            {getDeviceLabel(deviceType)}
          </Text>
        </View>

        {budget > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Ngân sách
            </Text>

            <Text style={styles.infoMoney}>
              {formatCurrency(budget)}
            </Text>
          </View>
        )}

        {needs?.roomArea !== undefined && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Diện tích phòng
            </Text>

            <Text style={styles.infoValue}>
              {needs.roomArea} m²
            </Text>
          </View>
        )}

        {needs?.householdSize !==
          undefined && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Số người sử dụng
            </Text>

            <Text style={styles.infoValue}>
              {needs.householdSize} người
            </Text>
          </View>
        )}

        {needs?.energySaving !==
          undefined && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Ưu tiên tiết kiệm điện
            </Text>

            <Text style={styles.infoValue}>
              {needs.energySaving
                ? 'Có'
                : 'Không yêu cầu'}
            </Text>
          </View>
        )}

        {!!needs?.preferredBrands?.length && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Thương hiệu ưu tiên
            </Text>

            <Text style={styles.infoValue}>
              {needs.preferredBrands.join(', ')}
            </Text>
          </View>
        )}

        {!!needs?.purpose && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Mục đích sử dụng
            </Text>

            <Text style={styles.infoValue}>
              {needs.purpose}
            </Text>
          </View>
        )}

        {!!activeContext.comparisonReason && (
          <View style={styles.contextReason}>
            <Text style={styles.contextReasonTitle}>
              Lý do so sánh
            </Text>

            <Text style={styles.paragraph}>
              {activeContext.comparisonReason}
            </Text>
          </View>
        )}

        {!!activeContext.comparisonCriteria
          ?.length && (
          <View style={styles.contextReason}>
            <Text style={styles.contextReasonTitle}>
              Tiêu chí quan tâm
            </Text>

            {activeContext.comparisonCriteria.map(
              (criterion, index) => (
                <Text
                  key={index}
                  style={styles.paragraph}
                >
                  • {criterion}
                </Text>
              )
            )}
          </View>
        )}
      </View>
    );
  }

  // ==================================================
  // THẺ THIẾT BỊ ĐƯỢC CHỌN
  // ==================================================

  function renderSelectedDevice(
    product: ProductRecommendation | undefined,
    side: 'left' | 'right'
  ) {
    const isRecommended =
      Boolean(product) &&
      product?.id === recommendedProduct?.id;

    return (
      <TouchableOpacity
        style={[
          styles.selectedCard,

          isRecommended &&
            styles.selectedCardRecommended,
        ]}
        onPress={() =>
          setSelectionSide(
            selectionSide === side
              ? null
              : side
          )
        }
        activeOpacity={0.75}
      >
        <Text style={styles.selectedLabel}>
          THIẾT BỊ {side === 'left' ? 'A' : 'B'}
        </Text>

        <View style={styles.deviceIconBox}>
          <Text style={styles.selectedIcon}>
            {getDeviceIcon(deviceType)}
          </Text>
        </View>

        <Text style={styles.selectedBrand}>
          {product?.brand ?? ''}
        </Text>

        <Text style={styles.selectedName}>
          {product?.name ?? 'Chọn thiết bị'}
        </Text>

        {!!product && (
          <>
            <Text style={styles.selectedCapacity}>
              {product.capacity}
            </Text>

            <Text style={styles.selectedPrice}>
              {formatCurrency(product.price)}
            </Text>
          </>
        )}

        {isRecommended && (
          <View style={styles.recommendedTag}>
            <Text style={styles.recommendedText}>
              Ưu tiên đề xuất
            </Text>
          </View>
        )}

        <Text style={styles.changeText}>
          Nhấn để thay đổi
        </Text>
      </TouchableOpacity>
    );
  }

  // ==================================================
  // DANH SÁCH CHỌN THIẾT BỊ
  // ==================================================

  function renderSelector() {
    if (!selectionSide) {
      return null;
    }

    return (
      <View style={styles.selectorPanel}>
        <View style={styles.selectorHeader}>
          <Text style={styles.selectorTitle}>
            Chọn thiết bị{' '}
            {selectionSide === 'left'
              ? 'A'
              : 'B'}
          </Text>

          <TouchableOpacity
            onPress={() =>
              setSelectionSide(null)
            }
          >
            <Text style={styles.closeText}>
              Đóng ✕
            </Text>
          </TouchableOpacity>
        </View>

        {availableDevices.map((device) => {
          const selected =
            selectionSide === 'left'
              ? leftId === device.id
              : rightId === device.id;

          const usedOnOtherSide =
            selectionSide === 'left'
              ? rightId === device.id
              : leftId === device.id;

          return (
            <TouchableOpacity
              key={device.id}
              style={[
                styles.deviceOption,

                selected &&
                  styles.deviceOptionActive,

                usedOnOtherSide &&
                  styles.disabledOption,
              ]}
              disabled={usedOnOtherSide}
              onPress={() =>
                selectDevice(device.id)
              }
            >
              <Text style={styles.optionIcon}>
                {getDeviceIcon(
                  device.deviceType
                )}
              </Text>

              <View style={styles.flex}>
                <Text style={styles.deviceOptionName}>
                  {device.name}
                </Text>

                <Text style={styles.deviceOptionPrice}>
                  {formatCurrency(device.price)}
                </Text>

                <Text style={styles.optionCapacity}>
                  {device.capacity}
                </Text>
              </View>

              <Text style={styles.optionStatus}>
                {usedOnOtherSide
                  ? 'Đã chọn'
                  : selected
                    ? '✓'
                    : '›'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // ==================================================
  // BẢNG SO SÁNH THÔNG SỐ
  // ==================================================

  function renderComparisonTable(
    first: ProductRecommendation,
    second: ProductRecommendation
  ) {
    const rows = [
      {
        label: 'Thương hiệu',
        a: first.brand,
        b: second.brand,
      },
      {
        label: 'Model',
        a: first.model ?? UNKNOWN,
        b: second.model ?? UNKNOWN,
      },
      {
        label: 'Giá thiết bị',
        a: formatCurrency(first.price),
        b: formatCurrency(second.price),
        highlight: true,
      },
      {
        label:
          deviceType === 'air-conditioner'
            ? 'Công suất'
            : 'Dung tích',
        a: first.capacity,
        b: second.capacity,
      },
      {
        label: 'Inverter',
        a: first.inverter
          ? 'Có (mẫu)'
          : 'Chưa xác minh',
        b: second.inverter
          ? 'Có (mẫu)'
          : 'Chưa xác minh',
      },
      {
        label: 'Công suất điện',
        a: getPower(first),
        b: getPower(second),
      },
      {
        label: 'Nhãn năng lượng',
        a: first.energyRating ?? UNKNOWN,
        b: second.energyRating ?? UNKNOWN,
      },
      {
        label: 'Phù hợp',
        a:
          first.suitableRoomArea ??
          first.description,
        b:
          second.suitableRoomArea ??
          second.description,
      },
      {
        label: 'Bảo hành',
        a:
          first.warranty ??
          'Cần kiểm tra theo model',
        b:
          second.warranty ??
          'Cần kiểm tra theo model',
      },
      {
        label: 'Xuất xứ',
        a: first.origin ?? UNKNOWN,
        b: second.origin ?? UNKNOWN,
      },
    ];

    return (
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableLabelHeader}>
            Tiêu chí
          </Text>

          <Text style={styles.tableValueHeader}>
            Thiết bị A
          </Text>

          <Text style={styles.tableValueHeader}>
            Thiết bị B
          </Text>
        </View>

        {rows.map((row, index) => (
          <View
            key={row.label}
            style={[
              styles.tableRow,

              index % 2 === 0 &&
                styles.tableRowAlt,
            ]}
          >
            <Text style={styles.tableLabel}>
              {row.label}
            </Text>

            <Text
              style={[
                styles.tableValue,

                row.highlight &&
                  styles.tablePrice,
              ]}
            >
              {row.a}
            </Text>

            <Text
              style={[
                styles.tableValue,

                row.highlight &&
                  styles.tablePrice,
              ]}
            >
              {row.b}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  // ==================================================
  // NHẬN XÉT SO SÁNH
  // ==================================================

  function renderAnalysis() {
    if (!left || !right) {
      return null;
    }

    return (
      <View style={styles.analysisCard}>
        <Text style={styles.analysisTitle}>
          ✨ Nhận xét so sánh
        </Text>

        <View style={styles.analysisItem}>
          <Text style={styles.analysisItemTitle}>
            💰 Về giá bán
          </Text>

          <Text style={styles.analysisText}>
            {cheaper
              ? cheaper.name +
                ' có giá thấp hơn ' +
                formatCurrency(priceDifference) +
                '.'
              : 'Hai thiết bị có cùng mức giá mẫu.'}
          </Text>
        </View>

        <View style={styles.analysisItem}>
          <Text style={styles.analysisItemTitle}>
            📐 Về công suất và dung tích
          </Text>

          <Text style={styles.analysisText}>
            {!comparableCapacity
              ? 'Chưa đủ thông số cùng đơn vị để so sánh.'
              : larger
                ? larger.name +
                  ' có công suất hoặc dung tích danh nghĩa lớn hơn.'
                : 'Hai thiết bị có công suất hoặc dung tích danh nghĩa tương đương.'}
          </Text>
        </View>

        <View style={styles.analysisItem}>
          <Text style={styles.analysisItemTitle}>
            ⚡ Về tiết kiệm điện
          </Text>

          <Text style={styles.analysisText}>
            {left.inverter && right.inverter
              ? 'Cả hai đều có Inverter theo dữ liệu mẫu. Cần thông số tiêu thụ điện thực tế để xác định thiết bị nào tiết kiệm hơn.'
              : 'Chưa đủ dữ liệu để kết luận thiết bị nào tiết kiệm điện hơn.'}
          </Text>
        </View>

        {budget > 0 &&
          leftEstimate &&
          rightEstimate && (
          <View style={styles.analysisItem}>
            <Text style={styles.analysisItemTitle}>
              🎯 Về ngân sách
            </Text>

            <Text style={styles.analysisText}>
              {leftEstimate.total <= budget &&
              rightEstimate.total <= budget
                ? 'Cả hai phương án đều nằm trong ngân sách dự kiến.'
                : leftEstimate.total <= budget
                  ? left.name +
                    ' nằm trong ngân sách dự kiến.'
                  : rightEstimate.total <= budget
                    ? right.name +
                      ' nằm trong ngân sách dự kiến.'
                    : 'Cả hai phương án đều vượt ngân sách khi tính thêm các chi phí dự kiến.'}
            </Text>
          </View>
        )}

        <Text style={styles.analysisNote}>
          Nhận xét được tạo bằng quy tắc so sánh
          và dữ liệu giả lập, chưa phải phân tích
          từ mô hình AI thực tế.
        </Text>
      </View>
    );
  }

  // ==================================================
  // TÍNH NĂNG, ƯU ĐIỂM VÀ NHƯỢC ĐIỂM
  // ==================================================

  function renderProductDetails(
    product: ProductRecommendation,
    side: 'A' | 'B'
  ) {
    const features = getFeatures(product);

    const advantages = getAdvantages(product);

    const disadvantages =
      getDisadvantages(product);

    return (
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={styles.detailIconBox}>
            <Text style={styles.detailIcon}>
              {getDeviceIcon(product.deviceType)}
            </Text>
          </View>

          <View style={styles.flex}>
            <Text style={styles.detailLabel}>
              THIẾT BỊ {side}
            </Text>

            <Text style={styles.detailName}>
              {product.name}
            </Text>
          </View>
        </View>

        <Text style={styles.detailDescription}>
          {product.description}
        </Text>

        <Text style={styles.detailSectionTitle}>
          Tính năng nổi bật
        </Text>

        <View style={styles.featureWrap}>
          {features.length > 0 ? (
            features.map((feature, index) => (
              <View
                key={index}
                style={styles.featureTag}
              >
                <Text style={styles.featureTagText}>
                  {feature}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.paragraph}>
              Chưa có thông tin tính năng.
            </Text>
          )}
        </View>

        <View style={styles.advantageBox}>
          <Text style={styles.advantageTitle}>
            ✓ Ưu điểm tham khảo
          </Text>

          {advantages.length > 0 ? (
            advantages.map((item, index) => (
              <Text
                key={index}
                style={styles.advantageText}
              >
                • {item}
              </Text>
            ))
          ) : (
            <Text style={styles.advantageText}>
              Chưa có dữ liệu.
            </Text>
          )}
        </View>

        <View style={styles.disadvantageBox}>
          <Text style={styles.disadvantageTitle}>
            ! Điểm cần cân nhắc
          </Text>

          {disadvantages.length > 0 ? (
            disadvantages.map(
              (item, index) => (
                <Text
                  key={index}
                  style={styles.disadvantageText}
                >
                  • {item}
                </Text>
              )
            )
          ) : (
            <Text style={styles.disadvantageText}>
              Cần kiểm tra thông số thực tế.
            </Text>
          )}
        </View>

        {!!product.recommendationReason && (
          <View style={styles.contextReason}>
            <Text style={styles.contextReasonTitle}>
              Lý do được đề xuất
            </Text>

            <Text style={styles.paragraph}>
              {product.recommendationReason}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // ==================================================
  // SO SÁNH CHI PHÍ
  // ==================================================

  function renderCostComparison(
    first: ProductRecommendation,
    second: ProductRecommendation
  ) {
    const firstData = buildEstimate(
      first,
      activeContext
    );

    const secondData = buildEstimate(
      second,
      activeContext
    );

    const firstResult =
      calculateEstimate(firstData);

    const secondResult =
      calculateEstimate(secondData);

    const rows = [
      {
        label: 'Giá thiết bị',
        a: firstResult.deviceCost,
        b: secondResult.deviceCost,
      },
      {
        label: 'Vật tư',
        a: firstData.materialCost,
        b: secondData.materialCost,
      },
      {
        label: 'Công lắp đặt',
        a: firstData.laborCost,
        b: secondData.laborCost,
      },
      {
        label: 'Phụ phí',
        a: firstData.extraCost,
        b: secondData.extraCost,
      },
      {
        label: 'Dự phòng (5%)',
        a: firstResult.reserveCost,
        b: secondResult.reserveCost,
      },
    ];

    return (
      <View style={styles.costCard}>
        <Text style={styles.sectionTitle}>
          🧮 So sánh chi phí dự kiến
        </Text>

        <Text style={styles.costSubtitle}>
          Chi phí mua và lắp đặt theo cùng
          phương pháp tính giả lập.
        </Text>

        <View style={styles.costNames}>
          <View style={styles.costNameBox}>
            <Text style={styles.costNameLabel}>
              THIẾT BỊ A
            </Text>

            <Text style={styles.costName}>
              {first.name}
            </Text>
          </View>

          <View style={styles.costNameBox}>
            <Text style={styles.costNameLabel}>
              THIẾT BỊ B
            </Text>

            <Text style={styles.costName}>
              {second.name}
            </Text>
          </View>
        </View>

        {rows.map((row) => (
          <View
            key={row.label}
            style={styles.costRow}
          >
            <Text style={styles.costLabel}>
              {row.label}
            </Text>

            <Text style={styles.costValue}>
              {formatCurrency(row.a)}
            </Text>

            <Text style={styles.costValue}>
              {formatCurrency(row.b)}
            </Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Tổng dự kiến
          </Text>

          <Text style={styles.totalValue}>
            {formatCurrency(firstResult.total)}
          </Text>

          <Text style={styles.totalValue}>
            {formatCurrency(secondResult.total)}
          </Text>
        </View>

        <View style={styles.differenceBox}>
          <Text style={styles.differenceLabel}>
            Chênh lệch tổng chi phí
          </Text>

          <Text style={styles.differenceValue}>
            {formatCurrency(
              Math.abs(
                firstResult.total -
                  secondResult.total
              )
            )}
          </Text>
        </View>

        {budget > 0 && (
          <View style={styles.budgetColumns}>
            {[
              {
                side: 'A',
                total: firstResult.total,
              },
              {
                side: 'B',
                total: secondResult.total,
              },
            ].map((item) => {
              const remaining =
                budget - item.total;

              return (
                <View
                  key={item.side}
                  style={[
                    styles.budgetBox,

                    remaining < 0 &&
                      styles.budgetBoxOver,
                  ]}
                >
                  <Text style={styles.budgetTitle}>
                    Thiết bị {item.side}
                  </Text>

                  <Text
                    style={[
                      styles.budgetText,

                      {
                        color:
                          remaining >= 0
                            ? GREEN
                            : RED,
                      },
                    ]}
                  >
                    {remaining >= 0
                      ? 'Còn lại'
                      : 'Vượt ngân sách'}
                  </Text>

                  <Text
                    style={[
                      styles.budgetAmount,

                      {
                        color:
                          remaining >= 0
                            ? GREEN
                            : RED,
                      },
                    ]}
                  >
                    {formatCurrency(
                      Math.abs(remaining)
                    )}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {hasEstimateNavigation && (
          <View style={styles.costActions}>
            <TouchableOpacity
              style={styles.estimateButton}
              onPress={() =>
                openEstimate(first)
              }
            >
              <Text style={styles.estimateButtonText}>
                Dự toán máy A ›
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.estimateButton}
              onPress={() =>
                openEstimate(second)
              }
            >
              <Text style={styles.estimateButtonText}>
                Dự toán máy B ›
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.analysisNote}>
          Chi phí chỉ mang tính minh họa,
          không phải báo giá lắp đặt thực tế.
        </Text>
      </View>
    );
  }

  // ==================================================
  // KẾT LUẬN VÀ ĐỀ XUẤT
  // ==================================================

  function renderRecommendation() {
    if (!left || !right) {
      return null;
    }

    return (
      <View style={styles.recommendationCard}>
        <View style={styles.recommendationHeader}>
          <View style={styles.recommendationIconBox}>
            <Text style={styles.recommendationIcon}>
              ✦
            </Text>
          </View>

          <View style={styles.flex}>
            <Text style={styles.recommendationTitle}>
              {recommendedProduct
                ? 'Đề xuất từ SmartCool AI'
                : 'Gợi ý lựa chọn'}
            </Text>

            <Text style={styles.contextSubtitle}>
              Kết quả tham khảo
            </Text>
          </View>
        </View>

        {recommendedProduct ? (
          <>
            <View style={styles.recommendedProductBox}>
              <Text style={styles.recommendedProductLabel}>
                THIẾT BỊ ĐƯỢC ƯU TIÊN
              </Text>

              <Text style={styles.recommendedProductName}>
                {recommendedProduct.name}
              </Text>

              <Text style={styles.recommendedProductPrice}>
                {formatCurrency(
                  recommendedProduct.price
                )}
              </Text>
            </View>

            <Text style={styles.paragraph}>
              {recommendedProduct.recommendationReason ??
                activeContext?.comparisonReason ??
                'Đây là thiết bị được ưu tiên trong kết quả tư vấn đã nhận.'}
            </Text>

            {budget > 0 &&
              calculateEstimate(
                buildEstimate(
                  recommendedProduct,
                  activeContext
                )
              ).total > budget && (
                <Text style={styles.warningText}>
                  Lưu ý: Tổng chi phí dự kiến của
                  thiết bị này vượt ngân sách.
                </Text>
              )}

            {hasEstimateNavigation && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  openEstimate(
                    recommendedProduct
                  )
                }
              >
                <Text style={styles.primaryButtonText}>
                  Xem dự toán thiết bị này ›
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Text style={styles.paragraph}>
              {cheaper
                ? 'Nếu ưu tiên giá mua, bạn có thể cân nhắc ' +
                  cheaper.name +
                  '.'
                : 'Hai thiết bị có cùng mức giá mẫu.'}
            </Text>

            <Text style={styles.paragraph}>
              Không nên chỉ dựa vào giá bán
              hoặc công suất lớn hơn để lựa chọn.
              Hãy cân nhắc nhu cầu sử dụng,
              chi phí vận hành, bảo hành
              và điều kiện lắp đặt.
            </Text>
          </>
        )}

        <Text style={styles.analysisNote}>
          Đề xuất không thay thế việc kiểm tra
          thông số chính thức của nhà sản xuất.
        </Text>
      </View>
    );
  }

  // ==================================================
  // GIAO DIỆN HIỂN THỊ
  // ==================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* NÚT QUAY LẠI */}

      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
      >
        <Text style={styles.backText}>
          ← Quay lại
        </Text>
      </TouchableOpacity>

      {/* TIÊU ĐỀ */}

      <View style={styles.hero}>
        <View style={styles.heroIconBox}>
          <Text style={styles.heroIcon}>
            ⚖️
          </Text>
        </View>

        <Text style={styles.heroTitle}>
          So sánh thiết bị
        </Text>

        <Text style={styles.heroDescription}>
          {activeContext
            ? 'So sánh chi tiết hai thiết bị đã được chuyển từ kết quả tư vấn.'
            : 'Chọn hai thiết bị cùng loại để so sánh giá, công suất, tính năng và nhu cầu sử dụng.'}
        </Text>

        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>
            {isFromAI
              ? '✦ KẾT QUẢ AI DEMO'
              : 'DỮ LIỆU MẪU'}
          </Text>
        </View>
      </View>

      {/* THÔNG TIN TỪ AI */}

      {renderContext()}

      {!!incomingData &&
        !validIncoming && (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>
              Không thể nhận cặp thiết bị
            </Text>

            <Text style={styles.noticeText}>
              Hai thiết bị phải khác nhau
              và thuộc cùng một loại.
              Bạn có thể chọn lại bên dưới.
            </Text>
          </View>
        )}

      {/* CHỌN LOẠI THIẾT BỊ */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          1. Chọn loại thiết bị
        </Text>

        <View style={styles.typeRow}>
          {TYPES.map((type) => {
            const active =
              deviceType === type.id;

            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,

                  active &&
                    styles.typeButtonActive,
                ]}
                onPress={() =>
                  changeType(type.id)
                }
              >
                <Text style={styles.typeIcon}>
                  {type.icon}
                </Text>

                <Text
                  style={[
                    styles.typeText,

                    active &&
                      styles.typeTextActive,
                  ]}
                >
                  {type.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>
          2. Chọn hai thiết bị
        </Text>

        {!!activeContext && (
          <View style={styles.autoSelectedBox}>
            <Text style={styles.autoSelectedText}>
              ✓ Hai thiết bị đã được tự động chọn
              từ kết quả tư vấn.
            </Text>
          </View>
        )}

        <View style={styles.selectedRow}>
          {renderSelectedDevice(left, 'left')}

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>
              VS
            </Text>
          </View>

          {renderSelectedDevice(right, 'right')}
        </View>

        {renderSelector()}

        <TouchableOpacity
          style={[
            styles.primaryButton,

            !canCompare &&
              styles.disabledButton,
          ]}
          disabled={!canCompare}
          onPress={() => {
            setSelectionSide(null);
            setShowComparison(true);
          }}
        >
          <Text style={styles.primaryButtonText}>
            {showComparison
              ? '⚖️ Cập nhật so sánh'
              : '⚖️ So sánh ngay'}
          </Text>
        </TouchableOpacity>

        {!!incomingData &&
          validIncoming &&
          !activeContext && (
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={
                restoreOriginalComparison
              }
            >
              <Text style={styles.restoreText}>
                Khôi phục kết quả so sánh ban đầu
              </Text>
            </TouchableOpacity>
          )}
      </View>

      {/* KẾT QUẢ SO SÁNH */}

      {showComparison &&
        canCompare &&
        left &&
        right && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>
              Kết quả so sánh
            </Text>

            <Text style={styles.resultsSubtitle}>
              {activeContext
                ? 'Đối chiếu đúng hai thiết bị từ kết quả tư vấn.'
                : 'Bảng đối chiếu hai thiết bị đã chọn.'}
            </Text>

            {renderComparisonTable(left, right)}

            {renderAnalysis()}

            {renderCostComparison(left, right)}

            <Text style={styles.detailsHeading}>
              Chi tiết từng thiết bị
            </Text>

            {renderProductDetails(left, 'A')}

            {renderProductDetails(right, 'B')}

            {renderRecommendation()}
          </View>
        )}

      {/* LƯU Ý */}

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>
          ℹ️ Lưu ý về dữ liệu
        </Text>

        <Text style={styles.noticeText}>
          SmartCool AI hiện đang sử dụng dữ liệu
          giả lập phục vụ đồ án.
          {'\n\n'}
          Tên thiết bị có thể chỉ đại diện cho
          một dòng sản phẩm, chưa gắn với mã
          model cụ thể.
          {'\n\n'}
          Giá bán, công suất, công nghệ,
          tính năng và chi phí lắp đặt cần
          được xác minh trước khi mua.
        </Text>
      </View>
    </ScrollView>
  );
}

// ==================================================
// STYLE
// ==================================================

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  content: {
    padding: 17,
    paddingBottom: 40,
  },

  backButton: {
    marginBottom: 17,
  },

  backText: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '700',
  },

  hero: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
  },

  heroIconBox: {
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  heroIcon: {
    fontSize: 35,
  },

  heroTitle: {
    color: TEXT,
    fontSize: 24,
    fontWeight: '800',
  },

  heroDescription: {
    color: '#557594',
    fontSize: 13,
    lineHeight: 22,
    marginTop: 9,
  },

  demoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: WHITE,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 15,
  },

  demoBadgeText: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '800',
  },

  // THÔNG TIN AI

  contextCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#B9D9FF',
    borderRadius: 20,
    padding: 17,
    marginBottom: 18,
  },

  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  aiAvatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiAvatarText: {
    color: WHITE,
    fontSize: 29,
    fontWeight: '800',
  },

  contextTitle: {
    color: DARK_BLUE,
    fontSize: 15,
    fontWeight: '800',
  },

  contextSubtitle: {
    color: MUTED,
    fontSize: 11,
    marginTop: 5,
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 17,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },

  infoLabel: {
    flex: 1,
    fontSize: 12,
    color: MUTED,
    lineHeight: 19,
  },

  infoValue: {
    flex: 1,
    fontSize: 12,
    color: TEXT,
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 19,
  },

  infoMoney: {
    flex: 1,
    color: BLUE,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },

  contextReason: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 13,
    padding: 13,
    marginTop: 15,
  },

  contextReasonTitle: {
    color: DARK_BLUE,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },

  paragraph: {
    color: TEXT,
    fontSize: 12,
    lineHeight: 21,
    marginBottom: 6,
  },

  // CHỌN THIẾT BỊ

  card: {
    backgroundColor: WHITE,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 17,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    color: TEXT,
    fontWeight: '800',
    marginBottom: 14,
  },

  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 23,
  },

  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FAFCFF',
    borderRadius: 13,
    alignItems: 'center',
    paddingVertical: 14,
  },

  typeButtonActive: {
    borderColor: BLUE,
    backgroundColor: LIGHT_BLUE,
  },

  typeIcon: {
    fontSize: 25,
    marginBottom: 7,
  },

  typeText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '700',
  },

  typeTextActive: {
    color: BLUE,
  },

  autoSelectedBox: {
    backgroundColor: '#F0FDF4',
    padding: 11,
    borderRadius: 10,
    marginBottom: 13,
  },

  autoSelectedText: {
    color: GREEN,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 18,
  },

  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 18,
  },

  selectedCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 220,
    borderWidth: 1,
    borderColor: '#D9E7F6',
    backgroundColor: '#FAFCFF',
    borderRadius: 15,
    padding: 11,
    alignItems: 'center',
  },

  selectedCardRecommended: {
    borderColor: GREEN,
    backgroundColor: '#F7FFF9',
  },

  selectedLabel: {
    color: '#6683A1',
    fontSize: 10,
    fontWeight: '800',
  },

  deviceIconBox: {
    width: 56,
    height: 56,
    backgroundColor: LIGHT_BLUE,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 10,
  },

  selectedIcon: {
    fontSize: 30,
  },

  selectedBrand: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 5,
  },

  selectedName: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
    minHeight: 36,
  },

  selectedCapacity: {
    color: MUTED,
    fontSize: 11,
    marginTop: 7,
    textAlign: 'center',
  },

  selectedPrice: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 9,
  },

  recommendedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 9,
  },

  recommendedText: {
    color: GREEN,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },

  changeText: {
    color: '#8293A8',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 9,
  },

  vsContainer: {
    width: 26,
    alignItems: 'center',
  },

  vsText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '900',
  },

  // DANH SÁCH LỰA CHỌN

  selectorPanel: {
    backgroundColor: '#F8FBFF',
    borderWidth: 1,
    borderColor: '#D9E7F6',
    borderRadius: 13,
    padding: 12,
    marginBottom: 17,
  },

  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  selectorTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '800',
  },

  closeText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '700',
  },

  deviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 11,
    backgroundColor: WHITE,
    padding: 12,
    marginBottom: 8,
  },

  deviceOptionActive: {
    borderColor: BLUE,
    backgroundColor: LIGHT_BLUE,
  },

  disabledOption: {
    opacity: 0.45,
  },

  optionIcon: {
    fontSize: 24,
    marginRight: 10,
  },

  deviceOptionName: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },

  deviceOptionPrice: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },

  optionCapacity: {
    color: MUTED,
    fontSize: 10,
    marginTop: 4,
  },

  optionStatus: {
    color: BLUE,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 9,
  },

  primaryButton: {
    backgroundColor: BLUE,
    borderRadius: 13,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  disabledButton: {
    backgroundColor: '#B9D3F1',
  },

  restoreButton: {
    paddingTop: 17,
    alignItems: 'center',
  },

  restoreText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  // KẾT QUẢ

  results: {
    marginBottom: 18,
  },

  resultsTitle: {
    color: TEXT,
    fontSize: 21,
    fontWeight: '800',
  },

  resultsSubtitle: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 15,
  },

  table: {
    backgroundColor: WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BLUE,
    paddingVertical: 15,
    paddingHorizontal: 9,
  },

  tableLabelHeader: {
    flex: 1,
    color: WHITE,
    fontSize: 11,
    fontWeight: '800',
  },

  tableValueHeader: {
    flex: 1,
    color: WHITE,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 9,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F8',
  },

  tableRowAlt: {
    backgroundColor: '#F8FBFF',
  },

  tableLabel: {
    flex: 1,
    color: '#425B76',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 18,
    paddingRight: 5,
  },

  tableValue: {
    flex: 1,
    color: TEXT,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 3,
  },

  tablePrice: {
    color: BLUE,
    fontWeight: '800',
  },

  // NHẬN XÉT

  analysisCard: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 17,
    padding: 17,
    marginTop: 16,
  },

  analysisTitle: {
    color: DARK_BLUE,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },

  analysisItem: {
    marginBottom: 15,
  },

  analysisItemTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },

  analysisText: {
    color: '#365C83',
    fontSize: 12,
    lineHeight: 21,
  },

  analysisNote: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 17,
    marginTop: 12,
  },

  // CHI PHÍ

  costCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 15,
    marginTop: 16,
  },

  costSubtitle: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 15,
  },

  costNames: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },

  costNameBox: {
    flex: 1,
    backgroundColor: LIGHT_BLUE,
    borderRadius: 11,
    padding: 11,
  },

  costNameLabel: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
  },

  costName: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 19,
  },

  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F8',
  },

  costLabel: {
    flex: 1,
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
  },

  costValue: {
    flex: 1,
    color: TEXT,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    paddingLeft: 4,
  },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_BLUE,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },

  totalLabel: {
    flex: 1,
    color: DARK_BLUE,
    fontSize: 11,
    fontWeight: '800',
  },

  totalValue: {
    flex: 1,
    color: BLUE,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    paddingLeft: 3,
  },

  differenceBox: {
    alignItems: 'center',
    paddingVertical: 17,
  },

  differenceLabel: {
    color: MUTED,
    fontSize: 12,
  },

  differenceValue: {
    color: DARK_BLUE,
    fontSize: 23,
    fontWeight: '800',
    marginTop: 7,
  },

  budgetColumns: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 13,
  },

  budgetBox: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderRadius: 11,
    padding: 11,
  },

  budgetBoxOver: {
    backgroundColor: '#FEF2F2',
  },

  budgetTitle: {
    color: TEXT,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
  },

  budgetText: {
    fontSize: 11,
    fontWeight: '600',
  },

  budgetAmount: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 5,
  },

  costActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 5,
  },

  estimateButton: {
    flex: 1,
    backgroundColor: BLUE,
    borderRadius: 11,
    paddingVertical: 13,
    paddingHorizontal: 6,
    alignItems: 'center',
  },

  estimateButtonText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  // CHI TIẾT SẢN PHẨM

  detailsHeading: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 22,
    marginBottom: 14,
  },

  detailCard: {
    backgroundColor: WHITE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 14,
  },

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  detailIconBox: {
    width: 55,
    height: 55,
    borderRadius: 15,
    backgroundColor: LIGHT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailIcon: {
    fontSize: 29,
  },

  detailLabel: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 5,
  },

  detailName: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
  },

  detailDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 21,
    marginTop: 14,
  },

  detailSectionTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 10,
  },

  featureWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  featureTag: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  featureTagText: {
    color: DARK_BLUE,
    fontSize: 10,
    fontWeight: '700',
  },

  advantageBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 13,
    marginTop: 16,
  },

  advantageTitle: {
    color: GREEN,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },

  advantageText: {
    color: '#166534',
    fontSize: 12,
    lineHeight: 21,
    marginBottom: 4,
  },

  disadvantageBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 13,
    marginTop: 12,
  },

  disadvantageTitle: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },

  disadvantageText: {
    color: '#92400E',
    fontSize: 12,
    lineHeight: 21,
    marginBottom: 4,
  },

  // ĐỀ XUẤT

  recommendationCard: {
    backgroundColor: WHITE,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#B9D9FF',
    padding: 17,
    marginTop: 5,
  },

  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 16,
  },

  recommendationIconBox: {
    width: 43,
    height: 43,
    backgroundColor: BLUE,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  recommendationIcon: {
    color: WHITE,
    fontSize: 25,
    fontWeight: '800',
  },

  recommendationTitle: {
    color: DARK_BLUE,
    fontSize: 15,
    fontWeight: '800',
  },

  recommendedProductBox: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 14,
    padding: 15,
    marginBottom: 14,
  },

  recommendedProductLabel: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
  },

  recommendedProductName: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
  },

  recommendedProductPrice: {
    color: BLUE,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 9,
  },

  warningText: {
    color: RED,
    fontSize: 12,
    lineHeight: 20,
    marginVertical: 10,
  },

  // LƯU Ý

  notice: {
    backgroundColor: '#FFF8EA',
    borderRadius: 15,
    padding: 17,
    marginBottom: 14,
  },

  noticeTitle: {
    color: '#956300',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 9,
  },

  noticeText: {
    color: '#9C7A3B',
    fontSize: 11,
    lineHeight: 19,
  },
});
