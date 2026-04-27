import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { AzureOpenAI } from "openai";
import {
    DEFAULT_NEWS_RSS_URL,
    NEWS_TOOL_ALLOWLIST,
    WEATHER_TOOL_ALLOWLIST,
} from "../config";
import { routeQuestion } from "./router";
import { runToolAgent } from "./toolRunner";

const WEATHER_SYSTEM = `You are a weather assistant. You MUST use the provided MCP tools (Open‑Meteo):
- Use geocoding to resolve city or region names to coordinates when needed.
- Use weather_forecast for current conditions and upcoming days.
Only state weather facts that appear in tool results. If tools fail, say so briefly.`;

const NEWS_SYSTEM = `You are a news assistant. You MUST use fetch_feed_entries on RSS feeds.
Unless the user names another feed, use this default world news feed URL: ${DEFAULT_NEWS_RSS_URL}
Summarize headlines and dates from tool output; do not invent stories.`;

const MERGE_SYSTEM = `You combine two factual briefs (weather from Open‑Meteo, news from RSS tool output) into one clear answer for the user.
Do not add facts that are not in the briefs. If a brief says data is missing, reflect that.`;

export type OrchestratorResult = {
    answer: string;
    route: Awaited<ReturnType<typeof routeQuestion>>;
    toolsCalled: string[];
};

export async function orchestrateAnswer(
    openai: AzureOpenAI,
    deployment: string,
    weatherMcp: Client,
    newsMcp: Client,
    userQuestion: string,
    onToolCall?: (name: string, args: unknown) => void
): Promise<OrchestratorResult> {
    const route = await routeQuestion(openai, deployment, userQuestion);
    const toolsCalled: string[] = [];
    const record =
        (name: string, args: unknown) => {
            toolsCalled.push(name);
            onToolCall?.(name, args);
        };

    if (route.domain === "weather") {
        const { assistantText, toolsCalled: tc } = await runToolAgent(
            openai,
            deployment,
            weatherMcp,
            WEATHER_TOOL_ALLOWLIST,
            WEATHER_SYSTEM,
            userQuestion,
            { onToolCall: record }
        );
        return { answer: assistantText, route, toolsCalled: tc };
    }

    if (route.domain === "news") {
        const { assistantText, toolsCalled: tc } = await runToolAgent(
            openai,
            deployment,
            newsMcp,
            NEWS_TOOL_ALLOWLIST,
            NEWS_SYSTEM,
            userQuestion,
            { onToolCall: record }
        );
        return { answer: assistantText, route, toolsCalled: tc };
    }

    const w = await runToolAgent(
        openai,
        deployment,
        weatherMcp,
        WEATHER_TOOL_ALLOWLIST,
        WEATHER_SYSTEM,
        userQuestion,
        { onToolCall: record }
    );
    const n = await runToolAgent(
        openai,
        deployment,
        newsMcp,
        NEWS_TOOL_ALLOWLIST,
        NEWS_SYSTEM,
        userQuestion,
        { onToolCall: record }
    );

    const merge = await openai.chat.completions.create({
        model: deployment,
        temperature: 0.2,
        messages: [
            { role: "system", content: MERGE_SYSTEM },
            {
                role: "user",
                content: `User question:\n${userQuestion}\n\n--- Weather brief ---\n${w.assistantText}\n\n--- News brief ---\n${n.assistantText}`,
            },
        ],
    });

    const answer =
        merge.choices[0]?.message?.content?.trim() ??
        `${w.assistantText}\n\n${n.assistantText}`;

    return {
        answer,
        route,
        toolsCalled: [...w.toolsCalled, ...n.toolsCalled],
    };
}
