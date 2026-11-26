
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import './BuyingAdviceScreen.css';
const Alert = { alert: (title: string, message: string) => window.alert(title + '\n\n' + message) };


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

  return (
    <section className="sc-buy">
      <button className="buy-link" onClick={onBack}>← {incomingData ? 'Quay lại cuộc trò chuyện' : 'Quay lại'}</button>
      <header className="buy-hero"><span>🛒 · DỮ LIỆU MẪU</span><h1>Tư vấn mua thiết bị</h1><p>Tìm thiết bị điện lạnh phù hợp với nhu cầu sử dụng và ngân sách.</p></header>
      {activeAIData && <div className="buy-panel"><h2>Kết quả từ SmartCool AI</h2><p>Dữ liệu từ cuộc trò chuyện</p><dl>{Object.entries({ 'Loại thiết bị': getDeviceLabel(deviceType), 'Ngân sách': budgetValue ? formatCurrency(budgetValue) : undefined, 'Diện tích phòng': activeAIData.userNeeds.roomArea && `${activeAIData.userNeeds.roomArea} m²`, 'Số người': activeAIData.userNeeds.householdSize, 'Loại phòng': activeAIData.userNeeds.roomType, 'Thương hiệu ưu tiên': activeAIData.userNeeds.preferredBrands?.join(', '), 'Tiết kiệm điện': activeAIData.userNeeds.energySaving === undefined ? undefined : activeAIData.userNeeds.energySaving ? 'Có' : 'Không yêu cầu', 'Mục đích': activeAIData.userNeeds.purpose }).filter(([,v])=>v!==undefined && v!=='').map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><p>{activeAIData.adviceSummary ?? activeAIData.summary ?? activeAIData.recommendationReason}</p><button className="buy-outline" onClick={beginManualEdit}>Thay đổi nhu cầu tư vấn</button></div>}
      {showManualForm && <form className="buy-panel" onSubmit={e=>{e.preventDefault();submit();}}><div className="buy-row"><h2>Thông tin nhu cầu</h2><button type="button" className="buy-link" onClick={resetForm}>Đặt lại</button></div>
        <label>1. Bạn muốn mua thiết bị nào?</label><div className="buy-options">{DEVICE_OPTIONS.map(o=><button type="button" key={o.id} className={deviceType===o.id?'chosen':''} onClick={()=>changeDevice(o.id)}>{o.icon} {o.label}</button>)}</div>
        <label htmlFor="buy-budget">2. Ngân sách tối đa (VNĐ)</label><input id="buy-budget" inputMode="numeric" value={budget} placeholder="Ví dụ: 12000000" onChange={e=>{setBudget(e.target.value.replace(/[^0-9]/g,''));setSubmitted(false);setSelectedIds([]);}}/><small>{budgetValue?formatCurrency(budgetValue):'Nhập số tiền bạn dự định chi'}</small>
        {deviceType==='air-conditioner' && <><label htmlFor="buy-area">3. Diện tích phòng (m²)</label><input id="buy-area" inputMode="decimal" value={area} placeholder="Ví dụ: 20" onChange={e=>{setArea(e.target.value);setSubmitted(false);setSelectedIds([]);}}/></>}
        {deviceType==='refrigerator' && <><label htmlFor="buy-household">3. Số người trong gia đình</label><input id="buy-household" inputMode="numeric" value={householdSize} placeholder="Ví dụ: 4" onChange={e=>{setHouseholdSize(e.target.value.replace(/[^0-9]/g,''));setSubmitted(false);setSelectedIds([]);}}/><small>Thông tin tham khảo khi chọn dung tích tủ lạnh.</small></>}
        <label>{deviceType==='freezer'?'3.':'4.'} Ưu tiên của bạn</label><div className="buy-options">{PRIORITY_OPTIONS.map(o=><button type="button" key={o.id} className={priority===o.id?'chosen':''} onClick={()=>{setPriority(o.id);setSubmitted(false);setSelectedIds([]);}}>{o.label}</button>)}</div><button className="buy-primary" type="submit">✦ Xem thiết bị phù hợp</button>{incomingData && <button type="button" className="buy-link" onClick={restoreAIResults}>Khôi phục kết quả tư vấn từ AI</button>}
      </form>}
      {submitted && <><div className="buy-row"><h2>{isFromAI?'Thiết bị AI đề xuất':'Kết quả tư vấn'}</h2><span>{recommendations.length} thiết bị</span></div><p>Chọn hai sản phẩm cùng loại để so sánh.</p>{!recommendations.length && <div className="buy-panel">Chưa tìm thấy thiết bị phù hợp. Hãy thay đổi nhu cầu hoặc ngân sách.</div>}<div className="buy-grid">{recommendations.map((product,index)=>{const selected=selectedIds.includes(product.id);const estimate=calculateEstimate(buildEstimate(product,currentNeeds,activeAIData));return <article key={product.id} className={'buy-panel buy-product '+(selected?'chosen':'')}><div className="buy-row"><small>#{index+1} · {activeAIData?.recommendedProductId===product.id?'AI ưu tiên đề xuất':isFromAI?'AI đề xuất':'Sản phẩm mẫu'}</small><input type="checkbox" aria-label={'Chọn so sánh '+product.name} checked={selected} onChange={()=>toggleProduct(product)}/></div><div className="buy-product-head"><span>{getDeviceIcon(product.deviceType)}</span><div><small>{product.brand}</small><h3>{product.name}</h3>{product.model&&<small>Model: {product.model}</small>}<p>{product.capacity} · {product.inverter?'Inverter':'Không Inverter'}</p></div></div><strong className="buy-price">{formatCurrency(product.price)}</strong>{budgetValue>0&&<small>{product.price<=budgetValue?'✓ Giá máy trong ngân sách':'Vượt ngân sách '+formatCurrency(product.price-budgetValue)}</small>}<p>{product.description}</p><div className="buy-tags">{getProductFeatures(product).map((f,i)=><span key={i}>{f}</span>)}</div>{product.recommendationReason&&<p>{product.recommendationReason}</p>}{product.advantages?.length? <p>Ưu điểm: {product.advantages.join(' · ')}</p>:null}{product.disadvantages?.length?<p>Cân nhắc: {product.disadvantages.join(' · ')}</p>:null}<div className="buy-estimate"><small>Tổng chi phí mua và lắp đặt dự kiến</small><strong>{formatCurrency(estimate.total)}</strong>{budgetValue>0&&<small>{estimate.total<=budgetValue?'Còn lại '+formatCurrency(budgetValue-estimate.total):'Cần chuẩn bị thêm '+formatCurrency(estimate.total-budgetValue)}</small>}</div><div className="buy-options"><button type="button" className={selected?'chosen':''} onClick={()=>toggleProduct(product)}>{selected?'✓ Đã chọn':'＋ Chọn so sánh'}</button><button className="buy-primary" onClick={()=>openEstimate(product)}>Xem dự toán ›</button></div><small>Giá và thông số giả lập.</small></article>})}</div></>}
      <aside className="buy-note"><strong>ℹ️ Lưu ý khi chọn thiết bị</strong><p>Cần xét chiều cao trần, hướng nắng, khả năng cách nhiệt và số người sử dụng. Giá bán, thông số và chi phí lắp đặt cần kiểm tra thực tế.</p></aside>
      {selectedIds.length>0&&<div className="buy-compare"><div className="buy-row"><strong>So sánh thiết bị ({selectedIds.length}/2)</strong><button className="buy-link" onClick={()=>setSelectedIds([])}>Bỏ chọn tất cả</button></div><div className="buy-options">{[0,1].map(i=><span key={i}>{selectedProducts[i]?.name??'Chọn thiết bị'}</span>)}</div><button className="buy-primary" disabled={selectedIds.length!==2} onClick={compareSelectedProducts}>So sánh hai thiết bị</button></div>}
    </section>
  );
}
