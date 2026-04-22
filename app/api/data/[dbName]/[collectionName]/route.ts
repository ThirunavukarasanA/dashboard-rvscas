import { requireRoleForCollection } from "@/lib/auth/guards";
import { addProgrammeNamesToAdmissionsExport } from "@/lib/services/admissions";
import { listDocuments } from "@/lib/services/documents";
import { fail, getErrorMessage, ok } from "@/lib/utils/api";
import { parseDataQuery } from "@/lib/validators/query";

export async function GET(
  request: Request,
  context: { params: Promise<{ dbName: string; collectionName: string }> },
) {
  try {
    const { dbName, collectionName } = await context.params;
    const decodedDbName = decodeURIComponent(dbName);
    const decodedCollectionName = decodeURIComponent(collectionName);
    const session = await requireRoleForCollection(decodedDbName, decodedCollectionName);
    const query = parseDataQuery(new URL(request.url).searchParams);
    const data = await listDocuments(
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

    return ok({ ...data, documents });
  } catch (error) {
    return fail(getErrorMessage(error), 400);
  }
}
