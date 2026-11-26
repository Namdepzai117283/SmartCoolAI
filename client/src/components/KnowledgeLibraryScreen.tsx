import { useMemo, useState } from 'react';
import './KnowledgeLibraryScreen.css';
type Props = { onBack: () => void; userId: string; };
type Category =
  | 'all'
  | 'aircon'
  | 'fridge'
  | 'maintenance'
  | 'safety';

type Article = {
  id: string;
  title: string;
  category: Exclude<Category, 'all'>;
  icon: string;
  summary: string;
  readingMinutes: number;
  sections: {
    heading: string;
    content: string;
  }[];
};


const CATEGORIES: {
  id: Category;
  label: string;
  icon: string;
}[] = [
  { id: 'all', label: 'Tất cả', icon: '📚' },
  { id: 'aircon', label: 'Máy lạnh', icon: '❄️' },
  { id: 'fridge', label: 'Tủ lạnh', icon: '🧊' },
  { id: 'maintenance', label: 'Bảo dưỡng', icon: '🛠️' },
  { id: 'safety', label: 'An toàn', icon: '🛡️' },
];

const ARTICLES: Article[] = [
  {
    id: 'a1',
    title: 'Máy lạnh Inverter là gì?',
    category: 'aircon',
    icon: '❄️',
    summary:
      'Tìm hiểu nguyên lý cơ bản và ưu điểm của máy lạnh Inverter.',
    readingMinutes: 4,
    sections: [
      {
        heading: '1. Khái niệm',
        content:
          'Máy lạnh Inverter sử dụng công nghệ điều khiển tốc độ máy nén để điều chỉnh năng suất làm lạnh theo nhu cầu thực tế.',
      },
      {
        heading: '2. Ưu điểm',
        content:
          'Công nghệ này có thể giúp giảm dao động nhiệt độ, vận hành ổn định và tiết kiệm điện trong điều kiện sử dụng phù hợp.',
      },
      {
        heading: '3. Khi nào nên chọn?',
        content:
          'Máy lạnh Inverter thường đáng cân nhắc khi thiết bị được sử dụng nhiều giờ mỗi ngày. Hiệu quả tiết kiệm điện còn phụ thuộc công suất, nhiệt độ cài đặt, cách nhiệt và điều kiện vận hành.',
      },
    ],
  },
  {
    id: 'a2',
    title: 'Chọn công suất máy lạnh theo diện tích phòng',
    category: 'aircon',
    icon: '🏠',
    summary:
      'Tham khảo cách chọn máy lạnh 1 HP, 1.5 HP hoặc 2 HP.',
    readingMinutes: 5,
    sections: [
      {
        heading: '1. Mức công suất tham khảo',
        content:
          'Phòng khoảng 15 m² trở xuống có thể tham khảo máy 1 HP; phòng 15–20 m² tham khảo 1.5 HP; phòng 20–30 m² tham khảo 2 HP.',
      },
      {
        heading: '2. Các yếu tố ảnh hưởng',
        content:
          'Cần xem xét chiều cao trần, số người sử dụng, hướng nắng, diện tích cửa kính, mức độ cách nhiệt và các thiết bị tỏa nhiệt trong phòng.',
      },
      {
        heading: '3. Lời khuyên',
        content:
          'Không nên chỉ dựa vào diện tích để chọn công suất. Với không gian có tải nhiệt lớn, nên nhờ đơn vị kỹ thuật tính toán phù hợp.',
      },
    ],
  },
  {
    id: 'a3',
    title: 'Vì sao máy lạnh không mát?',
    category: 'aircon',
    icon: '🌡️',
    summary:
      'Những nguyên nhân phổ biến và cách kiểm tra an toàn.',
    readingMinutes: 5,
    sections: [
      {
        heading: '1. Sai chế độ hoạt động',
        content:
          'Kiểm tra điều khiển và bảo đảm máy đang ở chế độ làm lạnh COOL, thay vì FAN hoặc chế độ khác.',
      },
      {
        heading: '2. Lưới lọc bẩn',
        content:
          'Bụi bẩn có thể cản trở luồng không khí, khiến hiệu quả làm lạnh giảm. Vệ sinh lưới lọc theo hướng dẫn của nhà sản xuất.',
      },
      {
        heading: '3. Những nguyên nhân cần kỹ thuật viên',
        content:
          'Quạt hỏng, cảm biến lỗi hoặc sự cố hệ thống môi chất lạnh có thể khiến máy làm lạnh kém. Không tự tháo đường ống hoặc xử lý môi chất lạnh.',
      },
    ],
  },
  {
    id: 'a4',
    title: 'Cách sử dụng máy lạnh tiết kiệm điện',
    category: 'aircon',
    icon: '⚡',
    summary:
      'Các thói quen sử dụng giúp giảm điện năng tiêu thụ.',
    readingMinutes: 4,
    sections: [
      {
        heading: '1. Chọn nhiệt độ phù hợp',
        content:
          'Có thể tham khảo mức 26–28°C tùy điều kiện thời tiết và sự thoải mái. Tránh đặt nhiệt độ quá thấp không cần thiết.',
      },
      {
        heading: '2. Hạn chế thất thoát nhiệt',
        content:
          'Đóng cửa khi sử dụng máy lạnh, che nắng hợp lý và hạn chế nguồn nhiệt không cần thiết trong phòng.',
      },
      {
        heading: '3. Bảo dưỡng định kỳ',
        content:
          'Lưới lọc sạch và thiết bị vận hành đúng cách góp phần duy trì hiệu quả làm lạnh.',
      },
    ],
  },
  {
    id: 'a5',
    title: 'Nguyên lý hoạt động của tủ lạnh',
    category: 'fridge',
    icon: '🧊',
    summary:
      'Tìm hiểu các bộ phận chính trong hệ thống làm lạnh.',
    readingMinutes: 5,
    sections: [
      {
        heading: '1. Chu trình làm lạnh',
        content:
          'Tủ lạnh sử dụng hệ thống làm lạnh để chuyển nhiệt từ bên trong khoang tủ ra môi trường bên ngoài.',
      },
      {
        heading: '2. Các bộ phận chính',
        content:
          'Hệ thống thường có máy nén, dàn ngưng, bộ phận tiết lưu và dàn bay hơi.',
      },
      {
        heading: '3. Điều khiển nhiệt độ',
        content:
          'Cảm biến và bộ điều khiển giúp duy trì nhiệt độ theo mức cài đặt. Cấu tạo cụ thể thay đổi theo từng dòng tủ.',
      },
    ],
  },
  {
    id: 'a6',
    title: 'Tủ lạnh không đông đá: Kiểm tra những gì?',
    category: 'fridge',
    icon: '🥶',
    summary:
      'Các nguyên nhân thường gặp khi ngăn đông hoạt động kém.',
    readingMinutes: 4,
    sections: [
      {
        heading: '1. Kiểm tra cài đặt',
        content:
          'Xác nhận mức nhiệt độ đang phù hợp và cửa tủ đã đóng kín.',
      },
      {
        heading: '2. Kiểm tra thực phẩm',
        content:
          'Không xếp thực phẩm che kín đường lưu thông không khí bên trong tủ.',
      },
      {
        heading: '3. Khi nào cần sửa chữa?',
        content:
          'Nếu tủ không đạt nhiệt độ sau khi kiểm tra những yếu tố cơ bản, nên liên hệ kỹ thuật viên để kiểm tra quạt, cảm biến hoặc hệ thống làm lạnh.',
      },
    ],
  },
  {
    id: 'a7',
    title: 'Cách bảo quản thực phẩm trong tủ lạnh',
    category: 'fridge',
    icon: '🥬',
    summary:
      'Một số nguyên tắc giúp bảo quản thực phẩm tốt hơn.',
    readingMinutes: 4,
    sections: [
      {
        heading: '1. Nhiệt độ bảo quản',
        content:
          'Ngăn mát thường nên duy trì khoảng 4°C hoặc thấp hơn, ngăn đông khoảng -18°C để bảo quản thực phẩm đông lạnh.',
      },
      {
        heading: '2. Phân loại thực phẩm',
        content:
          'Để thực phẩm sống riêng với thực phẩm đã chế biến và sử dụng hộp đựng phù hợp.',
      },
      {
        heading: '3. Tránh quá tải',
        content:
          'Không nhồi nhét quá nhiều thực phẩm làm cản trở luồng không khí lạnh.',
      },
    ],
  },
  {
    id: 'a8',
    title: 'Vệ sinh lưới lọc máy lạnh đúng cách',
    category: 'maintenance',
    icon: '🧽',
    summary:
      'Các bước cơ bản để vệ sinh lưới lọc an toàn.',
    readingMinutes: 5,
    sections: [
      {
        heading: '1. Chuẩn bị',
        content:
          'Tắt máy và ngắt nguồn điện theo hướng dẫn của nhà sản xuất trước khi vệ sinh.',
      },
      {
        heading: '2. Tháo lưới lọc',
        content:
          'Chỉ tháo bộ phận lưới lọc mà nhà sản xuất cho phép người dùng tự vệ sinh. Không tác động vào bộ phận điện.',
      },
      {
        heading: '3. Làm sạch và lắp lại',
        content:
          'Vệ sinh bằng phương pháp phù hợp với hướng dẫn sử dụng, để khô hoàn toàn và lắp đúng vị trí trước khi vận hành.',
      },
    ],
  },
  {
    id: 'a9',
    title: 'Dấu hiệu thiết bị cần bảo dưỡng',
    category: 'maintenance',
    icon: '🔧',
    summary:
      'Nhận biết các biểu hiện bất thường của thiết bị điện lạnh.',
    readingMinutes: 4,
    sections: [
      {
        heading: '1. Hiệu quả làm lạnh giảm',
        content:
          'Thiết bị mất nhiều thời gian hơn để đạt nhiệt độ mong muốn hoặc làm lạnh không đều.',
      },
      {
        heading: '2. Tiếng ồn bất thường',
        content:
          'Tiếng rung, tiếng va đập hoặc âm thanh khác thường có thể là dấu hiệu cần kiểm tra.',
      },
      {
        heading: '3. Rò nước hoặc mùi lạ',
        content:
          'Nước chảy bất thường, mùi khét hoặc dấu hiệu chập điện cần được xử lý thận trọng. Với dấu hiệu nguy hiểm, ngừng sử dụng và gọi người có chuyên môn.',
      },
    ],
  },
  {
    id: 'a10',
    title: 'An toàn điện khi sử dụng máy lạnh',
    category: 'safety',
    icon: '🛡️',
    summary:
      'Những nguyên tắc quan trọng để hạn chế rủi ro điện.',
    readingMinutes: 5,
    sections: [
      {
        heading: '1. Sử dụng nguồn điện phù hợp',
        content:
          'Thiết bị cần được lắp đặt theo thông số kỹ thuật và hướng dẫn của nhà sản xuất, với các biện pháp bảo vệ điện phù hợp.',
      },
      {
        heading: '2. Khi có dấu hiệu rò điện',
        content:
          'Không chạm vào thiết bị nếu nghi ngờ có điện rò. Ngắt nguồn điện từ vị trí an toàn nếu có thể và liên hệ người có chuyên môn.',
      },
      {
        heading: '3. Không tự sửa chữa',
        content:
          'Không tự mở hộp điện, thay linh kiện điện hoặc can thiệp hệ thống khi chưa được đào tạo.',
      },
    ],
  },
  {
    id: 'a11',
    title: 'Cần làm gì khi máy lạnh có mùi khét?',
    category: 'safety',
    icon: '🚨',
    summary:
      'Hướng dẫn xử lý ban đầu khi thiết bị có dấu hiệu nguy hiểm.',
    readingMinutes: 3,
    sections: [
      {
        heading: '1. Ngừng sử dụng',
        content:
          'Dừng thiết bị ngay. Nếu có thể thực hiện an toàn, ngắt điện tại cầu dao phù hợp.',
      },
      {
        heading: '2. Tránh tiếp xúc nguy hiểm',
        content:
          'Không chạm vào dây điện hư hỏng hoặc thiết bị có dấu hiệu chập cháy. Không dùng nước để xử lý đám cháy điện.',
      },
      {
        heading: '3. Liên hệ hỗ trợ',
        content:
          'Gọi kỹ thuật viên đủ chuyên môn. Nếu có cháy hoặc khói lan rộng, sơ tán và liên hệ lực lượng cứu hỏa.',
      },
    ],
  },
  {
    id: 'a12',
    title: 'Tìm hiểu mã lỗi điều hòa',
    category: 'maintenance',
    icon: '🔍',
    summary:
      'Vì sao cùng một mã lỗi có thể khác nhau giữa các hãng?',
    readingMinutes: 4,
    sections: [
      {
        heading: '1. Mã lỗi là gì?',
        content:
          'Mã lỗi là thông tin do hệ thống điều khiển hiển thị nhằm hỗ trợ nhận biết tình trạng hoạt động của thiết bị.',
      },
      {
        heading: '2. Không suy luận chỉ từ mã',
        content:
          'Mã E1, E2 hoặc các mã tương tự có thể mang ý nghĩa khác nhau tùy hãng và model.',
      },
      {
        heading: '3. Cách tra cứu',
        content:
          'Ghi lại hãng, model và mã lỗi chính xác. Đối chiếu tài liệu chính thức hoặc nhờ kỹ thuật viên kiểm tra.',
      },
    ],
  },
];

function categoryName(category: Article['category']): string {
  return (
    CATEGORIES.find((item) => item.id === category)?.label ??
    'Kiến thức'
  );
}


export default function KnowledgeLibraryScreen({onBack,userId}:Props) {
 const key='smartcool_library_favorites_v1:'+userId;
 const [favorites,setFavorites]=useState<string[]>(()=>{try{const v:unknown=JSON.parse(localStorage.getItem(key)??'[]');return Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'&&ARTICLES.some(a=>a.id===x)):[];}catch{return [];}});
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState<Category>('all');
 const [onlyFavorites,setOnlyFavorites]=useState(false);
 const [selected,setSelected]=useState<Article|null>(null);
 const [error,setError]=useState('');
 const filtered=useMemo(()=>ARTICLES.filter(a=>(category==='all'||a.category===category)&&(!onlyFavorites||favorites.includes(a.id))&&[a.title,a.summary,categoryName(a.category),...a.sections.flatMap(s=>[s.heading,s.content])].join(' ').toLocaleLowerCase('vi-VN').includes(query.trim().toLocaleLowerCase('vi-VN'))),[query,category,onlyFavorites,favorites]);
 function toggle(id:string){const next=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];try{localStorage.setItem(key,JSON.stringify(next));setFavorites(next);setError('');}catch{setError('Không thể lưu bài viết trên trình duyệt.');}}
 function open(a:Article|null){setSelected(a);window.scrollTo({top:0,behavior:'auto'});}
 const favoriteButton=(a:Article)=> <button type="button" className={'sck-favorite '+(favorites.includes(a.id)?'active':'')} aria-pressed={favorites.includes(a.id)} onClick={()=>toggle(a.id)}>{favorites.includes(a.id)?'★ Đã lưu':'☆ Lưu yêu thích'}</button>;
 return <div className="sck-library"><button className="sck-back" onClick={()=>selected?open(null):onBack()}>← {selected?'Quay lại thư viện':'Quay lại'}</button>{error&&<p role="alert">{error}</p>}{selected?<><article className="sck-detail"><span className="sck-icon">{selected.icon}</span><small>{categoryName(selected.category)} · {selected.readingMinutes} phút đọc</small><h1>{selected.title}</h1><p>{selected.summary}</p>{favoriteButton(selected)}<hr/>{selected.sections.map(s=><section key={s.heading}><h2>{s.heading}</h2><p>{s.content}</p></section>)}</article><aside>Nội dung mang tính tham khảo và học tập. Khi thiết bị có dấu hiệu nguy hiểm hoặc cần can thiệp kỹ thuật, hãy liên hệ người có chuyên môn.</aside></>:<><header className="sck-hero"><h1>📚 Thư viện kiến thức</h1><p>Khám phá kiến thức về máy lạnh, tủ lạnh, bảo dưỡng và sử dụng thiết bị điện lạnh an toàn.</p><div className="sck-stats">{[[ARTICLES.length,'Bài viết'],[CATEGORIES.length-1,'Danh mục'],[favorites.length,'Đã lưu']].map(([n,l])=><div key={l}><strong>{n}</strong><span>{l}</span></div>)}</div></header><section className="sck-search"><label htmlFor="sck-query">🔎 Tìm kiếm kiến thức</label><input id="sck-query" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ví dụ: máy lạnh không mát..."/><div className="sck-filters">{CATEGORIES.map(c=><button key={c.id} aria-pressed={category===c.id} className={category===c.id?'active':''} onClick={()=>setCategory(c.id)}>{c.icon} {c.label}</button>)}<button className={onlyFavorites?'active':''} aria-pressed={onlyFavorites} onClick={()=>setOnlyFavorites(!onlyFavorites)}>★ Chỉ xem bài yêu thích</button></div></section><div className="sck-heading"><h2>Danh sách bài viết</h2><span>{filtered.length} bài</span></div>{filtered.length?<div className="sck-grid">{filtered.map(a=><article key={a.id}><span className="sck-icon">{a.icon}</span><small>{categoryName(a.category)} · {a.readingMinutes} phút đọc</small><h3>{a.title}</h3><p>{a.summary}</p><div className="sck-actions"><button className="sck-read" onClick={()=>open(a)}>Đọc bài viết →</button>{favoriteButton(a)}</div></article>)}</div>:<section className="sck-search"><h3>Không tìm thấy bài viết</h3><p>Hãy thử từ khóa khác hoặc thay đổi bộ lọc.</p><button onClick={()=>{setQuery('');setCategory('all');setOnlyFavorites(false);}}>Xóa bộ lọc</button></section>}<aside>Thư viện sử dụng nội dung biên soạn sẵn phục vụ đồ án. Bài viết yêu thích lưu riêng theo tài khoản trên trình duyệt, chưa đồng bộ với Mobile.</aside></>}</div>;
}
