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

function sanitizeClonePayload(payload: unknown) {
  if (!payload) {
    return {};
  }

  if (typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid clone payload");
  }

  return Object.fromEntries(
    Object.entries(payload as Record<string, unknown>).filter(
      ([key]) => key !== "_id" && key !== "__v",
    ),
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ dbName: string; collectionName: string; documentId: string }> },
) {
  try {
    const { dbName, collectionName, documentId } = await context.params;
    const decodedDbName = decodeURIComponent(dbName);
    const decodedCollectionName = decodeURIComponent(collectionName);
    const session = await requireRoleForCollection(decodedDbName, decodedCollectionName);

    if (session.user.role !== "super_admin" || !isTargetCollection(decodedDbName, decodedCollectionName)) {
      return fail("You are not allowed to clone from this collection", 403);
    }

    const collection = await getCollection(decodedDbName, decodedCollectionName, session.user.role);
    const _id = parseObjectId(decodeURIComponent(documentId));
    const source = await collection.findOne({ _id });

    if (!source) {
      return fail("Document not found", 404);
    }

    const overrides = sanitizeClonePayload(await request.json().catch(() => null));
    const { __v, ...cloneBase } = Object.fromEntries(
      Object.entries(source as Record<string, unknown>).filter(([key]) => key !== "_id"),
    );
    const clonePayload = {
      ...cloneBase,
      ...overrides,
      ...(typeof __v === "number" ? { __v: 0 } : {}),
    };
    const result = await collection.insertOne(clonePayload);
    const inserted = await collection.findOne({ _id: result.insertedId });

    return ok({ document: JSON.parse(JSON.stringify(inserted)) as Record<string, unknown> });
  } catch (error) {
    return fail(getErrorMessage(error), 400);
  }
}
