import "dotenv/config";
import path from "path";
import dotenv from "dotenv";
import { AzureOpenAI } from "openai";

dotenv.config({
    path: path.join(__dirname, "../../..", ".env"),
});

const API_KEY = process.env.OPENAI_API_KEY;
const API_VERSION = "2024-02-01";
const ENDPOINT = "https://ai-proxy.lab.epam.com";
const JUDGE_MODEL = "gpt-4.1-mini-2025-04-14";

if (!API_KEY) {
    throw new Error("Missing DIAL_API_KEY in .env");
}

export function createClient() {
    return new AzureOpenAI({
        apiKey: API_KEY,
        apiVersion: API_VERSION,
        endpoint: ENDPOINT,
    });
}

export async function judgeEvidenceSupport(
    client: AzureOpenAI,
    claim: string,
    context: string
): Promise<{ score: number; verdict: "supported" | "unsupported"; explanation: string }> {
    const prompt = `
        You are a strict evaluator.
        Check whether CLAIM is supported by CONTEXT.
        
        Return JSON with:
        - score: number from 0 to 1
        - verdict: "supported" or "unsupported"
        - explanation: short reason
        
        Rules:
        - Use only CONTEXT.
        - If evidence is missing, verdict must be "unsupported".
        - Be strict and conservative.
        
        CLAIM:
        ${claim}
        
        CONTEXT:
        ${context}
`.trim();

    const res = await client.chat.completions.create({
        model: JUDGE_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "judge_response",
                schema: {
                    type: "object",
                    properties: {
                        score: { type: "number" },
                        verdict: { type: "string", enum: ["supported", "unsupported"] },
                        explanation: { type: "string" },
                    },
                    required: ["score", "verdict", "explanation"],
                    additionalProperties: false,
                },
            },
        },
    });

    const content = res.choices[0].message.content;
    if (!content) {
        throw new Error("Empty response from judge model");
    }

    const parsed = JSON.parse(content) as {
        score: number;
        verdict: "supported" | "unsupported";
        explanation: string;
    };

    return parsed;
}
