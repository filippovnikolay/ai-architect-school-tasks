import "dotenv/config";
import dotenv from "dotenv";
import path from "path";
import { AzureOpenAI } from "openai";
import { deploymentName, NPX_COMMAND, OPEN_METEO_MCP_ARGS, RSS_READER_MCP_ARGS } from "./config";
import { orchestrateAnswer } from "./agents/orchestrator";
import { startMcpSession } from "./mcp/mcpSession";

dotenv.config({
    path: path.join(__dirname, "../..", ".env"),
});

const API_KEY = process.env.OPENAI_API_KEY;
const API_VERSION = "2024-02-01";
const ENDPOINT = "https://ai-proxy.lab.epam.com";

if (!API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in .env");
}

const openai = new AzureOpenAI({
    apiKey: API_KEY,
    apiVersion: API_VERSION,
    endpoint: ENDPOINT,
});

async function withMcpSessions<T>(
    fn: (weather: Awaited<ReturnType<typeof startMcpSession>>, news: Awaited<ReturnType<typeof startMcpSession>>) => Promise<T>
): Promise<T> {
    const weather = await startMcpSession(NPX_COMMAND, [
        ...OPEN_METEO_MCP_ARGS,
    ]);
    const news = await startMcpSession(NPX_COMMAND, [...RSS_READER_MCP_ARGS]);
    try {
        return await fn(weather, news);
    } finally {
        await weather.close();
        await news.close();
    }
}

async function main(): Promise<void> {
    //const hardcodedQuestion =
    //    "What is the current weather and short forecast for Paris, France?";
     const hardcodedQuestion = "Give me the latest world news headlines.";

    const deployment = deploymentName();

    await withMcpSessions(async (w, n) => {
        console.log(`[Question] ${hardcodedQuestion}\n`);
        const { answer, route, toolsCalled } = await orchestrateAnswer(
            openai,
            deployment,
            w.client,
            n.client,
            hardcodedQuestion,
            (name) => {
                console.error(`[MCP tool] ${name}`);
            }
        );
        console.log(`\n[Router] ${route.domain} — ${route.rationale}`);
        console.log(`[Tools] ${toolsCalled.join(", ") || "(none)"}\n`);
        console.log(answer);
    });
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
