import { prisma } from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { AppError, pageResult, paginate, parseId, parseInput } from '../utils/http';
import { slugify } from './brand.service';
import { articleCreateSchema, articleQuerySchema, articleUpdateSchema, progressSchema } from '../validators/article.validator';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function findPublished(idOrSlug: string, includeDraft: boolean) {
  const where = UUID_PATTERN.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
  const article = await prisma.knowledgeArticle.findUnique({ where });
  if (!article || (!article.isPublished && !includeDraft)) throw new AppError(404, 'Không tìm thấy bài viết.');
  return article;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export const articleService = {
  // READ: danh sách bài viết (khách chỉ thấy bài đã xuất bản)
  async list(rawQuery: unknown, includeDraft: boolean) {
    const query = parseInput(articleQuerySchema, rawQuery);
    const where: Prisma.KnowledgeArticleWhereInput = {
      ...(includeDraft ? {} : { isPublished: true }),
      ...(query.category ? { category: query.category } : {}),
      ...(query.guide !== undefined ? { isGuide: query.guide } : {}),
      ...(query.tag ? { tags: { has: query.tag } } : {}),
      ...(query.q
        ? { OR: [
            { title: { contains: query.q, mode: 'insensitive' } },
            { summary: { contains: query.q, mode: 'insensitive' } },
          ] }
        : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.knowledgeArticle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        // Danh sách không trả content dài để nhẹ mạng.
        omit: { content: true },
        ...paginate(query.page, query.limit),
      }),
      prisma.knowledgeArticle.count({ where }),
    ]);
    return pageResult(items, total, query.page, query.limit);
  },

  async get(idOrSlug: string, includeDraft: boolean) {
    return findPublished(idOrSlug, includeDraft);
  },

  // CREATE (ADMIN)
  async create(body: unknown) {
    const data = parseInput(articleCreateSchema, body);
    const { steps, ...rest } = data;
    return prisma.knowledgeArticle.create({
      data: { ...rest, slug: data.slug ?? slugify(data.title), ...(steps ? { steps: asJson(steps) } : {}) },
    });
  },

  // UPDATE (ADMIN)
  async update(rawId: unknown, body: unknown) {
    const id = parseId(rawId);
    const data = parseInput(articleUpdateSchema, body);
    const { steps, ...rest } = data;
    return prisma.knowledgeArticle.update({ where: { id }, data: { ...rest, ...(steps ? { steps: asJson(steps) } : {}) } });
  },

  // DELETE (ADMIN): xóa hẳn, favorites/progress bị xóa theo (onDelete: Cascade)
  async remove(rawId: unknown) {
    await prisma.knowledgeArticle.delete({ where: { id: parseId(rawId) } });
    return { deleted: true };
  },

  // ===== YÊU THÍCH =====
  async listFavorites(userId: string) {
    const rows = await prisma.articleFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { article: { omit: { content: true } } },
    });
    return rows.map((row) => ({ favoritedAt: row.createdAt, ...row.article }));
  },

  async addFavorite(userId: string, rawId: unknown) {
    const articleId = parseId(rawId);
    await findPublished(articleId, false);
    await prisma.articleFavorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {},
    });
    return { favorite: true };
  },

  async removeFavorite(userId: string, rawId: unknown) {
    const articleId = parseId(rawId);
    await prisma.articleFavorite.deleteMany({ where: { userId, articleId } });
    return { favorite: false };
  },

  // ===== TIẾN ĐỘ HƯỚNG DẪN =====
  async saveProgress(userId: string, rawId: unknown, body: unknown) {
    const articleId = parseId(rawId);
    const article = await findPublished(articleId, false);
    if (!article.isGuide) throw new AppError(400, 'Bài viết này không phải hướng dẫn từng bước.');

    const steps = Array.isArray(article.steps) ? (article.steps as Array<{ id?: string }>) : [];
    const validIds = new Set(steps.map((s) => s.id).filter(Boolean) as string[]);
    const { completedSteps } = parseInput(progressSchema, body);
    const done = [...new Set(completedSteps)].filter((id) => validIds.has(id));

    const totalSteps = validIds.size;
    const progress = totalSteps ? Math.round((done.length / totalSteps) * 100) : 0;
    const isCompleted = totalSteps > 0 && done.length === totalSteps;

    const data = { completedSteps: done, totalSteps, progress, isCompleted, completedAt: isCompleted ? new Date() : null };
    return prisma.guideProgress.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId, ...data },
      update: data,
    });
  },

  async listProgress(userId: string) {
    return prisma.guideProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { article: { select: { id: true, title: true, slug: true, category: true } } },
    });
  },
};
