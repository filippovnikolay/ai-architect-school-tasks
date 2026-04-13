import fs from "fs";
import csv from "csv-parser";
import crypto from "crypto";

export type Resume = {
    id: string;
    text: string;
    category: string;
    contentHash: string;
};

function getContentHash(text: string): string {
    return crypto.createHash("sha256").update(text, "utf-8").digest("hex");
}

export async function loadResumesFromCsv(path: string): Promise<Resume[]> {
    const results: Resume[] = [];

    return new Promise((resolve) => {
        fs.createReadStream(path)
            .pipe(csv())
            .on("data", (data) => {
                results.push({
                    id: data.ID,
                    text: data.Resume_str,
                    category: data.Category,
                    contentHash: getContentHash(data.Resume_str ?? ""),
                });
            })
            .on("end", () => resolve(results));
    });
}
