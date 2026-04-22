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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    const dateField = query.dateField || "createdAt";
    const dateFilter: Record<string, Date> = {};

    if (query.dateFrom) {
      dateFilter.$gte = new Date(query.dateFrom);
    }

    if (query.dateTo) {
      dateFilter.$lte = new Date(query.dateTo);
    }

    clauses.push({ [dateField]: dateFilter });
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
    limit: Math.min(query.limit || 100, 100),
  });
}
