import {useState,useEffect} from 'react';
import type {DeviceType,DiagnosisPayload,RiskLevel,AIAction} from '../types/smartcool';
import {createId,formatCurrency} from '../types/smartcool';
import './DiagnosisScreen.css';
type Props={onBack:()=>void;initialData?:DiagnosisPayload;userId:string;onAction:(action:AIAction)=>void};
type RecordItem={id:string;createdAt:number;result:DiagnosisPayload};
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
        'Chỉ ngắt nguồn từ vị trí an toàn ngoài khu vực nghi rò môi chất lạnh; không thao tác công tắc trong khu vực rò rỉ.',
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


const blank=():DiagnosisPayload=>({deviceType:'air-conditioner',symptoms:[],source:'home',isDemo:true});
export default function DiagnosisScreen({onBack,initialData,userId,onAction}:Props){
 const [data,setData]=useState<DiagnosisPayload>(initialData??blank());
 const [result,setResult]=useState<DiagnosisPayload|null>(initialData?(initialData.possibleCauses?.length?initialData:diagnose(initialData)):null);
 const [mode,setMode]=useState<'form'|'result'|'history'>(initialData?'result':'form');
 const [history,setHistory]=useState<RecordItem[]>([]);const [ready,setReady]=useState(false);const [notice,setNotice]=useState('');
 const key='smartcool_web_diagnoses_v1:'+userId;
 useEffect(()=>{setData(initialData??blank());setResult(initialData?(initialData.possibleCauses?.length?initialData:diagnose(initialData)):null);setMode(initialData?'result':'form');},[initialData]);
 useEffect(()=>{setReady(false);setHistory([]);try{const raw=JSON.parse(localStorage.getItem(key)??'[]');if(!Array.isArray(raw)||raw.some(x=>!x||typeof x.id!=='string'||!Array.isArray(x.result?.symptoms)))throw Error();setHistory(raw);setReady(true);}catch{setNotice('Không đọc được lịch sử; tạm khóa lưu để bảo vệ dữ liệu.');}},[key]);
 function persist(next:RecordItem[]){if(!ready)return;try{localStorage.setItem(key,JSON.stringify(next));setHistory(next);setNotice('Đã cập nhật lịch sử.');}catch{setNotice('Không thể lưu lịch sử trên trình duyệt.');}}
 function update(p:Partial<DiagnosisPayload>){setData(d=>({...d,...p}));setNotice('');}
 function reset(){setData(blank());setResult(null);setMode('form');setNotice('');}
 function analyze(){if(!data.symptoms.length&&!data.description?.trim()&&!data.errorCode?.trim()){setNotice('Vui lòng chọn triệu chứng, nhập mã lỗi hoặc mô tả sự cố.');return;}setResult(diagnose({...blank(),deviceType:data.deviceType,brand:data.brand?.trim(),model:data.model?.trim(),errorCode:data.errorCode?.trim().toUpperCase(),symptoms:data.symptoms,description:data.description?.trim(),createdAt:Date.now()}));setMode('result');setNotice('');}
 function field(label:string,k:'brand'|'model'|'errorCode'){return <label>{label}<input value={data[k]??''} onChange={e=>update({[k]:e.target.value})}/></label>}
 const risk=RISK_CONFIG[result?.riskLevel??'medium']??RISK_CONFIG.medium;
 function section(title:string,items?:string[],warning=false){return items?.length?<section className={warning?'scd-warning':''}><h2>{title}</h2><ol>{items.map((x,i)=><li key={i}>{x}</li>)}</ol></section>:null;}
 return <div className="scd"><header><button onClick={onBack}>← Quay lại</button><button onClick={()=>setMode(mode==='history'?(result?'result':'form'):'history')}>{mode==='history'?'Quay lại chẩn đoán':`Lịch sử (${history.length})`}</button></header><h1>Chẩn đoán thiết bị</h1><p>Phân tích sự cố điện lạnh thông minh</p>{notice&&<p role="status">{notice}</p>}
 {mode==='form'&&<><div className="scd-hero"><h2>🔧 Thiết bị của bạn gặp sự cố?</h2><p>Cung cấp thông tin để khoanh vùng nguyên nhân.</p></div><section><h2>01. Chọn loại thiết bị</h2><div className="scd-chips">{DEVICES.map(d=><button key={d.id} aria-pressed={data.deviceType===d.id} onClick={()=>{if(d.id!==data.deviceType)setData({...blank(),deviceType:d.id});}}>{d.icon} {d.name}</button>)}</div></section><section><h2>02. Thông tin thiết bị</h2><div className="scd-chips">{BRANDS[data.deviceType].map(b=><button key={b} aria-pressed={data.brand===b} onClick={()=>update({brand:b})}>{b}</button>)}</div><div className="scd-fields">{field('Hãng sản xuất','brand')}{field('Model','model')}{field('Mã lỗi (nếu có)','errorCode')}</div><p>Mã lỗi cần đối chiếu tài liệu đúng model.</p></section><section><h2>03. Triệu chứng đang gặp</h2><div className="scd-chips">{uniqueStrings([...SYMPTOMS[data.deviceType],...data.symptoms]).map(x=><button key={x} aria-pressed={data.symptoms.includes(x)} onClick={()=>update({symptoms:data.symptoms.includes(x)?data.symptoms.filter(y=>y!==x):[...data.symptoms,x]})}>{x}</button>)}</div><p>Đã chọn {data.symptoms.length} triệu chứng</p></section><section><h2>04. Mô tả thêm tình trạng</h2><textarea value={data.description??''} maxLength={1500} onChange={e=>update({description:e.target.value})} placeholder="Mô tả thời điểm và biểu hiện sự cố..."/><p>{data.description?.length??0}/1500</p></section><button className="scd-primary" onClick={analyze}>✦ Phân tích sự cố</button>{result&&<button onClick={()=>setMode('result')}>Xem lại kết quả trước</button>}</>}
 {mode==='result'&&result&&<>{result.source==='ai-chat'&&<section>Kết quả được chuyển từ AI Chat.</section>}<section><h2>Kết quả chẩn đoán sơ bộ</h2><div className="scd-risk" style={{color:risk.color,background:risk.background}}>{risk.icon} {risk.label}</div><p><b>{getDeviceName(result.deviceType)}</b> · {result.brand||'Chưa rõ hãng'} · {result.model||'Chưa rõ model'}</p><p>Mã lỗi: {result.errorCode||'Chưa cung cấp'}</p><p>{result.symptoms.join(', ')}</p><p>{result.description}</p>{(result.attachments?.map(a=>a.uri)??(result.imageUri?[result.imageUri]:[])).map((uri,i)=><img key={i} src={uri} alt="Ảnh tham khảo sự cố"/>)}</section>{section('⚠ Cảnh báo an toàn',result.safetyWarnings,true)}{section('Nguyên nhân có thể xảy ra',result.possibleCauses)}{section('Hướng xử lý đề xuất',result.recommendedActions)}<section><h2>Chi phí sửa chữa tham khảo</h2>{result.estimatedRepairCost?<><h3>{formatCurrency(result.estimatedRepairCost.min)} – {formatCurrency(result.estimatedRepairCost.max)}</h3><p>Khoảng giá mô phỏng, không phải báo giá thực tế.</p>{result.riskLevel!=='danger'&&<button className="scd-primary" onClick={()=>{const cost=result.estimatedRepairCost;if(!cost)return;onAction({id:createId(),label:'Chuyển sang dự toán',feature:'estimate',payload:{source:result.source??'home',conversationId:result.conversationId,deviceType:result.deviceType,serviceType:'repair',productName:[getDeviceName(result.deviceType),result.brand,result.model].filter(Boolean).join(' '),quantity:1,unitPrice:0,materialCost:0,laborCost:0,extraCost:cost.max,reservePercent:0,note:'Tạm tính theo mức cao của khoảng giá demo; chưa phân tách vật tư và nhân công.',isDemo:true}});}}>Chuyển sang dự toán</button>}</>:<p>Chưa đủ thông tin để ước tính.</p>}</section><section>{result.requiresTechnician?'Khuyến nghị liên hệ kỹ thuật viên.':'Theo dõi thiết bị; gọi kỹ thuật viên nếu sự cố tiếp diễn.'}</section><div className="scd-chips"><button className="scd-primary" disabled={!ready} onClick={()=>persist([{id:createId(),createdAt:Date.now(),result},...history])}>Lưu kết quả</button><button onClick={()=>{setData(result);setMode('form');}}>Bổ sung thông tin</button><button onClick={reset}>Chẩn đoán mới</button></div></>}
 {mode==='history'&&<section><h2>Lịch sử chẩn đoán</h2>{history.length===0?<p>Chưa có kết quả đã lưu.</p>:history.map(r=><div className="scd-record" key={r.id}><div><b>{getDeviceName(r.result.deviceType)} {r.result.brand}</b><p>{r.result.symptoms.join(', ')}</p><small>{formatDate(r.createdAt)}</small></div><button onClick={()=>{setData(r.result);setResult(r.result);setMode('result');}}>Xem</button><button onClick={()=>{if(confirm('Xóa kết quả này?'))persist(history.filter(x=>x.id!==r.id));}}>Xóa</button></div>)}<button onClick={reset}>Chẩn đoán mới</button>{history.length>0&&<button onClick={()=>{if(confirm('Xóa toàn bộ lịch sử chẩn đoán mới?'))persist([]);}}>Xóa tất cả</button>}</section>}
 <p className="scd-disclaimer">Dữ liệu mô phỏng theo từ khóa, chưa phân tích ảnh thật và không thay thế kiểm tra của kỹ thuật viên.</p></div>;
}
