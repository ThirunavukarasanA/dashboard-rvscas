import { MongoClient } from "mongodb";

let clientPromise: Promise<MongoClient> | null = null;

export function getMongoClient() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!clientPromise) {
    const client = new MongoClient(uri, {
      appName: "dashboard-rvscas",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });

    clientPromise = client.connect();
  }

  return clientPromise;
}
