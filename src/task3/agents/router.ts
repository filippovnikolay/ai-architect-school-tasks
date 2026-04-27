import type { AzureOpenAI } from "openai";

export type RoutedDomain = "weather" | "news" | "both";

export type RouteDecision = {
    domain: RoutedDomain;
    rationale: string;
};

const ROUTER_SYSTEM = `You route user questions for a assistant that has two capabilities:
1) current weather and forecasts (Open-Meteo tools)
2) latest news from RSS feeds (no API keys)

Classify each user message into exactly one category:
- "weather" — temperature, rain, wind, forecast, air quality for a place, etc.
- "news" — headlines, current events, what is in the news, topics in media
- "both" — explicitly needs live weather AND news in one answer`;

/** Structured output schema for the router (enforced via response_format). */
const ROUTE_DECISION_RESPONSE_FORMAT = {
    type: "json_schema" as const,
    json_schema: {
        name: "route_decision",
        strict: true,
        schema: {
            type: "object",
            properties: {
                domain: {
                    type: "string",
                    description: "Which domain path to use.",
                    enum: ["weather", "news", "both"],
                },
                rationale: {
                    type: "string",
                    description: "One short sentence explaining the routing choice.",
                },
            },
            required: ["domain", "rationale"],
            additionalProperties: false,
        },
    },
};

export async function routeQuestion(
    openai: AzureOpenAI,
    deployment: string,
    userQuestion: string
): Promise<RouteDecision> {
    const completion = await openai.chat.completions.create({
        model: deployment,
        temperature: 0,
        response_format: ROUTE_DECISION_RESPONSE_FORMAT,
        messages: [
            { role: "system", content: ROUTER_SYSTEM },
            { role: "user", content: userQuestion },
        ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    let parsed: { domain?: string; rationale?: string };
    try {
        parsed = JSON.parse(raw) as { domain?: string; rationale?: string };
    } catch {
        return { domain: "both", rationale: "parse_error_default" };
    }

    const d = parsed.domain;
    const domain: RoutedDomain =
        d === "weather" || d === "news" || d === "both" ? d : "both";

    return {
        domain,
        rationale: typeof parsed.rationale === "string" ? parsed.rationale : "",
    };
}
