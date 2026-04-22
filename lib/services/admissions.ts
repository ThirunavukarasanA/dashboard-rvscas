import { ObjectId } from "mongodb";
import type { DatabaseRole } from "@/config/db-registry";
import { getCollection } from "@/lib/mongodb/getCollection";

type ExportRow = Record<string, unknown>;

function stringifyId(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "$oid" in value) {
    return String((value as { $oid: unknown }).$oid);
  }

  return value ? String(value) : "";
}

function withProgrammeName(row: ExportRow, programmeName: string) {
  const entries = Object.entries(row);
  const enhanced: ExportRow = {};
  let inserted = false;

  for (const [key, value] of entries) {
    enhanced[key] = value;

    if (key === "programmeid") {
      enhanced.programmename = programmeName;
      inserted = true;
    }
  }

  if (!inserted) {
    enhanced.programmename = programmeName;
  }

  return enhanced;
}

export async function addProgrammeNamesToAdmissionsExport(
  dbName: string,
  collectionName: string,
  role: DatabaseRole,
  rows: ExportRow[],
) {
  if (dbName !== "online-admission" || collectionName !== "admissions" || rows.length === 0) {
    return rows;
  }

  const programmeIds = Array.from(
    new Set(rows.map((row) => stringifyId(row.programmeid)).filter(Boolean)),
  );

  if (programmeIds.length === 0) {
    return rows.map((row) => withProgrammeName(row, ""));
  }

  const objectIds = programmeIds.filter(ObjectId.isValid).map((id) => new ObjectId(id));
  const programmes = await getCollection(dbName, "programmes", role);
  const programmeRows = await programmes
    .find({ _id: { $in: objectIds } }, { projection: { name: 1, shortname: 1 } })
    .toArray();
  const programmeNames = new Map(
    programmeRows.map((programme) => [
      stringifyId(programme._id),
      String(programme.name || programme.shortname || ""),
    ]),
  );

  return rows.map((row) => {
    const programmeId = stringifyId(row.programmeid);

    return withProgrammeName(row, programmeNames.get(programmeId) ?? "");
  });
}
