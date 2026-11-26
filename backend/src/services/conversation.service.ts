import { prisma } from '../config/database';
import { z } from 'zod';
import type { Prisma } from '../generated/prisma/client';

export class ConversationError extends Error {
  constructor(public statusCode: number, message: string) { super(message); }
}
const uuid = z.string().uuid();
const title = z.string().trim().min(1).max(255);
const json = z.record(z.string(), z.unknown());
const createSchema = z.object({ title: title.default('Cuộc trò chuyện mới'), context: json.optional() }).strict();
const patchSchema = z.object({ title: title.optional(), context: json.optional(), archived: z.boolean().optional() }).strict().refine(v => Object.keys(v).length > 0);
const messageSchema = z.object({ role: z.enum(['USER','ASSISTANT']), content: z.string().trim().min(1).max(50000), intent: z.string().max(100).optional(), actions: z.array(json).max(50).optional(), metadata: json.optional() }).strict();
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ConversationError(400, 'Dữ liệu không hợp lệ: ' + result.error.issues.map(i => i.path.join('.') + ' ' + i.message).join('; '));
  return result.data;
}
function id(value: unknown) { return parse(uuid, value); }
function asJson(value: unknown): Prisma.InputJsonValue { return value as Prisma.InputJsonValue; }
const detail = { messages: { orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }], include: { attachments: true } } };
export const conversationService = {
  async list(userId: string) {
    return prisma.conversation.findMany({ where: { userId, archived: false }, orderBy: { updatedAt: 'desc' }, include: { _count: { select: { messages: true } } } });
  },
  async create(userId: string, body: unknown) {
    const data = parse(createSchema, body);
    return prisma.conversation.create({ data: { userId, title: data.title, ...(data.context !== undefined ? { context: asJson(data.context) } : {}) }, include: detail });
  },
  async get(userId: string, rawId: unknown) {
    const row = await prisma.conversation.findFirst({ where: { id: id(rawId), userId }, include: detail });
    if (!row) throw new ConversationError(404, 'Không tìm thấy cuộc trò chuyện.');
    return row;
  },
  async update(userId: string, rawId: unknown, body: unknown) {
    const conversationId = id(rawId);
    const data = parse(patchSchema, body);
    return prisma.$transaction(async tx => {
      const result = await tx.conversation.updateMany({ where: { id: conversationId, userId }, data: { ...(data.title !== undefined ? { title: data.title } : {}), ...(data.context !== undefined ? { context: asJson(data.context) } : {}), ...(data.archived !== undefined ? { archived: data.archived } : {}) } });
      if (!result.count) throw new ConversationError(404, 'Không tìm thấy cuộc trò chuyện.');
      return tx.conversation.findUniqueOrThrow({ where: { id: conversationId }, include: detail });
    });
  },
  async remove(userId: string, rawId: unknown) {
    const result = await prisma.conversation.deleteMany({ where: { id: id(rawId), userId } });
    if (!result.count) throw new ConversationError(404, 'Không tìm thấy cuộc trò chuyện.');
    return { deleted: true };
  },
  async addMessage(userId: string, rawId: unknown, body: unknown) {
    const conversationId = id(rawId);
    const data = parse(messageSchema, body);
    return prisma.$transaction(async tx => {
      const result = await tx.conversation.updateMany({ where: { id: conversationId, userId, archived: false }, data: { updatedAt: new Date() } });
      if (!result.count) throw new ConversationError(404, 'Không tìm thấy cuộc trò chuyện đang hoạt động.');
      return tx.message.create({ data: { conversationId, role: data.role, content: data.content, isDemo: true, ...(data.intent !== undefined ? { intent: data.intent } : {}), ...(data.actions !== undefined ? { actions: asJson(data.actions) } : {}), ...(data.metadata !== undefined ? { metadata: asJson(data.metadata) } : {}) }, include: { attachments: true } });
    });
  },
};
