import { conversationService as api, type ServerConversation } from './conversationService';
import { authStorage } from './authStorage';
import { authService } from './authService';
import { ApiError } from './apiService';
import type { AIConversation, AIMessage } from '../types/smartcool';

// Strip device-local image references, including nested AI action payloads.
function clean(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value, (key, v) => {
    if (['imageUri','attachments','imageUrls'].includes(key)) return undefined;
    if (typeof v === 'string' && /^(data:|blob:|file:|content:)/i.test(v)) return undefined;
    return v;
  })) as Record<string, unknown>;
}
async function authorized<T>(userId: string, run: (token: string)=>Promise<T>): Promise<T> {
  const tokens = await authStorage.getTokens();
  if (!tokens) throw new Error('Vui lòng đăng nhập lại.');
  const user = await authService.getCurrentUser(tokens.accessToken).catch(async e => {
    if (!(e instanceof ApiError) || e.statusCode !== 401) throw e;
    const session = await authService.refresh(tokens.refreshToken);
    if (session.user.id !== userId) throw new Error('Tài khoản đã thay đổi.');
    const current = await authStorage.getTokens();
    if (current?.refreshToken !== tokens.refreshToken) throw new Error('Phiên đăng nhập đã thay đổi.');
    await authStorage.saveTokens(session.accessToken, session.refreshToken);
    return session.user;
  });
  if (user.id !== userId) throw new Error('Tài khoản đã thay đổi.');
  const current = await authStorage.getTokens();
  if (!current) throw new Error('Vui lòng đăng nhập lại.');
  return run(current.accessToken);
}
function fromServer(row: ServerConversation): AIConversation {
  const context = row.context ?? {};
  const snapshot = (context.snapshot ?? {}) as Partial<AIConversation>;
  return { ...snapshot, id: typeof context.clientConversationId === 'string' ? context.clientConversationId : row.id,
    title: row.title, createdAt: Date.parse(row.createdAt), updatedAt: Date.parse(row.updatedAt),
    messages: (row.messages ?? []).filter(m=>m.role !== 'SYSTEM').map(m=>({
      ...((m.metadata?.snapshot ?? {}) as Partial<AIMessage>),
      id: typeof m.metadata?.clientMessageId === 'string' ? m.metadata.clientMessageId : m.id,
      role: m.role === 'USER' ? 'user' : 'assistant', content: m.content,
      createdAt: Date.parse(m.createdAt), isDemo: m.isDemo,
      actions: (m.actions ?? undefined) as AIMessage['actions'], intent: (m.intent ?? undefined) as AIMessage['intent'],
    })) };
}
function matches(row: ServerConversation, id: string) { return row.id === id || row.context?.clientConversationId === id; }
export async function loadServerChats(userId: string) {
  return authorized(userId, async token => {
    const rows = await api.getConversations(token);
    return Promise.all(rows.map(async row=>fromServer(await api.getConversation(token,row.id))));
  });
}
export async function syncChat(userId: string, chat: AIConversation) {
  return authorized(userId, async token => {
    const rows = await api.getConversations(token);
    const existing = rows.find(row=>matches(row,chat.id));
    const {messages, ...snapshot} = chat;
    const context = clean({clientConversationId:chat.id,snapshot});
    const row = existing ? await api.getConversation(token,existing.id) : await api.createConversation(token,{title:chat.title.slice(0,255),context});
    const ids = new Set((row.messages??[]).flatMap(m=>[m.id,m.metadata?.clientMessageId]));
    for (const message of messages) {
      if (ids.has(message.id)) continue;
      await api.addMessage(token,row.id,{role:message.role==='user'?'USER':'ASSISTANT',content:message.content.trim() || '[Hình ảnh lưu trên thiết bị]',
        ...(message.intent ? {intent:message.intent}:{}),
        ...(message.actions ? {actions:message.actions.map(clean)}:{}),
        metadata:clean({clientMessageId:message.id,snapshot:message})});
    }
    await api.updateConversation(token,row.id,{title:chat.title.slice(0,255),context});
  });
}
export async function removeServerChat(userId:string,id:string) {
  return authorized(userId,async token=>{
    const rows=await api.getConversations(token);
    const row=rows.find(r=>matches(r,id));
    if(row) await api.deleteConversation(token,row.id);
  });
}
