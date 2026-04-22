import { canExport, requireRoleForCollection } from "@/lib/auth/guards";
import { addProgrammeNamesToAdmissionsExport } from "@/lib/services/admissions";
import { audit } from "@/lib/services/audit";
import { listDocumentsForExport } from "@/lib/services/documents";
import { toCsv, toPdf, toXlsx } from "@/lib/services/exporters";
import { fail, getErrorMessage } from "@/lib/utils/api";
import { parseDataQuery } from "@/lib/validators/query";

const EXPORT_TYPES = new Set(["csv", "xlsx", "json", "pdf"]);

export async function GET(
  request: Request,
  context: { params: Promise<{ dbName: string; collectionName: string }> },
) {
  try {
    const { dbName, collectionName } = await context.params;
    const decodedDbName = decodeURIComponent(dbName);
    const decodedCollectionName = decodeURIComponent(collectionName);
    const session = await requireRoleForCollection(decodedDbName, decodedCollectionName);

    if (!canExport(session.user.role)) {
      return fail("Exports are not allowed for this role", 403);
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "csv";

    if (!EXPORT_TYPES.has(type)) {
      return fail("Unsupported export type", 400);
    }

    const query = parseDataQuery(url.searchParams);
    const data = await listDocumentsForExport(
      decodedDbName,
      decodedCollectionName,
      session.user.role,
      query,
    );
    const documents = await addProgrammeNamesToAdmissionsExport(
      decodedDbName,
      decodedCollectionName,
      session.user.role,
      data.documents,
    );
    const stamp = new Date().toISOString();
    const fileBase = `${decodedDbName}-${decodedCollectionName}-${stamp.slice(0, 10)}`;
    const meta = {
      database: decodedDbName,
      collection: decodedCollectionName,
      exportedAt: stamp,
      totalRows: String(documents.length),
    };

    audit({
      action: "export",
      user: session.user,
      target: `${decodedDbName}.${decodedCollectionName}`,
      metadata: { type, rows: documents.length },
    });

    if (type === "json") {
      return new Response(JSON.stringify({ meta, documents }, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${fileBase}.json"`,
        },
      });
    }

    if (type === "xlsx") {
      const body = Uint8Array.from(toXlsx(documents, decodedCollectionName)).buffer;

      return new Response(body, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${fileBase}.xlsx"`,
        },
      });
    }

    if (type === "pdf") {
      const body = Uint8Array.from(
        toPdf(
          documents,
          `${decodedDbName} / ${decodedCollectionName}`,
          `Exported ${stamp}. Showing up to 50 rows.`,
        ),
      ).buffer;

      return new Response(
        body,
        {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${fileBase}.pdf"`,
          },
        },
      );
    }

    return new Response(toCsv(documents, meta), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileBase}.csv"`,
      },
    });
  } catch (error) {
    return fail(getErrorMessage(error), 400);
  }
}
