import { z } from "zod";

const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

function safeField(value: string | null) {
  if (!value) {
    return undefined;
  }

  if (value.includes("$") || value.includes("[") || value.includes("]")) {
    return undefined;
  }

  return value.slice(0, 80);
}

export const dataQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(120).optional().catch(undefined),
  sortBy: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => safeField(value ?? null)),
  sortOrder: sortOrderSchema,
  field: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => safeField(value ?? null)),
  value: z.string().trim().max(160).optional().catch(undefined),
  dateField: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => safeField(value ?? null)),
  dateFrom: z.string().trim().max(30).optional().catch(undefined),
  dateTo: z.string().trim().max(30).optional().catch(undefined),
});

export type DataQuery = z.infer<typeof dataQuerySchema>;

export function parseDataQuery(searchParams: URLSearchParams) {
  return dataQuerySchema.parse(Object.fromEntries(searchParams.entries()));
}
