"use client";

import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import { FaClone, FaPenToSquare, FaTrash } from "react-icons/fa6";
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

type AdmissionYearEditForm = {
  id: string;
  year: string;
  fromdate: string;
  todate: string;
};

const ADMISSIONS_TAIL_COLUMNS = new Set(["instid", "deptid", "programmeid"]);

function shouldMoveAdmissionsIdsToEnd(dbName: string, collectionName: string) {
  return dbName === "online-admission" && collectionName === "admissions";
}

function reorderColumnsForCollection(columns: string[], dbName: string, collectionName: string) {
  if (!shouldMoveAdmissionsIdsToEnd(dbName, collectionName)) {
    return columns;
  }

  const front: string[] = [];
  const tail: string[] = [];

  for (const column of columns) {
    if (ADMISSIONS_TAIL_COLUMNS.has(column)) {
      tail.push(column);
      continue;
    }

    front.push(column);
  }

  return [...front, ...tail];
}

function visibleColumns(rows: DocumentRow[], dbName: string, collectionName: string) {
  const columns = new Set<string>();

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => columns.add(key));
  });

  const visible = Array.from(columns).slice(0, 12);

  return reorderColumnsForCollection(visible, dbName, collectionName);
}

function isAdmissionYearsCollection(dbName: string, collectionName: string) {
  return dbName === "online-admission" && collectionName === "admissionyears";
}

function extractDocumentId(value: unknown) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "$oid" in value) {
    return String((value as { $oid: unknown }).$oid ?? "");
  }

  return "";
}

function formatDateParam(date: Date | null) {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
  const [dateField, setDateField] = useState("createdat");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState("_id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionRowId, setActionRowId] = useState("");
  const [editForm, setEditForm] = useState<AdmissionYearEditForm | null>(null);
  const [cloneForm, setCloneForm] = useState<AdmissionYearEditForm | null>(null);

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

    const formattedDateFrom = formatDateParam(dateFrom);
    const formattedDateTo = formatDateParam(dateTo);

    if (formattedDateFrom || formattedDateTo) {
      params.set("dateField", dateField || "createdat");
    }

    if (formattedDateFrom) {
      params.set("dateFrom", formattedDateFrom);
    }

    if (formattedDateTo) {
      params.set("dateTo", formattedDateTo);
    }

    return params.toString();
  }, [page, limit, sortBy, sortOrder, debouncedSearch, field, value, dateField, dateFrom, dateTo]);

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
  }, [dbName, collectionName, queryString, refreshKey]);

  const columns = useMemo(
    () => visibleColumns(rows, dbName, collectionName),
    [rows, dbName, collectionName],
  );
  const canManageAdmissionYears = useMemo(
    () => isAdmissionYearsCollection(dbName, collectionName),
    [dbName, collectionName],
  );
  const tableColumnCount = Math.max(columns.length + (canManageAdmissionYears ? 1 : 0), 1);
  const exportParams = useMemo(() => {
    const params = new URLSearchParams(queryString);
    params.set("page", "1");
    params.delete("limit");
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

  function openEdit(row: DocumentRow) {
    const documentId = extractDocumentId(row._id);

    if (!documentId) {
      setError("Unable to identify this document for editing.");
      return;
    }

    setEditForm({
      id: documentId,
      year: compactValue(row.year),
      fromdate: compactValue(row.fromdate),
      todate: compactValue(row.todate),
    });
  }

  function openClone(row: DocumentRow) {
    const documentId = extractDocumentId(row._id);

    if (!documentId) {
      setError("Unable to identify this document for cloning.");
      return;
    }

    setCloneForm({
      id: documentId,
      year: compactValue(row.year),
      fromdate: compactValue(row.fromdate),
      todate: compactValue(row.todate),
    });
  }

  async function saveClone() {
    if (!cloneForm) {
      return;
    }

    const payload: Record<string, unknown> = {
      fromdate: cloneForm.fromdate.trim(),
      todate: cloneForm.todate.trim(),
    };
    const trimmedYear = cloneForm.year.trim();
    const numericYear = Number(trimmedYear);

    payload.year = Number.isFinite(numericYear) ? numericYear : trimmedYear;
    setActionRowId(cloneForm.id);
    setError("");

    try {
      const response = await fetch(
        `/api/data/${encodeURIComponent(dbName)}/${encodeURIComponent(collectionName)}/${encodeURIComponent(cloneForm.id)}/clone`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "Unable to clone this record.");
        return;
      }

      setCloneForm(null);
      setRefreshKey((current) => current + 1);
    } catch {
      setError("Unable to clone this record right now.");
    } finally {
      setActionRowId("");
    }
  }

  async function deleteRow(row: DocumentRow) {
    const documentId = extractDocumentId(row._id);

    if (!documentId) {
      setError("Unable to identify this document for deleting.");
      return;
    }

    const confirmed = window.confirm("Delete this admission year record?");

    if (!confirmed) {
      return;
    }

    setActionRowId(documentId);
    setError("");

    try {
      const response = await fetch(
        `/api/data/${encodeURIComponent(dbName)}/${encodeURIComponent(collectionName)}/${encodeURIComponent(documentId)}`,
        { method: "DELETE" },
      );
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "Unable to delete this record.");
        return;
      }

      setRefreshKey((current) => current + 1);
    } catch {
      setError("Unable to delete this record right now.");
    } finally {
      setActionRowId("");
    }
  }

  async function saveEdit() {
    if (!editForm) {
      return;
    }

    const updates: Record<string, unknown> = {
      fromdate: editForm.fromdate.trim(),
      todate: editForm.todate.trim(),
    };
    const trimmedYear = editForm.year.trim();
    const numericYear = Number(trimmedYear);

    updates.year = Number.isFinite(numericYear) ? numericYear : trimmedYear;
    setActionRowId(editForm.id);
    setError("");

    try {
      const response = await fetch(
        `/api/data/${encodeURIComponent(dbName)}/${encodeURIComponent(collectionName)}/${encodeURIComponent(editForm.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        },
      );
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "Unable to update this record.");
        return;
      }

      setEditForm(null);
      setRefreshKey((current) => current + 1);
    } catch {
      setError("Unable to update this record right now.");
    } finally {
      setActionRowId("");
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 2xl:grid-cols-[1.2fr_0.9fr_1.1fr_auto]">
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
        <div className="grid gap-3 sm:grid-cols-[1fr_150px_150px]">
          <Input
            list="date-field-suggestions"
            value={dateField}
            onChange={(event) => {
              setDateField(event.target.value);
              setPage(1);
            }}
            placeholder="Date field"
          />
          <datalist id="date-field-suggestions">
            <option value="createdat" />
            <option value="createdAt" />
            <option value="created_at" />
            <option value="updatedat" />
            <option value="updatedAt" />
            <option value="date" />
          </datalist>
          <DatePicker
            selected={dateFrom}
            onChange={(date: Date | null) => {
              setDateFrom(date);
              setPage(1);
            }}
            selectsStart
            startDate={dateFrom}
            endDate={dateTo}
            maxDate={dateTo ?? undefined}
            isClearable
            placeholderText="From date"
            dateFormat="dd/MM/yyyy"
            wrapperClassName="w-full"
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            calendarClassName="rvscas-datepicker"
            popperClassName="rvscas-datepicker-popper"
            ariaLabelledBy="date-from-label"
          />
          <DatePicker
            selected={dateTo}
            onChange={(date: Date | null) => {
              setDateTo(date);
              setPage(1);
            }}
            selectsEnd
            startDate={dateFrom}
            endDate={dateTo}
            minDate={dateFrom ?? undefined}
            isClearable
            placeholderText="To date"
            dateFormat="dd/MM/yyyy"
            wrapperClassName="w-full"
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            calendarClassName="rvscas-datepicker"
            popperClassName="rvscas-datepicker-popper"
            ariaLabelledBy="date-to-label"
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRefreshKey((current) => current + 1)}
              disabled={loading}
              title="Refresh table data"
            >
              <span className={loading ? "animate-spin" : ""} aria-hidden="true">
                ↻
              </span>
              Refresh
            </Button>
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

        <div className="rvscas-table-scroll max-h-[52vh] overflow-auto">
          <table className="min-w-full table-fixed border-collapse">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                {columns.length > 0 ? (
                  <>
                    {columns.map((column) => (
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
                    ))}
                    {canManageAdmissionYears ? (
                      <th className="w-32 px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                        actions
                      </th>
                    ) : null}
                  </>
                ) : (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Records</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400" colSpan={tableColumnCount}>
                    <span className="animate-soft-pulse">Loading records</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-red-600 dark:text-red-200" colSpan={tableColumnCount}>
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={tableColumnCount}>
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
                    {canManageAdmissionYears ? (
                      <td className="w-32 px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            disabled={Boolean(actionRowId)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-200"
                            title="Edit"
                            aria-label="Edit row"
                          >
                            <FaPenToSquare />
                          </button>
                          <button
                            type="button"
                            onClick={() => openClone(row)}
                            disabled={Boolean(actionRowId)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-200"
                            title="Clone"
                            aria-label="Clone row"
                          >
                            <FaClone />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRow(row)}
                            disabled={Boolean(actionRowId)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-300 bg-white text-red-700 transition hover:border-red-500 hover:text-red-800 disabled:opacity-50 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300 dark:hover:border-red-600 dark:hover:text-red-200"
                            title="Delete"
                            aria-label="Delete row"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      {editForm ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 px-4">
          <div className="w-full max-w-lg rounded-md border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Edit admission year</h2>
            <p className="mt-1 text-xs text-slate-400">Document ID: {editForm.id}</p>
            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300">Year</span>
                <Input
                  value={editForm.year}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, year: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300">From date</span>
                <Input
                  value={editForm.fromdate}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, fromdate: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300">To date</span>
                <Input
                  value={editForm.todate}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, todate: event.target.value } : current,
                    )
                  }
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditForm(null)} disabled={Boolean(actionRowId)}>
                Cancel
              </Button>
              <Button type="button" onClick={saveEdit} disabled={Boolean(actionRowId)}>
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {cloneForm ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 px-4">
          <div className="w-full max-w-lg rounded-md border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Clone admission year</h2>
            <p className="mt-1 text-xs text-slate-400">Source Document ID: {cloneForm.id}</p>
            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300">Year</span>
                <Input
                  value={cloneForm.year}
                  onChange={(event) =>
                    setCloneForm((current) =>
                      current ? { ...current, year: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300">From date</span>
                <Input
                  value={cloneForm.fromdate}
                  onChange={(event) =>
                    setCloneForm((current) =>
                      current ? { ...current, fromdate: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300">To date</span>
                <Input
                  value={cloneForm.todate}
                  onChange={(event) =>
                    setCloneForm((current) =>
                      current ? { ...current, todate: event.target.value } : current,
                    )
                  }
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setCloneForm(null)} disabled={Boolean(actionRowId)}>
                Cancel
              </Button>
              <Button type="button" onClick={saveClone} disabled={Boolean(actionRowId)}>
                OK
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
