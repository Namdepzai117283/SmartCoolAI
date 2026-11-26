import { loadServerChats, syncChat, removeServerChat } from './services/conversationSync';
import UsageGuideScreen from './components/UsageGuideScreen';
import KnowledgeLibraryScreen from './components/KnowledgeLibraryScreen';
import DiagnosisScreen from './components/DiagnosisScreen';
import CostEstimateScreen from './components/CostEstimateScreen';
import CompareScreen from './components/CompareScreen';
import BuyingAdviceScreen from './components/BuyingAdviceScreen';
import AICameraScreen from './components/AICameraScreen';
import ProfessionalHome from './components/ProfessionalHome';
import AIChatScreen from './components/AIChatScreen';
import { createAIConversation, sendAIMessage } from './services/aiService';
import type { AIConversation, AIAction, FeatureId } from './types/smartcool';
import { useEffect, useRef, useState } from 'react';

import { Snowflake, Home, MessageCircle, Camera, History, LayoutGrid, Sparkles, ArrowRight, ArrowLeft, Plus, Search, Wallet, SlidersHorizontal, Wrench, Activity, Package, ShieldCheck, UserRound, CheckCircle2, Trash2, ChevronRight, Save, Menu, X, ClipboardList, Star, Upload, ThermometerSnowflake } from 'lucide-react';



type Page = 'home'|'chat'|'camera'|'budget'|'devices'|'library'|'compare'|'estimate'|'install'|'installation'|'diagnose'|'history'|'account'|'more';

type Device = {id:string;name:string;brand:string;type:string;power:string;price:number;area:string;score:number;desc:string;emoji:string};

type Message = {id:number;role:'user'|'ai';text:string;deviceIds?:string[];image?:string};

type EstimateItem = {id:string;name:string;unit:string;price:number;qty:number};

type Saved = {id:number;title:string;detail:string;date:string};

const VND=(n:number)=>Math.round(n).toLocaleString('vi-VN')+' ₫';

const devices:Device[]=[

{id:'ac1',name:'Daikin Inverter FTKB25YVMV',brand:'Daikin',type:'Máy lạnh',power:'1 HP',price:8850000,area:'Dưới 15 m²',score:4.8,desc:'Vận hành êm, tiết kiệm điện, phù hợp phòng ngủ.',emoji:'❄️'},

{id:'ac2',name:'Panasonic Inverter CU/CS-PU12AKH',brand:'Panasonic',type:'Máy lạnh',power:'1.5 HP',price:11690000,area:'15–20 m²',score:4.9,desc:'Làm lạnh nhanh, thích hợp phòng khách nhỏ.',emoji:'🌬️'},

{id:'ac3',name:'LG DualCool Inverter V13WIN1',brand:'LG',type:'Máy lạnh',power:'1.5 HP',price:10290000,area:'15–20 m²',score:4.7,desc:'Tối ưu chi phí và điện năng tiêu thụ.',emoji:'🧊'},

{id:'ac4',name:'Casper Inverter GC-12IS35',brand:'Casper',type:'Máy lạnh',power:'1.5 HP',price:7390000,area:'15–20 m²',score:4.5,desc:'Giải pháp ngân sách tiết kiệm.',emoji:'💨'},

{id:'fr1',name:'Samsung Inverter RT31CG5424B1',brand:'Samsung',type:'Tủ lạnh',power:'305 lít',price:8990000,area:'Gia đình 3–4 người',score:4.7,desc:'Dung tích rộng, làm lạnh ổn định.',emoji:'🧊'},

{id:'fr2',name:'Panasonic Inverter NR-BV281BGMV',brand:'Panasonic',type:'Tủ lạnh',power:'255 lít',price:10990000,area:'Gia đình 2–3 người',score:4.8,desc:'Ngăn đông mềm, tiết kiệm điện.',emoji:'🥶'},

{id:'fz1',name:'Sanaky VH-2899W3',brand:'Sanaky',type:'Tủ đông',power:'280 lít',price:7790000,area:'Cửa hàng nhỏ',score:4.6,desc:'Phù hợp bảo quản thực phẩm kinh doanh.',emoji:'📦'},

{id:'co1',name:'Kangaroo KG298K',brand:'Kangaroo',type:'Tủ mát',power:'298 lít',price:9990000,area:'Quầy giải khát',score:4.5,desc:'Trưng bày đồ uống và thực phẩm mát.',emoji:'🥤'},

];

const materials:Record<string,EstimateItem[]>={

'Máy lạnh':[{id:'copper',name:'Ống đồng + bảo ôn',unit:'mét',price:185000,qty:3},{id:'wire',name:'Dây điện phù hợp',unit:'mét',price:28000,qty:4},{id:'drain',name:'Ống thoát nước',unit:'mét',price:20000,qty:4},{id:'bracket',name:'Giá đỡ dàn nóng',unit:'bộ',price:250000,qty:1},{id:'small',name:'Vật tư phụ',unit:'bộ',price:150000,qty:1},{id:'labor',name:'Nhân công lắp đặt tham khảo',unit:'lần',price:450000,qty:1}],

'Tủ lạnh':[{id:'power',name:'Ổ cắm điện đạt chuẩn (nếu cần)',unit:'bộ',price:140000,qty:1},{id:'move',name:'Vận chuyển / bố trí vị trí',unit:'lần',price:250000,qty:1}],

'Tủ đông':[{id:'power',name:'Ổ cắm điện đạt chuẩn (nếu cần)',unit:'bộ',price:140000,qty:1},{id:'move',name:'Vận chuyển / bố trí vị trí',unit:'lần',price:300000,qty:1}],

'Tủ mát':[{id:'power',name:'Ổ cắm điện đạt chuẩn (nếu cần)',unit:'bộ',price:140000,qty:1},{id:'move',name:'Vận chuyển / bố trí vị trí',unit:'lần',price:300000,qty:1}]

};

const pageNames:Record<Page,string>={home:'Trang chủ',chat:'Trợ lý AI',camera:'AI Camera',budget:'Tư vấn mua thiết bị',devices:'Thiết bị điện lạnh',library:'Thư viện kiến thức',compare:'So sánh thiết bị',estimate:'Dự toán chi phí',installation:'Chuẩn bị lắp đặt',install:'Hướng dẫn lắp đặt',diagnose:'Chẩn đoán sự cố',history:'Lịch sử',account:'Tài khoản',more:'Tất cả chức năng'};

const nav:{id:Page;icon:typeof Home;label:string}[]=[{id:'home',icon:Home,label:'Trang chủ'},{id:'chat',icon:MessageCircle,label:'AI Chat'},{id:'camera',icon:Camera,label:'AI Camera'},{id:'history',icon:History,label:'Lịch sử'},{id:'more',icon:LayoutGrid,label:'Tất cả'}];

const allNav:{id:Page;icon:typeof Home}[]=[{id:'home',icon:Home},{id:'chat',icon:MessageCircle},{id:'camera',icon:Camera},{id:'diagnose',icon:Activity},{id:'budget',icon:Wallet},{id:'compare',icon:SlidersHorizontal},{id:'library',icon:ClipboardList},{id:'devices',icon:ThermometerSnowflake},{id:'estimate',icon:Package},{id:'install',icon:Wrench},{id:'history',icon:History},{id:'account',icon:UserRound}];



function load<T,>(key:string,fallback:T):T {try{const x=localStorage.getItem(key);return x?JSON.parse(x) as T:fallback}catch{return fallback}}





// Xác thực qua Backend

import { authService, type AuthUser, type AuthSession } from './services/authService';
import { authStorage } from './services/authStorage';
import { ApiError } from './services/apiService';

const errorText = (e: unknown) => e instanceof Error ? e.message : 'Có lỗi xảy ra.';
const toProfile = (u: AuthUser) => ({name:u.profile?.fullName || '',email:u.email,phone:u.profile?.phone || '',address:u.profile?.address || ''});

function AuthScreen({onLogin}:{onLogin:(session:AuthSession)=>Promise<void>}) {

 const [mode,setMode]=useState<'login'|'register'|'reset'>('login');

 const [name,setName]=useState('');const [email,setEmail]=useState('');const [phone,setPhone]=useState('');

 const [password,setPassword]=useState('');const [confirmPassword,setConfirmPassword]=useState('');

 const [error,setError]=useState('');const [notice,setNotice]=useState('');

 const switchMode=(next:'login'|'register'|'reset')=>{setMode(next);setError('');setNotice('');setPassword('');setConfirmPassword('')};

 const [busy,setBusy]=useState(false);
 const submit=async(e:React.FormEvent<HTMLFormElement>)=>{
  e.preventDefault(); if(busy)return; setError('');setNotice('');
  const normalized=email.trim().toLowerCase();
  if(mode==='reset'){setNotice('Chức năng đặt lại mật khẩu chưa được hỗ trợ.');return;}
  if(mode==='register' && (name.trim().length<2 || password.length<8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password))){setError('Nhập họ tên và mật khẩu ít nhất 8 ký tự, có chữ hoa, chữ thường và số.');return;}
  if(mode==='register' && password!==confirmPassword){setError('Mật khẩu xác nhận không trùng khớp.');return;}
  setBusy(true);
  try {const session=mode==='register'?await authService.register({fullName:name.trim(),email:normalized,password,phone:phone.trim()||undefined}):await authService.login({email:normalized,password});await onLogin(session);}
  catch(e){setError(errorText(e));}finally{setBusy(false);}
 };

 return <div className="auth-page"><div className="auth-card"><div className="auth-brand"><div className="brand-icon"><Snowflake size={27}/></div><div><strong>SmartCool <span>AI</span></strong><small>Trợ lý ngành điện lạnh</small></div></div><div className="auth-heading"><span className="eyebrow blue">CHÀO MỪNG ĐẾN SMARTCOOL AI</span><h1>{mode==='login'?'Đăng nhập':mode==='register'?'Tạo tài khoản':'Quên mật khẩu'}</h1><p>{mode==='login'?'Đăng nhập để khám phá các tính năng điện lạnh.':mode==='register'?'Tạo tài khoản trải nghiệm SmartCool AI.':'Tính năng đặt lại mật khẩu chưa được hỗ trợ.'}</p></div><form onSubmit={submit} className="auth-form">{mode==='register'&&<><label>Họ và tên<input required className="text-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Nguyễn Văn A"/></label><label>Số điện thoại (không bắt buộc)<input className="text-input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="09xxxxxxxx"/></label></>}<label>Email<input required type="email" autoComplete="email" className="text-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com"/></label>{mode!=='reset'&&<label>Mật khẩu<input required minLength={mode==='register'?8:undefined} type="password" autoComplete={mode==='register'?'new-password':'current-password'} className="text-input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nhập mật khẩu"/></label>}{mode==='register'&&<label>Xác nhận mật khẩu<input required type="password" autoComplete="new-password" className="text-input" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu"/></label>}{error&&<p className="auth-error" role="alert">{error}</p>}{notice&&<p className="auth-notice">{notice}</p>}<button className="btn primary full" type="submit" disabled={busy}>{busy?'Đang xử lý…':mode==='login'?'Đăng nhập':mode==='register'?'Đăng ký':'Kiểm tra yêu cầu'} <ArrowRight size={17}/></button></form><div className="auth-links">{mode==='login'?<><button onClick={()=>switchMode('reset')}>Quên mật khẩu?</button><p>Chưa có tài khoản? <button onClick={()=>switchMode('register')}>Đăng ký ngay</button></p></>:<p>Đã có tài khoản? <button onClick={()=>switchMode('login')}>Đăng nhập</button></p>}</div><p className="auth-disclaimer">Tài khoản dùng chung với ứng dụng Mobile. Các tính năng AI vẫn đang mô phỏng.</p></div></div>

}



function App(){

 const [authUser,setAuthUser]=useState<AuthUser|null>(null);
 const [authReady,setAuthReady]=useState(false);
 const [savingProfile,setSavingProfile]=useState(false);
 const [restoreError,setRestoreError]=useState('');
 const [page,setPage]=useState<Page>('home');const [menu,setMenu]=useState(false);

 const [conversations,setConversations]=useState<AIConversation[]>([]);
 const [activeChat,setActiveChat]=useState<AIConversation>(()=>createAIConversation());
 const [pendingAction,setPendingAction]=useState<AIAction|null>(null);const [saved,setSaved]=useState<Saved[]>([]);

 const [,setSelected]=useState<Device>(devices[0]);const [,setItems]=useState<EstimateItem[]>(materials['Máy lạnh'].map(i=>({...i})));

 const [image,setImage]=useState('');const [imageName,setImageName]=useState('');const [imageSource,setImageSource]=useState<'camera'|'install'|'chat'>('camera');

 const [query,setQuery]=useState('');const [category,setCategory]=useState('Tất cả');



 const [issueMessages,setIssueMessages]=useState<Message[]>([]);const [installQuestion,setInstallQuestion]=useState('');const [installAsked,setInstallAsked]=useState(false);const [profile,setProfile]=useState({name:'',email:'',phone:'',address:''});

 const [toast,setToast]=useState('');

 const fileRef=useRef<HTMLInputElement>(null);

 const userId=authUser?.id;
 const sessionUser=useRef<string|undefined>(undefined);
 const syncQueue=useRef<Promise<void>>(Promise.resolve());
 const [syncing,setSyncing]=useState(false);
 const refreshChats=async(id:string)=>{try{const remote=await loadServerChats(id);if(sessionUser.current!==id)return;setConversations(old=>{const merged=new Map(old.map(c=>[c.id,c]));for(const c of remote){const local=merged.get(c.id);if(!local||c.updatedAt>=local.updatedAt){const images=new Map(local?.messages.map(m=>[m.id,m])??[]);merged.set(c.id,{...c,messages:c.messages.map(m=>({...m,imageUri:images.get(m.id)?.imageUri,attachments:images.get(m.id)?.attachments}))});}}return [...merged.values()].sort((a,b)=>b.updatedAt-a.updatedAt);});}catch(e){if(sessionUser.current===id)notify('Không tải được lịch sử máy chủ: '+errorText(e));}};

 useEffect(()=>{if(userId)try{localStorage.setItem('sc-conversations:'+userId,JSON.stringify(conversations))}catch{setToast('Không đủ dung lượng lưu lịch sử trên trình duyệt.')}},[conversations,userId]);
 useEffect(()=>{if(userId)try{localStorage.setItem('sc-history:'+userId,JSON.stringify(saved))}catch{}},[saved,userId]);
 useEffect(()=>{if(userId)try{localStorage.setItem('sc-diagnosis:'+userId,JSON.stringify(issueMessages))}catch{}},[issueMessages,userId]);
 
 
 const applyUser=(user:AuthUser)=>{sessionUser.current=user.id;const chats=load<AIConversation[]>('sc-conversations:'+user.id,[]);setConversations(chats);setActiveChat(chats[0]??createAIConversation());setPendingAction(null);setSaved(load('sc-history:'+user.id,[]));setIssueMessages(load('sc-diagnosis:'+user.id,[]));setProfile(toProfile(user));setAuthUser(user);setPage('home');void refreshChats(user.id);};
 const login=async(session:AuthSession)=>{await authStorage.saveTokens(session.accessToken,session.refreshToken);applyUser(session.user);};
 const restore=async()=>{setAuthReady(false);setRestoreError('');try{const tokens=await authStorage.getTokens();if(!tokens)return;try{applyUser(await authService.getCurrentUser(tokens.accessToken));}catch(e){if(!(e instanceof ApiError)||e.statusCode!==401)throw e;await login(await authService.refresh(tokens.refreshToken));}}catch(e){if(e instanceof ApiError && [401,403].includes(e.statusCode)){await authStorage.clearTokens();}else setRestoreError(errorText(e));}finally{setAuthReady(true);}};
 const restored=useRef(false);
 useEffect(()=>{if(restored.current)return;restored.current=true;try{localStorage.removeItem('sc-demo-users');localStorage.removeItem('sc-demo-session');localStorage.removeItem('sc-profile');}catch{}void restore();},[]);
 const logout=async()=>{if(savingProfile||syncing)return;sessionUser.current=undefined;try{const tokens=await authStorage.getTokens();if(tokens)await authService.logout(tokens.refreshToken);}catch(e){notify('Không thể thu hồi phiên trên máy chủ: '+errorText(e));}finally{await authStorage.clearTokens();setAuthUser(null);setConversations([]);setActiveChat(createAIConversation());setPendingAction(null);setSaved([]);setIssueMessages([]);setImage('');setImageName('');setInstallQuestion('');setInstallAsked(false);setProfile({name:'',email:'',phone:'',address:''});setPage('home');setMenu(false);}};
 const saveProfile=async()=>{if(savingProfile)return;if(profile.name.trim().length<2){notify('Vui lòng nhập họ tên hợp lệ.');return;}setSavingProfile(true);try{const tokens=await authStorage.getTokens();if(!tokens)throw new ApiError('Vui lòng đăng nhập lại.',401);const input={fullName:profile.name,phone:profile.phone||null,address:profile.address||null};let user:AuthUser;try{user=await authService.updateProfile(tokens.accessToken,input);}catch(e){if(!(e instanceof ApiError)||e.statusCode!==401)throw e;const session=await authService.refresh(tokens.refreshToken);await authStorage.saveTokens(session.accessToken,session.refreshToken);user=await authService.updateProfile(session.accessToken,input);}setAuthUser(user);setProfile(toProfile(user));notify('Cập nhật hồ sơ thành công.');}catch(e){notify(errorText(e));if(e instanceof ApiError && [401,403].includes(e.statusCode)){await authStorage.clearTokens();setAuthUser(null);}}finally{setSavingProfile(false);}};
 const notify=(t:string)=>{setToast(t);setTimeout(()=>setToast(''),3000)};

 const go=(p:Page, action:AIAction|null=null)=>{setPendingAction(action);setPage(p);setMenu(false);window.scrollTo({top:0,behavior:'auto'})};

 const record=(title:string,detail:string)=>{setSaved(prev=>[{id:Date.now(),title,detail,date:new Date().toLocaleString('vi-VN')},...prev].slice(0,60));notify('Đã lưu vào lịch sử')};

 const choose=(d:Device)=>{setPendingAction(null);setSelected(d);setItems((materials[d.type]||[]).map(i=>({...i})));go('estimate')};

 const saveChat=(next:AIConversation)=>{setActiveChat(next);setConversations(prev=>[next,...prev.filter(c=>c.id!==next.id)]);if(!userId||!next.messages.length)return;const id=userId;setSyncing(true);syncQueue.current=syncQueue.current.catch(()=>{}).then(async()=>{if(sessionUser.current!==id)return;await syncChat(id,next);}).catch(e=>{if(sessionUser.current===id)notify('Chưa đồng bộ: '+errorText(e)+' — dữ liệu còn trên trình duyệt.');});const task=syncQueue.current;void task.finally(()=>{if(syncQueue.current===task)setSyncing(false);});};
 const deleteChat=async(c:AIConversation)=>{if(!userId||syncing||!confirm('Xóa cuộc trò chuyện này?'))return;const id=userId;setSyncing(true);try{await removeServerChat(id,c.id);if(sessionUser.current!==id)return;setConversations(p=>p.filter(x=>x.id!==c.id));if(activeChat.id===c.id)setActiveChat(createAIConversation());}catch(e){notify(errorText(e));}finally{setSyncing(false);}};
 const send=(value:string)=>{if(!value.trim())return;saveChat(sendAIMessage(createAIConversation(),value));go('chat');};
 const openAIAction=(action:AIAction)=>{switch(action.feature){case 'compare':go('compare',action);break;case 'budget':go('budget',action);break;case 'diagnosis':go('diagnose',action);break;case 'estimate':go('estimate',action);break;case 'guide':go('install',action);break;case 'library':go('library',action);break;case 'camera':go('camera',action);break;case 'chat':go('chat',action);break;}};


 const imageUpload=(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;if(!f.type.startsWith('image/')){notify('Vui lòng chọn tệp ảnh');return}if(f.size>5*1024*1024){notify('Ảnh phải nhỏ hơn 5 MB');return}const r=new FileReader();r.onload=()=>{setImage(String(r.result));setImageName(f.name);if(imageSource==='chat'){saveChat(sendAIMessage(activeChat,{content:'Tôi đã gửi ảnh '+f.name,imageUri:String(r.result)}));go('chat')}else go(imageSource==='install'?'installation':'camera')};r.readAsDataURL(f);e.target.value=''};

 const openUpload=(source:'camera'|'install'|'chat',capture=false)=>{setImageSource(source);if(fileRef.current){fileRef.current.setAttribute('accept','image/*');if(capture)fileRef.current.setAttribute('capture','environment');else fileRef.current.removeAttribute('capture');fileRef.current.click()}};



 const filtered=devices.filter(d=>(category==='Tất cả'||d.type===category)&&(`${d.name} ${d.type} ${d.brand}`.toLowerCase().includes(query.toLowerCase())));




 const card=(d:Device,action?:()=>void)=><div className="device-card" key={d.id}><div className="device-art">{d.emoji}</div><div className="device-main"><span className="eyebrow">{d.type} · {d.brand}</span><h3>{d.name}</h3><p>{d.power} · {d.area}</p><div className="device-meta"><strong>{VND(d.price)}</strong><span><Star size={13} fill="currentColor"/> {d.score}</span></div><button className="small-btn" onClick={action||(()=>choose(d))}>Xem chi tiết & dự toán <ChevronRight size={15}/></button></div></div>;

 const heading=(title:string,sub:string)=><div className="section-head"><button className="back" onClick={()=>go('home')}><ArrowLeft size={17}/> Quay lại</button><h1>{title}</h1><p>{sub}</p></div>;

 const content=()=>{switch(page){

 case 'home':return <ProfessionalHome onOpenFeature={(id:FeatureId)=>{const pages:Record<FeatureId,Page>={chat:'chat',camera:'camera',diagnosis:'diagnose',budget:'budget',compare:'compare',library:'library',estimate:'estimate',guide:'install'};setPendingAction(null);go(pages[id]);}} onAskQuestion={(question)=>{go('chat');send(question);}} />;

 case 'chat':return <AIChatScreen key={activeChat.id} conversation={activeChat} onBack={()=>go('home')} onAction={openAIAction} onConversationChange={saveChat} onNewConversation={saveChat}/>;

 case 'camera':return <AICameraScreen onBack={()=>go('home')}/>;

  case 'budget':return <BuyingAdviceScreen initialData={pendingAction?.feature==='budget'?pendingAction.payload:undefined} onBack={()=>go(pendingAction?.feature==='budget'?'chat':'home')} onAction={openAIAction}/>;

 case 'library':return <KnowledgeLibraryScreen key={authUser?.id} userId={authUser?.id??''} onBack={()=>go(pendingAction?.feature==='library'?'chat':'home')}/>;
 case 'devices':return <>{heading('Thư viện thiết bị điện lạnh','Danh sách model mẫu để trải nghiệm tư vấn và dự toán.')}<div className="panel filters"><div className="search"><Search size={19}/><input placeholder="Tìm theo tên, hãng, loại máy…" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="row wrap">{['Tất cả','Máy lạnh','Tủ lạnh','Tủ đông','Tủ mát'].map(t=><button key={t} className={'chip '+(category===t?'active':'')} onClick={()=>setCategory(t)}>{t}</button>)}</div></div><div className="device-grid">{filtered.map(d=>card(d))}</div>{!filtered.length&&<div className="empty">Không tìm thấy thiết bị phù hợp.</div>}</>;

 case 'estimate':return <CostEstimateScreen key={authUser?.id} userId={authUser?.id??''} initialData={pendingAction?.feature==='estimate'?pendingAction.payload:undefined} onBack={()=>go(pendingAction?.feature==='estimate'?'chat':'home')}/>;

 case 'compare':return <CompareScreen initialData={pendingAction?.feature==='compare'?pendingAction.payload:undefined} onBack={()=>go(pendingAction?.feature==='compare'?'chat':'home')} onAction={openAIAction}/>;

 case 'install':return <><UsageGuideScreen key={authUser?.id} userId={authUser?.id??''} onBack={()=>go(pendingAction?.feature==='guide'?'chat':'home')}/><button className="btn secondary" onClick={()=>go('installation')}>Hướng dẫn chuẩn bị lắp đặt bằng ảnh</button></>;
 case 'installation':return <>{heading('AI hướng dẫn lắp đặt','Chụp ảnh thiết bị, mô tả vị trí và đặt câu hỏi về cách lắp đặt an toàn.')}<div className="panel upload-panel">{image?<><img src={image} alt="Ảnh phục vụ hướng dẫn" className="uploaded"/><p>{imageName}</p></>:<><div className="upload-icon"><Wrench size={34}/></div><h2>Gửi ảnh thiết bị cần lắp đặt</h2><p>Ưu tiên ảnh nhãn model và vị trí lắp đặt.</p></>}<div className="row center"><button className="btn primary" onClick={()=>openUpload('install',true)}><Camera size={17}/> Chụp ảnh</button><button className="btn secondary" onClick={()=>openUpload('install')}><Upload size={17}/> Chọn ảnh</button></div></div><div className="panel"><label className="field-label">Bạn muốn hỏi AI điều gì?</label><textarea className="text-input question-area" value={installQuestion} onChange={e=>{setInstallQuestion(e.target.value);setInstallAsked(false)}} placeholder="Ví dụ: Tôi muốn lắp máy lạnh tại phòng ngủ, cần chuẩn bị những gì?"/><button className="btn primary top-gap" disabled={!installQuestion.trim()} onClick={()=>setInstallAsked(true)}><Sparkles size={17}/> Nhận hướng dẫn</button></div>{installAsked&&<div className="panel result"><span className="pill amber">Checklist mô phỏng · Chưa phân tích ảnh bằng AI</span><h2>Hướng dẫn chuẩn bị lắp đặt</h2><p><b>Câu hỏi:</b> {installQuestion}</p><ol className="safe-list"><li>Xác minh loại thiết bị, model, tài liệu của hãng và điều kiện bảo hành.</li><li>Khảo sát vị trí lắp, khoảng thông gió, lối thoát nước và nguồn điện phù hợp.</li><li>Chuẩn bị danh sách vật tư theo tài liệu nhà sản xuất; chưa xác định thông số chỉ từ ảnh.</li><li>Đề nghị kỹ thuật viên đủ chuyên môn thực hiện khoan lắp, đấu nối điện và các công việc liên quan môi chất lạnh.</li><li>Kiểm tra vận hành, an toàn điện, độ kín và bàn giao hướng dẫn sử dụng.</li></ol><p className="muted">Ứng dụng chưa đọc được nội dung ảnh. Khi tích hợp AI thị giác, câu trả lời sẽ dựa trên ảnh, model và tài liệu kỹ thuật đã kiểm chứng.</p><button className="btn secondary" onClick={()=>record('Hướng dẫn lắp đặt',installQuestion)}><Save size={17}/> Lưu yêu cầu</button></div>}</>;

  case 'diagnose':return <DiagnosisScreen key={authUser?.id} userId={authUser?.id??''} initialData={pendingAction?.feature==='diagnosis'?pendingAction.payload:undefined} onBack={()=>go(pendingAction?.feature==='diagnosis'?'chat':'home')} onAction={openAIAction}/>;

 case 'history':return <>{heading('Lịch sử hoạt động','Cuộc trò chuyện máy chủ và dữ liệu cục bộ.')}<div className="panel"><h2>Lịch sử trò chuyện AI</h2><button className="btn secondary" disabled={syncing} onClick={()=>{if(userId)void refreshChats(userId)}}>Tải lại từ máy chủ</button>{syncing&&<p>Đang đồng bộ...</p>}{conversations.length?conversations.map(c=><div className="history-item" key={c.id}><div className="history-icon"><MessageCircle size={20}/></div><div><strong>{c.title}</strong><p>{c.messages.filter(m=>m.role==='user').length} câu hỏi</p><small>{new Date(c.updatedAt).toLocaleString('vi-VN')}</small></div><button className="btn secondary" onClick={()=>{setActiveChat(c);go('chat')}}>Mở</button><button className="icon-button" title="Xóa cuộc trò chuyện" disabled={syncing} onClick={()=>void deleteChat(c)}><Trash2 size={18}/></button></div>):<p>Chưa có cuộc trò chuyện.</p>}<button className="btn primary top-gap" onClick={()=>{setActiveChat(createAIConversation());go('chat')}}><Plus size={17}/> Cuộc trò chuyện mới</button></div><div className="panel">{saved.length?<>{saved.map(s=><div className="history-item" key={s.id}><div className="history-icon"><ClipboardList size={20}/></div><div><strong>{s.title}</strong><p>{s.detail}</p><small>{s.date}</small></div><button className="icon-button right" title="Xóa" onClick={()=>setSaved(p=>p.filter(x=>x.id!==s.id))}><Trash2 size={18}/></button></div>)}<button className="btn secondary top-gap" onClick={()=>{if(confirm('Xóa toàn bộ lịch sử đã lưu?'))setSaved([])}}><Trash2 size={17}/> Xóa lịch sử</button></>:<div className="empty"><History size={34}/><h3>Chưa có lịch sử</h3><p>Hãy lưu một dự toán hoặc chẩn đoán để xem lại ở đây.</p><button className="btn primary" onClick={()=>go('chat')}>Bắt đầu hỏi AI</button></div>}</div></>;

  case 'account':return <>{heading('Tài khoản','Cập nhật hồ sơ và xem hoạt động của bạn trên thiết bị hiện tại.')}<div className="panel account"><div className="account-avatar"><UserRound size={35}/></div><h2>{profile.name||'Khách trải nghiệm'}</h2><p>Tài khoản: {authUser?.email} · {authUser?.role}</p><div className="account-stats"><div><strong>{saved.length}</strong><span>Mục đã lưu</span></div><div><strong>{conversations.reduce((n,c)=>n+c.messages.filter(m=>m.role==='user').length,0)}</strong><span>Câu hỏi AI Chat</span></div><div><strong>{issueMessages.filter(m=>m.role==='user').length}</strong><span>Câu hỏi chẩn đoán</span></div></div><div className="profile-form">{([['name','Họ và tên'],['email','Email'],['phone','Số điện thoại'],['address','Địa chỉ']] as const).map(([key,label])=><label key={key}><span className="field-label">{label}</span><input className="text-input" type={key==='email'?'email':'text'} value={profile[key]} readOnly={key==='email'} disabled={savingProfile} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))} placeholder={'Nhập '+label.toLowerCase()}/></label>)}</div><button className="btn primary top-gap" onClick={saveProfile} disabled={savingProfile}><Save size={17}/> Lưu thông tin</button><button className="btn secondary top-gap" onClick={logout} disabled={savingProfile}>Đăng xuất</button><div className="hint top-gap"><ShieldCheck size={19}/> Hồ sơ đồng bộ qua Backend. Lịch sử AI và dự toán vẫn lưu riêng trên trình duyệt.</div></div></>;

 case 'more':return <>{heading('Tất cả chức năng','Chọn tính năng bạn muốn trải nghiệm.')}<div className="features">{allNav.map(({id,icon:Icon})=><button className="feature" key={id} onClick={()=>{setPendingAction(null);go(id)}}><span className="feature-icon"><Icon size={23}/></span><strong>{pageNames[id]}</strong><small>Mở chức năng</small><ArrowRight size={17} className="feature-arrow"/></button>)}</div></>;

 }};

 if(!authReady)return <div className="auth-page"><div className="auth-card">Đang tải SmartCool AI…</div></div>;
 if(restoreError)return <div className="auth-page"><div className="auth-card"><p role="alert">{restoreError}</p><button className="btn primary" onClick={restore}>Thử lại</button><button className="btn secondary" onClick={async()=>{await authStorage.clearTokens();setRestoreError('');}}>Đăng nhập lại</button></div></div>;
 if(!authUser)return <AuthScreen onLogin={login}/>;

 return <div className="app"><input ref={fileRef} type="file" accept="image/*" hidden onChange={imageUpload}/><aside className={'sidebar '+(menu?'open':'')}><div className="brand"><div className="brand-icon"><Snowflake size={27}/></div><div><strong>SmartCool <span>AI</span></strong><small>Trợ lý ngành điện lạnh</small></div><button className="mobile-close" onClick={()=>setMenu(false)}><X size={20}/></button></div><div className="side-label">KHÁM PHÁ</div><div className="side-links">{allNav.map(({id,icon:Icon})=><button key={id} className={'side-link '+(page===id?'selected':'')} onClick={()=>{setPendingAction(null);go(id)}}><Icon size={19}/>{pageNames[id]}{id==='chat'&&<span className="side-ai">AI</span>}</button>)}</div><div className="side-note"><ShieldCheck size={23}/><strong>Trợ lý luôn bên bạn</strong><small>Khám phá thiết bị, lựa chọn thông minh, vận hành an toàn.</small></div></aside>{menu&&<div className="scrim" onClick={()=>setMenu(false)}/>}<div className="main"><header className="topbar"><button className="menu-toggle" onClick={()=>setMenu(true)}><Menu size={22}/></button><div className="breadcrumb">Không gian làm việc <span>/</span> <strong>{pageNames[page]}</strong></div><div className="top-actions"><span className="demo-status"><span/> Chế độ trải nghiệm</span><button className="profile" onClick={()=>go('account')} title="Tài khoản"><UserRound size={20}/></button></div></header><main className="content">{content()}</main><footer className="footer">SmartCool AI v1.0 · Đồ án điện lạnh · Dữ liệu và giá minh họa · Không phải dịch vụ bán hàng</footer></div><nav className="bottom-nav">{nav.map(({id,icon:Icon,label})=><button className={page===id?'active':''} key={id} onClick={()=>{setPendingAction(null);go(id)}}><Icon size={21}/><span>{label}</span></button>)}</nav>{toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}</div>

}

export default App;
