import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { AzureOpenAI } from "openai";
import { orchestrateAnswer } from "../agents/orchestrator";
import type { RoutedDomain } from "../agents/router";
import { EVAL_CASES, type EvalCase } from "./evalDataset";

export type EvalRowResult = {
    id: string;
    query: string;
    predictedDomain: RoutedDomain;
    expectedDomain: RoutedDomain;
    routingCorrect: boolean;
    toolsCalled: string[];
    toolRuleSatisfied: boolean;
    answer: string;
};

function toolRuleSatisfied(
    row: EvalCase,
    toolsCalled: string[]
): boolean {
    const uniq = new Set(toolsCalled);
    if (row.expectedToolGroups?.length) {
        return row.expectedToolGroups.every((group) =>
            group.some((t) => uniq.has(t))
        );
    }
    if (row.expectedAnyTools?.length) {
        return row.expectedAnyTools.some((t) => uniq.has(t));
    }
    return true;
}

export type EvalSummary = {
    routingAccuracy: number;
    routingCorrectCount: number;
    routingTotalCount: number;
    toolAppropriatenessRate: number;
    rows: EvalRowResult[];
};

/**
 * Metrics on a small labeled set:
 * 1) Routing accuracy — does the orchestrator pick the right specialist path?
 * 2) Tool appropriateness — were the expected MCP tools invoked at least once?
 */
export async function runEvaluation(
    openai: AzureOpenAI,
    deployment: string,
    weatherMcp: Client,
    newsMcp: Client
): Promise<EvalSummary> {
    const rows: EvalRowResult[] = [];

    for (const c of EVAL_CASES) {
        const { answer, route, toolsCalled } = await orchestrateAnswer(
            openai,
            deployment,
            weatherMcp,
            newsMcp,
            c.query
        );

        const routingCorrect = route.domain === c.expectedDomain;
        const toolsOk = toolRuleSatisfied(c, toolsCalled);

        rows.push({
            id: c.id,
            query: c.query,
            predictedDomain: route.domain,
            expectedDomain: c.expectedDomain,
            routingCorrect,
            toolsCalled: [...toolsCalled],
            toolRuleSatisfied: toolsOk,
            answer,
        });
    }

    const routingDenom = EVAL_CASES.length;
    const routingCorrectN = rows.filter((r) => r.routingCorrect).length;
    const routingAccuracy =
        routingDenom === 0 ? 1 : routingCorrectN / routingDenom;

    const toolRows = EVAL_CASES.filter(
        (c) =>
            (c.expectedAnyTools?.length ?? 0) > 0 ||
            (c.expectedToolGroups?.length ?? 0) > 0
    );
    let toolOk = 0;
    for (const r of rows) {
        const c = EVAL_CASES.find((x) => x.id === r.id)!;
        if (
            !(c.expectedAnyTools?.length || c.expectedToolGroups?.length)
        ) {
            continue;
        }
        if (toolRuleSatisfied(c, r.toolsCalled)) {
            toolOk++;
        }
    }
    const toolAppropriatenessRate =
        toolRows.length === 0 ? 1 : toolOk / toolRows.length;

    return {
        routingAccuracy,
        routingCorrectCount: routingCorrectN,
        routingTotalCount: routingDenom,
        toolAppropriatenessRate,
        rows,
    };
}

/** Builds the full evaluation report as plain text (metrics + per-case lines). */
export function formatEvalReport(summary: EvalSummary): string {
    const lines: string[] = [
        "",
        "=== Test Execution ===",
        "",
        `Routing accuracy: ${(summary.routingAccuracy * 100).toFixed(1)}% (${summary.routingCorrectCount}/${summary.routingTotalCount})`,
        `Tool appropriateness: ${(summary.toolAppropriatenessRate * 100).toFixed(1)}% (cases that require specific MCP tools)`,
        "",
        "Per-case:",
        "",
    ];

    for (const r of summary.rows) {
        const flags = [
            r.routingCorrect ? "route OK" : "route FAIL",
            r.toolRuleSatisfied ? "tools OK" : "tools FAIL",
        ].join(" | ");
        lines.push(`[${r.id}] ${flags}`);
        lines.push(`  query: ${r.query}`);
        lines.push(
            `  predicted=${r.predictedDomain} expected=${r.expectedDomain}`
        );
        lines.push(`  tools: ${r.toolsCalled.join(", ") || "(none)"}`);
        lines.push(`  answer: ${r.answer}`);
        lines.push("");
    }

    return lines.join("\n");
}

/** Logs {@link formatEvalReport} to stdout. */
export function printEvalReport(summary: EvalSummary): void {
    console.log(formatEvalReport(summary));
}
