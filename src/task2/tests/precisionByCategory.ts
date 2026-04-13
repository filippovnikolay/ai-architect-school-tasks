import { retrieve } from "../core/retrieve";
import { analyzeTopCandidates } from "../core/qa";
import { EVAL_SET, type EvalCase } from "./evalDataset";
import { createClient } from "./testUtils";

type EvalResult = {
    query: string;
    expectedCategory: string;
    predictedCandidateIds: string[];
    predictedCategories: string[];
    isCorrect: boolean;
};

const client = createClient();

async function evaluateCase(item: EvalCase): Promise<EvalResult> {
    const topResumes = await retrieve(
        item.query,
        item.retrievalK ?? 5
    );
    const analysis = await analyzeTopCandidates(client, item.query, topResumes);

    const predictedCandidateIds = analysis.candidates.map((c) => c.candidateId);
    const predictedCategories = analysis.candidates
        .map((c) => c.category?.trim())
        .filter((c): c is string => Boolean(c));
    const isCorrect = predictedCategories.includes(item.expectedCategory);

    return {
        query: item.query,
        expectedCategory: item.expectedCategory,
        predictedCandidateIds,
        predictedCategories,
        isCorrect,
    };
}

function printModeReport(title: string, rows: EvalResult[]) {
    const correct = rows.filter((r) => r.isCorrect).length;
    const precision = correct / rows.length;

    console.log(title);
    console.log(`Total: ${rows.length}`);
    console.log(`Correct: ${correct}`);
    console.log(`Precision: ${precision.toFixed(3)}`);
    console.log("");

    for (const r of rows) {
        console.log(
            `[${r.isCorrect ? "OK" : "FAIL"}] expected=${r.expectedCategory} predictedAny=${r.predictedCategories.join(", ") || "n/a"} ids=${r.predictedCandidateIds.join(", ")}`
        );
        console.log(`  query: ${r.query}`);
    }
    console.log("");
}

/**
 * "When the system returns candidates, how often are they correct for the request?"
 * High precision = fewer wrong matches in results.
 */
export async function runPrecisionByCategoryTest() {
    const rows: EvalResult[] = [];

    for (const item of EVAL_SET) {
        rows.push(await evaluateCase(item));
    }

    printModeReport("=== Detailed report: all categories ===", rows);

    const correct = rows.filter((r) => r.isCorrect).length;
    const precision = correct / rows.length;
    return { precision, total: rows.length, correct };
}

if (require.main === module) {
    runPrecisionByCategoryTest().catch((err) => {
        console.error("Evaluation failed:", err);
        process.exit(1);
    });
}
