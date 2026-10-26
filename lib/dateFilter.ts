// Server-side helper: turn ?from=YYYY-MM-DD&to=YYYY-MM-DD query params
// into a Prisma where-clause for createdAt, with basic validation.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type DateFilter = {
  from: string;
  to: string;
  where: { createdAt?: { gte: Date; lte: Date } };
};

export function getDateFilter(sp: Record<string, string | string[] | undefined>): DateFilter {
  const rawFrom = typeof sp.from === "string" ? sp.from : "";
  const rawTo = typeof sp.to === "string" ? sp.to : "";
  const from = DATE_RE.test(rawFrom) ? rawFrom : "";
  const to = DATE_RE.test(rawTo) ? rawTo : "";

  const where: DateFilter["where"] = {};
  if (from || to) {
    const range: { gte?: Date; lte?: Date } = {};
    if (from) range.gte = new Date(`${from}T00:00:00`);
    if (to) range.lte = new Date(`${to}T23:59:59.999`);
    where.createdAt = range as { gte: Date; lte: Date };
  }

  return { from, to, where };
}
