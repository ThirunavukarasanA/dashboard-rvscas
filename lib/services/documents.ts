import { type Document, type Filter } from "mongodb";
import type { DatabaseRole } from "@/config/db-registry";
import { getCollection } from "@/lib/mongodb/getCollection";
import type { DataQuery } from "@/lib/validators/query";

const SEARCH_FIELDS = [
  "name",
  "email",
  "phone",
  "mobile",
  "course",
  "status",
  "source",
  "campaign",
  "message",
  "city",
  "state",
];
const EXPORT_LIMIT = 5000;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function startOfDay(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);

  return date;
}

function endOfDay(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(23, 59, 59, 999);

  return date;
}

function dateStringExpression(field: string, format?: string) {
  return {
    $dateFromString: {
      dateString: `$${field}`,
      ...(format ? { format } : {}),
      onError: null,
      onNull: null,
    },
  };
}

function dateExprRange(dateValue: Record<string, unknown>, from?: Date | null, to?: Date | null) {
  const parts: Document[] = [];

  if (from) {
    parts.push({ $gte: [dateValue, from] });
  }

  if (to) {
    parts.push({ $lte: [dateValue, to] });
  }

  return parts.length === 1 ? parts[0] : { $and: parts };
}

function buildFilter(query: DataQuery) {
  const clauses: Filter<Document>[] = [];

  if (query.search) {
    const regex = { $regex: escapeRegex(query.search), $options: "i" };
    clauses.push({
      $or: SEARCH_FIELDS.map((field) => ({ [field]: regex })),
    });
  }

  if (query.field && query.value) {
    clauses.push({ [query.field]: { $regex: `^${escapeRegex(query.value)}$`, $options: "i" } });
  }

  if (query.dateFrom || query.dateTo) {
    const dateField = query.dateField || "createdat";
    const from = query.dateFrom ? startOfDay(query.dateFrom) : null;
    const to = query.dateTo ? endOfDay(query.dateTo) : null;

    if (from || to) {
      const dateFilter: Record<string, Date> = {};

      if (from) {
        dateFilter.$gte = from;
      }

      if (to) {
        dateFilter.$lte = to;
      }

      clauses.push({
        $or: [
          { [dateField]: dateFilter },
          { $expr: dateExprRange(dateStringExpression(dateField), from, to) },
          { $expr: dateExprRange(dateStringExpression(dateField, "%d/%m/%Y %H:%M:%S"), from, to) },
          { $expr: dateExprRange(dateStringExpression(dateField, "%d/%m/%Y"), from, to) },
        ],
      });
    }
  }

  if (clauses.length === 0) {
    return {};
  }

  if (clauses.length === 1) {
    return clauses[0];
  }

  return { $and: clauses };
}

function serializeDocuments(documents: Document[]) {
  return JSON.parse(JSON.stringify(documents)) as Record<string, unknown>[];
}

export async function listDocuments(
  dbName: string,
  collectionName: string,
  role: DatabaseRole,
  query: DataQuery,
) {
  const collection = await getCollection(dbName, collectionName, role);
  const filter = buildFilter(query);
  const skip = (query.page - 1) * query.limit;
  const sortField = query.sortBy || "_id";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const cursor = collection
    .find(filter)
    .sort({ [sortField]: sortOrder })
    .skip(skip)
    .limit(query.limit);

  const [documents, total] = await Promise.all([cursor.toArray(), collection.countDocuments(filter)]);

  return {
    documents: serializeDocuments(documents),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function listDocumentsForExport(
  dbName: string,
  collectionName: string,
  role: DatabaseRole,
  query: DataQuery,
) {
  return listDocuments(dbName, collectionName, role, {
    ...query,
    page: 1,
    limit: EXPORT_LIMIT,
  });
}
