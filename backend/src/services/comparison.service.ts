import { prisma } from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { AppError, pageResult, paginate, parseId, parseInput } from '../utils/http';
import { serializeProduct } from './product.service';
import { comparisonCreateSchema, comparisonQuerySchema } from '../validators/estimate.validator';

const productInclude = { include: { brand: { select: { id: true, name: true, slug: true } } } } as const;
const detailInclude = { firstProduct: productInclude, secondProduct: productInclude } as const;

type ProductRow = Prisma.ProductGetPayload<typeof productInclude>;

const RATING_SCORE: Record<string, number> = { '5 sao': 5, '4 sao': 4, '3 sao': 3, '2 sao': 2, '1 sao': 1 };

// So sánh từng tiêu chí, trả về bên thắng: 'first' | 'second' | 'tie'
function compareProducts(a: ProductRow, b: ProductRow, priority: string) {
  const pick = (x: number | null | undefined, y: number | null | undefined, higherBetter: boolean) => {
    if (x == null || y == null || x === y) return 'tie';
    return (higherBetter ? x > y : x < y) ? 'first' : 'second';
  };
  const criteria = [
    { key: 'price', label: 'Giá bán', first: Number(a.price), second: Number(b.price), winner: pick(Number(a.price), Number(b.price), false) },
    { key: 'power', label: 'Điện năng tiêu thụ (kW)', first: a.powerConsumption, second: b.powerConsumption, winner: pick(a.powerConsumption, b.powerConsumption, false) },
    { key: 'energy', label: 'Nhãn năng lượng', first: a.energyRating, second: b.energyRating, winner: pick(RATING_SCORE[a.energyRating ?? ''], RATING_SCORE[b.energyRating ?? ''], true) },
    { key: 'inverter', label: 'Công nghệ Inverter', first: a.inverter, second: b.inverter, winner: a.inverter === b.inverter ? 'tie' : a.inverter ? 'first' : 'second' },
    { key: 'warranty', label: 'Bảo hành (tháng)', first: a.warrantyMonths, second: b.warrantyMonths, winner: pick(a.warrantyMonths, b.warrantyMonths, true) },
    { key: 'features', label: 'Số tính năng', first: a.features.length, second: b.features.length, winner: pick(a.features.length, b.features.length, true) },
  ];

  const weight: Record<string, number> = { price: 1, power: 1, energy: 1, inverter: 1, warranty: 1, features: 0.5 };
  if (priority === 'price') weight.price = 3;
  if (priority === 'energy') { weight.power = 2; weight.energy = 2; weight.inverter = 2; }
  if (priority === 'warranty') weight.warranty = 3;

  let firstScore = 0;
  let secondScore = 0;
  for (const c of criteria) {
    if (c.winner === 'first') firstScore += weight[c.key] ?? 1;
    if (c.winner === 'second') secondScore += weight[c.key] ?? 1;
  }
  const winner = firstScore === secondScore ? 'tie' : firstScore > secondScore ? 'first' : 'second';
  return { criteria, score: { first: firstScore, second: secondScore }, winner };
}

function serialize(row: Prisma.ComparisonGetPayload<{ include: typeof detailInclude }>) {
  return { ...row, firstProduct: serializeProduct(row.firstProduct), secondProduct: serializeProduct(row.secondProduct) };
}

export const comparisonService = {
  async list(userId: string, rawQuery: unknown) {
    const query = parseInput(comparisonQuerySchema, rawQuery);
    const where = { userId };
    const [items, total] = await prisma.$transaction([
      prisma.comparison.findMany({ where, orderBy: { createdAt: 'desc' }, include: detailInclude, ...paginate(query.page, query.limit) }),
      prisma.comparison.count({ where }),
    ]);
    return pageResult(items.map(serialize), total, query.page, query.limit);
  },

  async get(userId: string, rawId: unknown) {
    const row = await prisma.comparison.findFirst({ where: { id: parseId(rawId), userId }, include: detailInclude });
    if (!row) throw new AppError(404, 'Không tìm thấy lần so sánh.');
    return serialize(row);
  },

  async create(userId: string, body: unknown) {
    const data = parseInput(comparisonCreateSchema, body);
    const [a, b] = await Promise.all([
      prisma.product.findFirst({ where: { id: data.firstProductId, isActive: true }, ...productInclude }),
      prisma.product.findFirst({ where: { id: data.secondProductId, isActive: true }, ...productInclude }),
    ]);
    if (!a || !b) throw new AppError(400, 'Sản phẩm cần so sánh không tồn tại.');
    if (a.deviceType !== b.deviceType) throw new AppError(400, 'Chỉ so sánh được hai sản phẩm cùng loại thiết bị.');

    const priority = data.userNeeds?.priority ?? 'balanced';
    const result = compareProducts(a, b, priority);
    const winnerName = result.winner === 'first' ? a.name : result.winner === 'second' ? b.name : null;
    const conclusion = winnerName
      ? `Với ưu tiên "${priority}", ${winnerName} phù hợp hơn (điểm ${result.score.first} - ${result.score.second}).`
      : `Hai sản phẩm ngang nhau (điểm ${result.score.first} - ${result.score.second}), hãy chọn theo thương hiệu bạn tin dùng.`;

    if (data.conversationId) {
      const own = await prisma.conversation.count({ where: { id: data.conversationId, userId } });
      if (!own) throw new AppError(400, 'conversationId không thuộc tài khoản của bạn.');
    }

    const row = await prisma.comparison.create({
      data: {
        userId,
        conversationId: data.conversationId ?? null,
        firstProductId: a.id,
        secondProductId: b.id,
        title: data.title ?? `${a.brand.name} ${a.model} vs ${b.brand.name} ${b.model}`,
        userNeeds: (data.userNeeds ?? {}) as Prisma.InputJsonValue,
        criteria: result.criteria as unknown as Prisma.InputJsonValue,
        result: { score: result.score, winner: result.winner } as Prisma.InputJsonValue,
        conclusion,
      },
      include: detailInclude,
    });
    return serialize(row);
  },

  async remove(userId: string, rawId: unknown) {
    const result = await prisma.comparison.deleteMany({ where: { id: parseId(rawId), userId } });
    if (!result.count) throw new AppError(404, 'Không tìm thấy lần so sánh.');
    return { deleted: true };
  },
};
