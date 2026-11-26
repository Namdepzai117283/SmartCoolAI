
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  calculateEstimate,
  formatCurrency,
  createId,
} from '../types/smartcool';

import type {
  DeviceType,
  ServiceType,
  EstimatePayload,
} from '../types/smartcool';

// ==================================================
// KIỂU DỮ LIỆU
// ==================================================

type Props = {
  onBack: () => void;
  initialData?: EstimatePayload;
  payload?: EstimatePayload;
};

type SavedEstimate = {
  id: string;
  createdAt: number;
  data: EstimatePayload;
  total: number;
};

type EstimateForm = {
  deviceType: DeviceType;
  serviceType: ServiceType;
  productName: string;
  quantity: string;
  unitPrice: string;
  materialCost: string;
  laborCost: string;
  extraCost: string;
  reservePercent: string;
  budget: string;
  note: string;
};

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

const STORAGE_KEY = 'smartcool_estimates_v1';

// ==================================================
// DANH MỤC THIẾT BỊ
// ==================================================

const DEVICES: {
  id: DeviceType;
  label: string;
  icon: string;
}[] = [
  {
    id: 'air-conditioner',
    label: 'Máy lạnh',
    icon: '❄️',
  },
  {
    id: 'refrigerator',
    label: 'Tủ lạnh',
    icon: '🧊',
  },
  {
    id: 'freezer',
    label: 'Tủ đông',
    icon: '🥶',
  },
];

// ==================================================
// DANH MỤC DỊCH VỤ
// ==================================================

const SERVICES: {
  id: ServiceType;
  label: string;
  icon: string;
}[] = [
  {
    id: 'installation',
    label: 'Mua và lắp đặt',
    icon: '🏠',
  },
  {
    id: 'maintenance',
    label: 'Bảo dưỡng',
    icon: '🧽',
  },
  {
    id: 'repair',
    label: 'Sửa chữa',
    icon: '🔧',
  },
];

// ==================================================
// HÀM HỖ TRỢ
// ==================================================

function parseMoney(value: string): number {
  const digits = value.replace(/[^0-9]/g, '');

  const number = Number(digits);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(
    Math.max(number, 0),
    1000000000000
  );
}

function formatInputMoney(value: string): string {
  const digits = value.replace(/[^0-9]/g, '');

  if (!digits) {
    return '';
  }

  return parseMoney(digits).toLocaleString('vi-VN');
}

function numberToInput(
  value?: number
): string {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return '0';
  }

  return Math.max(
    0,
    Math.round(value)
  ).toLocaleString('vi-VN');
}

function deviceName(id: DeviceType): string {
  return (
    DEVICES.find((item) => item.id === id)
      ?.label ?? 'Thiết bị điện lạnh'
  );
}

function deviceIcon(id: DeviceType): string {
  return (
    DEVICES.find((item) => item.id === id)
      ?.icon ?? '❄️'
  );
}

function serviceName(id: ServiceType): string {
  return (
    SERVICES.find((item) => item.id === id)
      ?.label ?? 'Dịch vụ điện lạnh'
  );
}

function normalizeDevice(
  value: unknown
): DeviceType {
  if (
    value === 'fridge' ||
    value === 'refrigerator'
  ) {
    return 'refrigerator';
  }

  if (value === 'freezer') {
    return 'freezer';
  }

  return 'air-conditioner';
}

function normalizeService(
  value: unknown
): ServiceType {
  if (value === 'maintenance') {
    return 'maintenance';
  }

  if (value === 'repair') {
    return 'repair';
  }

  return 'installation';
}

function safeValue(
  value: unknown,
  fallback = 0
): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? Math.max(number, 0)
    : fallback;
}

// ==================================================
// TẠO FORM TRỐNG
// ==================================================

function createEmptyForm(): EstimateForm {
  return {
    deviceType: 'air-conditioner',

    serviceType: 'installation',

    productName: '',

    quantity: '1',

    unitPrice: '0',

    materialCost: '0',

    laborCost: '0',

    extraCost: '0',

    reservePercent: '0',

    budget: '',

    note: '',
  };
}

// ==================================================
// CHUYỂN DỮ LIỆU AI THÀNH FORM
// ==================================================

function createFormFromPayload(
  data: EstimatePayload
): EstimateForm {
  return {
    deviceType: data.deviceType,

    serviceType: data.serviceType,

    productName:
      data.productName ??
      data.product?.name ??
      '',

    quantity: String(
      Math.max(
        1,
        Math.floor(
          safeValue(data.quantity, 1)
        )
      )
    ),

    unitPrice: numberToInput(
      data.unitPrice
    ),

    materialCost: numberToInput(
      data.materialCost
    ),

    laborCost: numberToInput(
      data.laborCost
    ),

    extraCost: numberToInput(
      data.extraCost
    ),

    reservePercent: String(
      safeValue(data.reservePercent)
    ),

    budget:
      data.budget !== undefined ||
      data.userNeeds?.budget !== undefined
        ? numberToInput(
            data.budget ??
              data.userNeeds?.budget
          )
        : '',

    note: data.note ?? '',
  };
}

// ==================================================
// TƯƠNG THÍCH LỊCH SỬ CŨ
// ==================================================

function normalizeSavedEstimate(
  value: unknown
): SavedEstimate | null {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return null;
  }

  const item = value as Record<
    string,
    unknown
  >;

  if (
    typeof item.id !== 'string'
  ) {
    return null;
  }

  // Dữ liệu lịch sử phiên bản mới.

  if (
    item.data &&
    typeof item.data === 'object'
  ) {
    const original =
      item.data as EstimatePayload;

    const data: EstimatePayload = {
      ...original,

      deviceType: normalizeDevice(
        original.deviceType
      ),

      serviceType: normalizeService(
        original.serviceType
      ),

      quantity: Math.max(
        1,
        Math.floor(
          safeValue(original.quantity, 1)
        )
      ),

      unitPrice: safeValue(
        original.unitPrice
      ),

      materialCost: safeValue(
        original.materialCost
      ),

      laborCost: safeValue(
        original.laborCost
      ),

      extraCost: safeValue(
        original.extraCost
      ),

      reservePercent: safeValue(
        original.reservePercent
      ),
    };

    return {
      id: item.id,

      createdAt: safeValue(
        item.createdAt,
        Date.now()
      ),

      data,

      total: calculateEstimate(data).total,
    };
  }

  // Dữ liệu lịch sử phiên bản cũ.

  if (
    !('device' in item) ||
    !('service' in item)
  ) {
    return null;
  }

  const data: EstimatePayload = {
    source: 'home',

    deviceType: normalizeDevice(
      item.device
    ),

    serviceType: normalizeService(
      item.service
    ),

    quantity: Math.max(
      1,
      Math.floor(
        safeValue(item.quantity, 1)
      )
    ),

    unitPrice: safeValue(
      item.unitPrice
    ),

    materialCost: safeValue(
      item.materialCost
    ),

    laborCost: safeValue(
      item.laborCost
    ),

    extraCost: safeValue(
      item.extraCost
    ),

    reservePercent: 0,

    note:
      typeof item.note === 'string'
        ? item.note
        : '',

    isDemo: true,
  };

  return {
    id: item.id,

    createdAt: safeValue(
      item.createdAt,
      Date.now()
    ),

    data,

    total: calculateEstimate(data).total,
  };
}

// ==================================================
// COMPONENT NHẬP TIỀN
// ==================================================

function MoneyInput({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <View style={styles.moneyInputContainer}>
        <TextInput
          style={styles.moneyInput}
          keyboardType="number-pad"
          value={value}
          onChangeText={(text) =>
            onChangeText(
              formatInputMoney(text)
            )
          }
          placeholder={placeholder ?? '0'}
          placeholderTextColor="#94A3B8"
          maxLength={19}
          selectTextOnFocus
        />

        <Text style={styles.currency}>
          VNĐ
        </Text>
      </View>
    </View>
  );
}

// ==================================================
// COMPONENT HIỂN THỊ MỘT DÒNG CHI PHÍ
// ==================================================

function CostRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>
        {label}
      </Text>

      <Text style={styles.resultValue}>
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

// ==================================================
// GIAO DIỆN CHÍNH
// ==================================================

export default function CostEstimateScreen({
  onBack,
  initialData,
  payload,
}: Props) {
  const incomingData =
    initialData ?? payload;

  const [form, setForm] =
    useState<EstimateForm>(() =>
      incomingData
        ? createFormFromPayload(incomingData)
        : createEmptyForm()
    );

  const [originalData, setOriginalData] =
    useState<EstimatePayload | undefined>(
      incomingData
    );

  const [estimates, setEstimates] =
    useState<SavedEstimate[]>([]);

  const [ready, setReady] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [showHistory, setShowHistory] =
    useState(false);

  const [isEdited, setIsEdited] =
    useState(false);

  const [storageError, setStorageError] =
    useState(false);

  // ==================================================
  // NHẬN DỮ LIỆU TỪ AI
  // ==================================================

  useEffect(() => {
    if (incomingData) {
      setOriginalData(incomingData);

      setForm(
        createFormFromPayload(incomingData)
      );

      setIsEdited(false);
      setShowHistory(false);

      return;
    }

    setOriginalData(undefined);
    setForm(createEmptyForm());
    setIsEdited(false);
    setShowHistory(false);
  }, [incomingData]);

  // ==================================================
  // ĐỌC LỊCH SỬ DỰ TOÁN
  // ==================================================

  useEffect(() => {
    let mounted = true;

    async function loadEstimates() {
      try {
        const saved =
          await AsyncStorage.getItem(
            STORAGE_KEY
          );

        if (saved) {
          const parsed: unknown =
            JSON.parse(saved);

          if (Array.isArray(parsed)) {
            const normalized = parsed
              .map(normalizeSavedEstimate)
              .filter(
                (
                  item
                ): item is SavedEstimate =>
                  item !== null
              );

            if (mounted) {
              setEstimates(normalized);
            }
          } else {
            throw new Error(
              'Dữ liệu lịch sử không hợp lệ.'
            );
          }
        }
      } catch (error) {
        console.warn(
          'Lỗi tải lịch sử dự toán:',
          error
        );

        if (mounted) {
          setStorageError(true);
        }
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    }

    loadEstimates();

    return () => {
      mounted = false;
    };
  }, []);

  // ==================================================
  // CẬP NHẬT FORM
  // ==================================================

  function updateField<
    K extends keyof EstimateForm
  >(
    key: K,
    value: EstimateForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setIsEdited(true);
  }

  function changeDevice(type: DeviceType) {
    if (type === form.deviceType) {
      return;
    }

    setForm((previous) => ({
      ...previous,

      deviceType: type,

      productName: '',

      unitPrice: '0',

      materialCost: '0',

      laborCost: '0',

      extraCost: '0',
    }));

    setIsEdited(true);
  }

  function changeService(type: ServiceType) {
    if (type === form.serviceType) {
      return;
    }

    setForm((previous) => ({
      ...previous,

      serviceType: type,

      unitPrice:
        type === 'installation'
          ? previous.unitPrice
          : '0',

      materialCost: '0',

      laborCost: '0',

      extraCost: '0',
    }));

    setIsEdited(true);
  }

  // ==================================================
  // TÍNH TOÁN CHI PHÍ
  // ==================================================

  const quantityNumber = Math.min(
    Math.max(
      Math.floor(
        Number(form.quantity) || 0
      ),
      0
    ),
    9999
  );

  const reserveNumber = Math.min(
    Math.max(
      Number(form.reservePercent) || 0,
      0
    ),
    100
  );

  const budgetNumber = parseMoney(
    form.budget
  );

  const currentData =
    useMemo<EstimatePayload>(() => {
      const sameProduct =
        originalData?.deviceType ===
          form.deviceType &&
        (
          originalData?.productName ??
          originalData?.product?.name ??
          ''
        ) === form.productName;

      const sameDevice =
        originalData?.deviceType ===
        form.deviceType;

      return {
        ...originalData,

        source:
          originalData?.source ?? 'home',

        deviceType: form.deviceType,

        serviceType: form.serviceType,

        productName:
          form.productName.trim() ||
          undefined,

        product: sameProduct
          ? originalData?.product
          : undefined,

        userNeeds: sameDevice
          ? {
              ...originalData?.userNeeds,

              budget:
                budgetNumber > 0
                  ? budgetNumber
                  : undefined,
            }
          : {
              deviceType: form.deviceType,

              budget:
                budgetNumber > 0
                  ? budgetNumber
                  : undefined,
            },

        quantity: quantityNumber,

        unitPrice: parseMoney(
          form.unitPrice
        ),

        materialCost: parseMoney(
          form.materialCost
        ),

        laborCost: parseMoney(
          form.laborCost
        ),

        extraCost: parseMoney(
          form.extraCost
        ),

        reservePercent: reserveNumber,

        budget:
          budgetNumber > 0
            ? budgetNumber
            : undefined,

        note: form.note.trim(),

        explanation: isEdited
          ? undefined
          : originalData?.explanation,

        assumptions: isEdited
          ? undefined
          : originalData?.assumptions,

        isDemo: true,
      };
    }, [
      originalData,
      form,
      quantityNumber,
      reserveNumber,
      budgetNumber,
      isEdited,
    ]);

  const calculation = useMemo(
    () => calculateEstimate(currentData),
    [currentData]
  );

  const originalCalculation = useMemo(
    () =>
      originalData
        ? calculateEstimate(originalData)
        : null,
    [originalData]
  );

  const budgetDifference =
    budgetNumber - calculation.total;

  const isFromAI =
    originalData?.source === 'ai-chat' ||
    Boolean(originalData?.conversationId);

  // ==================================================
  // LƯU DỮ LIỆU VÀO ASYNCSTORAGE
  // ==================================================

  async function persistEstimates(
    nextEstimates: SavedEstimate[]
  ): Promise<boolean> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nextEstimates)
      );

      setEstimates(nextEstimates);

      return true;
    } catch (error) {
      console.warn(
        'Lỗi lưu dự toán:',
        error
      );

      Alert.alert(
        'Không thể lưu dữ liệu',
        'Vui lòng thử lại sau.'
      );

      return false;
    }
  }

  // ==================================================
  // LƯU DỰ TOÁN
  // ==================================================

  async function saveEstimate() {
    Keyboard.dismiss();

    if (
      saving ||
      !ready ||
      storageError
    ) {
      return;
    }

    if (quantityNumber < 1) {
      Alert.alert(
        'Thông báo',
        'Số lượng thiết bị phải lớn hơn 0.'
      );

      return;
    }

    if (calculation.total <= 0) {
      Alert.alert(
        'Thông báo',
        'Vui lòng nhập ít nhất một khoản chi phí.'
      );

      return;
    }

    const newEstimate: SavedEstimate = {
      id: createId(),

      createdAt: Date.now(),

      data: {
        ...currentData,

        createdAt: Date.now(),
      },

      total: calculation.total,
    };

    setSaving(true);

    try {
      const success =
        await persistEstimates([
          newEstimate,
          ...estimates,
        ]);

      if (success) {
        Alert.alert(
          'Lưu thành công',
          'Dự toán đã được lưu trên thiết bị.',
          [
            {
              text: 'Đóng',
              style: 'cancel',
            },
            {
              text: 'Xem lịch sử',
              onPress: () =>
                setShowHistory(true),
            },
          ]
        );
      }
    } finally {
      setSaving(false);
    }
  }

  // ==================================================
  // KHÔI PHỤC DỰ TOÁN BAN ĐẦU
  // ==================================================

  function restoreOriginal() {
    if (!originalData) {
      return;
    }

    Keyboard.dismiss();

    Alert.alert(
      'Khôi phục dự toán',
      'Các thay đổi hiện tại sẽ được thay bằng số liệu ban đầu.',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Khôi phục',

          onPress: () => {
            setForm(
              createFormFromPayload(
                originalData
              )
            );

            setIsEdited(false);
          },
        },
      ]
    );
  }

  // ==================================================
  // TẠO DỰ TOÁN MỚI
  // ==================================================

  function resetForm() {
    Keyboard.dismiss();

    Alert.alert(
      'Tạo dự toán mới',
      'Bạn muốn xóa các giá trị đang nhập? Lịch sử đã lưu sẽ không bị ảnh hưởng.',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Tạo mới',

          onPress: () => {
            setForm(createEmptyForm());

            setOriginalData(undefined);

            setIsEdited(false);

            setShowHistory(false);
          },
        },
      ]
    );
  }

  // ==================================================
  // XÓA DỰ TOÁN
  // ==================================================

  function deleteEstimate(id: string) {
    if (saving || storageError) {
      return;
    }

    Alert.alert(
      'Xóa dự toán',
      'Bạn có chắc muốn xóa dự toán này?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',

          onPress: async () => {
            setSaving(true);

            try {
              await persistEstimates(
                estimates.filter(
                  (item) => item.id !== id
                )
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  // ==================================================
  // XEM LẠI DỰ TOÁN
  // ==================================================

  function loadEstimate(
    item: SavedEstimate
  ) {
    setOriginalData(item.data);

    setForm(
      createFormFromPayload(item.data)
    );

    setIsEdited(false);

    setShowHistory(false);
  }

  // ==================================================
  // HIỂN THỊ THÔNG TIN TỪ AI
  // ==================================================

  function renderAIContext() {
    if (!originalData) {
      return null;
    }

    return (
      <View style={styles.contextCard}>
        <View style={styles.contextHeader}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>
              {isFromAI ? '✦' : '🧮'}
            </Text>
          </View>

          <View style={styles.flex}>
            <Text style={styles.contextTitle}>
              {isFromAI
                ? 'Dự toán từ SmartCool AI'
                : 'Dự toán đã nhận'}
            </Text>

            <Text style={styles.contextSubtitle}>
              {isEdited
                ? 'Bạn đã chỉnh sửa số liệu'
                : 'Đã tự động điền dữ liệu'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {!!(
          originalData.productName ??
          originalData.product?.name
        ) && (
          <View style={styles.productBox}>
            <Text style={styles.productIcon}>
              {deviceIcon(
                originalData.deviceType
              )}
            </Text>

            <View style={styles.flex}>
              <Text style={styles.productLabel}>
                THIẾT BỊ ĐƯỢC ĐỀ XUẤT
              </Text>

              <Text style={styles.productName}>
                {originalData.productName ??
                  originalData.product?.name}
              </Text>

              {!!originalData.product
                ?.capacity && (
                <Text style={styles.productInfo}>
                  Công suất / Dung tích:{' '}
                  {
                    originalData.product
                      .capacity
                  }
                </Text>
              )}

              <Text style={styles.productPrice}>
                {formatCurrency(
                  originalData.unitPrice
                )}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Loại thiết bị
          </Text>

          <Text style={styles.infoValue}>
            {deviceName(
              originalData.deviceType
            )}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Loại công việc
          </Text>

          <Text style={styles.infoValue}>
            {serviceName(
              originalData.serviceType
            )}
          </Text>
        </View>

        {originalData.userNeeds
          ?.roomArea !== undefined && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Diện tích phòng
            </Text>

            <Text style={styles.infoValue}>
              {
                originalData.userNeeds
                  .roomArea
              }{' '}
              m²
            </Text>
          </View>
        )}

        {originalData.userNeeds
          ?.householdSize !== undefined && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Số người sử dụng
            </Text>

            <Text style={styles.infoValue}>
              {
                originalData.userNeeds
                  .householdSize
              }{' '}
              người
            </Text>
          </View>
        )}

        {!!(
          originalData.budget ??
          originalData.userNeeds?.budget
        ) && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Ngân sách ban đầu
            </Text>

            <Text style={styles.infoMoney}>
              {formatCurrency(
                originalData.budget ??
                  originalData.userNeeds
                    ?.budget ??
                  0
              )}
            </Text>
          </View>
        )}

        {!!originalData.explanation && (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationTitle}>
              Giải thích dự toán ban đầu
            </Text>

            <Text style={styles.paragraph}>
              {originalData.explanation}
            </Text>
          </View>
        )}

        {!!originalData.assumptions?.length && (
          <View style={styles.assumptionBox}>
            <Text style={styles.assumptionTitle}>
              Điều kiện giả định ban đầu
            </Text>

            {originalData.assumptions.map(
              (item, index) => (
                <Text
                  key={index}
                  style={styles.assumptionText}
                >
                  • {item}
                </Text>
              )
            )}
          </View>
        )}

        <View style={styles.originalTotalBox}>
          <Text style={styles.originalTotalLabel}>
            TỔNG DỰ TOÁN BAN ĐẦU
          </Text>

          <Text style={styles.originalTotalValue}>
            {formatCurrency(
              originalCalculation?.total ?? 0
            )}
          </Text>
        </View>

        {isEdited && (
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={restoreOriginal}
          >
            <Text style={styles.restoreButtonText}>
              ↻ Khôi phục số liệu ban đầu
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ==================================================
  // HIỂN THỊ NGÂN SÁCH
  // ==================================================

  function renderBudget() {
    if (budgetNumber <= 0) {
      return null;
    }

    const isOverBudget =
      budgetDifference < 0;

    const percent = Math.round(
      (calculation.total / budgetNumber) *
        100
    );

    const progress = Math.min(
      Math.max(percent, 0),
      100
    );

    return (
      <View
        style={[
          styles.budgetCard,

          isOverBudget &&
            styles.budgetCardOver,
        ]}
      >
        <Text style={styles.budgetTitle}>
          🎯 Phân tích ngân sách
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Ngân sách của bạn
          </Text>

          <Text style={styles.infoValue}>
            {formatCurrency(budgetNumber)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Tổng chi phí dự kiến
          </Text>

          <Text style={styles.infoValue}>
            {formatCurrency(
              calculation.total
            )}
          </Text>
        </View>

        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            Tỷ lệ sử dụng ngân sách
          </Text>

          <Text
            style={[
              styles.progressPercent,
              {
                color: isOverBudget
                  ? RED
                  : GREEN,
              },
            ]}
          >
            {percent}%
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,

                backgroundColor:
                  isOverBudget
                    ? RED
                    : GREEN,
              },
            ]}
          />
        </View>

        <View style={styles.budgetResult}>
          <Text
            style={[
              styles.budgetResultLabel,
              {
                color: isOverBudget
                  ? RED
                  : GREEN,
              },
            ]}
          >
            {isOverBudget
              ? 'VƯỢT NGÂN SÁCH'
              : 'NGÂN SÁCH CÒN LẠI'}
          </Text>

          <Text
            style={[
              styles.budgetResultValue,
              {
                color: isOverBudget
                  ? RED
                  : GREEN,
              },
            ]}
          >
            {formatCurrency(
              Math.abs(budgetDifference)
            )}
          </Text>
        </View>

        <Text style={styles.budgetAdvice}>
          {isOverBudget
            ? 'Bạn có thể cân nhắc thiết bị khác hoặc điều chỉnh các khoản chi phí phù hợp. Không nên cắt giảm những vật tư cần thiết cho an toàn lắp đặt.'
            : 'Phương án hiện tại nằm trong ngân sách dự kiến của bạn.'}
        </Text>
      </View>
    );
  }

  // ==================================================
  // HIỂN THỊ BẢNG TỔNG HỢP
  // ==================================================

  function renderSummary() {
    const items = [
      {
        label: 'Thiết bị',
        value: calculation.deviceCost,
        color: '#0878E8',
      },
      {
        label: 'Vật tư',
        value: currentData.materialCost,
        color: '#38BDF8',
      },
      {
        label: 'Nhân công',
        value: currentData.laborCost,
        color: '#6366F1',
      },
      {
        label: 'Phát sinh',
        value: currentData.extraCost,
        color: '#F59E0B',
      },
      {
        label: 'Dự phòng',
        value: calculation.reserveCost,
        color: '#14B8A6',
      },
    ];

    return (
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>
          📊 Bảng tổng hợp chi phí
        </Text>

        {!!form.productName.trim() && (
          <Text style={styles.summaryProduct}>
            {form.productName}
          </Text>
        )}

        <CostRow
          label={`Thiết bị (${quantityNumber})`}
          value={calculation.deviceCost}
        />

        <CostRow
          label="Chi phí vật tư"
          value={currentData.materialCost}
        />

        <CostRow
          label="Chi phí nhân công"
          value={currentData.laborCost}
        />

        <CostRow
          label="Chi phí phát sinh"
          value={currentData.extraCost}
        />

        <View style={styles.divider} />

        <CostRow
          label="Tạm tính"
          value={calculation.subtotal}
        />

        <CostRow
          label={`Dự phòng (${reserveNumber}%)`}
          value={calculation.reserveCost}
        />

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>
            TỔNG CHI PHÍ DỰ KIẾN
          </Text>

          <Text style={styles.totalValue}>
            {formatCurrency(
              calculation.total
            )}
          </Text>

          <Text style={styles.totalNote}>
            Bao gồm toàn bộ các khoản đã nhập
          </Text>
        </View>

        {calculation.total > 0 && (
          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>
              Cơ cấu chi phí
            </Text>

            <View style={styles.chartTrack}>
              {items
                .filter(
                  (item) => item.value > 0
                )
                .map((item) => (
                  <View
                    key={item.label}
                    style={{
                      flex: item.value,

                      backgroundColor:
                        item.color,
                    }}
                  />
                ))}
            </View>

            {items
              .filter(
                (item) => item.value > 0
              )
              .map((item) => (
                <View
                  key={item.label}
                  style={styles.legendRow}
                >
                  <View
                    style={[
                      styles.legendDot,
                      {
                        backgroundColor:
                          item.color,
                      },
                    ]}
                  />

                  <Text style={styles.legendLabel}>
                    {item.label}
                  </Text>

                  <Text style={styles.legendPercent}>
                    {(
                      (item.value /
                        calculation.total) *
                      100
                    ).toFixed(1)}
                    %
                  </Text>
                </View>
              ))}
          </View>
        )}

        {isEdited &&
          originalCalculation && (
            <View style={styles.changeBox}>
              <Text style={styles.changeLabel}>
                Chênh lệch so với dự toán ban đầu
              </Text>

              <Text
                style={[
                  styles.changeValue,
                  {
                    color:
                      calculation.total >
                      originalCalculation.total
                        ? RED
                        : GREEN,
                  },
                ]}
              >
                {calculation.total >
                originalCalculation.total
                  ? '+'
                  : calculation.total <
                      originalCalculation.total
                    ? '−'
                    : ''}
                {formatCurrency(
                  Math.abs(
                    calculation.total -
                      originalCalculation.total
                  )
                )}
              </Text>
            </View>
          )}
      </View>
    );
  }

  // ==================================================
  // HIỂN THỊ LỊCH SỬ
  // ==================================================

  function renderHistory() {
    return (
      <View>
        <Text style={styles.historyTitle}>
          Dự toán đã lưu
        </Text>

        <Text style={styles.historySubtitle}>
          Xem lại và chỉnh sửa những dự toán
          đã lưu trên thiết bị.
        </Text>

        {!ready ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Đang tải lịch sử...
            </Text>
          </View>
        ) : storageError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Không thể đọc lịch sử
            </Text>

            <Text style={styles.emptyDescription}>
              Hãy thử đóng và mở lại ứng dụng.
              Dữ liệu cũ chưa bị ghi đè.
            </Text>
          </View>
        ) : estimates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              📂
            </Text>

            <Text style={styles.emptyTitle}>
              Chưa có dự toán nào
            </Text>

            <Text style={styles.emptyDescription}>
              Hãy tạo và lưu dự toán đầu tiên.
            </Text>
          </View>
        ) : (
          estimates.map((item) => (
            <View
              key={item.id}
              style={styles.savedCard}
            >
              <View style={styles.savedHeader}>
                <View style={styles.savedIconBox}>
                  <Text style={styles.savedIcon}>
                    {deviceIcon(
                      item.data.deviceType
                    )}
                  </Text>
                </View>

                <View style={styles.flex}>
                  <Text style={styles.savedTitle}>
                    {item.data.productName ??
                      deviceName(
                        item.data.deviceType
                      )}
                  </Text>

                  <Text style={styles.savedInfo}>
                    {serviceName(
                      item.data.serviceType
                    )}
                  </Text>
                </View>
              </View>

              {item.data.source ===
                'ai-chat' && (
                <View style={styles.savedSource}>
                  <Text style={styles.savedSourceText}>
                    ✦ Dự toán từ AI
                  </Text>
                </View>
              )}

              <View style={styles.savedAmountBox}>
                <Text style={styles.savedAmountLabel}>
                  Tổng chi phí
                </Text>

                <Text style={styles.savedTotal}>
                  {formatCurrency(item.total)}
                </Text>
              </View>

              <Text style={styles.savedInfo}>
                Số lượng: {item.data.quantity}
              </Text>

              {!!item.data.budget && (
                <Text style={styles.savedInfo}>
                  Ngân sách:{' '}
                  {formatCurrency(
                    item.data.budget
                  )}
                </Text>
              )}

              <Text style={styles.savedDate}>
                {new Date(
                  item.createdAt
                ).toLocaleString('vi-VN')}
              </Text>

              {!!item.data.note && (
                <Text style={styles.savedNote}>
                  Ghi chú: {item.data.note}
                </Text>
              )}

              <View style={styles.savedActions}>
                <TouchableOpacity
                  style={styles.loadButton}
                  disabled={saving}
                  onPress={() =>
                    loadEstimate(item)
                  }
                >
                  <Text style={styles.loadButtonText}>
                    Xem lại
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  disabled={saving}
                  onPress={() =>
                    deleteEstimate(item.id)
                  }
                >
                  <Text style={styles.deleteButtonText}>
                    Xóa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets
    >
      {/* QUAY LẠI */}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          Keyboard.dismiss();

          if (showHistory) {
            setShowHistory(false);
          } else {
            onBack();
          }
        }}
      >
        <Text style={styles.backText}>
          {showHistory
            ? '← Quay lại dự toán'
            : '← Quay lại'}
        </Text>
      </TouchableOpacity>

      {/* TIÊU ĐỀ */}

      <View style={styles.hero}>
        <View style={styles.heroIconBox}>
          <Text style={styles.heroIcon}>
            🧮
          </Text>
        </View>

        <Text style={styles.heroTitle}>
          Dự toán chi phí
        </Text>

        <Text style={styles.heroDescription}>
          {originalData
            ? 'Kiểm tra và điều chỉnh bảng chi phí đã được chuyển từ kết quả tư vấn.'
            : 'Tính toán chi phí mua thiết bị, vật tư, nhân công và các khoản phát sinh trong công việc điện lạnh.'}
        </Text>

        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>
            {isFromAI
              ? '✦ DỰ TOÁN AI DEMO'
              : 'CÔNG CỤ DỰ TOÁN'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => {
            Keyboard.dismiss();

            setShowHistory(
              (previous) => !previous
            );
          }}
        >
          <Text style={styles.historyButtonText}>
            {showHistory
              ? '🧮 Quay lại dự toán'
              : `🕘 Lịch sử dự toán (${estimates.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {showHistory ? (
        renderHistory()
      ) : (
        <>
          {/* THÔNG TIN AI */}

          {renderAIContext()}

          {/* TỔNG CHI PHÍ NHANH */}

          {!!originalData && (
            <View style={styles.quickTotalCard}>
              <Text style={styles.quickTotalLabel}>
                CHI PHÍ CẦN CHUẨN BỊ
              </Text>

              <Text style={styles.quickTotalValue}>
                {formatCurrency(
                  calculation.total
                )}
              </Text>

              <Text style={styles.quickTotalNote}>
                {isEdited
                  ? 'Đã cập nhật theo các thay đổi của bạn'
                  : 'Tính theo dữ liệu dự toán đã nhận'}
              </Text>
            </View>
          )}

          {/* LOẠI THIẾT BỊ */}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              1. Loại thiết bị
            </Text>

            <View style={styles.optionRow}>
              {DEVICES.map((item) => {
                const active =
                  form.deviceType === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.optionButton,

                      active &&
                        styles.optionActive,
                    ]}
                    onPress={() =>
                      changeDevice(item.id)
                    }
                  >
                    <Text style={styles.optionIcon}>
                      {item.icon}
                    </Text>

                    <Text
                      style={[
                        styles.optionText,

                        active &&
                          styles.optionTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* LOẠI CÔNG VIỆC */}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              2. Loại công việc
            </Text>

            <View style={styles.optionRow}>
              {SERVICES.map((item) => {
                const active =
                  form.serviceType === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.optionButton,

                      active &&
                        styles.optionActive,
                    ]}
                    onPress={() =>
                      changeService(item.id)
                    }
                  >
                    <Text style={styles.optionIcon}>
                      {item.icon}
                    </Text>

                    <Text
                      style={[
                        styles.optionText,

                        active &&
                          styles.optionTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* THÔNG TIN THIẾT BỊ */}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              3. Thông tin thiết bị
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Tên thiết bị / Model
              </Text>

              <TextInput
                style={styles.textInput}
                value={form.productName}
                onChangeText={(value) =>
                  updateField(
                    'productName',
                    value
                  )
                }
                placeholder="Ví dụ: LG Dual Inverter 1.5 HP"
                placeholderTextColor="#94A3B8"
                maxLength={150}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Số lượng thiết bị
              </Text>

              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    updateField(
                      'quantity',
                      String(
                        Math.max(
                          1,
                          quantityNumber - 1
                        )
                      )
                    )
                  }
                >
                  <Text style={styles.quantityButtonText}>
                    −
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityInput}
                  keyboardType="number-pad"
                  value={form.quantity}
                  onChangeText={(value) =>
                    updateField(
                      'quantity',

                      value
                        .replace(
                          /[^0-9]/g,
                          ''
                        )
                        .slice(0, 4)
                    )
                  }
                  maxLength={4}
                  selectTextOnFocus
                />

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    updateField(
                      'quantity',

                      String(
                        Math.min(
                          9999,
                          quantityNumber + 1
                        )
                      )
                    )
                  }
                >
                  <Text style={styles.quantityButtonText}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <MoneyInput
              label="Đơn giá thiết bị"
              value={form.unitPrice}
              onChangeText={(value) =>
                updateField(
                  'unitPrice',
                  value
                )
              }
              placeholder="Ví dụ: 9.200.000"
            />

            <View style={styles.smallTotalBox}>
              <Text style={styles.smallTotalLabel}>
                Thành tiền thiết bị
              </Text>

              <Text style={styles.smallTotalValue}>
                {formatCurrency(
                  calculation.deviceCost
                )}
              </Text>
            </View>

            <Text style={styles.helperText}>
              Nếu chỉ bảo dưỡng hoặc sửa chữa,
              bạn có thể để đơn giá thiết bị
              bằng 0.
            </Text>
          </View>

          {/* CHI PHÍ DỊCH VỤ */}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              4. Chi phí dịch vụ
            </Text>

            <MoneyInput
              label="Chi phí vật tư"
              value={form.materialCost}
              onChangeText={(value) =>
                updateField(
                  'materialCost',
                  value
                )
              }
              placeholder="Ví dụ: 750.000"
            />

            <MoneyInput
              label="Chi phí nhân công"
              value={form.laborCost}
              onChangeText={(value) =>
                updateField(
                  'laborCost',
                  value
                )
              }
              placeholder="Ví dụ: 350.000"
            />

            <MoneyInput
              label="Chi phí phát sinh"
              value={form.extraCost}
              onChangeText={(value) =>
                updateField(
                  'extraCost',
                  value
                )
              }
              placeholder="Ví dụ: 200.000"
            />

            <Text style={styles.helperText}>
              Các khoản vật tư, nhân công và
              phát sinh là tổng chi phí cho
              toàn bộ số lượng thiết bị.
              Khi thay đổi số lượng, hãy kiểm tra
              lại các khoản này.
            </Text>
          </View>

          {/* CHI PHÍ DỰ PHÒNG */}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              5. Chi phí dự phòng
            </Text>

            <Text style={styles.helperText}>
              Khoản tiền chuẩn bị thêm cho
              những chi phí chưa được xác định.
            </Text>

            <View style={styles.reserveOptions}>
              {[0, 5, 10, 15, 20].map(
                (percent) => {
                  const active =
                    reserveNumber === percent;

                  return (
                    <TouchableOpacity
                      key={percent}
                      style={[
                        styles.reserveButton,

                        active &&
                          styles.reserveButtonActive,
                      ]}
                      onPress={() =>
                        updateField(
                          'reservePercent',

                          String(percent)
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.reserveButtonText,

                          active &&
                            styles.reserveButtonTextActive,
                        ]}
                      >
                        {percent}%
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>

            <Text style={styles.inputLabel}>
              Phần trăm tùy chỉnh
            </Text>

            <View style={styles.moneyInputContainer}>
              <TextInput
                style={styles.moneyInput}
                keyboardType="number-pad"
                value={form.reservePercent}
                onChangeText={(value) => {
                  const digits = value.replace(
                    /[^0-9]/g,
                    ''
                  );

                  updateField(
                    'reservePercent',

                    digits
                      ? String(
                          Math.min(
                            100,
                            Number(digits)
                          )
                        )
                      : ''
                  );
                }}
                maxLength={3}
                placeholder="0"
                placeholderTextColor="#94A3B8"
                selectTextOnFocus
              />

              <Text style={styles.currency}>
                %
              </Text>
            </View>

            <View style={styles.smallTotalBox}>
              <Text style={styles.smallTotalLabel}>
                Tiền dự phòng
              </Text>

              <Text style={styles.smallTotalValue}>
                {formatCurrency(
                  calculation.reserveCost
                )}
              </Text>
            </View>
          </View>

          {/* NGÂN SÁCH */}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              6. Ngân sách của bạn
            </Text>

            <MoneyInput
              label="Số tiền dự kiến chuẩn bị"
              value={form.budget}
              onChangeText={(value) =>
                updateField(
                  'budget',
                  value
                )
              }
              placeholder="Ví dụ: 12.000.000"
            />

            <Text style={styles.helperText}>
              Không bắt buộc. Nhập ngân sách
              để hệ thống tính số tiền còn lại
              hoặc vượt ngân sách.
            </Text>
          </View>

          {/* GHI CHÚ */}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              7. Ghi chú
            </Text>

            <TextInput
              style={styles.noteInput}
              multiline
              value={form.note}
              onChangeText={(value) =>
                updateField(
                  'note',
                  value
                )
              }
              placeholder="Ví dụ: Lắp máy lạnh phòng ngủ, cần thêm ống đồng..."
              placeholderTextColor="#94A3B8"
              maxLength={1000}
              textAlignVertical="top"
            />

            <Text style={styles.characterCount}>
              {form.note.length}/1000
            </Text>
          </View>

          {/* TỔNG HỢP */}

          {renderSummary()}

          {/* PHÂN TÍCH NGÂN SÁCH */}

          {renderBudget()}

          {/* CẢNH BÁO LƯU TRỮ */}

          {storageError && (
            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerTitle}>
                Không thể đọc dữ liệu đã lưu
              </Text>

              <Text style={styles.disclaimerText}>
                Chức năng lưu tạm thời bị khóa
                để tránh ghi đè lịch sử cũ.
                Hãy thử mở lại ứng dụng.
              </Text>
            </View>
          )}

          {/* LƯU DỰ TOÁN */}

          <TouchableOpacity
            style={[
              styles.saveButton,

              (
                saving ||
                !ready ||
                storageError
              ) && styles.disabledButton,
            ]}
            disabled={
              saving ||
              !ready ||
              storageError
            }
            onPress={saveEstimate}
          >
            <Text style={styles.saveButtonText}>
              {saving
                ? 'Đang lưu dự toán...'
                : '💾 Lưu dự toán'}
            </Text>
          </TouchableOpacity>

          {!!originalData && isEdited && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={restoreOriginal}
            >
              <Text style={styles.secondaryButtonText}>
                ↻ Khôi phục dự toán ban đầu
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetForm}
          >
            <Text style={styles.resetButtonText}>
              ＋ Tạo dự toán mới
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* LƯU Ý */}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>
          ℹ️ Lưu ý về dự toán
        </Text>

        <Text style={styles.disclaimerText}>
          SmartCool AI hiện sử dụng dữ liệu
          giả lập phục vụ đồ án.
          {'\n\n'}
          Các khoản chi phí mang tính tham khảo,
          không phải báo giá chính thức.
          {'\n\n'}
          Dự toán chưa tự tính thuế hoặc
          chiết khấu. Chi phí thực tế phụ thuộc
          vào model thiết bị, vị trí lắp đặt,
          vật tư và đơn vị thi công.
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
    paddingBottom: 45,
  },

  backButton: {
    marginBottom: 17,
  },

  backText: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '700',
  },

  // HERO

  hero: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
  },

  heroIconBox: {
    width: 65,
    height: 65,
    backgroundColor: WHITE,
    borderRadius: 20,
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
    marginTop: 14,
  },

  demoBadgeText: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '800',
  },

  historyButton: {
    backgroundColor: WHITE,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 17,
  },

  historyButtonText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '800',
  },

  // THÔNG TIN AI

  contextCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#B9D9FF',
    borderRadius: 20,
    padding: 17,
    marginBottom: 17,
  },

  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  aiAvatar: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiAvatarText: {
    color: WHITE,
    fontSize: 28,
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
    marginVertical: 15,
  },

  productBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_BLUE,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 13,
  },

  productIcon: {
    fontSize: 36,
  },

  productLabel: {
    color: BLUE,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 6,
  },

  productName: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
  },

  productInfo: {
    color: MUTED,
    fontSize: 11,
    marginTop: 6,
    lineHeight: 18,
  },

  productPrice: {
    color: BLUE,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 11,
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
    color: TEXT,
    fontSize: 12,
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

  explanationBox: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 12,
    padding: 13,
    marginTop: 15,
  },

  explanationTitle: {
    color: DARK_BLUE,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },

  paragraph: {
    color: TEXT,
    fontSize: 12,
    lineHeight: 21,
  },

  assumptionBox: {
    backgroundColor: '#FFF8EA',
    borderRadius: 12,
    padding: 13,
    marginTop: 12,
  },

  assumptionTitle: {
    color: '#956300',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
  },

  assumptionText: {
    color: '#9C7A3B',
    fontSize: 11,
    lineHeight: 20,
    marginBottom: 3,
  },

  originalTotalBox: {
    alignItems: 'center',
    backgroundColor: '#F4F8FE',
    borderRadius: 13,
    padding: 15,
    marginTop: 16,
  },

  originalTotalLabel: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '800',
  },

  originalTotalValue: {
    color: BLUE,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },

  restoreButton: {
    alignItems: 'center',
    paddingTop: 15,
  },

  restoreButtonText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '700',
  },

  // TỔNG CHI PHÍ NHANH

  quickTotalCard: {
    backgroundColor: BLUE,
    borderRadius: 20,
    padding: 23,
    alignItems: 'center',
    marginBottom: 17,
  },

  quickTotalLabel: {
    color: '#DCEEFF',
    fontSize: 11,
    fontWeight: '800',
  },

  quickTotalValue: {
    color: WHITE,
    fontSize: 31,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center',
  },

  quickTotalNote: {
    color: '#DCEEFF',
    fontSize: 11,
    lineHeight: 19,
    marginTop: 9,
    textAlign: 'center',
  },

  // CARD

  card: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 17,
    marginBottom: 16,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },

  // LỰA CHỌN

  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },

  optionButton: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    backgroundColor: '#FAFCFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
  },

  optionActive: {
    borderColor: BLUE,
    backgroundColor: LIGHT_BLUE,
  },

  optionIcon: {
    fontSize: 25,
    marginBottom: 8,
  },

  optionText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },

  optionTextActive: {
    color: BLUE,
  },

  // INPUT

  inputGroup: {
    marginBottom: 17,
  },

  inputLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 9,
  },

  textInput: {
    minHeight: 51,
    borderWidth: 1,
    borderColor: '#DCE7F4',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    color: TEXT,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 13,
  },

  moneyInputContainer: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#DCE7F4',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  moneyInput: {
    flex: 1,
    minHeight: 50,
    fontSize: 15,
    color: TEXT,
    fontWeight: '600',
  },

  currency: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 10,
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  quantityButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: LIGHT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityButtonText: {
    color: BLUE,
    fontSize: 25,
    fontWeight: '700',
  },

  quantityInput: {
    flex: 1,
    height: 47,
    borderWidth: 1,
    borderColor: '#DCE7F4',
    borderRadius: 12,
    textAlign: 'center',
    color: TEXT,
    fontSize: 17,
    fontWeight: '800',
  },

  helperText: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 19,
    marginTop: 8,
  },

  smallTotalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LIGHT_BLUE,
    borderRadius: 11,
    padding: 13,
    gap: 8,
    marginTop: 12,
  },

  smallTotalLabel: {
    flex: 1,
    color: DARK_BLUE,
    fontSize: 11,
    fontWeight: '700',
  },

  smallTotalValue: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '800',
  },

  // DỰ PHÒNG

  reserveOptions: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 16,
    marginBottom: 17,
  },

  reserveButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },

  reserveButtonActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },

  reserveButtonText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '700',
  },

  reserveButtonTextActive: {
    color: WHITE,
  },

  // GHI CHÚ

  noteInput: {
    minHeight: 105,
    borderWidth: 1,
    borderColor: '#DCE7F4',
    backgroundColor: '#FAFCFF',
    borderRadius: 12,
    padding: 13,
    fontSize: 13,
    color: TEXT,
    lineHeight: 21,
  },

  characterCount: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 7,
  },

  // KẾT QUẢ

  resultCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#CFE3FA',
    borderRadius: 20,
    padding: 18,
    marginBottom: 17,
  },

  resultTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 18,
  },

  summaryProduct: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 17,
  },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },

  resultLabel: {
    flex: 1,
    color: MUTED,
    fontSize: 12,
    lineHeight: 19,
  },

  resultValue: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },

  totalBox: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 7,
  },

  totalLabel: {
    color: DARK_BLUE,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  totalValue: {
    color: BLUE,
    fontSize: 29,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 9,
  },

  totalNote: {
    color: MUTED,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 9,
    lineHeight: 18,
  },

  // BIỂU ĐỒ CHI PHÍ

  breakdown: {
    marginTop: 21,
  },

  breakdownTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 13,
  },

  chartTrack: {
    flexDirection: 'row',
    height: 17,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: 15,
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 11,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  legendLabel: {
    flex: 1,
    color: MUTED,
    fontSize: 12,
  },

  legendPercent: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '700',
  },

  changeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
    marginTop: 12,
  },

  changeLabel: {
    color: MUTED,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
  },

  changeValue: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 7,
  },

  // NGÂN SÁCH

  budgetCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 18,
    padding: 17,
    marginBottom: 17,
  },

  budgetCardOver: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  budgetTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 17,
    marginBottom: 9,
  },

  progressLabel: {
    flex: 1,
    color: MUTED,
    fontSize: 11,
  },

  progressPercent: {
    fontSize: 13,
    fontWeight: '800',
  },

  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DDE7E2',
    overflow: 'hidden',
  },

  progressFill: {
    height: 10,
    borderRadius: 5,
  },

  budgetResult: {
    alignItems: 'center',
    marginTop: 21,
  },

  budgetResultLabel: {
    fontSize: 11,
    fontWeight: '800',
  },

  budgetResultValue: {
    fontSize: 27,
    fontWeight: '800',
    marginTop: 9,
    textAlign: 'center',
  },

  budgetAdvice: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 13,
  },

  // BUTTON

  saveButton: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 11,
  },

  saveButtonText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.5,
  },

  secondaryButton: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 11,
  },

  secondaryButtonText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '700',
  },

  resetButton: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#D7E6F7',
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 18,
  },

  resetButtonText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '700',
  },

  // LỊCH SỬ

  historyTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 7,
  },

  historySubtitle: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 17,
  },

  emptyCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    marginBottom: 17,
  },

  emptyIcon: {
    fontSize: 43,
    marginBottom: 13,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 9,
  },

  savedCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 17,
    marginBottom: 14,
  },

  savedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  savedIconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: LIGHT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  savedIcon: {
    fontSize: 27,
  },

  savedTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
  },

  savedInfo: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },

  savedSource: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT_BLUE,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginTop: 12,
  },

  savedSourceText: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '700',
  },

  savedAmountBox: {
    backgroundColor: '#F4F8FE',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },

  savedAmountLabel: {
    color: MUTED,
    fontSize: 11,
  },

  savedTotal: {
    color: BLUE,
    fontSize: 23,
    fontWeight: '800',
    marginTop: 7,
  },

  savedDate: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 9,
  },

  savedNote: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 10,
  },

  savedActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 17,
  },

  loadButton: {
    flex: 1,
    backgroundColor: LIGHT_BLUE,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },

  loadButtonText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '800',
  },

  deleteButton: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },

  deleteButtonText: {
    color: RED,
    fontSize: 12,
    fontWeight: '800',
  },

  // LƯU Ý

  disclaimer: {
    backgroundColor: '#FFF8EA',
    borderRadius: 15,
    padding: 17,
    marginBottom: 15,
  },

  disclaimerTitle: {
    color: '#956300',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 9,
  },

  disclaimerText: {
    color: '#9C7A3B',
    fontSize: 11,
    lineHeight: 20,
  },
});
