import { prisma } from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { AppError, pageResult, paginate, parseId, parseInput } from '../utils/http';
import { analyzeDiagnosis } from './diagnosis.rules';
import { diagnosisCreateSchema, diagnosisQuerySchema, diagnosisUpdateSchema } from '../validators/diagnosis.validator';

function serialize<T extends { estimatedMinCost: unknown; estimatedMaxCost: unknown }>(row: T) {
  return {
    ...row,
    estimatedMinCost: row.estimatedMinCost == null ? null : Number(row.estimatedMinCost),
    estimatedMaxCost: row.estimatedMaxCost == null ? null : Number(row.estimatedMaxCost),
  };
}

async function ensureOwnConversation(userId: string, conversationId?: string | null) {
  if (!conversationId) return;
  const found = await prisma.conversation.count({ where: { id: conversationId, userId } });
  if (!found) throw new AppError(400, 'conversationId không thuộc tài khoản của bạn.');
}

async function findOwn(userId: string, rawId: unknown) {
  const row = await prisma.diagnosis.findFirst({ where: { id: parseId(rawId), userId } });
  if (!row) throw new AppError(404, 'Không tìm thấy phiếu chẩn đoán.');
  return row;
}

export const diagnosisService = {
  // READ: lịch sử chẩn đoán của chính người dùng
  async list(userId: string, rawQuery: unknown) {
    const query = parseInput(diagnosisQuerySchema, rawQuery);
    const where: Prisma.DiagnosisWhereInput = {
      userId,
      ...(query.deviceType ? { deviceType: query.deviceType } : {}),
      ...(query.riskLevel ? { riskLevel: query.riskLevel } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.diagnosis.findMany({ where, orderBy: { createdAt: 'desc' }, ...paginate(query.page, query.limit) }),
      prisma.diagnosis.count({ where }),
    ]);
    return pageResult(items.map(serialize), total, query.page, query.limit);
  },

  async get(userId: string, rawId: unknown) {
    return serialize(await findOwn(userId, rawId));
  },

  // CREATE: server tự phân tích triệu chứng → nguyên nhân, mức độ rủi ro, chi phí
  async create(userId: string, body: unknown) {
    const data = parseInput(diagnosisCreateSchema, body);
    await ensureOwnConversation(userId, data.conversationId);
    const analysis = analyzeDiagnosis(data);

    const row = await prisma.diagnosis.create({
      data: {
        userId,
        deviceType: data.deviceType,
        brand: data.brand ?? null,
        model: data.model ?? null,
        errorCode: data.errorCode?.toUpperCase() ?? null,
        description: data.description ?? null,
        symptoms: data.symptoms ?? [],
        conversationId: data.conversationId ?? null,
        possibleCauses: data.possibleCauses ?? analysis.possibleCauses,
        recommendedActions: data.recommendedActions ?? analysis.recommendedActions,
        safetyWarnings: data.safetyWarnings ?? analysis.safetyWarnings,
        riskLevel: data.riskLevel ?? analysis.riskLevel,
        requiresTechnician: data.requiresTechnician ?? analysis.requiresTechnician,
        estimatedMinCost: data.estimatedMinCost ?? analysis.estimatedMinCost,
        estimatedMaxCost: data.estimatedMaxCost ?? analysis.estimatedMaxCost,
        imageUrls: data.imageUrls ?? [],
        isDemo: false,
      },
    });
    return { ...serialize(row), matchedRules: analysis.matchedRules };
  },

  // UPDATE: sửa thông tin; reanalyze=true thì chạy lại bộ luật
  async update(userId: string, rawId: unknown, body: unknown) {
    const current = await findOwn(userId, rawId);
    const { reanalyze, ...data } = parseInput(diagnosisUpdateSchema, body);

    const merged = {
      deviceType: current.deviceType,
      description: data.description !== undefined ? data.description : current.description,
      symptoms: data.symptoms ?? current.symptoms,
      errorCode: data.errorCode !== undefined ? data.errorCode : current.errorCode,
    };
    const analysis = reanalyze ? analyzeDiagnosis(merged) : null;

    const row = await prisma.diagnosis.update({
      where: { id: current.id },
      data: {
        ...data,
        ...(data.errorCode ? { errorCode: data.errorCode.toUpperCase() } : {}),
        ...(analysis
          ? {
              possibleCauses: data.possibleCauses ?? analysis.possibleCauses,
              recommendedActions: data.recommendedActions ?? analysis.recommendedActions,
              safetyWarnings: data.safetyWarnings ?? analysis.safetyWarnings,
              riskLevel: data.riskLevel ?? analysis.riskLevel,
              requiresTechnician: data.requiresTechnician ?? analysis.requiresTechnician,
              estimatedMinCost: data.estimatedMinCost ?? analysis.estimatedMinCost,
              estimatedMaxCost: data.estimatedMaxCost ?? analysis.estimatedMaxCost,
            }
          : {}),
      },
    });
    return serialize(row);
  },

  // DELETE
  async remove(userId: string, rawId: unknown) {
    const row = await findOwn(userId, rawId);
    await prisma.diagnosis.delete({ where: { id: row.id } });
    return { deleted: true };
  },

  // Phân tích thử, không lưu DB (POST /api/diagnoses/analyze)
  preview(body: unknown) {
    const data = parseInput(diagnosisCreateSchema, body);
    return analyzeDiagnosis(data);
  },
};
