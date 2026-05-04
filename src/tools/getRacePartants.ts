import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB ?? "letrot";

let cachedClient: MongoClient | null = null;

async function getClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }
  cachedClient = new MongoClient(MONGODB_URI);
  await cachedClient.connect();
  return cachedClient;
}

export async function getRacePartants(args: { race_id: string }): Promise<CallToolResult> {
  const { race_id } = args;
  if (!race_id) {
    return {
      isError: true,
      content: [{ type: "text", text: "race_id is required" }],
    };
  }

  try {
    const client = await getClient();
    const db = client.db(MONGODB_DB);
    const doc = await db.collection("courses").findOne({ _id: race_id as unknown as never });

    if (!doc) {
      return {
        isError: true,
        content: [{ type: "text", text: `No race found with _id="${race_id}"` }],
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(doc) }],
      structuredContent: doc as Record<string, unknown>,
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `MongoDB error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
