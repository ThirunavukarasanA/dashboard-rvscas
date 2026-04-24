import { ObjectId } from "mongodb";
import { requireRoleForCollection } from "@/lib/auth/guards";
import { getCollection } from "@/lib/mongodb/getCollection";
import { fail, getErrorMessage, ok } from "@/lib/utils/api";

function isTargetCollection(dbName: string, collectionName: string) {
  return dbName === "online-admission" && collectionName === "admissionyears";
}

function parseObjectId(value: string) {
  if (!ObjectId.isValid(value)) {
    throw new Error("Invalid document id");
  }

  return new ObjectId(value);
}

function sanitizeUpdates(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid update payload");
  }

  const entries = Object.entries(payload as Record<string, unknown>).filter(
    ([key]) => key !== "_id" && key !== "__v",
  );

  if (entries.length === 0) {
    throw new Error("No editable fields provided");
  }

  return Object.fromEntries(entries);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ dbName: string; collectionName: string; documentId: string }> },
) {
  try {
    const { dbName, collectionName, documentId } = await context.params;
    const decodedDbName = decodeURIComponent(dbName);
    const decodedCollectionName = decodeURIComponent(collectionName);
    const session = await requireRoleForCollection(decodedDbName, decodedCollectionName);

    if (session.user.role !== "super_admin" || !isTargetCollection(decodedDbName, decodedCollectionName)) {
      return fail("You are not allowed to edit this collection", 403);
    }

    const collection = await getCollection(decodedDbName, decodedCollectionName, session.user.role);
    const _id = parseObjectId(decodeURIComponent(documentId));
    const updates = sanitizeUpdates(await request.json().catch(() => null));
    const result = await collection.findOneAndUpdate(
      { _id },
      { $set: updates },
      { returnDocument: "after" },
    );

    if (!result) {
      return fail("Document not found", 404);
    }

    return ok({ document: JSON.parse(JSON.stringify(result)) as Record<string, unknown> });
  } catch (error) {
    return fail(getErrorMessage(error), 400);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ dbName: string; collectionName: string; documentId: string }> },
) {
  try {
    const { dbName, collectionName, documentId } = await context.params;
    const decodedDbName = decodeURIComponent(dbName);
    const decodedCollectionName = decodeURIComponent(collectionName);
    const session = await requireRoleForCollection(decodedDbName, decodedCollectionName);

    if (session.user.role !== "super_admin" || !isTargetCollection(decodedDbName, decodedCollectionName)) {
      return fail("You are not allowed to delete from this collection", 403);
    }

    const collection = await getCollection(decodedDbName, decodedCollectionName, session.user.role);
    const _id = parseObjectId(decodeURIComponent(documentId));
    const result = await collection.deleteOne({ _id });

    if (result.deletedCount === 0) {
      return fail("Document not found", 404);
    }

    return ok({ success: true });
  } catch (error) {
    return fail(getErrorMessage(error), 400);
  }
}
