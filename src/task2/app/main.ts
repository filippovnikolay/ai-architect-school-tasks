import "dotenv/config";
import { AzureOpenAI } from "openai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import { loadResumesFromCsv } from "../core/loader";
import { ingest } from "../core/ingest";
import { retrieve } from "../core/retrieve";
import { analyzeTopCandidates } from "../core/qa";

dotenv.config({
    path: path.join(__dirname, "../../..", ".env"),
});

const API_KEY = process.env.OPENAI_API_KEY;
const API_VERSION = "2024-02-01";
const ENDPOINT = "https://ai-proxy.lab.epam.com";

if (!API_KEY) {
    throw new Error("Missing DIAL_API_KEY in .env");
}

const client = new AzureOpenAI({
    apiKey: API_KEY,
    apiVersion: API_VERSION,
    endpoint: ENDPOINT,
});

async function updateChangedData() {
    const resumes = await loadResumesFromCsv(
        path.join(__dirname, "../data/resume.csv")
    );
    console.log("Loaded:", resumes.length);
    await ingest(resumes, {
        statePath: path.join(__dirname, "../output/corpus-state.json"),
    });
}

async function main() {
    await updateChangedData();
    const vacancyDescription = "Senior Java Spring backend engineer with REST APIs and microservices";
    // Emulates access control: categories available for the current user. Empty = All categories.
    const allowedCategories: string[] = [] // ["ENGINEERING", "INFORMATION-TECHNOLOGY"];

    const topResumes = await retrieve(vacancyDescription, 5, allowedCategories);
    const topCandidates = await analyzeTopCandidates(
        client,
        vacancyDescription,
        topResumes
    );

    const outputPath = path.join(__dirname, "../output/data.json");
    fs.mkdirSync(path.join(__dirname, "../output"), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(topCandidates, null, 5));
}

main();
