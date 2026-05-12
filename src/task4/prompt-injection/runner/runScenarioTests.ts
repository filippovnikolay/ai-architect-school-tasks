import fs from "fs";
import path from "path";
import { createAzureClient, deploymentName } from "../../config/client";
import {
    containsInstructionEchoLeak,
    containsSecretLeak,
} from "../domain/leakCheck";
import { mitigatedChat } from "../flows/mitigatedFlow";
import { SCENARIOS } from "../scenarios/scenarios";
import { vulnerableChat } from "../flows/vulnerableFlow";

export interface ScenarioRunRow {
    scenarioId: string;
    title: string;
    flow: "vulnerable" | "mitigated";
    /** `true` if either secret markers or instruction-echo heuristics matched. */
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
            const markerLeak = containsSecretLeak(vOut);
            const instructionEchoLeak = containsInstructionEchoLeak(vOut);
            rows.push({
                ...base,
                flow: "vulnerable",
                leak: markerLeak || instructionEchoLeak,
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
            const combined = `${m.raw}\n${m.reply ?? ""}`;
            const markerLeak = containsSecretLeak(combined);
            const instructionEchoLeak = containsInstructionEchoLeak(combined);
            rows.push({
                ...base,
                flow: "mitigated",
                leak: markerLeak || instructionEchoLeak,
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
        "| Scenario Id | Vulnerable Flow Leak | Mitigated Flow Leak |",
        "| --- | --- | --- |",
        ...body,
    ];
    return lines.join("\n");
}

function formatMarkdownReport(rows: ScenarioRunRow[], generatedIso: string): string {
    return [
        "# Prompt injection — scenario test matrix",
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
