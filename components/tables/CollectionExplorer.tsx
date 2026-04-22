"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { compactValue } from "@/lib/utils/format";

type DocumentRow = Record<string, unknown>;

type ApiResponse = {
  documents: DocumentRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  error?: string;
};

function visibleColumns(rows: DocumentRow[]) {
  const columns = new Set<string>();

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => columns.add(key));
  });

  return Array.from(columns).slice(0, 12);
}

export function CollectionExplorer({
  dbName,
  collectionName,
}: {
  dbName: string;
  collectionName: string;
}) {
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [field, setField] = useState("");
  const [value, setValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState("_id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy,
      sortOrder,
    });

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }

    if (field && value) {
      params.set("field", field);
      params.set("value", value);
    }

    return params.toString();
  }, [page, limit, sortBy, sortOrder, debouncedSearch, field, value]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/data/${encodeURIComponent(dbName)}/${encodeURIComponent(collectionName)}?${queryString}`,
      );
      const data = (await response.json().catch(() => null)) as ApiResponse | null;

      if (ignore) {
        return;
      }

      setLoading(false);

      if (!response.ok || !data) {
        setError(data?.error ?? "Unable to load records");
        setRows([]);
        return;
      }

      setRows(data.documents);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    }

    load();

    return () => {
      ignore = true;
    };
  }, [dbName, collectionName, queryString]);

  const columns = useMemo(() => visibleColumns(rows), [rows]);
  const exportParams = useMemo(() => {
    const params = new URLSearchParams(queryString);
    params.set("page", "1");
    params.set("limit", "100");
    return params;
  }, [queryString]);

  function sortColumn(column: string) {
    setPage(1);
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortOrder("asc");
  }

  function exportHref(type: string) {
    const params = new URLSearchParams(exportParams);
    params.set("type", type);
    return `/api/export/${encodeURIComponent(dbName)}/${encodeURIComponent(collectionName)}?${params.toString()}`;
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 xl:grid-cols-[1.5fr_1fr_auto]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, email, phone, source, campaign"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={field}
            onChange={(event) => {
              setField(event.target.value);
              setPage(1);
            }}
            placeholder="Exact field"
          />
          <Input
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setPage(1);
            }}
            placeholder="Exact value"
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {["csv", "xlsx", "json", "pdf"].map((type) => (
            <a
              key={type}
              href={exportHref(type)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold uppercase text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-200"
            >
              {type}
            </a>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-950 dark:text-white">
              {total.toLocaleString()} records
            </p>
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-950 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
            >
              Prev
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                {columns.length > 0 ? (
                  columns.map((column) => (
                    <th key={column} className="w-48 px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <button
                        type="button"
                        className="flex max-w-full items-center gap-2 truncate text-left transition hover:text-emerald-700 dark:hover:text-emerald-200"
                        onClick={() => sortColumn(column)}
                      >
                        <span className="truncate">{column}</span>
                        {sortBy === column ? <span>{sortOrder === "asc" ? "A-Z" : "Z-A"}</span> : null}
                      </button>
                    </th>
                  ))
                ) : (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Records</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400" colSpan={Math.max(columns.length, 1)}>
                    <span className="animate-soft-pulse">Loading records</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-red-600 dark:text-red-200" colSpan={Math.max(columns.length, 1)}>
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={Math.max(columns.length, 1)}>
                    No records match the current filters.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={compactValue(row._id) || index}
                    className="border-b border-slate-200/80 transition hover:bg-emerald-50/70 dark:border-slate-800/80 dark:hover:bg-slate-950/70"
                  >
                    {columns.map((column) => (
                      <td key={column} className="w-48 px-4 py-3 align-top text-sm text-slate-700 dark:text-slate-200">
                        <div className="max-h-20 overflow-hidden break-words font-mono text-xs leading-5">
                          {compactValue(row[column])}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
