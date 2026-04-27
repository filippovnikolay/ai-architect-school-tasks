import type { RoutedDomain } from "../agents/router";

/**
 * Small held-out set for offline-style checks in `runEvaluation.ts`.
 * Weather “gold” labels are behavioural (domain + tool family), not numeric forecasts,
 * because live weather changes continuously.
 */
export type EvalCase = {
    id: string;
    query: string;
    /** Expected output from the routing orchestrator step. */
    expectedDomain: RoutedDomain;
    /**
     * For quantitative tool-appropriateness: at least one listed tool name
     * must appear in the trace when the full pipeline runs.
     */
    expectedAnyTools?: string[];
    /**
     * Stricter check: each inner array is an OR-group; every group must match
     * at least one tool name (used for weather+news combined questions).
     */
    expectedToolGroups?: string[][];
};

export const EVAL_CASES: EvalCase[] = [
    {
        id: "w-paris",
        query: "What is the current weather and short forecast for Paris, France?",
        expectedDomain: "weather",
        expectedAnyTools: ["geocoding", "weather_forecast"],
    },
    {
        id: "w-berlin",
        query: "Will it rain in Berlin tomorrow?",
        expectedDomain: "weather",
        expectedAnyTools: ["weather_forecast", "geocoding"],
    },
    {
        id: "n-headlines",
        query: "Give me the latest BBC world news headlines.",
        expectedDomain: "news",
        expectedAnyTools: ["fetch_feed_entries"],
    },
    {
        id: "n-topic",
        query: "What stories appear in the world news RSS feed right now?",
        expectedDomain: "news",
        expectedAnyTools: ["fetch_feed_entries"],
    },
    {
        id: "b-combo",
        query: "I need both: weather in London today and the latest BBC world headlines.",
        expectedDomain: "both",
        expectedToolGroups: [
            ["geocoding", "weather_forecast"],
            ["fetch_feed_entries"],
        ],
    },
    {
        id: "w-london-implicit",
        query: "Is it warm enough to walk outside in London this afternoon?",
        expectedDomain: "weather",
        expectedAnyTools: ["weather_forecast", "geocoding"],
    },
    {
        id: "n-generic",
        query: "Summarize top international news from the default RSS feed.",
        expectedDomain: "news",
        expectedAnyTools: ["fetch_feed_entries"],
    },
];
