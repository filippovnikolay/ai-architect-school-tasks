import fs from "fs";
import path from "path";
import { createAzureClient, deploymentName } from "../../config/client";
import { containsDangerousOutput } from "../domain/sinkSafety";
import { mitigatedChat } from "../flows/mitigatedFlow";
import { vulnerableChat } from "../flows/vulnerableFlow";
import { SCENARIOS } from "../scenarios/scenarios";

export interface ScenarioRunRow {
    scenarioId: string;
    title: string;
    flow: "vulnerable" | "mitigated";
    /**
     * True if content bound for the HTML/HTTP sink still matches dangerous heuristics
     * (XSS-style markup, metadata SSRF URLs, etc.).
     */
    leak: boolean;
    attackRequest: string;
    llmResponse: string;
    error?: string;
}

export async function runAllScenarioTests(): Promise<ScenarioRunRow[]> {
    const openai = createAzureClient();
    const model = deploymentName();
    const rows: ScenarioRunRow[] = [];

    for (const s of SCENARIOS) {
        const prompt = s.buildPrompt();
        const base = {
            scenarioId: s.id,
            title: s.title,
            attackRequest: prompt,
        };

        try {
            const vOut = await vulnerableChat(openai, model, prompt);
            rows.push({
                ...base,
                flow: "vulnerable",
                leak: containsDangerousOutput(vOut),
                llmResponse: vOut,
            });
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            rows.push({
                ...base,
                flow: "vulnerable",
                leak: false,
                llmResponse: "",
                error: msg,
            });
        }

        try {
            const m = await mitigatedChat(openai, model, prompt);
            const sinkPayload = m.reply ?? "";
            rows.push({
                ...base,
                flow: "mitigated",
                leak: containsDangerousOutput(sinkPayload),
                llmResponse: m.raw,
            });
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            rows.push({
                ...base,
                flow: "mitigated",
                leak: false,
                llmResponse: "",
                error: msg,
            });
        }
    }

    return rows;
}

function formatSummaryMarkdownTable(rows: ScenarioRunRow[]): string {
    const body = SCENARIOS.map((s) => {
        const v = rows.find((r) => r.scenarioId === s.id && r.flow === "vulnerable");
        const m = rows.find((r) => r.scenarioId === s.id && r.flow === "mitigated");
        const vLeak = v?.leak === true ? "yes" : "no";
        const mLeak = m?.leak === true ? "yes" : "no";
        return `| ${s.id} | ${vLeak} | ${mLeak} |`;
    });
    const lines = [
        "| Scenario Id | Vulnerable sink unsafe | Mitigated sink unsafe |",
        "| --- | --- | --- |",
        ...body,
    ];
    return lines.join("\n");
}

function formatMarkdownReport(rows: ScenarioRunRow[], generatedIso: string): string {
    return [
        "# Improper output handling — scenario test matrix",
        "",
        "Rows measure whether model output (vulnerable: raw; mitigated: after JSON parse + HTML escape) still matches unsafe-sink heuristics.",
        "",
        `Generated: \`${generatedIso}\``,
        "",
        formatSummaryMarkdownTable(rows),
        "",
    ].join("\n");
}

export async function runScenarioTestsAndReport(): Promise<void> {
    const rows = await runAllScenarioTests();
    const generatedIso = new Date().toISOString();

    const outDir = path.join(__dirname, "..", "output");
    fs.mkdirSync(outDir, { recursive: true });
    const mdPath = path.join(outDir, "scenario-last-run.md");
    const txtPath = path.join(outDir, "scenario-last-run.txt");
    fs.writeFileSync(mdPath, formatMarkdownReport(rows, generatedIso), "utf-8");
    fs.writeFileSync(txtPath, JSON.stringify(rows, null, 2), "utf-8");
}
