import "dotenv/config";
import dotenv from "dotenv";
import path from "path";
import { AzureOpenAI } from "openai";

dotenv.config({
    path: path.join(__dirname, "..", "..", "..", ".env"),
});

const API_KEY = process.env.OPENAI_API_KEY;
const API_VERSION = "2024-02-01";
const ENDPOINT = "https://ai-proxy.lab.epam.com";

export function deploymentName(): string {
    return (
        process.env.AZURE_OPENAI_DEPLOYMENT ??
        process.env.OPENAI_DEPLOYMENT ??
        "gpt-4.1-mini-2025-04-14"
    );
}

export function createAzureClient(): AzureOpenAI {
    if (!API_KEY) {
        throw new Error("Missing OPENAI_API_KEY in .env (see task1 or task3 setup).");
    }
    return new AzureOpenAI({
        apiKey: API_KEY,
        apiVersion: API_VERSION,
        endpoint: ENDPOINT,
    });
}
