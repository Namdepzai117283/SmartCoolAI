
import React, { useEffect, useState } from 'react';

import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  DeviceType,
  DiagnosisPayload,
  RiskLevel,
} from '../types/smartcool';

import {
  createId,
  formatCurrency,
} from '../types/smartcool';

// ==================================================
// KIỂU DỮ LIỆU
// ==================================================

interface Props {
  onBack: () => void;
  initialData?: DiagnosisPayload;
  payload?: DiagnosisPayload;
}

interface DiagnosisRecord {
  id: string;
  createdAt: number;
  result: DiagnosisPayload;
}

interface LegacyMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  time: number;
}

// ==================================================
// CẤU HÌNH
// ==================================================

const BLUE = '#0878E8';
const DARK = '#12345B';
const MUTED = '#64748B';
const WHITE = '#FFFFFF';
const BACKGROUND = '#F3F8FF';
const BORDER = '#E4EDF8';

const STORAGE_KEY = 'smartcool_diagnosis_history_v2';
const LEGACY_KEY = 'smartcool_diagnosis_v1';

const DEVICES: {
  id: DeviceType;
  name: string;
  icon: string;
}[] = [
  {
    id: 'air-conditioner',
    name: 'Máy lạnh',
    icon: '❄️',
  },
  {
    id: 'refrigerator',
    name: 'Tủ lạnh',
    icon: '🧊',
  },
  {
    id: 'freezer',
    name: 'Tủ đông',
    icon: '📦',
  },
];

const BRANDS: Record<DeviceType, string[]> = {
  'air-conditioner': [
    'Daikin',
    'Panasonic',
    'LG',
    'Casper',
    'Samsung',
    'Toshiba',
    'Mitsubishi',
    'Sharp',
    'Khác',
  ],

  refrigerator: [
    'Samsung',
    'LG',
    'Panasonic',
    'Toshiba',
    'Sharp',
    'Aqua',
    'Hitachi',
    'Electrolux',
    'Khác',
  ],

  freezer: [
    'Sanaky',
    'Alaska',
    'Hòa Phát',
    'Aqua',
    'Kangaroo',
    'Khác',
  ],
};

const COMMON_SYMPTOMS = [
  'Không lên nguồn',
  'Có tiếng ồn',
  'Báo mã lỗi',
  'Có mùi khét',
  'Nghi ngờ rò điện',
  'Tự động tắt',
];

const SYMPTOMS: Record<DeviceType, string[]> = {
  'air-conditioner': [
    'Không mát',
    'Làm lạnh yếu',
    'Chảy nước',
    'Không thổi gió',
    'Đóng tuyết dàn lạnh',
    ...COMMON_SYMPTOMS,
  ],

  refrigerator: [
    'Không lạnh',
    'Không đông đá',
    'Đóng tuyết nhiều',
    'Chảy nước',
    'Cửa tủ không kín',
    'Chạy liên tục',
    ...COMMON_SYMPTOMS,
  ],

  freezer: [
    'Không đông đá',
    'Làm lạnh yếu',
    'Đóng tuyết nhiều',
    'Chảy nước',
    'Chạy liên tục',
    ...COMMON_SYMPTOMS,
  ],
};

const RISK_CONFIG: Record<
  RiskLevel,
  {
    label: string;
    color: string;
    background: string;
    icon: string;
  }
> = {
  low: {
    label: 'Mức độ thấp',
    color: '#15803D',
    background: '#DCFCE7',
    icon: '✓',
  },

  medium: {
    label: 'Cần kiểm tra',
    color: '#B45309',
    background: '#FEF3C7',
    icon: '!',
  },

  high: {
    label: 'Mức độ cao',
    color: '#C2410C',
    background: '#FFEDD5',
    icon: '⚠',
  },

  danger: {
    label: 'Nguy hiểm',
    color: '#B91C1C',
    background: '#FEE2E2',
    icon: '⚠',
  },
};

// ==================================================
// HÀM HỖ TRỢ
// ==================================================

function normalizeText(value: string) {
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
) {
  return keywords.some((keyword) =>
    text.includes(normalizeText(keyword))
  );
}

function getDeviceName(deviceType: DeviceType) {
  return (
    DEVICES.find((device) => device.id === deviceType)
      ?.name ?? 'Thiết bị'
  );
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

function formatDate(value: number) {
  return new Date(value).toLocaleString('vi-VN');
}

// ==================================================
// CHẨN ĐOÁN DEMO
// ==================================================

function diagnose(
  data: DiagnosisPayload
): DiagnosisPayload {
  const text = normalizeText(
    [
      ...data.symptoms,
      data.description ?? '',
      data.errorCode ?? '',
    ].join(' ')
  );

  const causes: string[] = [];
  const actions: string[] = [];
  const warnings: string[] = [];

  let riskLevel: RiskLevel = 'medium';
  let requiresTechnician = false;

  let estimatedRepairCost:
    | { min: number; max: number }
    | undefined;

  // ------------------------------------------------
  // 1. SỰ CỐ NGUY HIỂM
  // ------------------------------------------------

  if (
    containsAny(text, [
      'cháy',
      'khói',
      'mùi khét',
      'rò điện',
      'giật điện',
      'chập điện',
      'tia lửa',
      'rò gas',
      'rò môi chất lạnh',
    ])
  ) {
    return {
      ...data,

      riskLevel: 'danger',

      possibleCauses: [
        'Có thể xảy ra sự cố điện hoặc quá nhiệt.',
        'Linh kiện hoặc dây dẫn có thể bị hư hỏng.',
        'Cần kiểm tra trực tiếp để xác định nguyên nhân.',
      ],

      recommendedActions: [
        'Ngừng sử dụng thiết bị ngay.',
        'Không chạm vào thiết bị nếu nghi ngờ rò điện.',
        'Ngắt nguồn điện từ vị trí an toàn nếu có thể.',
        'Giữ khoảng cách và liên hệ kỹ thuật viên.',
        'Nếu có cháy hoặc khói nguy hiểm, rời khỏi khu vực và gọi 114.',
      ],

      safetyWarnings: [
        'Không tự tháo thiết bị.',
        'Không tiếp tục vận hành để thử máy.',
        'Không dùng nước để xử lý cháy điện.',
        'Nếu nghi rò môi chất lạnh, tránh nguồn lửa và công tắc điện trong khu vực.',
      ],

      requiresTechnician: true,
      estimatedRepairCost: undefined,
      isDemo: true,
    };
  }

  // ------------------------------------------------
  // 2. MÁY LẠNH KHÔNG MÁT
  // ------------------------------------------------

  if (
    data.deviceType === 'air-conditioner' &&
    containsAny(text, [
      'không mát',
      'không lạnh',
      'làm lạnh yếu',
      'không thổi gió',
    ])
  ) {
    causes.push(
      'Chế độ hoặc nhiệt độ cài đặt chưa phù hợp.',
      'Lưới lọc bám bụi hoặc luồng gió bị cản trở.',
      'Quạt hoặc hệ thống làm lạnh có thể gặp sự cố.'
    );

    actions.push(
      'Kiểm tra máy đang ở chế độ COOL.',
      'Kiểm tra nhiệt độ cài đặt trên điều khiển.',
      'Quan sát luồng gió từ bên ngoài.',
      'Vệ sinh lưới lọc theo hướng dẫn của nhà sản xuất sau khi ngắt điện.'
    );

    warnings.push(
      'Không tự nạp môi chất lạnh.',
      'Không tháo bo mạch hoặc đường ống.'
    );

    requiresTechnician = true;

    estimatedRepairCost = {
      min: 200000,
      max: 1500000,
    };
  }

  // ------------------------------------------------
  // 3. CHẢY NƯỚC
  // ------------------------------------------------

  if (
    containsAny(text, [
      'chảy nước',
      'rò nước',
      'nhỏ nước',
    ])
  ) {
    if (data.deviceType === 'air-conditioner') {
      causes.push(
        'Đường thoát nước ngưng có thể bị tắc.',
        'Dàn lạnh có thể bị đóng băng.',
        'Đường thoát nước có thể lắp chưa đúng độ dốc.'
      );
    } else {
      causes.push(
        'Đường thoát nước có thể bị tắc.',
        'Cửa tủ hoặc gioăng cửa có thể không kín.',
        'Hệ thống xả đá có thể gặp sự cố.'
      );
    }

    actions.push(
      'Quan sát vị trí nước chảy từ bên ngoài.',
      'Ngừng sử dụng nếu nước chảy gần ổ điện.',
      'Liên hệ kỹ thuật viên nếu sự cố tiếp diễn.'
    );

    warnings.push(
      'Không chạm vào ổ điện hoặc dây điện bị ướt.'
    );

    requiresTechnician = true;

    if (!estimatedRepairCost) {
      estimatedRepairCost = {
        min: 150000,
        max: 800000,
      };
    }
  }

  // ------------------------------------------------
  // 4. TỦ LẠNH HOẶC TỦ ĐÔNG KHÔNG LẠNH
  // ------------------------------------------------

  if (
    data.deviceType !== 'air-conditioner' &&
    containsAny(text, [
      'không lạnh',
      'không đông',
      'không mát',
      'làm lạnh yếu',
    ])
  ) {
    causes.push(
      'Cửa tủ hoặc gioăng cửa không kín.',
      'Nhiệt độ cài đặt chưa phù hợp.',
      'Luồng khí lạnh có thể bị cản trở.',
      'Quạt, hệ thống xả đá hoặc máy nén có thể gặp sự cố.'
    );

    actions.push(
      'Kiểm tra cửa tủ đã đóng kín chưa.',
      'Kiểm tra nhiệt độ cài đặt.',
      'Sắp xếp thực phẩm để không che cửa gió.',
      'Chuyển thực phẩm dễ hỏng sang nơi bảo quản lạnh phù hợp.'
    );

    warnings.push(
      'Không tự tháo máy nén hoặc đường ống làm lạnh.'
    );

    requiresTechnician = true;

    if (!estimatedRepairCost) {
      estimatedRepairCost = {
        min: 250000,
        max: 1800000,
      };
    }
  }

  // ------------------------------------------------
  // 5. ĐÓNG TUYẾT
  // ------------------------------------------------

  if (
    containsAny(text, [
      'đóng tuyết',
      'đóng băng',
      'bám tuyết',
    ])
  ) {
    causes.push(
      'Luồng không khí lưu thông không tốt.',
      'Cảm biến hoặc hệ thống xả đá có thể gặp sự cố.'
    );

    actions.push(
      'Kiểm tra hướng dẫn sử dụng của thiết bị.',
      'Thực hiện xả đá theo hướng dẫn của nhà sản xuất nếu phù hợp.',
      'Gọi kỹ thuật viên nếu hiện tượng lặp lại.'
    );

    warnings.push(
      'Không dùng dao hoặc vật sắc nhọn để cạy đá.',
      'Không dùng nguồn nhiệt mạnh để làm tan đá.'
    );

    requiresTechnician = true;

    if (!estimatedRepairCost) {
      estimatedRepairCost = {
        min: 200000,
        max: 1000000,
      };
    }
  }

  // ------------------------------------------------
  // 6. TIẾNG ỒN
  // ------------------------------------------------

  if (
    containsAny(text, [
      'tiếng ồn',
      'tiếng kêu',
      'kêu to',
      'rung',
    ])
  ) {
    causes.push(
      'Bộ phận lắp đặt có thể bị rung.',
      'Quạt có thể gặp vật cản.',
      'Linh kiện cơ khí có thể bị mòn.'
    );

    actions.push(
      'Xác định vị trí phát ra tiếng ồn từ khoảng cách an toàn.',
      'Kiểm tra thiết bị có đặt cân bằng hay không.',
      'Ngừng sử dụng nếu có tiếng va đập mạnh.'
    );

    warnings.push(
      'Không đưa tay hoặc vật dụng vào khu vực quạt.'
    );

    requiresTechnician = true;

    if (!estimatedRepairCost) {
      estimatedRepairCost = {
        min: 200000,
        max: 1200000,
      };
    }
  }

  // ------------------------------------------------
  // 7. KHÔNG LÊN NGUỒN
  // ------------------------------------------------

  if (
    containsAny(text, [
      'không lên nguồn',
      'không hoạt động',
      'không bật',
      'tự động tắt',
    ])
  ) {
    riskLevel = 'high';

    causes.push(
      'Nguồn cấp điện có thể gặp sự cố.',
      'Điều khiển hoặc chế độ bảo vệ có thể đang hoạt động.',
      'Bo mạch hoặc linh kiện điện có thể bị hư hỏng.'
    );

    actions.push(
      'Kiểm tra điều khiển và công tắc bên ngoài nếu an toàn.',
      'Không bật tắt thiết bị liên tục.',
      'Liên hệ kỹ thuật viên để kiểm tra nguồn điện.'
    );

    warnings.push(
      'Không tự đo điện áp hoặc tháo bo mạch.'
    );

    requiresTechnician = true;

    if (!estimatedRepairCost) {
      estimatedRepairCost = {
        min: 300000,
        max: 2000000,
      };
    }
  }

  // ------------------------------------------------
  // 8. MÃ LỖI
  // ------------------------------------------------

  if (
    data.errorCode?.trim() ||
    containsAny(text, [
      'báo lỗi',
      'báo mã lỗi',
      'mã lỗi',
    ])
  ) {
    causes.push(
      'Thiết bị đang báo trạng thái bất thường.',
      'Ý nghĩa mã lỗi phụ thuộc vào hãng và model.'
    );

    actions.push(
      'Ghi lại chính xác mã lỗi đang hiển thị.',
      'Đối chiếu với tài liệu chính thức của đúng model.',
      'Cung cấp mã lỗi cho kỹ thuật viên.'
    );

    requiresTechnician = true;
  }

  // ------------------------------------------------
  // 9. CỬA TỦ KHÔNG KÍN
  // ------------------------------------------------

  if (
    containsAny(text, [
      'cửa tủ không kín',
      'gioăng cửa',
    ])
  ) {
    causes.push(
      'Gioăng cửa có thể bị bẩn hoặc biến dạng.',
      'Thực phẩm có thể cản trở cửa tủ.'
    );

    actions.push(
      'Kiểm tra vật cản ở cửa tủ.',
      'Lau gioăng cửa theo hướng dẫn sử dụng.'
    );
  }

  // ------------------------------------------------
  // 10. THIẾT BỊ CHẠY LIÊN TỤC
  // ------------------------------------------------

  if (containsAny(text, ['chạy liên tục'])) {
    causes.push(
      'Thiết bị có thể đang chịu tải làm lạnh cao.',
      'Cửa tủ không kín hoặc môi trường quá nóng.',
      'Cảm biến nhiệt độ có thể gặp sự cố.'
    );

    actions.push(
      'Kiểm tra nhiệt độ cài đặt.',
      'Đảm bảo thiết bị có khoảng thông thoáng phù hợp.',
      'Theo dõi và liên hệ kỹ thuật viên nếu không cải thiện.'
    );
  }

  // ------------------------------------------------
  // 11. CHƯA ĐỦ THÔNG TIN
  // ------------------------------------------------

  if (causes.length === 0) {
    causes.push(
      'Chưa đủ thông tin để khoanh vùng nguyên nhân.'
    );

    actions.push(
      'Bổ sung hãng, model và mã lỗi nếu có.',
      'Mô tả thời điểm bắt đầu xảy ra sự cố.',
      'Cho biết thiết bị còn hoạt động hay không.'
    );

    requiresTechnician = true;
  }

  if (warnings.length === 0) {
    warnings.push(
      'Không tự tháo linh kiện điện hoặc hệ thống làm lạnh.'
    );
  }

  return {
    ...data,

    riskLevel,

    possibleCauses: uniqueStrings(causes),

    recommendedActions: uniqueStrings(actions),

    safetyWarnings: uniqueStrings(warnings),

    requiresTechnician,

    estimatedRepairCost,

    isDemo: true,
  };
}

// ==================================================
// COMPONENT NÚT CHỌN
// ==================================================

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && styles.chipActive,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextActive,
        ]}
      >
        {selected ? '✓ ' : ''}
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ==================================================
// COMPONENT DANH SÁCH KẾT QUẢ
// ==================================================

function ResultSection({
  title,
  icon,
  items,
  warning = false,
}: {
  title: string;
  icon: string;
  items?: string[];
  warning?: boolean;
}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.card,
        warning && styles.warningCard,
      ]}
    >
      <Text
        style={[
          styles.cardTitle,
          warning && styles.warningTitle,
        ]}
      >
        {icon} {title}
      </Text>

      {items.map((item, index) => (
        <View
          key={`${index}-${item}`}
          style={styles.resultItem}
        >
          <View
            style={[
              styles.numberCircle,
              warning && styles.warningNumber,
            ]}
          >
            <Text
              style={[
                styles.numberText,
                warning && styles.warningNumberText,
              ]}
            >
              {index + 1}
            </Text>
          </View>

          <Text style={styles.resultText}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ==================================================
// MÀN HÌNH CHẨN ĐOÁN
// ==================================================

export default function DiagnosisScreen({
  onBack,
  initialData,
  payload,
}: Props) {
  const incomingData = initialData ?? payload;

  const [deviceType, setDeviceType] =
    useState<DeviceType>(
      incomingData?.deviceType ?? 'air-conditioner'
    );

  const [brand, setBrand] = useState(
    incomingData?.brand ?? ''
  );

  const [model, setModel] = useState(
    incomingData?.model ?? ''
  );

  const [errorCode, setErrorCode] = useState(
    incomingData?.errorCode ?? ''
  );

  const [selectedSymptoms, setSelectedSymptoms] =
    useState<string[]>(
      incomingData?.symptoms ?? []
    );

  const [description, setDescription] = useState(
    incomingData?.description ?? ''
  );

  const [result, setResult] =
    useState<DiagnosisPayload | null>(
      incomingData
        ? incomingData.possibleCauses?.length
          ? incomingData
          : diagnose(incomingData)
        : null
    );

  const [showForm, setShowForm] = useState(
    !incomingData
  );

  const [showHistory, setShowHistory] =
    useState(false);

  const [history, setHistory] =
    useState<DiagnosisRecord[]>([]);

  const [legacyMessages, setLegacyMessages] =
    useState<LegacyMessage[]>([]);

  const [showLegacy, setShowLegacy] =
    useState(false);

  const [ready, setReady] = useState(false);

  const [saving, setSaving] = useState(false);

  const [fromAI, setFromAI] = useState(
    Boolean(incomingData)
  );

  // ==================================================
  // TẢI LỊCH SỬ
  // ==================================================

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        const saved = await AsyncStorage.getItem(
          STORAGE_KEY
        );

        const legacy = await AsyncStorage.getItem(
          LEGACY_KEY
        );

        if (!mounted) {
          return;
        }

        if (saved) {
          const parsed = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            setHistory(
              parsed.filter(
                (item) =>
                  item &&
                  typeof item.id === 'string' &&
                  typeof item.createdAt === 'number' &&
                  item.result &&
                  DEVICES.some(
                    (device) =>
                      device.id === item.result.deviceType
                  )
              )
            );
          }
        }

        if (legacy) {
          const parsedLegacy = JSON.parse(legacy);

          if (Array.isArray(parsedLegacy)) {
            setLegacyMessages(
              parsedLegacy.filter(
                (item) =>
                  item &&
                  typeof item.text === 'string' &&
                  typeof item.time === 'number'
              )
            );
          }
        }
      } catch (error) {
        console.warn(
          'Không thể tải lịch sử chẩn đoán:',
          error
        );
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    }

    loadHistory();

    return () => {
      mounted = false;
    };
  }, []);

  // ==================================================
  // NHẬN DỮ LIỆU TỪ AI
  // ==================================================

  useEffect(() => {
    if (!incomingData) {
      return;
    }

    setDeviceType(incomingData.deviceType);
    setBrand(incomingData.brand ?? '');
    setModel(incomingData.model ?? '');
    setErrorCode(incomingData.errorCode ?? '');
    setSelectedSymptoms(incomingData.symptoms ?? []);
    setDescription(incomingData.description ?? '');

    const nextResult =
      incomingData.possibleCauses?.length
        ? incomingData
        : diagnose(incomingData);

    setResult(nextResult);
    setFromAI(true);
    setShowForm(false);
    setShowHistory(false);
  }, [incomingData]);

  // ==================================================
  // CHỌN THIẾT BỊ
  // ==================================================

  function changeDevice(nextDevice: DeviceType) {
    if (nextDevice === deviceType) {
      return;
    }

    setDeviceType(nextDevice);
    setBrand('');
    setModel('');
    setErrorCode('');
    setSelectedSymptoms([]);
    setDescription('');
    setResult(null);
    setFromAI(false);
  }

  // ==================================================
  // CHỌN TRIỆU CHỨNG
  // ==================================================

  function toggleSymptom(symptom: string) {
    setSelectedSymptoms((previous) =>
      previous.includes(symptom)
        ? previous.filter((item) => item !== symptom)
        : [...previous, symptom]
    );
  }

  // ==================================================
  // PHÂN TÍCH
  // ==================================================

  function handleDiagnose() {
    if (
      selectedSymptoms.length === 0 &&
      !description.trim() &&
      !errorCode.trim()
    ) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng chọn triệu chứng, nhập mã lỗi hoặc mô tả tình trạng thiết bị.'
      );

      return;
    }

    Keyboard.dismiss();

    const data: DiagnosisPayload = {
      deviceType,

      brand: brand.trim() || undefined,

      model: model.trim() || undefined,

      errorCode:
        errorCode.trim().toUpperCase() || undefined,

      symptoms: selectedSymptoms,

      description: description.trim() || undefined,

      source: 'home',

      createdAt: Date.now(),

      isDemo: true,
    };

    setResult(diagnose(data));
    setFromAI(false);
    setShowForm(false);
    setShowHistory(false);
  }

  // ==================================================
  // LƯU KẾT QUẢ
  // ==================================================

  async function saveResult() {
    if (!result || saving || !ready) {
      return;
    }

    setSaving(true);

    const record: DiagnosisRecord = {
      id: createId(),
      createdAt: Date.now(),
      result,
    };

    const updatedHistory = [
      record,
      ...history,
    ];

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedHistory)
      );

      setHistory(updatedHistory);

      Alert.alert(
        'Đã lưu',
        'Kết quả đã được lưu vào lịch sử chẩn đoán.'
      );
    } catch {
      Alert.alert(
        'Lỗi',
        'Không thể lưu kết quả chẩn đoán.'
      );
    } finally {
      setSaving(false);
    }
  }

  // ==================================================
  // XEM LẠI KẾT QUẢ
  // ==================================================

  function openRecord(record: DiagnosisRecord) {
    const data = record.result;

    setDeviceType(data.deviceType);
    setBrand(data.brand ?? '');
    setModel(data.model ?? '');
    setErrorCode(data.errorCode ?? '');
    setSelectedSymptoms(data.symptoms ?? []);
    setDescription(data.description ?? '');

    setResult(data);
    setFromAI(data.source === 'ai-chat');
    setShowForm(false);
    setShowHistory(false);
  }

  // ==================================================
  // XÓA LỊCH SỬ
  // ==================================================

  function deleteRecord(id: string) {
    Alert.alert(
      'Xóa kết quả',
      'Bạn có chắc muốn xóa kết quả này?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },

        {
          text: 'Xóa',
          style: 'destructive',

          onPress: async () => {
            const updatedHistory = history.filter(
              (item) => item.id !== id
            );

            try {
              await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(updatedHistory)
              );

              setHistory(updatedHistory);
            } catch {
              Alert.alert(
                'Lỗi',
                'Không thể xóa kết quả.'
              );
            }
          },
        },
      ]
    );
  }

  function clearHistory() {
    Alert.alert(
      'Xóa lịch sử',
      'Bạn có muốn xóa toàn bộ kết quả chẩn đoán đã lưu?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },

        {
          text: 'Xóa tất cả',
          style: 'destructive',

          onPress: async () => {
            try {
              await AsyncStorage.removeItem(
                STORAGE_KEY
              );

              setHistory([]);
            } catch {
              Alert.alert(
                'Lỗi',
                'Không thể xóa lịch sử.'
              );
            }
          },
        },
      ]
    );
  }

  // ==================================================
  // CHẨN ĐOÁN MỚI
  // ==================================================

  function resetDiagnosis() {
    Keyboard.dismiss();

    setDeviceType('air-conditioner');
    setBrand('');
    setModel('');
    setErrorCode('');
    setSelectedSymptoms([]);
    setDescription('');
    setResult(null);
    setFromAI(false);
    setShowForm(true);
    setShowHistory(false);
  }

  function editDiagnosis() {
    setShowForm(true);
    setShowHistory(false);
  }

  // ==================================================
  // FORM NHẬP THÔNG TIN
  // ==================================================

  function renderForm() {
    return (
      <>
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🔧</Text>

          <Text style={styles.heroTitle}>
            Thiết bị của bạn gặp sự cố?
          </Text>

          <Text style={styles.heroDescription}>
            Cung cấp thông tin và triệu chứng để
            SmartCool AI hỗ trợ khoanh vùng nguyên nhân.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            01. Chọn loại thiết bị
          </Text>

          <View style={styles.deviceRow}>
            {DEVICES.map((device) => {
              const active =
                deviceType === device.id;

              return (
                <TouchableOpacity
                  key={device.id}
                  style={[
                    styles.deviceCard,
                    active && styles.deviceCardActive,
                  ]}
                  onPress={() =>
                    changeDevice(device.id)
                  }
                >
                  <Text style={styles.deviceIcon}>
                    {device.icon}
                  </Text>

                  <Text
                    style={[
                      styles.deviceName,
                      active && styles.deviceNameActive,
                    ]}
                  >
                    {device.name}
                  </Text>

                  {active && (
                    <Text style={styles.deviceCheck}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            02. Thông tin thiết bị
          </Text>

          <Text style={styles.label}>
            Hãng sản xuất
          </Text>

          <View style={styles.chipRow}>
            {BRANDS[deviceType].map((item) => (
              <Chip
                key={item}
                label={item}
                selected={brand === item}
                onPress={() => setBrand(item)}
              />
            ))}
          </View>

          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="Hoặc nhập tên hãng"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>
            Model thiết bị
          </Text>

          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="Ví dụ: FTKB35"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
          />

          <Text style={styles.label}>
            Mã lỗi (nếu có)
          </Text>

          <TextInput
            style={styles.input}
            value={errorCode}
            onChangeText={setErrorCode}
            placeholder="Ví dụ: E1, U4, H11..."
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
          />

          <Text style={styles.hint}>
            Có thể bỏ qua những thông tin chưa biết.
            Mã lỗi cần được đối chiếu theo đúng model.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            03. Triệu chứng đang gặp
          </Text>

          <Text style={styles.cardDescription}>
            Có thể chọn nhiều triệu chứng.
          </Text>

          <View style={styles.chipRow}>
            {uniqueStrings([
              ...SYMPTOMS[deviceType],
              ...selectedSymptoms,
            ]).map((symptom) => (
              <Chip
                key={symptom}
                label={symptom}
                selected={selectedSymptoms.includes(
                  symptom
                )}
                onPress={() =>
                  toggleSymptom(symptom)
                }
              />
            ))}
          </View>

          <View style={styles.selectionInfo}>
            <Text style={styles.selectionText}>
              Đã chọn {selectedSymptoms.length} triệu chứng
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            04. Mô tả thêm tình trạng
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.descriptionInput,
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Ví dụ: Máy chạy khoảng 10 phút thì tự tắt, có tiếng kêu bất thường..."
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
            maxLength={1500}
          />

          <Text style={styles.characterCount}>
            {description.length}/1500
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleDiagnose}
        >
          <Text style={styles.primaryButtonText}>
            ✦ Phân tích sự cố
          </Text>
        </TouchableOpacity>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Kết quả hiện tại là chẩn đoán sơ bộ dựa
            trên dữ liệu demo, không thay thế việc
            kiểm tra trực tiếp của kỹ thuật viên.
          </Text>
        </View>
      </>
    );
  }

  // ==================================================
  // HIỂN THỊ KẾT QUẢ
  // ==================================================

  function renderResult() {
    if (!result) {
      return renderForm();
    }

    const risk =
      RISK_CONFIG[result.riskLevel ?? 'medium'] ??
      RISK_CONFIG.medium;

    const images =
      result.attachments &&
      result.attachments.length > 0
        ? result.attachments.map((item) => item.uri)
        : result.imageUri
          ? [result.imageUri]
          : [];

    return (
      <>
        {fromAI && (
          <View style={styles.aiBanner}>
            <View style={styles.aiIconBox}>
              <Text style={styles.aiIcon}>✦</Text>
            </View>

            <View style={styles.flex}>
              <Text style={styles.aiTitle}>
                Kết quả từ SmartCool AI
              </Text>

              <Text style={styles.aiDescription}>
                Thông tin được nhận từ cuộc trò chuyện.
                Bạn không cần nhập lại.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.resultHeading}>
            Kết quả chẩn đoán sơ bộ
          </Text>

          <View
            style={[
              styles.riskBox,
              {
                backgroundColor: risk.background,
              },
            ]}
          >
            <Text
              style={[
                styles.riskIcon,
                { color: risk.color },
              ]}
            >
              {risk.icon}
            </Text>

            <View style={styles.flex}>
              <Text
                style={[
                  styles.riskTitle,
                  { color: risk.color },
                ]}
              >
                {risk.label}
              </Text>

              <Text
                style={[
                  styles.riskDescription,
                  { color: risk.color },
                ]}
              >
                Mức độ đánh giá sơ bộ
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.cardTitle}>
            Thông tin thiết bị
          </Text>

          {[
            {
              label: 'Loại thiết bị',
              value: getDeviceName(
                result.deviceType
              ),
            },

            {
              label: 'Hãng',
              value: result.brand || 'Chưa xác định',
            },

            {
              label: 'Model',
              value: result.model || 'Chưa xác định',
            },

            {
              label: 'Mã lỗi',
              value:
                result.errorCode || 'Chưa cung cấp',
            },
          ].map((item) => (
            <View
              key={item.label}
              style={styles.infoRow}
            >
              <Text style={styles.infoLabel}>
                {item.label}
              </Text>

              <Text style={styles.infoValue}>
                {item.value}
              </Text>
            </View>
          ))}

          {result.symptoms.length > 0 && (
            <>
              <Text style={styles.label}>
                Triệu chứng
              </Text>

              <View style={styles.chipRow}>
                {result.symptoms.map(
                  (symptom, index) => (
                    <View
                      key={`${index}-${symptom}`}
                      style={styles.symptomBadge}
                    >
                      <Text
                        style={styles.symptomBadgeText}
                      >
                        {symptom}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </>
          )}

          {Boolean(result.description) && (
            <View style={styles.descriptionBox}>
              <Text style={styles.label}>
                Mô tả sự cố
              </Text>

              <Text style={styles.resultText}>
                {result.description}
              </Text>
            </View>
          )}

          {images.length > 0 && (
            <>
              <Text style={styles.label}>
                Hình ảnh đã cung cấp
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {images.map((uri, index) => (
                  <Image
                    key={`${index}-${uri}`}
                    source={{ uri }}
                    style={styles.attachedImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>

              <Text style={styles.hint}>
                Hình ảnh được đính kèm để tham khảo.
                Phiên bản demo chưa phân tích hình ảnh thật.
              </Text>
            </>
          )}
        </View>

        <ResultSection
          title="Cảnh báo an toàn"
          icon="⚠️"
          items={result.safetyWarnings}
          warning
        />

        <ResultSection
          title="Nguyên nhân có thể xảy ra"
          icon="🔍"
          items={result.possibleCauses}
        />

        <ResultSection
          title="Hướng xử lý đề xuất"
          icon="🛠️"
          items={result.recommendedActions}
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            💰 Chi phí sửa chữa tham khảo
          </Text>

          {result.estimatedRepairCost ? (
            <>
              <Text style={styles.costRange}>
                {formatCurrency(
                  result.estimatedRepairCost.min
                )}
                {' - '}
                {formatCurrency(
                  result.estimatedRepairCost.max
                )}
              </Text>

              <Text style={styles.cardDescription}>
                Khoảng giá minh họa từ dữ liệu demo.
                Chi phí thực tế phụ thuộc vào linh kiện,
                hãng máy và kết quả kiểm tra trực tiếp.
              </Text>
            </>
          ) : (
            <Text style={styles.cardDescription}>
              Chưa đủ thông tin để ước tính chi phí.
              Cần kiểm tra thiết bị trước khi báo giá.
            </Text>
          )}
        </View>

        <View style={styles.technicianCard}>
          <Text style={styles.technicianIcon}>
            👨‍🔧
          </Text>

          <View style={styles.flex}>
            <Text style={styles.technicianTitle}>
              {result.requiresTechnician
                ? 'Khuyến nghị gọi kỹ thuật viên'
                : 'Theo dõi tình trạng thiết bị'}
            </Text>

            <Text style={styles.technicianText}>
              {result.requiresTechnician
                ? 'Nên để người có chuyên môn kiểm tra trước khi sửa chữa hoặc tiếp tục sử dụng nếu thiết bị có dấu hiệu nguy hiểm.'
                : 'Thực hiện các kiểm tra an toàn theo hướng dẫn sử dụng. Nếu sự cố tiếp diễn, hãy liên hệ kỹ thuật viên.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!ready || saving) &&
              styles.disabledButton,
          ]}
          disabled={!ready || saving}
          onPress={saveResult}
        >
          <Text style={styles.primaryButtonText}>
            {saving
              ? 'Đang lưu...'
              : '▣ Lưu kết quả chẩn đoán'}
          </Text>
        </TouchableOpacity>

        <View style={styles.twoButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={editDiagnosis}
          >
            <Text style={styles.secondaryButtonText}>
              ✎ Bổ sung thông tin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={resetDiagnosis}
          >
            <Text style={styles.secondaryButtonText}>
              + Chẩn đoán mới
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            SmartCool AI đang sử dụng dữ liệu mô phỏng.
            Đây không phải kết luận kỹ thuật chính thức.
          </Text>
        </View>
      </>
    );
  }

  // ==================================================
  // LỊCH SỬ CHẨN ĐOÁN
  // ==================================================

  function renderHistory() {
    return (
      <>
        <View style={styles.historyHeading}>
          <View style={styles.flex}>
            <Text style={styles.resultHeading}>
              Lịch sử chẩn đoán
            </Text>

            <Text style={styles.cardDescription}>
              {history.length} kết quả đã lưu
            </Text>
          </View>

          {history.length > 0 && (
            <TouchableOpacity
              onPress={clearHistory}
            >
              <Text style={styles.deleteText}>
                Xóa tất cả
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {!ready ? (
          <View style={styles.card}>
            <Text style={styles.cardDescription}>
              Đang tải lịch sử...
            </Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              🕘
            </Text>

            <Text style={styles.emptyTitle}>
              Chưa có kết quả đã lưu
            </Text>

            <Text style={styles.emptyDescription}>
              Các kết quả chẩn đoán sẽ xuất hiện
              tại đây sau khi bạn lưu.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={resetDiagnosis}
            >
              <Text style={styles.primaryButtonText}>
                Bắt đầu chẩn đoán
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          history.map((record) => {
            const data = record.result;

            const risk =
              RISK_CONFIG[
                data.riskLevel ?? 'medium'
              ] ?? RISK_CONFIG.medium;

            return (
              <View
                key={record.id}
                style={styles.historyCard}
              >
                <TouchableOpacity
                  style={styles.historyOpen}
                  onPress={() =>
                    openRecord(record)
                  }
                >
                  <View style={styles.historyIconBox}>
                    <Text style={styles.historyIcon}>
                      🔧
                    </Text>
                  </View>

                  <View style={styles.flex}>
                    <Text style={styles.historyTitle}>
                      {getDeviceName(data.deviceType)}
                      {data.brand
                        ? ` ${data.brand}`
                        : ''}
                    </Text>

                    <Text
                      style={styles.historySymptoms}
                      numberOfLines={2}
                    >
                      {data.symptoms.join(', ') ||
                        data.description ||
                        data.errorCode ||
                        'Chẩn đoán thiết bị'}
                    </Text>

                    <Text style={styles.historyDate}>
                      {formatDate(record.createdAt)}
                    </Text>

                    <Text
                      style={[
                        styles.historyRisk,
                        { color: risk.color },
                      ]}
                    >
                      {risk.label}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    deleteRecord(record.id)
                  }
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>
                    Xóa
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {legacyMessages.length > 0 && (
          <View style={styles.card}>
            <TouchableOpacity
              onPress={() =>
                setShowLegacy(!showLegacy)
              }
            >
              <Text style={styles.cardTitle}>
                Hội thoại chẩn đoán phiên bản cũ
                {' '}
                {showLegacy ? '⌃' : '⌄'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.cardDescription}>
              Dữ liệu đã lưu trước khi nâng cấp
              vẫn được giữ lại.
            </Text>

            {showLegacy &&
              legacyMessages.map((message, index) => (
                <View
                  key={`${index}-${message.id}`}
                  style={[
                    styles.legacyMessage,
                    message.role === 'user' &&
                      styles.legacyUserMessage,
                  ]}
                >
                  <Text style={styles.legacyRole}>
                    {message.role === 'user'
                      ? 'Bạn'
                      : 'SmartCool AI'}
                  </Text>

                  <Text style={styles.resultText}>
                    {message.text}
                  </Text>

                  <Text style={styles.historyDate}>
                    {formatDate(message.time)}
                  </Text>
                </View>
              ))}
          </View>
        )}
      </>
    );
  }

  // ==================================================
  // GIAO DIỆN CHÍNH
  // ==================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
      keyboardVerticalOffset={
        Platform.OS === 'ios' ? 90 : 0
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backText}>
              ← Quay lại
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => {
              Keyboard.dismiss();
              setShowHistory(!showHistory);
            }}
          >
            <Text style={styles.historyButtonText}>
              {showHistory
                ? '← Chẩn đoán'
                : '◷ Lịch sử'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          Chẩn đoán thiết bị
        </Text>

        <Text style={styles.subtitle}>
          Phân tích sự cố điện lạnh thông minh
        </Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {showHistory
          ? renderHistory()
          : showForm
            ? renderForm()
            : renderResult()}
      </ScrollView>
    </KeyboardAvoidingView>
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

  header: {
    backgroundColor: WHITE,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  backText: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '700',
  },

  historyButton: {
    backgroundColor: '#EAF4FF',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
  },

  historyButtonText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '700',
  },

  title: {
    color: DARK,
    fontSize: 24,
    fontWeight: '800',
  },

  subtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 6,
  },

  content: {
    padding: 15,
    paddingBottom: 30,
  },

  hero: {
    backgroundColor: BLUE,
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },

  heroIcon: {
    fontSize: 36,
    marginBottom: 12,
  },

  heroTitle: {
    color: WHITE,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 29,
  },

  heroDescription: {
    color: '#E0EFFF',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
  },

  card: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 17,
    marginBottom: 14,
  },

  cardTitle: {
    color: DARK,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },

  cardDescription: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 10,
  },

  deviceRow: {
    flexDirection: 'row',
    gap: 9,
  },

  deviceCard: {
    flex: 1,
    minHeight: 105,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },

  deviceCardActive: {
    backgroundColor: '#EAF4FF',
    borderColor: BLUE,
    borderWidth: 2,
  },

  deviceIcon: {
    fontSize: 29,
    marginBottom: 8,
  },

  deviceName: {
    fontSize: 12,
    color: MUTED,
    fontWeight: '600',
  },

  deviceNameActive: {
    color: BLUE,
    fontWeight: '800',
  },

  deviceCheck: {
    position: 'absolute',
    top: 5,
    right: 8,
    color: BLUE,
    fontWeight: '800',
  },

  label: {
    color: DARK,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 9,
  },

  input: {
    minHeight: 49,
    backgroundColor: '#FAFCFF',
    borderWidth: 1,
    borderColor: '#DCE6F2',
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    color: DARK,
    marginBottom: 9,
  },

  descriptionInput: {
    minHeight: 125,
    lineHeight: 22,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },

  chip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  chipActive: {
    backgroundColor: '#EAF4FF',
    borderColor: BLUE,
  },

  chipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },

  chipTextActive: {
    color: BLUE,
    fontWeight: '700',
  },

  hint: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 5,
  },

  selectionInfo: {
    backgroundColor: '#F0F7FF',
    padding: 11,
    borderRadius: 9,
    marginTop: 5,
  },

  selectionText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '600',
  },

  characterCount: {
    textAlign: 'right',
    color: '#94A3B8',
    fontSize: 11,
  },

  primaryButton: {
    minHeight: 53,
    backgroundColor: BLUE,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
  },

  primaryButtonText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },

  disabledButton: {
    opacity: 0.5,
  },

  notice: {
    backgroundColor: '#EAF4FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },

  noticeText: {
    color: '#527397',
    fontSize: 12,
    lineHeight: 19,
  },

  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4FF',
    borderWidth: 1,
    borderColor: '#C5DFFF',
    borderRadius: 15,
    padding: 14,
    gap: 12,
    marginBottom: 15,
  },

  aiIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiIcon: {
    color: WHITE,
    fontSize: 25,
  },

  aiTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: '800',
  },

  aiDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },

  resultHeading: {
    color: DARK,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 13,
  },

  riskBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    padding: 15,
    gap: 12,
  },

  riskIcon: {
    fontSize: 28,
    fontWeight: '800',
  },

  riskTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  riskDescription: {
    fontSize: 12,
    marginTop: 5,
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 18,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
  },

  infoLabel: {
    color: MUTED,
    fontSize: 13,
  },

  infoValue: {
    flex: 1,
    textAlign: 'right',
    color: DARK,
    fontSize: 13,
    fontWeight: '700',
  },

  symptomBadge: {
    backgroundColor: '#EAF4FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },

  symptomBadgeText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '600',
  },

  descriptionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 11,
    padding: 12,
    marginTop: 10,
  },

  attachedImage: {
    width: 180,
    height: 150,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#E2E8F0',
  },

  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 13,
  },

  numberCircle: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  numberText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '800',
  },

  resultText: {
    flexShrink: 1,
    color: '#334155',
    fontSize: 13,
    lineHeight: 22,
  },

  warningCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },

  warningTitle: {
    color: '#C2410C',
  },

  warningNumber: {
    backgroundColor: '#FFEDD5',
  },

  warningNumberText: {
    color: '#C2410C',
  },

  costRange: {
    color: BLUE,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 30,
  },

  technicianCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EAF4FF',
    borderWidth: 1,
    borderColor: '#C5DFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 17,
  },

  technicianIcon: {
    fontSize: 35,
  },

  technicianTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },

  technicianText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 20,
  },

  twoButtons: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 14,
  },

  secondaryButton: {
    flex: 1,
    minHeight: 47,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#C5DFFF',
    borderRadius: 11,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  historyHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },

  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 15,
    padding: 13,
    marginBottom: 12,
  },

  historyOpen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  historyIconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  historyIcon: {
    fontSize: 24,
  },

  historyTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: '800',
  },

  historySymptoms: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  historyDate: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 7,
  },

  historyRisk: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 7,
  },

  deleteButton: {
    paddingHorizontal: 9,
    paddingVertical: 12,
  },

  deleteText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },

  emptyCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    marginBottom: 15,
  },

  emptyIcon: {
    fontSize: 45,
    marginBottom: 13,
  },

  emptyTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyDescription: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginVertical: 15,
  },

  legacyMessage: {
    backgroundColor: '#F8FAFC',
    padding: 13,
    borderRadius: 10,
    marginTop: 10,
  },

  legacyUserMessage: {
    backgroundColor: '#EAF4FF',
  },

  legacyRole: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
});
