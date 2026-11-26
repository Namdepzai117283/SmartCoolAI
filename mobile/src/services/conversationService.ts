import { apiRequest } from './apiService';
export type ConversationRole = 'USER' | 'ASSISTANT';
export interface ServerAttachment { id:string; messageId:string; type:'IMAGE'|'DOCUMENT'; fileName:string|null; fileUrl:string; mimeType:string|null; fileSize:number|null; width:number|null; height:number|null; createdAt:string; }
export interface ServerMessage { id:string; conversationId:string; role:ConversationRole|'SYSTEM'; content:string; intent:string|null; actions:unknown[]|null; metadata:Record<string,unknown>|null; isDemo:boolean; createdAt:string; attachments:ServerAttachment[]; }
export interface ServerConversation { id:string; userId:string; title:string; context:Record<string,unknown>|null; archived:boolean; createdAt:string; updatedAt:string; messages?:ServerMessage[]; _count?:{messages:number}; }
export interface CreateConversationInput { title?:string; context?:Record<string,unknown>; }
export interface UpdateConversationInput { title?:string; context?:Record<string,unknown>; archived?:boolean; }
export interface CreateMessageInput { role:ConversationRole; content:string; intent?:string; actions?:Record<string,unknown>[]; metadata?:Record<string,unknown>; }
function requireData<T>(response:{data?:T}):T { if(response.data == null) throw new Error('Backend không trả về dữ liệu.'); return response.data; }
export async function getConversations(accessToken:string):Promise<ServerConversation[]> { return requireData(await apiRequest<ServerConversation[]>('/conversations',{method:'GET',accessToken})); }
export async function createConversation(accessToken:string,input:CreateConversationInput={}):Promise<ServerConversation> { return requireData(await apiRequest<ServerConversation>('/conversations',{method:'POST',accessToken,body:{title:input.title?.trim()||'Cuộc trò chuyện mới',...(input.context!==undefined?{context:input.context}:{})}})); }
export async function getConversation(accessToken:string,conversationId:string):Promise<ServerConversation> { return requireData(await apiRequest<ServerConversation>(`/conversations/${encodeURIComponent(conversationId)}`,{method:'GET',accessToken})); }
export async function updateConversation(accessToken:string,conversationId:string,input:UpdateConversationInput):Promise<ServerConversation> { return requireData(await apiRequest<ServerConversation>(`/conversations/${encodeURIComponent(conversationId)}`,{method:'PATCH',accessToken,body:input})); }
export async function renameConversation(accessToken:string,conversationId:string,title:string):Promise<ServerConversation> { const newTitle=title.trim(); if(!newTitle) throw new Error('Tên cuộc trò chuyện không được để trống.'); return updateConversation(accessToken,conversationId,{title:newTitle}); }
export async function archiveConversation(accessToken:string,conversationId:string):Promise<ServerConversation> { return updateConversation(accessToken,conversationId,{archived:true}); }
export async function deleteConversation(accessToken:string,conversationId:string):Promise<void> { await apiRequest<{deleted:boolean}>(`/conversations/${encodeURIComponent(conversationId)}`,{method:'DELETE',accessToken}); }
export async function addMessage(accessToken:string,conversationId:string,input:CreateMessageInput):Promise<ServerMessage> { const content=input.content.trim(); if(!content) throw new Error('Nội dung tin nhắn không được để trống.'); return requireData(await apiRequest<ServerMessage>(`/conversations/${encodeURIComponent(conversationId)}/messages`,{method:'POST',accessToken,body:{...input,content}})); }
export const conversationService={getConversations,createConversation,getConversation,updateConversation,renameConversation,archiveConversation,deleteConversation,addMessage};
export default conversationService;
