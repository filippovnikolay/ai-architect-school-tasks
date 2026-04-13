import { retrieve } from "../core/retrieve";
import { analyzeTopCandidates } from "../core/qa";
import { EVAL_SET } from "./evalDataset";
import { createClient, judgeEvidenceSupport } from "./testUtils";

type FaithfulnessRow = {
    query: string;
    score: number;
    verdict: "supported" | "unsupported";
    explanation: string;
};

/**
 * “Does the final answer stay truthful to the retrieved data, without inventing facts?”
 * High faithfulness = low hallucination risk.
 */
export async function runFaithfulnessTest() {
    const client = createClient();
    const rows: FaithfulnessRow[] = [];

    for (const item of EVAL_SET) {
        const docs = await retrieve(item.query, item.retrievalK ?? 5);
        const analysis = await analyzeTopCandidates(client, item.query, docs);

        const claim = `${analysis.bestCandidate.candidateId}: ${analysis.bestCandidate.reason}`;
        const context = docs
            .map((d) => `Candidate ${d.id} (${d.category ?? "n/a"}): ${d.text ?? ""}`)
            .join("\n\n");

        const judged = await judgeEvidenceSupport(client, claim, context);
        rows.push({
            query: item.query,
            score: judged.score,
            verdict: judged.verdict,
            explanation: judged.explanation,
        });
    }

    const avgScore = rows.reduce((acc, r) => acc + r.score, 0) / rows.length;
    const unsupported = rows.filter((r) => r.verdict === "unsupported").length;
    console.log("=== Faithfulness report ===");
    console.log(`Total queries: ${rows.length}`);
    console.log(`Unsupported answers: ${unsupported}/${rows.length}`);
    console.log(`Average faithfulness score: ${avgScore.toFixed(3)}`);
    console.log("");

    for (const row of rows) {
        console.log(
            `[${row.verdict.toUpperCase()}] score=${row.score.toFixed(3)} query=${row.query}`
        );
        console.log(`  reason: ${row.explanation}`);
    }

    return { avgScore, unsupported, total: rows.length, rows };
}

if (require.main === module) {
    runFaithfulnessTest().catch((err) => {
        console.error("Faithfulness test failed:", err);
        process.exit(1);
    });
}
