import { getCollection } from "./vectorStore";
import type { Resume } from "./loader";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const MAX_BYTES = 16000;
const BATCH_SIZE = 16;
type CorpusState = Record<string, string>;
type IngestOptions = {
    statePath?: string;
};

function isTooLarge(text: string): boolean {
    return Buffer.byteLength(text, "utf-8") > MAX_BYTES;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }

    return chunks;
}

function readState(statePath?: string): CorpusState {
    if (!statePath || !fs.existsSync(statePath)) {
        return {};
    }

    try {
        return JSON.parse(fs.readFileSync(statePath, "utf-8")) as CorpusState;
    } catch {
        return {};
    }
}

function writeState(statePath: string | undefined, state: CorpusState): void {
    if (!statePath) {
        return;
    }

    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

export async function ingest(resumes: Resume[], options: IngestOptions = {}) {
    const collection = await getCollection();
    const previousState = readState(options.statePath);

    let skipped = 0;
    const nextState: CorpusState = {};

    const upsertIds: string[] = [];
    const upsertDocuments: string[] = [];
    const upsertMetadatas: { category: string }[] = [];

    for (const resume of resumes) {
        const text = resume.text || "";
        const id = resume.id?.toString() || crypto.randomUUID();
        const hash = resume.contentHash;

        if (isTooLarge(text)) {
            skipped++;
            continue;
        }

        nextState[id] = hash;

        if (previousState[id] !== hash) {
            upsertIds.push(id);
            upsertDocuments.push(text);
            upsertMetadatas.push({ category: resume.category ?? "" });
        }
    }

    const idsToDelete = Object.keys(previousState).filter((id) => !(id in nextState));

    console.log(`Resumes to upsert: ${upsertIds.length}`);
    console.log(`Resumes to delete: ${idsToDelete.length}`);

    const idBatches = chunkArray(upsertIds, BATCH_SIZE);
    const docBatches = chunkArray(upsertDocuments, BATCH_SIZE);
    const metaBatches = chunkArray(upsertMetadatas, BATCH_SIZE);

    for (let i = 0; i < idBatches.length; i++) {
        console.log(`Upserting batch ${i + 1}/${idBatches.length}`);

        await collection.upsert({
            ids: idBatches[i],
            documents: docBatches[i],
            metadatas: metaBatches[i],
        });
    }

    const deleteBatches = chunkArray(idsToDelete, BATCH_SIZE);
    for (let i = 0; i < deleteBatches.length; i++) {
        console.log(`Deleting batch ${i + 1}/${deleteBatches.length}`);
        await collection.delete({ ids: deleteBatches[i] });
    }

    writeState(options.statePath, nextState);

    console.log(`Incremental ingestion complete`);
    console.log(`Skipped (too large): ${skipped}`);
}
