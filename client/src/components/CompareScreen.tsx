import {useEffect,useMemo,useState} from 'react';
import {formatCurrency,calculateEstimate,createId} from '../types/smartcool';
import type {AIAction,ComparePayload,DeviceType,EstimatePayload,ProductRecommendation} from '../types/smartcool';
import './CompareScreen.css';
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


interface Props {onBack:()=>void;initialData?:ComparePayload;onAction:(action:AIAction)=>void}
export default function CompareScreen({onBack,initialData,onAction}:Props){
 const valid=isValidPair(initialData?.firstProduct,initialData?.secondProduct);
 const [type,setType]=useState<DeviceType>('air-conditioner');
 const [a,setA]=useState('');const [b,setB]=useState('');const [ready,setReady]=useState(false);
 const [context,setContext]=useState<ComparePayload>();
 function restore(){if(initialData&&valid){setType(initialData.firstProduct.deviceType);setA(initialData.firstProduct.id);setB(initialData.secondProduct.id);setContext(initialData);setReady(true)}else{setType('air-conditioner');setA('');setB('');setContext(undefined);setReady(false)}}
 useEffect(restore,[initialData]);
 const all=useMemo(()=>{const map=new Map(DEVICES.map(d=>[d.id,d]));if(initialData&&valid){map.set(initialData.firstProduct.id,initialData.firstProduct);map.set(initialData.secondProduct.id,initialData.secondProduct)}return [...map.values()]},[initialData,valid]);
 const options=all.filter(d=>d.deviceType===type);const left=options.find(d=>d.id===a),right=options.find(d=>d.id===b);
 const reset=()=>{setReady(false);setContext(undefined)};
 const estimate=(d:ProductRecommendation)=>onAction({id:createId(),label:'Dự toán '+d.name,feature:'estimate',payload:buildEstimate(d,context)});
 const rows:[string,(d:ProductRecommendation)=>string][]=[['Thương hiệu',d=>d.brand],['Model',d=>d.model||UNKNOWN],['Giá tham khảo',d=>formatCurrency(d.price)],['Công suất / dung tích',d=>d.capacity],['Inverter',d=>d.inverter?'Có':'Không theo dữ liệu mẫu'],['Công suất điện',getPower],['Nhãn năng lượng',d=>d.energyRating||UNKNOWN],['Phù hợp',d=>d.suitableRoomArea||d.description||UNKNOWN],['Bảo hành',d=>d.warranty||UNKNOWN],['Tính năng',d=>getFeatures(d).join(' • ')||UNKNOWN],['Ưu điểm',d=>getAdvantages(d).join(' • ')||UNKNOWN],['Hạn chế',d=>getDisadvantages(d).join(' • ')||UNKNOWN],['Dự toán tổng',d=>formatCurrency(calculateEstimate(buildEstimate(d,context)).total)]];
 return <div className="sc-compare"><button className="back" onClick={onBack}>← Quay lại</button><h1>So sánh thiết bị</h1><p>Đối chiếu hai thiết bị cùng loại để lựa chọn phù hợp.</p>
 {context&&<section><h2>Đã nhận hai thiết bị từ tư vấn</h2><p>{context.comparisonReason}</p>{context.userNeeds?.budget!==undefined&&<p>Ngân sách: {formatCurrency(context.userNeeds.budget)}</p>}{context.userNeeds?.roomArea!==undefined&&<p>Diện tích: {context.userNeeds.roomArea} m²</p>}{context.comparisonCriteria?.map((c,i)=><p key={i}>• {c}</p>)}</section>}
 <section><h2>Loại thiết bị</h2><div className="sc-c-types">{TYPES.map(t=><button key={t.id} className={type===t.id?'active':''} onClick={()=>{if(type!==t.id){setType(t.id);setA('');setB('');reset()}}}>{t.icon} {t.title}</button>)}</div><div className="sc-c-grid">{([['A',a,setA,left,b],['B',b,setB,right,a]] as const).map(([label,id,set,product,other])=><div className="sc-c-device" key={label}><small>THIẾT BỊ {label}</small><div className="sc-c-icon">{getDeviceIcon(type)}</div><select aria-label={'Thiết bị '+label} value={id} onChange={e=>{set(e.target.value);reset()}}><option value="">Chọn thiết bị</option>{options.map(d=><option key={d.id} value={d.id} disabled={d.id===other}>{d.name}</option>)}</select>{product&&<><h3>{product.name}</h3><p>{product.capacity}</p><strong>{formatCurrency(product.price)}</strong></>}</div>)}</div><div className="sc-c-types"><button className="active" disabled={!isValidPair(left,right)} onClick={()=>setReady(true)}>So sánh ngay</button>{valid&&<button onClick={restore}>Khôi phục kết quả ban đầu</button>}</div></section>
 {ready&&left&&right&&isValidPair(left,right)&&<><section><h2>Bảng so sánh {getDeviceLabel(type)}</h2><div className="sc-c-scroll"><table><thead><tr><th>Tiêu chí</th><th>{left.name}</th><th>{right.name}</th></tr></thead><tbody>{rows.map(([label,fn])=><tr key={label}><th>{label}</th><td>{fn(left)}</td><td>{fn(right)}</td></tr>)}</tbody></table></div></section><section><h2>Nhận xét lựa chọn</h2><p>{left.price===right.price?'Hai thiết bị có cùng giá mẫu.':`${left.price<right.price?left.name:right.name} có giá thấp hơn ${formatCurrency(Math.abs(left.price-right.price))}.`}</p>{getCapacityNumber(left)!==null&&getCapacityNumber(right)!==null&&<p>{getCapacityNumber(left)===getCapacityNumber(right)?'Hai thiết bị có công suất / dung tích tương đương.':`${Number(getCapacityNumber(left))>Number(getCapacityNumber(right))?left.name:right.name} có công suất / dung tích lớn hơn.`}</p>}<p>{context?.recommendedProductId&&[left,right].some(d=>d.id===context.recommendedProductId)?'Đề xuất từ tư vấn: '+[left,right].find(d=>d.id===context.recommendedProductId)?.name:'Nên chọn theo ngân sách và nhu cầu thực tế.'}</p><p>Chưa thể kết luận máy nào tiết kiệm điện hơn nếu thiếu thông số tiêu thụ điện và điều kiện sử dụng.</p><div className="sc-c-grid">{[left,right].map(d=><button className="sc-c-estimate" key={d.id} onClick={()=>estimate(d)}>Dự toán {d.name} →</button>)}</div></section></>}
 <p className="sc-c-note">Giá và thông số là dữ liệu mẫu. Cần kiểm tra model và chi phí thực tế trước khi mua.</p></div>
}
