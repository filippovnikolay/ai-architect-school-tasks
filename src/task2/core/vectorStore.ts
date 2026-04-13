import { DefaultEmbeddingFunction } from "@chroma-core/default-embed";
import { CloudClient } from "chromadb";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.join(__dirname, "../../..", ".env"),
});

const client = new CloudClient({
    apiKey: process.env.CHROMA_API_KEY!,
    tenant: process.env.CHROMA_TENANT!,
    database: "dev",
});

let collection: Awaited<ReturnType<CloudClient["getOrCreateCollection"]>> | undefined;

export async function getCollection() {
    if (!collection) {
        collection = await client.getOrCreateCollection({
            name: "resumes",
            embeddingFunction: new DefaultEmbeddingFunction(),
        });
    }

    return collection;
}
