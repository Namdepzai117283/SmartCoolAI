import { useState } from 'react';
import './UsageGuideScreen.css';
type Props = { onBack: () => void; userId: string };
type Category =
  | 'all'
  | 'aircon'
  | 'fridge'
  | 'freezer'
  | 'safety';

type Guide = {
  id: string;
  category: Category;
  icon: string;
  title: string;
  description: string;
  duration: string;
  steps: string[];
  warning: string;
};

type Progress = Record<string, number[]>;

const STORAGE_KEY = 'smartcool_web_guide_progress_v1';

const CATEGORIES: {
  id: Category;
  label: string;
}[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'aircon', label: 'Máy lạnh' },
  { id: 'fridge', label: 'Tủ lạnh' },
  { id: 'freezer', label: 'Tủ đông' },
  { id: 'safety', label: 'An toàn' },
];

const GUIDES: Guide[] = [
  {
    id: 'aircon-01',
    category: 'aircon',
    icon: '❄️',
    title: 'Sử dụng máy lạnh đúng cách',
    description:
      'Các bước sử dụng máy lạnh hiệu quả và tiết kiệm điện.',
    duration: '5 phút',
    steps: [
      'Kiểm tra khu vực xung quanh máy lạnh.',
      'Đóng cửa phòng để hạn chế thất thoát hơi lạnh.',
      'Nhấn nút ON/OFF trên remote.',
      'Chọn chế độ COOL để làm lạnh.',
      'Cài đặt nhiệt độ phù hợp, tham khảo 26–28°C.',
      'Điều chỉnh tốc độ quạt theo nhu cầu.',
      'Tắt máy khi không còn sử dụng.',
    ],
    warning:
      'Không sử dụng máy nếu có mùi khét, khói hoặc dấu hiệu rò điện.',
  },
  {
    id: 'aircon-02',
    category: 'aircon',
    icon: '🎛️',
    title: 'Sử dụng remote máy lạnh',
    description:
      'Tìm hiểu các nút bấm và chế độ phổ biến trên remote.',
    duration: '5 phút',
    steps: [
      'ON/OFF: Bật hoặc tắt máy lạnh.',
      'MODE: Chuyển đổi chế độ hoạt động.',
      'COOL: Chế độ làm lạnh.',
      'DRY: Chế độ giảm độ ẩm.',
      'FAN: Chế độ quạt gió.',
      'AUTO: Chế độ hoạt động tự động.',
      'TEMP: Điều chỉnh nhiệt độ.',
      'SWING: Điều chỉnh hướng gió.',
      'TIMER: Hẹn giờ bật hoặc tắt máy.',
      'SLEEP: Chế độ hỗ trợ khi ngủ, nếu có.',
    ],
    warning:
      'Tên nút và chức năng có thể khác nhau tùy hãng và model.',
  },
  {
    id: 'aircon-03',
    category: 'aircon',
    icon: '🧽',
    title: 'Vệ sinh lưới lọc máy lạnh',
    description:
      'Hướng dẫn vệ sinh bộ lọc bụi có thể tháo rời.',
    duration: '15–30 phút',
    steps: [
      'Tắt máy và ngắt nguồn điện an toàn.',
      'Đọc hướng dẫn vệ sinh của nhà sản xuất.',
      'Mở nắp ngoài theo hướng dẫn của thiết bị.',
      'Tháo lưới lọc nếu nhà sản xuất cho phép.',
      'Loại bỏ bụi bằng phương pháp được khuyến nghị.',
      'Rửa lưới lọc nếu đây là loại có thể rửa.',
      'Để lưới lọc khô hoàn toàn trong bóng râm.',
      'Lắp lại đúng vị trí và đóng nắp máy.',
      'Khôi phục nguồn điện và kiểm tra hoạt động.',
    ],
    warning:
      'Không xịt nước vào bo mạch, dây điện hoặc tự tháo dàn lạnh.',
  },
  {
    id: 'aircon-04',
    category: 'aircon',
    icon: '⚡',
    title: 'Tiết kiệm điện khi dùng máy lạnh',
    description:
      'Giảm điện năng tiêu thụ bằng thói quen sử dụng hợp lý.',
    duration: '5 phút',
    steps: [
      'Chọn nhiệt độ phù hợp với nhu cầu.',
      'Đóng kín cửa khi máy đang làm lạnh.',
      'Sử dụng rèm để giảm ánh nắng trực tiếp.',
      'Kết hợp quạt để lưu thông không khí.',
      'Sử dụng chức năng hẹn giờ khi cần.',
      'Vệ sinh lưới lọc theo khuyến nghị.',
      'Bảo dưỡng định kỳ bởi kỹ thuật viên.',
    ],
    warning:
      'Mức tiết kiệm điện thực tế phụ thuộc thiết bị và điều kiện sử dụng.',
  },
  {
    id: 'fridge-01',
    category: 'fridge',
    icon: '🧊',
    title: 'Sử dụng tủ lạnh đúng cách',
    description:
      'Bảo quản thực phẩm và duy trì hiệu quả làm lạnh.',
    duration: '5 phút',
    steps: [
      'Đặt tủ lạnh tại vị trí bằng phẳng, thông thoáng.',
      'Đảm bảo khoảng cách thông gió theo hướng dẫn.',
      'Cài đặt ngăn mát ở khoảng 1–4°C.',
      'Cài đặt ngăn đông khoảng -18°C hoặc thấp hơn.',
      'Sắp xếp thực phẩm không che kín cửa gió.',
      'Bảo quản thực phẩm trong hộp phù hợp.',
      'Hạn chế mở cửa tủ quá lâu.',
      'Kiểm tra cửa tủ đã đóng kín.',
    ],
    warning:
      'Không đặt thiết bị gần nguồn nhiệt hoặc sử dụng dây điện bị hư hỏng.',
  },
  {
    id: 'fridge-02',
    category: 'fridge',
    icon: '🧼',
    title: 'Vệ sinh tủ lạnh',
    description:
      'Quy trình làm sạch bên trong tủ lạnh an toàn.',
    duration: '30–45 phút',
    steps: [
      'Ngắt nguồn điện an toàn.',
      'Lấy thực phẩm ra và giữ lạnh phù hợp.',
      'Tháo các khay có thể tháo rời.',
      'Vệ sinh khay bằng chất làm sạch phù hợp.',
      'Lau sạch các bề mặt bên trong tủ.',
      'Vệ sinh gioăng cao su cửa tủ.',
      'Lau khô toàn bộ khu vực đã vệ sinh.',
      'Lắp lại các khay đúng vị trí.',
      'Khôi phục nguồn điện.',
      'Đưa thực phẩm trở lại khi tủ đủ lạnh.',
    ],
    warning:
      'Không sử dụng vật sắc nhọn để cạy đá hoặc hóa chất dễ cháy.',
  },
  {
    id: 'fridge-03',
    category: 'fridge',
    icon: '🌡️',
    title: 'Kiểm tra nhiệt độ tủ lạnh',
    description:
      'Kiểm tra khả năng bảo quản thực phẩm của thiết bị.',
    duration: '5 phút',
    steps: [
      'Kiểm tra mức nhiệt độ đang cài đặt.',
      'Sử dụng nhiệt kế chuyên dụng cho tủ lạnh.',
      'Đặt nhiệt kế tại vị trí phù hợp.',
      'Chờ đủ thời gian theo hướng dẫn nhiệt kế.',
      'Đọc và ghi nhận nhiệt độ.',
      'Điều chỉnh nhiệt độ nếu cần.',
      'Liên hệ kỹ thuật viên nếu tủ không đạt nhiệt độ.',
    ],
    warning:
      'Không sử dụng thực phẩm dễ hỏng nếu không bảo đảm điều kiện bảo quản an toàn.',
  },
  {
    id: 'freezer-01',
    category: 'freezer',
    icon: '🥶',
    title: 'Sử dụng tủ đông hiệu quả',
    description:
      'Bảo quản thực phẩm đông lạnh đúng cách.',
    duration: '5 phút',
    steps: [
      'Đặt tủ tại nơi thông thoáng.',
      'Kiểm tra nguồn điện phù hợp.',
      'Cài đặt nhiệt độ khoảng -18°C hoặc thấp hơn.',
      'Đóng gói thực phẩm trước khi bảo quản.',
      'Ghi ngày bảo quản trên bao bì.',
      'Sắp xếp thực phẩm theo từng nhóm.',
      'Hạn chế mở nắp tủ quá lâu.',
      'Kiểm tra nhiệt độ định kỳ.',
    ],
    warning:
      'Không tự ý thay đổi hệ thống điện hoặc hệ thống môi chất lạnh.',
  },
  {
    id: 'freezer-02',
    category: 'freezer',
    icon: '💧',
    title: 'Xả tuyết tủ đông',
    description:
      'Hướng dẫn dành cho tủ đông cần xả tuyết thủ công.',
    duration: 'Tùy thiết bị',
    steps: [
      'Đọc hướng dẫn xả tuyết của nhà sản xuất.',
      'Chuyển thực phẩm sang nơi bảo quản lạnh phù hợp.',
      'Tắt thiết bị và ngắt nguồn điện an toàn.',
      'Mở nắp tủ và để tuyết tan tự nhiên.',
      'Thu gom nước theo hướng dẫn thiết bị.',
      'Lau sạch và làm khô bên trong tủ.',
      'Khôi phục nguồn điện.',
      'Chờ tủ đạt nhiệt độ bảo quản trước khi đưa thực phẩm vào.',
    ],
    warning:
      'Không dùng dao, vật sắc nhọn, máy sấy hoặc nguồn nhiệt để làm tan đá.',
  },
  {
    id: 'safety-01',
    category: 'safety',
    icon: '⚠️',
    title: 'An toàn điện lạnh',
    description:
      'Những nguyên tắc cần nhớ khi sử dụng thiết bị.',
    duration: '5 phút',
    steps: [
      'Quan sát tình trạng dây điện và phích cắm.',
      'Không chạm thiết bị điện bằng tay ướt.',
      'Không sử dụng ổ cắm quá tải.',
      'Ngắt nguồn an toàn trước khi vệ sinh.',
      'Không tự tháo bo mạch hoặc máy nén.',
      'Không tự nạp hoặc xả môi chất lạnh.',
      'Liên hệ kỹ thuật viên khi phát hiện bất thường.',
    ],
    warning:
      'Nếu có nguy cơ điện giật hoặc cháy, tránh tiếp xúc thiết bị và gọi hỗ trợ khẩn cấp khi cần.',
  },
  {
    id: 'safety-02',
    category: 'safety',
    icon: '🛠️',
    title: 'Kiểm tra thiết bị định kỳ',
    description:
      'Danh sách kiểm tra cơ bản dành cho người sử dụng.',
    duration: '10 phút',
    steps: [
      'Quan sát bên ngoài thiết bị.',
      'Kiểm tra tiếng ồn bất thường.',
      'Kiểm tra khả năng làm lạnh.',
      'Quan sát dấu hiệu rò nước.',
      'Kiểm tra tình trạng cửa gió hoặc gioăng cửa.',
      'Ghi nhận các triệu chứng bất thường.',
      'Đặt lịch bảo dưỡng nếu cần.',
    ],
    warning:
      'Chỉ kiểm tra bên ngoài, không tự tháo các bộ phận kỹ thuật.',
  },
  {
    id: 'safety-03',
    category: 'safety',
    icon: '🚨',
    title: 'Xử lý khi thiết bị có mùi khét',
    description:
      'Nhận biết tình huống nguy hiểm và xử lý an toàn.',
    duration: 'Đọc ngay',
    steps: [
      'Ngừng sử dụng thiết bị.',
      'Giữ khoảng cách với thiết bị có dấu hiệu nguy hiểm.',
      'Ngắt nguồn điện từ vị trí an toàn nếu có thể.',
      'Không chạm vào thiết bị hoặc dây điện hư hỏng.',
      'Nếu có cháy hoặc khói nguy hiểm, rời khỏi khu vực và gọi 114.',
      'Liên hệ kỹ thuật viên có chuyên môn.',
      'Không bật lại thiết bị trước khi được xác nhận an toàn.',
    ],
    warning:
      'Không dùng nước để dập cháy thiết bị đang mang điện.',
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}


function readProgress(key: string): Progress {
  const raw = localStorage.getItem(key);
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid progress');
  const result: Progress = {};
  for (const guide of GUIDES) {
    const value = (parsed as Record<string, unknown>)[guide.id];
    if (Array.isArray(value)) result[guide.id] = [...new Set(value.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < guide.steps.length))];
  }
  return result;
}
export default function UsageGuideScreen({onBack,userId}: Props) {
  const key = `${STORAGE_KEY}:${userId}`;
  const [initial] = useState(() => {try {return {progress:readProgress(key),error:''};} catch {return {progress:{} as Progress,error:'Không thể đọc tiến độ đã lưu.'};}});
  const [progress,setProgress] = useState<Progress>(initial.progress);
  const [error,setError] = useState(initial.error);
  const [category,setCategory] = useState<Category>('all');
  const [search,setSearch] = useState('');
  const [completedOnly,setCompletedOnly] = useState(false);
  const [selected,setSelected] = useState<Guide|null>(null);
  const count = (g:Guide) => (progress[g.id]??[]).length;
  const percent = (g:Guide) => Math.round(count(g)/g.steps.length*100);
  const completed = GUIDES.filter(g=>percent(g)===100).length;
  const filtered = GUIDES.filter(g=>(category==='all'||g.category===category)&&(!completedOnly||percent(g)===100)&&normalize([g.title,g.description,...g.steps].join(' ')).includes(normalize(search.trim())));
  function persist(next:Progress) {try {localStorage.setItem(key,JSON.stringify(next));setProgress(next);setError('');} catch {setError('Không thể lưu tiến độ trên trình duyệt.');}}
  function toggle(g:Guide,i:number) {const current=progress[g.id]??[];persist({...progress,[g.id]:current.includes(i)?current.filter(n=>n!==i):[...current,i]});}
  function open(g:Guide|null) {setSelected(g);window.scrollTo({top:0,behavior:'auto'});}
  function bar(g:Guide) {return <><progress value={percent(g)} max={100} aria-label="Tiến độ thực hiện"/><small>{count(g)}/{g.steps.length} bước · {percent(g)}%</small></>;}
  return <div className="sc-guide">
    <button className="scg-back" onClick={()=>selected?open(null):onBack()}>← {selected?'Danh sách hướng dẫn':'Quay lại'}</button>
    {error&&<aside role="alert">{error}</aside>}
    {selected?<>
      <header><span className="scg-icon">{selected.icon}</span><h1>{selected.title}</h1><p>{selected.description}</p><small>◷ {selected.duration}</small></header>
      <section><h2>Tiến độ thực hiện</h2>{bar(selected)}</section>
      <aside><strong>⚠️ Lưu ý an toàn</strong><p>{selected.warning}</p></aside>
      <h2>Các bước hướng dẫn</h2><p>Đánh dấu những bước bạn đã thực hiện.</p>
      {selected.steps.map((step,i)=><label key={i} className={'scg-step '+((progress[selected.id]??[]).includes(i)?'checked':'')}><span className="scg-number">{i+1}</span><span><small>BƯỚC {i+1}</small><br/>{step}</span><input type="checkbox" checked={(progress[selected.id]??[]).includes(i)} disabled={!!initial.error} onChange={()=>toggle(selected,i)}/></label>)}
      {percent(selected)===100&&<section className="scg-success">✓ Đã hoàn thành hướng dẫn! Bạn đã đánh dấu tất cả các bước.</section>}
      <div className="scg-actions"><button disabled={!!initial.error} onClick={()=>{if(window.confirm('Bạn có muốn thực hiện lại hướng dẫn này?'))persist({...progress,[selected.id]:[]});}}>↻ Đặt lại tiến độ</button><button className="scg-primary" onClick={()=>open(null)}>Quay lại danh sách</button></div>
    </>:<>
      <header><span className="scg-icon">📋</span><h1>Hướng dẫn điện lạnh</h1><p>Sử dụng, vệ sinh và bảo dưỡng thiết bị đúng cách với hướng dẫn từng bước.</p><div className="scg-stats">{[[GUIDES.length,'Hướng dẫn'],[completed,'Đã hoàn thành'],[Math.round(completed/GUIDES.length*100)+'%','Tiến độ']].map(([n,t])=><div key={t}><strong>{n}</strong><small>{t}</small></div>)}</div></header>
      <section><div className="scg-search"><input aria-label="Tìm kiếm hướng dẫn" placeholder="Tìm kiếm hướng dẫn..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label="Xóa tìm kiếm" onClick={()=>setSearch('')}>×</button>}</div><div className="scg-actions">{CATEGORIES.map(c=><button key={c.id} aria-pressed={category===c.id} className={category===c.id?'scg-primary':''} onClick={()=>setCategory(c.id)}>{c.label}</button>)}</div><label className="scg-filter"><input type="checkbox" checked={completedOnly} onChange={e=>setCompletedOnly(e.target.checked)}/> Chỉ hiện hướng dẫn đã hoàn thành</label></section>
      <div className="scg-listhead"><h2>Danh sách hướng dẫn</h2><small>{filtered.length} kết quả</small></div>
      <div className="scg-grid">{filtered.map(g=><button className="scg-card" key={g.id} onClick={()=>open(g)}><span className="scg-icon">{g.icon}</span><h3>{g.title}</h3><p>{g.description}</p><small>◷ {g.duration} · {g.steps.length} bước {percent(g)===100?' · ✓ Hoàn thành':''}</small>{bar(g)}</button>)}</div>
      {!filtered.length&&<section>Không tìm thấy hướng dẫn. Hãy thử từ khóa hoặc danh mục khác. <button onClick={()=>{setSearch('');setCategory('all');setCompletedOnly(false);}}>Xóa bộ lọc</button></section>}
      <aside><strong>ℹ️ Thông tin</strong><p>Nội dung mang tính hướng dẫn chung. Luôn ưu tiên tài liệu của nhà sản xuất và liên hệ kỹ thuật viên đối với công việc liên quan đến điện, máy nén hoặc môi chất lạnh.</p></aside>
    </>}
  </div>;
}
