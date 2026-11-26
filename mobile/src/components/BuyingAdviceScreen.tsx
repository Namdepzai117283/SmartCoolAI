
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  createId,
  formatCurrency,
  calculateEstimate,
} from '../types/smartcool';

import type {
  AIAction,
  BuyingPayload,
  ComparePayload,
  EstimatePayload,
  ProductRecommendation,
  DeviceType,
  UserNeeds,
} from '../types/smartcool';

// ==================================================
// KIỂU DỮ LIỆU
// ==================================================

interface Props {
  onBack: () => void;
  initialData?: BuyingPayload;
  payload?: BuyingPayload;
  onAction?: (action: AIAction) => void;
  onCompare?: (data: ComparePayload) => void;
  onEstimate?: (data: EstimatePayload) => void;
}

type Priority = 'saving' | 'premium' | 'brand';

interface LocalProduct extends ProductRecommendation {
  minArea?: number;
  maxArea?: number;
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

// ==================================================
// DANH SÁCH THIẾT BỊ MẪU
// ==================================================

const PRODUCTS: LocalProduct[] = [
  {
    id: 'ac1',
    name: 'Máy lạnh Daikin Inverter 1 HP',
    brand: 'Daikin',
    deviceType: 'air-conditioner',
    price: 9500000,
    capacity: '1 HP',
    inverter: true,
    minArea: 0,
    maxArea: 15,
    description:
      'Phù hợp phòng ngủ nhỏ hoặc phòng làm việc.',
    features: [
      'Inverter',
      'Tiết kiệm điện',
      'Làm lạnh ổn định',
    ],
    isDemo: true,
  },
  {
    id: 'ac2',
    name: 'Máy lạnh Panasonic Inverter 1.5 HP',
    brand: 'Panasonic',
    deviceType: 'air-conditioner',
    price: 12500000,
    capacity: '1.5 HP',
    inverter: true,
    minArea: 15,
    maxArea: 20,
    description:
      'Phù hợp phòng ngủ lớn hoặc phòng sinh hoạt.',
    features: [
      'Inverter',
      'Làm lạnh nhanh',
      'Vận hành êm',
    ],
    isDemo: true,
  },
  {
    id: 'ac3',
    name: 'Máy lạnh LG Dual Inverter 2 HP',
    brand: 'LG',
    deviceType: 'air-conditioner',
    price: 15900000,
    capacity: '2 HP',
    inverter: true,
    minArea: 20,
    maxArea: 30,
    description:
      'Phù hợp phòng khách và không gian rộng.',
    features: [
      'Dual Inverter',
      'Làm lạnh nhanh',
      'Tiết kiệm điện',
    ],
    isDemo: true,
  },
  {
    id: 'ac4',
    name: 'Máy lạnh Casper Inverter 1 HP',
    brand: 'Casper',
    deviceType: 'air-conditioner',
    price: 6900000,
    capacity: '1 HP',
    inverter: true,
    minArea: 0,
    maxArea: 15,
    description:
      'Lựa chọn tham khảo cho ngân sách tiết kiệm.',
    features: [
      'Inverter',
      'Giá dễ tiếp cận',
    ],
    isDemo: true,
  },
  {
    id: 'ac5',
    name: 'Máy lạnh Samsung Inverter 1.5 HP',
    brand: 'Samsung',
    deviceType: 'air-conditioner',
    price: 10900000,
    capacity: '1.5 HP',
    inverter: true,
    minArea: 15,
    maxArea: 20,
    description:
      'Lựa chọn cho phòng diện tích trung bình.',
    features: [
      'Inverter',
      'Vận hành êm',
    ],
    isDemo: true,
  },
  {
    id: 'fr1',
    name: 'Tủ lạnh Panasonic Inverter 255 lít',
    brand: 'Panasonic',
    deviceType: 'refrigerator',
    price: 7900000,
    capacity: '255 lít',
    inverter: true,
    description:
      'Phù hợp hộ gia đình khoảng 2–3 người.',
    features: [
      'Inverter',
      'Ngăn đá riêng',
      'Tiết kiệm điện',
    ],
    isDemo: true,
  },
  {
    id: 'fr2',
    name: 'Tủ lạnh Samsung Inverter 307 lít',
    brand: 'Samsung',
    deviceType: 'refrigerator',
    price: 9900000,
    capacity: '307 lít',
    inverter: true,
    description:
      'Phù hợp gia đình khoảng 3–4 người.',
    features: [
      'Inverter',
      'Dung tích trung bình',
    ],
    isDemo: true,
  },
  {
    id: 'fr3',
    name: 'Tủ lạnh LG Inverter 374 lít',
    brand: 'LG',
    deviceType: 'refrigerator',
    price: 12900000,
    capacity: '374 lít',
    inverter: true,
    description:
      'Phù hợp gia đình có nhu cầu lưu trữ nhiều.',
    features: [
      'Inverter',
      'Dung tích lớn',
    ],
    isDemo: true,
  },
  {
    id: 'fz1',
    name: 'Tủ đông Sanaky 220 lít',
    brand: 'Sanaky',
    deviceType: 'freezer',
    price: 5900000,
    capacity: '220 lít',
    inverter: false,
    description:
      'Tham khảo cho gia đình hoặc cửa hàng nhỏ.',
    features: [
      'Trữ đông thực phẩm',
      'Dung tích vừa',
    ],
    isDemo: true,
  },
  {
    id: 'fz2',
    name: 'Tủ đông Hòa Phát 350 lít',
    brand: 'Hòa Phát',
    deviceType: 'freezer',
    price: 8500000,
    capacity: '350 lít',
    inverter: false,
    description:
      'Tham khảo cho cửa hàng cần lưu trữ nhiều.',
    features: [
      'Dung tích lớn',
      'Trữ đông thực phẩm',
    ],
    isDemo: true,
  },
];

// ==================================================
// DANH MỤC THIẾT BỊ
// ==================================================

const DEVICE_OPTIONS: {
  id: DeviceType;
  icon: string;
  label: string;
}[] = [
  {
    id: 'air-conditioner',
    icon: '❄️',
    label: 'Máy lạnh',
  },
  {
    id: 'refrigerator',
    icon: '🧊',
    label: 'Tủ lạnh',
  },
  {
    id: 'freezer',
    icon: '📦',
    label: 'Tủ đông',
  },
];

const PRIORITY_OPTIONS: {
  id: Priority;
  label: string;
}[] = [
  {
    id: 'saving',
    label: 'Giá tiết kiệm',
  },
  {
    id: 'premium',
    label: 'Cao cấp hơn',
  },
  {
    id: 'brand',
    label: 'Theo tên',
  },
];

// ==================================================
// HÀM HỖ TRỢ
// ==================================================

function parseMoney(value: string): number {
  const number = Number(
    value.replace(/[^\d]/g, '')
  );

  return Number.isFinite(number)
    ? number
    : 0;
}

function getDeviceLabel(type: DeviceType) {
  return (
    DEVICE_OPTIONS.find(
      (item) => item.id === type
    )?.label ?? 'Thiết bị điện lạnh'
  );
}

function getDeviceIcon(type: DeviceType) {
  return (
    DEVICE_OPTIONS.find(
      (item) => item.id === type
    )?.icon ?? '❄️'
  );
}

function getProductFeatures(
  product: ProductRecommendation
): string[] {
  if (product.features?.length) {
    return product.features;
  }

  const features: string[] = [];

  if (product.inverter) {
    features.push('Inverter');
  }

  if (product.capacity) {
    features.push(product.capacity);
  }

  if (product.energyRating) {
    features.push(product.energyRating);
  }

  return features;
}

// ==================================================
// TẠO DỮ LIỆU DỰ TOÁN
// ==================================================

function buildEstimate(
  product: ProductRecommendation,
  userNeeds: UserNeeds,
  transfer?: BuyingPayload
): EstimatePayload {
  const isAirConditioner =
    product.deviceType === 'air-conditioner';

  return {
    source: transfer?.source ?? 'home',

    conversationId:
      transfer?.conversationId,

    messageId:
      transfer?.messageId,

    question:
      transfer?.question,

    createdAt: Date.now(),

    deviceType: product.deviceType,

    serviceType: 'installation',

    productName: product.name,

    product,

    userNeeds,

    budget: userNeeds.budget,

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
      'Dự toán tham khảo cho ' +
      product.name,

    explanation:
      'Chi phí được tính từ giá thiết bị, ' +
      'vật tư, công lắp đặt, phụ phí ' +
      'và khoản dự phòng.',

    assumptions: [
      'Sử dụng giá thiết bị mẫu.',
      'Chi phí lắp đặt giả lập.',
      'Chưa khảo sát vị trí lắp đặt thực tế.',
    ],

    isDemo: true,
  };
}

// ==================================================
// GIAO DIỆN CHÍNH
// ==================================================

export default function BuyingAdviceScreen({
  onBack,
  initialData,
  payload,
  onAction,
  onCompare,
  onEstimate,
}: Props) {
  const incomingData =
    initialData ?? payload;

  const [activeAIData, setActiveAIData] =
    useState<BuyingPayload | undefined>(
      incomingData
    );

  const [deviceType, setDeviceType] =
    useState<DeviceType>(
      incomingData?.userNeeds.deviceType ??
      incomingData?.recommendations?.[0]
        ?.deviceType ??
      'air-conditioner'
    );

  const [budget, setBudget] = useState(
    incomingData?.userNeeds.budget !==
      undefined
      ? String(
          incomingData.userNeeds.budget
        )
      : ''
  );

  const [area, setArea] = useState(
    incomingData?.userNeeds.roomArea !==
      undefined
      ? String(
          incomingData.userNeeds.roomArea
        )
      : ''
  );

  const [householdSize, setHouseholdSize] =
    useState(
      incomingData?.userNeeds.householdSize !==
        undefined
        ? String(
            incomingData.userNeeds.householdSize
          )
        : ''
    );

  const [priority, setPriority] =
    useState<Priority>('saving');

  const [submitted, setSubmitted] =
    useState(Boolean(incomingData));

  const [showManualForm, setShowManualForm] =
    useState(!incomingData);

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  // ==================================================
  // NHẬN DỮ LIỆU TỪ AI
  // ==================================================

  useEffect(() => {
    setActiveAIData(incomingData);

    setDeviceType(
      incomingData?.userNeeds.deviceType ??
      incomingData?.recommendations?.[0]
        ?.deviceType ??
      'air-conditioner'
    );

    setBudget(
      incomingData?.userNeeds.budget !==
        undefined
        ? String(
            incomingData.userNeeds.budget
          )
        : ''
    );

    setArea(
      incomingData?.userNeeds.roomArea !==
        undefined
        ? String(
            incomingData.userNeeds.roomArea
          )
        : ''
    );

    setHouseholdSize(
      incomingData?.userNeeds.householdSize !==
        undefined
        ? String(
            incomingData.userNeeds.householdSize
          )
        : ''
    );

    setSubmitted(Boolean(incomingData));
    setShowManualForm(!incomingData);
    setSelectedIds([]);
    setPriority('saving');
  }, [incomingData]);

  const isFromAI = Boolean(activeAIData);

  const budgetValue = parseMoney(budget);

  const areaValue = Number(
    area.replace(',', '.')
  );

  const householdValue =
    parseMoney(householdSize);

  const currentNeeds: UserNeeds = {
    ...activeAIData?.userNeeds,

    deviceType,

    budget:
      budgetValue > 0
        ? budgetValue
        : undefined,

    roomArea:
      deviceType === 'air-conditioner' &&
      areaValue > 0
        ? areaValue
        : undefined,

    householdSize:
      deviceType === 'refrigerator' &&
      householdValue > 0
        ? householdValue
        : undefined,
  };

  // ==================================================
  // XỬ LÝ DANH SÁCH SẢN PHẨM
  // ==================================================

  const recommendations =
    useMemo<ProductRecommendation[]>(() => {
      if (!submitted) {
        return [];
      }

      // Nếu đi từ AI, giữ nguyên chính xác
      // danh sách sản phẩm AI đã đề xuất.

      if (activeAIData) {
        return (
          activeAIData.recommendations ?? []
        );
      }

      // Nếu đi từ trang chủ, lọc dữ liệu mẫu
      // theo thông tin người dùng tự nhập.

      return PRODUCTS.filter((product) => {
        if (
          product.deviceType !== deviceType
        ) {
          return false;
        }

        if (product.price > budgetValue) {
          return false;
        }

        if (
          deviceType === 'air-conditioner' &&
          Number.isFinite(areaValue) &&
          areaValue > 0
        ) {
          const min = product.minArea ?? 0;
          const max =
            product.maxArea ?? Infinity;

          if (
            areaValue < min ||
            areaValue > max
          ) {
            return false;
          }
        }

        return true;
      }).sort((a, b) => {
        if (priority === 'saving') {
          return a.price - b.price;
        }

        if (priority === 'premium') {
          return b.price - a.price;
        }

        return a.name.localeCompare(b.name);
      });
    }, [
      submitted,
      activeAIData,
      deviceType,
      budgetValue,
      areaValue,
      priority,
    ]);

  const selectedProducts =
    recommendations.filter((product) =>
      selectedIds.includes(product.id)
    );

  const canNavigateCompare = Boolean(
    onCompare || onAction
  );

  const canNavigateEstimate = Boolean(
    onEstimate || onAction
  );

  // ==================================================
  // CHUYỂN SANG TƯ VẤN THỦ CÔNG
  // ==================================================

  function beginManualEdit() {
    setActiveAIData(undefined);
    setShowManualForm(true);
    setSubmitted(false);
    setSelectedIds([]);
  }

  function changeDevice(type: DeviceType) {
    setDeviceType(type);
    setSubmitted(false);
    setSelectedIds([]);
  }

  function resetForm() {
    setActiveAIData(undefined);
    setDeviceType('air-conditioner');
    setBudget('');
    setArea('');
    setHouseholdSize('');
    setPriority('saving');
    setSubmitted(false);
    setSelectedIds([]);
    setShowManualForm(true);
  }

  function restoreAIResults() {
    if (!incomingData) {
      return;
    }

    setActiveAIData(incomingData);

    setDeviceType(
      incomingData.userNeeds.deviceType ??
      incomingData.recommendations?.[0]
        ?.deviceType ??
      'air-conditioner'
    );

    setBudget(
      incomingData.userNeeds.budget !==
        undefined
        ? String(
            incomingData.userNeeds.budget
          )
        : ''
    );

    setArea(
      incomingData.userNeeds.roomArea !==
        undefined
        ? String(
            incomingData.userNeeds.roomArea
          )
        : ''
    );

    setHouseholdSize(
      incomingData.userNeeds.householdSize !==
        undefined
        ? String(
            incomingData.userNeeds.householdSize
          )
        : ''
    );

    setSubmitted(true);
    setSelectedIds([]);
    setShowManualForm(false);
  }

  // ==================================================
  // TÌM THIẾT BỊ PHÙ HỢP
  // ==================================================

  function submit() {
    if (budgetValue <= 0) {
      Alert.alert(
        'Ngân sách không hợp lệ',
        'Vui lòng nhập ngân sách lớn hơn 0.'
      );

      return;
    }

    if (
      deviceType === 'air-conditioner' &&
      (
        !Number.isFinite(areaValue) ||
        areaValue <= 0
      )
    ) {
      Alert.alert(
        'Diện tích không hợp lệ',
        'Vui lòng nhập diện tích phòng lớn hơn 0.'
      );

      return;
    }

    setActiveAIData(undefined);
    setSelectedIds([]);
    setSubmitted(true);
  }

  // ==================================================
  // CHỌN HAI THIẾT BỊ ĐỂ SO SÁNH
  // ==================================================

  function toggleProduct(
    product: ProductRecommendation
  ) {
    if (selectedIds.includes(product.id)) {
      setSelectedIds((previous) =>
        previous.filter(
          (id) => id !== product.id
        )
      );

      return;
    }

    if (selectedIds.length >= 2) {
      Alert.alert(
        'Đã chọn đủ hai thiết bị',
        'Bạn hãy bỏ chọn một thiết bị ' +
          'trước khi chọn thiết bị khác.'
      );

      return;
    }

    if (
      selectedProducts.length > 0 &&
      selectedProducts[0].deviceType !==
        product.deviceType
    ) {
      Alert.alert(
        'Không thể so sánh',
        'Vui lòng chọn hai thiết bị cùng loại.'
      );

      return;
    }

    setSelectedIds((previous) => [
      ...previous,
      product.id,
    ]);
  }

  function compareSelectedProducts() {
    if (selectedProducts.length !== 2) {
      Alert.alert(
        'Chưa đủ thiết bị',
        'Bạn cần chọn đúng hai thiết bị ' +
          'để thực hiện so sánh.'
      );

      return;
    }

    const [
      firstProduct,
      secondProduct,
    ] = selectedProducts;

    const compareData: ComparePayload = {
      source: isFromAI
        ? 'ai-chat'
        : 'home',

      conversationId:
        activeAIData?.conversationId,

      messageId:
        activeAIData?.messageId,

      question:
        activeAIData?.question,

      createdAt: Date.now(),

      firstProduct,

      secondProduct,

      userNeeds: currentNeeds,

      recommendedProductId:
        activeAIData?.recommendedProductId,

      comparisonReason:
        'So sánh hai thiết bị được chọn ' +
        'dựa trên nhu cầu sử dụng và ngân sách.',

      comparisonCriteria: [
        'Giá thiết bị',
        'Công suất hoặc dung tích',
        'Công nghệ Inverter',
        'Tính năng',
        'Mức độ phù hợp với nhu cầu',
      ],
    };

    if (onCompare) {
      onCompare(compareData);
      return;
    }

    if (onAction) {
      onAction({
        id: createId(),
        label: 'So sánh hai thiết bị',
        feature: 'compare',
        payload: compareData,
      });

      return;
    }

    Alert.alert(
      'Đã chọn hai thiết bị',
      'Chức năng chuyển màn hình so sánh ' +
        'sẽ được kết nối ở bước tích hợp.'
    );
  }

  // ==================================================
  // LẬP DỰ TOÁN CHO THIẾT BỊ
  // ==================================================

  function openEstimate(
    product: ProductRecommendation
  ) {
    const estimateData = buildEstimate(
      product,
      currentNeeds,
      activeAIData
    );

    if (onEstimate) {
      onEstimate(estimateData);
      return;
    }

    if (onAction) {
      onAction({
        id: createId(),
        label:
          'Dự toán chi phí ' + product.name,
        feature: 'estimate',
        payload: estimateData,
      });

      return;
    }

    const result =
      calculateEstimate(estimateData);

    Alert.alert(
      'Dự toán chi phí tham khảo',
      product.name +
        '\n\nGiá thiết bị: ' +
        formatCurrency(result.deviceCost) +
        '\nTổng dự kiến: ' +
        formatCurrency(result.total) +
        '\n\nĐây là chi phí giả lập.'
    );
  }

  // ==================================================
  // HIỂN THỊ THÔNG TIN NHU CẦU TỪ AI
  // ==================================================

  function renderAIContext() {
    if (!activeAIData) {
      return null;
    }

    const needs = activeAIData.userNeeds;

    const summary =
      activeAIData.adviceSummary ??
      activeAIData.summary ??
      activeAIData.recommendationReason;

    return (
      <View style={styles.aiContextCard}>
        <View style={styles.aiContextHeader}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>
              ❄
            </Text>
          </View>

          <View style={styles.flex}>
            <Text style={styles.aiContextTitle}>
              Kết quả từ SmartCool AI
            </Text>

            <Text
              style={styles.aiContextSubtitle}
            >
              Dữ liệu từ cuộc trò chuyện
            </Text>
          </View>
        </View>

        <View style={styles.contextDivider} />

        <Text style={styles.sectionTitle}>
          Nhu cầu của bạn
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Loại thiết bị
          </Text>

          <Text style={styles.infoValue}>
            {getDeviceLabel(
              needs.deviceType ?? deviceType
            )}
          </Text>
        </View>

        {needs.budget !== undefined && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Ngân sách
            </Text>

            <Text style={styles.infoMoney}>
              {formatCurrency(needs.budget)}
            </Text>
          </View>
        )}

        {needs.roomArea !== undefined && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Diện tích phòng
            </Text>

            <Text style={styles.infoValue}>
              {needs.roomArea} m²
            </Text>
          </View>
        )}

        {needs.householdSize !==
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

        {!!needs.roomType && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Loại phòng
            </Text>

            <Text style={styles.infoValue}>
              {needs.roomType}
            </Text>
          </View>
        )}

        {!!needs.preferredBrands?.length && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Thương hiệu ưu tiên
            </Text>

            <Text style={styles.infoValue}>
              {needs.preferredBrands.join(', ')}
            </Text>
          </View>
        )}

        {needs.energySaving !== undefined && (
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

        {!!needs.purpose && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Mục đích sử dụng
            </Text>

            <Text style={styles.infoValue}>
              {needs.purpose}
            </Text>
          </View>
        )}

        {!!summary && (
          <View style={styles.aiSummary}>
            <Text style={styles.aiSummaryTitle}>
              Nhận xét từ trợ lý AI
            </Text>

            <Text style={styles.aiSummaryText}>
              {summary}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.editNeedsButton}
          onPress={beginManualEdit}
        >
          <Text style={styles.editNeedsText}>
            ✎ Thay đổi nhu cầu tư vấn
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==================================================
  // HIỂN THỊ FORM TƯ VẤN THỦ CÔNG
  // ==================================================

  function renderManualForm() {
    return (
      <View style={styles.card}>
        <View style={styles.formHeading}>
          <Text style={styles.sectionTitle}>
            Thông tin nhu cầu
          </Text>

          <TouchableOpacity onPress={resetForm}>
            <Text style={styles.resetText}>
              Đặt lại
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>
          1. Bạn muốn mua thiết bị nào?
        </Text>

        <View style={styles.deviceRow}>
          {DEVICE_OPTIONS.map((option) => {
            const active =
              deviceType === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.deviceButton,
                  active &&
                    styles.deviceButtonActive,
                ]}
                onPress={() =>
                  changeDevice(option.id)
                }
              >
                <Text style={styles.deviceIcon}>
                  {option.icon}
                </Text>

                <Text
                  style={[
                    styles.deviceLabel,
                    active &&
                      styles.deviceLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>
          2. Ngân sách tối đa (VNĐ)
        </Text>

        <TextInput
          style={styles.input}
          value={budget}
          onChangeText={(value) => {
            setBudget(value);
            setSubmitted(false);
            setSelectedIds([]);
          }}
          keyboardType="number-pad"
          placeholder="Ví dụ: 12000000"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.inputHint}>
          {budgetValue > 0
            ? 'Ngân sách: ' +
              formatCurrency(budgetValue)
            : 'Nhập số tiền bạn dự định chi'}
        </Text>

        {deviceType === 'air-conditioner' && (
          <>
            <Text style={styles.fieldLabel}>
              3. Diện tích phòng (m²)
            </Text>

            <TextInput
              style={styles.input}
              value={area}
              onChangeText={(value) => {
                setArea(value);
                setSubmitted(false);
                setSelectedIds([]);
              }}
              keyboardType="decimal-pad"
              placeholder="Ví dụ: 20"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputHint}>
              Công suất được gợi ý sơ bộ
              dựa trên diện tích phòng.
            </Text>
          </>
        )}

        {deviceType === 'refrigerator' && (
          <>
            <Text style={styles.fieldLabel}>
              3. Số người trong gia đình
            </Text>

            <TextInput
              style={styles.input}
              value={householdSize}
              onChangeText={(value) => {
                setHouseholdSize(value);
                setSubmitted(false);
                setSelectedIds([]);
              }}
              keyboardType="number-pad"
              placeholder="Ví dụ: 4"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputHint}>
              Thông tin tham khảo khi chọn
              dung tích tủ lạnh.
            </Text>
          </>
        )}

        <Text style={styles.fieldLabel}>
          {deviceType === 'freezer'
            ? '3.'
            : '4.'}{' '}
          Ưu tiên của bạn
        </Text>

        <View style={styles.priorityRow}>
          {PRIORITY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.priorityButton,
                priority === option.id &&
                  styles.priorityButtonActive,
              ]}
              onPress={() => {
                setPriority(option.id);
                setSubmitted(false);
                setSelectedIds([]);
              }}
            >
              <Text
                style={[
                  styles.priorityText,
                  priority === option.id &&
                    styles.priorityTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={submit}
        >
          <Text style={styles.submitText}>
            ✦ Xem thiết bị phù hợp
          </Text>
        </TouchableOpacity>

        {!!incomingData && (
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={restoreAIResults}
          >
            <Text style={styles.restoreText}>
              Khôi phục kết quả tư vấn từ AI
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ==================================================
  // HIỂN THỊ THẺ SẢN PHẨM
  // ==================================================

  function renderProduct(
    product: ProductRecommendation,
    index: number
  ) {
    const selected =
      selectedIds.includes(product.id);

    const recommended =
      activeAIData?.recommendedProductId ===
      product.id;

    const features =
      getProductFeatures(product);

    const remainingBudget =
      budgetValue - product.price;

    const estimateData = buildEstimate(
      product,
      currentNeeds,
      activeAIData
    );

    const estimate =
      calculateEstimate(estimateData);

    return (
      <View
        key={product.id}
        style={[
          styles.productCard,
          selected &&
            styles.productCardSelected,
        ]}
      >
        <View style={styles.productTopRow}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>
              {index + 1}
            </Text>
          </View>

          {recommended ? (
            <View style={styles.recommendedTag}>
              <Text
                style={styles.recommendedText}
              >
                ✦ AI ưu tiên đề xuất
              </Text>
            </View>
          ) : isFromAI ? (
            <View style={styles.aiProductTag}>
              <Text
                style={styles.aiProductTagText}
              >
                AI đề xuất
              </Text>
            </View>
          ) : (
            <View style={styles.aiProductTag}>
              <Text
                style={styles.aiProductTagText}
              >
                Sản phẩm mẫu
              </Text>
            </View>
          )}

          <View style={styles.flex} />

          <TouchableOpacity
            style={[
              styles.checkBox,
              selected &&
                styles.checkBoxActive,
            ]}
            onPress={() =>
              toggleProduct(product)
            }
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: selected,
            }}
            accessibilityLabel={
              'Chọn so sánh ' + product.name
            }
          >
            <Text style={styles.checkMark}>
              {selected ? '✓' : ''}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productHeading}>
          <View style={styles.productIconBox}>
            <Text style={styles.productIcon}>
              {getDeviceIcon(
                product.deviceType
              )}
            </Text>
          </View>

          <View
            style={styles.productHeadingText}
          >
            <Text style={styles.productBrand}>
              {product.brand}
            </Text>

            <Text style={styles.productName}>
              {product.name}
            </Text>

            {!!product.model && (
              <Text style={styles.productModel}>
                Model: {product.model}
              </Text>
            )}

            <Text style={styles.productCapacity}>
              {product.capacity}
            </Text>
          </View>
        </View>

        <Text style={styles.productPrice}>
          {formatCurrency(product.price)}
        </Text>

        {budgetValue > 0 && (
          <View
            style={[
              styles.budgetStatus,
              remainingBudget < 0 &&
                styles.budgetStatusOver,
            ]}
          >
            <Text
              style={[
                styles.budgetStatusText,
                remainingBudget < 0 &&
                  styles.budgetStatusTextOver,
              ]}
            >
              {remainingBudget >= 0
                ? '✓ Giá máy trong ngân sách'
                : 'Vượt ngân sách ' +
                  formatCurrency(
                    Math.abs(remainingBudget)
                  )}
            </Text>
          </View>
        )}

        <Text style={styles.productDescription}>
          {product.description}
        </Text>

        {!!features.length && (
          <View style={styles.featureWrap}>
            {features.map((feature, featureIndex) => (
              <View
                key={
                  feature + '-' + featureIndex
                }
                style={styles.featureTag}
              >
                <Text style={styles.featureText}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        )}

        {!!product.suitableRoomArea && (
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>
              Diện tích phù hợp
            </Text>

            <Text style={styles.specValue}>
              {product.suitableRoomArea}
            </Text>
          </View>
        )}

        {!!product.warranty && (
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>
              Bảo hành
            </Text>

            <Text style={styles.specValue}>
              {product.warranty}
            </Text>
          </View>
        )}

        {!!product.energyRating && (
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>
              Nhãn năng lượng
            </Text>

            <Text style={styles.specValue}>
              {product.energyRating}
            </Text>
          </View>
        )}

        {!!product.recommendationReason && (
          <View style={styles.reasonCard}>
            <Text style={styles.reasonTitle}>
              ✦ Lý do đề xuất
            </Text>

            <Text style={styles.reasonText}>
              {product.recommendationReason}
            </Text>
          </View>
        )}

        {!!product.advantages?.length && (
          <View style={styles.advantagesCard}>
            <Text style={styles.advantagesTitle}>
              Ưu điểm
            </Text>

            {product.advantages.map(
              (item, itemIndex) => (
                <Text
                  key={itemIndex}
                  style={styles.advantageText}
                >
                  ✓ {item}
                </Text>
              )
            )}
          </View>
        )}

        {!!product.disadvantages?.length && (
          <View style={styles.disadvantagesCard}>
            <Text
              style={styles.disadvantagesTitle}
            >
              Điểm cần cân nhắc
            </Text>

            {product.disadvantages.map(
              (item, itemIndex) => (
                <Text
                  key={itemIndex}
                  style={styles.disadvantageText}
                >
                  • {item}
                </Text>
              )
            )}
          </View>
        )}

        <View style={styles.estimatePreview}>
          <Text style={styles.estimateLabel}>
            Tổng chi phí mua và lắp đặt dự kiến
          </Text>

          <Text style={styles.estimateValue}>
            {formatCurrency(estimate.total)}
          </Text>

          <Text style={styles.estimateHint}>
            Bao gồm giá máy và các khoản
            chi phí giả lập.
          </Text>

          {budgetValue > 0 && (
            <Text
              style={[
                styles.estimateBudgetText,
                {
                  color:
                    estimate.total <= budgetValue
                      ? GREEN
                      : RED,
                },
              ]}
            >
              {estimate.total <= budgetValue
                ? 'Còn lại ' +
                  formatCurrency(
                    budgetValue - estimate.total
                  )
                : 'Cần chuẩn bị thêm ' +
                  formatCurrency(
                    estimate.total - budgetValue
                  )}
            </Text>
          )}
        </View>

        <View style={styles.productActions}>
          <TouchableOpacity
            style={[
              styles.compareSelectButton,
              selected &&
                styles.compareSelectButtonActive,
            ]}
            onPress={() =>
              toggleProduct(product)
            }
          >
            <Text
              style={[
                styles.compareSelectText,
                selected &&
                  styles.compareSelectTextActive,
              ]}
            >
              {selected
                ? '✓ Đã chọn'
                : '＋ Chọn so sánh'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.estimateButton}
            onPress={() =>
              openEstimate(product)
            }
          >
            <Text
              style={styles.estimateButtonText}
            >
              {canNavigateEstimate
                ? 'Xem dự toán ›'
                : 'Tính dự toán'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.productDisclaimer}>
          Giá và thông số là dữ liệu tham khảo
          giả lập, không phải báo giá thực tế.
        </Text>
      </View>
    );
  }

  // ==================================================
  // GIAO DIỆN CHÍNH
  // ==================================================

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          selectedIds.length > 0 && {
            paddingBottom: 150,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backText}>
            {incomingData
              ? '← Quay lại cuộc trò chuyện'
              : '← Quay lại'}
          </Text>
        </TouchableOpacity>

        {/* PHẦN TIÊU ĐỀ */}

        <View style={styles.hero}>
          <View style={styles.heroIconBox}>
            <Text style={styles.heroIcon}>
              🛒
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            Tư vấn mua thiết bị
          </Text>

          <Text style={styles.heroDescription}>
            {isFromAI
              ? 'Xem chi tiết những thiết bị ' +
                'SmartCool AI đã đề xuất ' +
                'dựa trên nhu cầu của bạn.'
              : 'Tìm thiết bị điện lạnh phù hợp ' +
                'với nhu cầu sử dụng và ngân sách.'}
          </Text>

          <View style={styles.demoTag}>
            <Text style={styles.demoTagText}>
              {isFromAI
                ? '✦ KẾT QUẢ AI DEMO'
                : 'DỮ LIỆU MẪU'}
            </Text>
          </View>
        </View>

        {/* THÔNG TIN TỪ AI */}

        {isFromAI && renderAIContext()}

        {/* FORM TƯ VẤN THỦ CÔNG */}

        {showManualForm &&
          renderManualForm()}

        {/* KẾT QUẢ TƯ VẤN */}

        {submitted && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeading}>
              <View style={styles.flex}>
                <Text style={styles.resultsTitle}>
                  {isFromAI
                    ? 'Thiết bị AI đề xuất'
                    : 'Kết quả tư vấn'}
                </Text>

                <Text
                  style={styles.resultsSubtitle}
                >
                  {isFromAI
                    ? 'Hiển thị đúng các sản phẩm ' +
                      'từ cuộc trò chuyện AI.'
                    : 'Các sản phẩm phù hợp với ' +
                      'bộ lọc bạn đã chọn.'}
                </Text>
              </View>

              <View style={styles.resultCount}>
                <Text
                  style={styles.resultCountText}
                >
                  {recommendations.length}
                </Text>
              </View>
            </View>

            {recommendations.length > 0 && (
              <View style={styles.compareHint}>
                <Text
                  style={styles.compareHintTitle}
                >
                  ⚖️ So sánh thiết bị
                </Text>

                <Text
                  style={styles.compareHintText}
                >
                  Chọn hai sản phẩm để xem
                  sự khác biệt về giá, công suất
                  và các tính năng.
                </Text>
              </View>
            )}

            {recommendations.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>
                  🔎
                </Text>

                <Text style={styles.emptyTitle}>
                  {isFromAI
                    ? 'AI chưa đề xuất thiết bị'
                    : 'Chưa tìm thấy thiết bị phù hợp'}
                </Text>

                <Text style={styles.emptyText}>
                  {isFromAI
                    ? 'Bạn có thể quay lại cuộc ' +
                      'trò chuyện để cung cấp thêm ' +
                      'thông tin cho SmartCool AI.'
                    : 'Bạn có thể tăng ngân sách ' +
                      'hoặc thay đổi diện tích phòng ' +
                      'để xem thêm gợi ý.'}
                </Text>

                {isFromAI && (
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={onBack}
                  >
                    <Text
                      style={styles.emptyButtonText}
                    >
                      Tiếp tục trò chuyện với AI
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              recommendations.map(
                (product, index) =>
                  renderProduct(product, index)
              )
            )}
          </View>
        )}

        {/* LƯU Ý */}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>
            ℹ️ Lưu ý khi chọn thiết bị
          </Text>

          <Text style={styles.noteText}>
            SmartCool AI hiện đang sử dụng
            dữ liệu mẫu và phản hồi giả lập.
            {'\n\n'}
            Khi lựa chọn máy lạnh, cần xét thêm
            chiều cao trần, hướng nắng, khả năng
            cách nhiệt và số người sử dụng.
            {'\n\n'}
            Giá bán, thông số kỹ thuật và chi phí
            lắp đặt cần được kiểm tra thực tế
            trước khi quyết định mua.
          </Text>
        </View>
      </ScrollView>

      {/* THANH SO SÁNH THIẾT BỊ */}

      {selectedIds.length > 0 && (
        <View style={styles.compareBar}>
          <View style={styles.compareBarTop}>
            <View style={styles.flex}>
              <Text
                style={styles.compareBarTitle}
              >
                So sánh thiết bị
              </Text>

              <Text
                style={styles.compareBarSubtitle}
              >
                Đã chọn {selectedIds.length}/2
                thiết bị
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                setSelectedIds([])
              }
            >
              <Text style={styles.clearText}>
                Bỏ chọn tất cả
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.selectedRow}>
            {[0, 1].map((index) => {
              const product =
                selectedProducts[index];

              return (
                <View
                  key={index}
                  style={[
                    styles.selectedSlot,
                    !!product &&
                      styles.selectedSlotFilled,
                  ]}
                >
                  <Text
                    style={styles.selectedSlotText}
                    numberOfLines={2}
                  >
                    {product
                      ? product.name
                      : '＋ Chọn thiết bị'}
                  </Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.compareMainButton,
              selectedIds.length !== 2 &&
                styles.disabledButton,
            ]}
            disabled={
              selectedIds.length !== 2
            }
            onPress={compareSelectedProducts}
          >
            <Text
              style={styles.compareMainButtonText}
            >
              {canNavigateCompare
                ? '⚖️ So sánh hai thiết bị'
                : '⚖️ Xác nhận thiết bị so sánh'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ==================================================
// STYLE
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: 17,
    paddingBottom: 35,
  },

  flex: {
    flex: 1,
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
    marginBottom: 14,
  },

  heroIcon: {
    fontSize: 35,
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT,
  },

  heroDescription: {
    color: '#557594',
    fontSize: 13,
    lineHeight: 22,
    marginTop: 9,
  },

  demoTag: {
    alignSelf: 'flex-start',
    backgroundColor: WHITE,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 15,
  },

  demoTagText: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '800',
  },

  // THÔNG TIN TỪ AI

  aiContextCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#B9D9FF',
    borderRadius: 20,
    padding: 17,
    marginBottom: 20,
  },

  aiContextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  aiAvatar: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiAvatarText: {
    color: WHITE,
    fontSize: 28,
    fontWeight: '700',
  },

  aiContextTitle: {
    color: DARK_BLUE,
    fontSize: 15,
    fontWeight: '800',
  },

  aiContextSubtitle: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
  },

  contextDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 17,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },

  infoLabel: {
    flex: 1,
    color: MUTED,
    fontSize: 12,
    lineHeight: 19,
  },

  infoValue: {
    flex: 1,
    textAlign: 'right',
    color: TEXT,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '700',
  },

  infoMoney: {
    flex: 1,
    textAlign: 'right',
    color: BLUE,
    fontSize: 14,
    fontWeight: '800',
  },

  aiSummary: {
    backgroundColor: LIGHT_BLUE,
    padding: 14,
    borderRadius: 13,
    marginTop: 16,
  },

  aiSummaryTitle: {
    color: DARK_BLUE,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },

  aiSummaryText: {
    color: TEXT,
    fontSize: 12,
    lineHeight: 21,
  },

  editNeedsButton: {
    borderWidth: 1,
    borderColor: '#C9DFFF',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
  },

  editNeedsText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '700',
  },

  // FORM NHẬP THÔNG TIN

  card: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 19,
    padding: 18,
    marginBottom: 20,
  },

  formHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 14,
  },

  resetText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '600',
  },

  deviceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 23,
  },

  deviceButton: {
    flex: 1,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E1EAF5',
    backgroundColor: '#FAFCFF',
    paddingVertical: 14,
    alignItems: 'center',
  },

  deviceButtonActive: {
    backgroundColor: LIGHT_BLUE,
    borderColor: BLUE,
  },

  deviceIcon: {
    fontSize: 25,
    marginBottom: 7,
  },

  deviceLabel: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '700',
  },

  deviceLabelActive: {
    color: BLUE,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: '#DCE7F4',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 14,
    height: 50,
    fontSize: 16,
    color: TEXT,
  },

  inputHint: {
    color: '#8293A8',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 22,
  },

  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 23,
  },

  priorityButton: {
    borderWidth: 1,
    borderColor: '#E0EAF6',
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 11,
    paddingVertical: 11,
    borderRadius: 10,
  },

  priorityButtonActive: {
    borderColor: BLUE,
    backgroundColor: LIGHT_BLUE,
  },

  priorityText: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '700',
  },

  priorityTextActive: {
    color: BLUE,
  },

  submitButton: {
    backgroundColor: BLUE,
    borderRadius: 13,
    paddingVertical: 17,
    alignItems: 'center',
  },

  submitText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '800',
  },

  restoreButton: {
    paddingTop: 17,
    alignItems: 'center',
  },

  restoreText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '700',
  },

  // KẾT QUẢ

  resultsSection: {
    marginBottom: 18,
  },

  resultsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },

  resultsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT,
  },

  resultsSubtitle: {
    fontSize: 12,
    color: MUTED,
    marginTop: 6,
    lineHeight: 19,
  },

  resultCount: {
    width: 42,
    height: 42,
    backgroundColor: LIGHT_BLUE,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultCountText: {
    color: BLUE,
    fontSize: 18,
    fontWeight: '800',
  },

  compareHint: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 13,
    padding: 13,
    marginBottom: 15,
  },

  compareHintTitle: {
    color: DARK_BLUE,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },

  compareHintText: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
  },

  // THẺ SẢN PHẨM

  productCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },

  productCardSelected: {
    borderColor: BLUE,
    borderWidth: 2,
    padding: 15,
  },

  productTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 17,
  },

  rankBadge: {
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: LIGHT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rankText: {
    fontWeight: '800',
    color: BLUE,
    fontSize: 13,
  },

  recommendedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    flexShrink: 1,
  },

  recommendedText: {
    color: GREEN,
    fontSize: 10,
    fontWeight: '800',
  },

  aiProductTag: {
    backgroundColor: LIGHT_BLUE,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },

  aiProductTagText: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '700',
  },

  checkBox: {
    width: 25,
    height: 25,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkBoxActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },

  checkMark: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '800',
  },

  productHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  productIconBox: {
    width: 70,
    height: 70,
    borderRadius: 17,
    backgroundColor: LIGHT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  productIcon: {
    fontSize: 36,
  },

  productHeadingText: {
    flex: 1,
  },

  productName: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT,
    lineHeight: 23,
  },

  productBrand: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },

  productModel: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
  },

  productCapacity: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },

  productPrice: {
    fontSize: 25,
    fontWeight: '800',
    color: BLUE,
    marginTop: 17,
  },

  budgetStatus: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    marginTop: 9,
  },

  budgetStatusOver: {
    backgroundColor: '#FEE2E2',
  },

  budgetStatusText: {
    color: GREEN,
    fontSize: 10,
    fontWeight: '700',
  },

  budgetStatusTextOver: {
    color: RED,
  },

  productDescription: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 21,
    marginTop: 12,
  },

  featureWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 13,
    marginBottom: 10,
  },

  featureTag: {
    backgroundColor: '#EEF6FF',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },

  featureText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3979B5',
  },

  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },

  specLabel: {
    flex: 1,
    color: MUTED,
    fontSize: 11,
  },

  specValue: {
    flex: 1,
    textAlign: 'right',
    color: TEXT,
    fontSize: 11,
    fontWeight: '700',
  },

  reasonCard: {
    backgroundColor: LIGHT_BLUE,
    padding: 13,
    borderRadius: 12,
    marginTop: 13,
  },

  reasonTitle: {
    color: DARK_BLUE,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
  },

  reasonText: {
    color: TEXT,
    fontSize: 12,
    lineHeight: 20,
  },

  advantagesCard: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },

  advantagesTitle: {
    color: GREEN,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
  },

  advantageText: {
    color: '#166534',
    fontSize: 11,
    lineHeight: 20,
  },

  disadvantagesCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
  },

  disadvantagesTitle: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
  },

  disadvantageText: {
    color: '#92400E',
    fontSize: 11,
    lineHeight: 20,
  },

  // DỰ TOÁN CHI PHÍ

  estimatePreview: {
    marginTop: 17,
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: '#DCEBFC',
  },

  estimateLabel: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
  },

  estimateValue: {
    color: DARK_BLUE,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 7,
  },

  estimateHint: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 17,
    marginTop: 6,
  },

  estimateBudgetText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },

  productActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 16,
  },

  compareSelectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: BLUE,
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  compareSelectButtonActive: {
    backgroundColor: LIGHT_BLUE,
  },

  compareSelectText: {
    color: BLUE,
    fontSize: 11,
    fontWeight: '700',
  },

  compareSelectTextActive: {
    color: DARK_BLUE,
  },

  estimateButton: {
    flex: 1,
    backgroundColor: BLUE,
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  estimateButtonText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '700',
  },

  productDisclaimer: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 13,
    lineHeight: 16,
  },

  // KHÔNG CÓ KẾT QUẢ

  emptyCard: {
    backgroundColor: WHITE,
    borderRadius: 17,
    padding: 27,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
  },

  emptyButton: {
    backgroundColor: BLUE,
    borderRadius: 11,
    paddingHorizontal: 17,
    paddingVertical: 13,
    marginTop: 16,
  },

  emptyButtonText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '700',
  },

  // LƯU Ý

  noteCard: {
    backgroundColor: '#FFF8EA',
    borderRadius: 15,
    padding: 17,
    marginBottom: 10,
  },

  noteTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#956300',
    marginBottom: 9,
  },

  noteText: {
    fontSize: 11,
    color: '#9C7A3B',
    lineHeight: 19,
  },

  // THANH SO SÁNH

  compareBar: {
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 16,
  },

  compareBarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  compareBarTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '800',
  },

  compareBarSubtitle: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
  },

  clearText: {
    color: RED,
    fontSize: 11,
    fontWeight: '600',
  },

  selectedRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 12,
  },

  selectedSlot: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },

  selectedSlotFilled: {
    borderStyle: 'solid',
    borderColor: BLUE,
    backgroundColor: LIGHT_BLUE,
  },

  selectedSlotText: {
    color: DARK_BLUE,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },

  compareMainButton: {
    backgroundColor: BLUE,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  compareMainButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '800',
  },

  disabledButton: {
    backgroundColor: '#A5C9F0',
  },
});
