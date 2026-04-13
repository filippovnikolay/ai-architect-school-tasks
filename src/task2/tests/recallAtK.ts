import { retrieve } from "../core/retrieve";
import { EVAL_SET } from "./evalDataset";

type RecallRow = {
    query: string;
    recall: number;
    matched: number;
    totalRelevant: number;
    mode: "id" | "category";
};

function computeRecallFromIds(predictedIds: string[], relevantIds: string[]) {
    if (relevantIds.length === 0) {
        return { recall: 0, matched: 0, totalRelevant: 0 };
    }
    const matched = relevantIds.filter((id) => predictedIds.includes(id)).length;
    return { recall: matched / relevantIds.length, matched, totalRelevant: relevantIds.length };
}

function computeRecallFromCategories(predictedCategories: string[], expectedCategory: string) {
    const matched = predictedCategories.includes(expectedCategory) ? 1 : 0;
    return { recall: matched, matched, totalRelevant: 1 };
}

/**
 * “Out of all good candidates that exist, how many did the system actually find?”
 * High recall = system misses fewer good candidates.
 */
export async function runRecallAtKTest() {
    const rows: RecallRow[] = [];

    for (const item of EVAL_SET) {
        const results = await retrieve(item.query, item.retrievalK ?? 5);
        const predictedIds = results.map((r) => r.id);
        const predictedCategories = results
            .map((r) => r.category?.trim())
            .filter((c): c is string => Boolean(c));

        const relevantIds = item.relevantCandidateIds ?? [];
        if (relevantIds.length > 0) {
            const stats = computeRecallFromIds(predictedIds, relevantIds);
            rows.push({
                query: item.query,
                recall: stats.recall,
                matched: stats.matched,
                totalRelevant: stats.totalRelevant,
                mode: "id",
            });
        } else {
            const stats = computeRecallFromCategories(predictedCategories, item.expectedCategory);
            rows.push({
                query: item.query,
                recall: stats.recall,
                matched: stats.matched,
                totalRelevant: stats.totalRelevant,
                mode: "category",
            });
        }
    }

    const avgRecall = rows.reduce((acc, r) => acc + r.recall, 0) / rows.length;
    console.log("=== Recall@K report ===");
    console.log(`Total queries: ${rows.length}`);
    console.log(`Average recall: ${avgRecall.toFixed(3)}`);
    console.log("");

    for (const row of rows) {
        console.log(
            `[${row.mode}] recall=${row.recall.toFixed(3)} matched=${row.matched}/${row.totalRelevant} query=${row.query}`
        );
    }

    return { avgRecall, rows };
}

if (require.main === module) {
    runRecallAtKTest().catch((err) => {
        console.error("Recall test failed:", err);
        process.exit(1);
    });
}
