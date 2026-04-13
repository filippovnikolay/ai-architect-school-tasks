import { runPrecisionByCategoryTest } from "./precisionByCategory";
import { runRecallAtKTest } from "./recallAtK";
import { runFaithfulnessTest } from "./faithfulness";

async function main() {
    console.log("=== Running all RAG evaluations ===");
    console.log("");

    const precision = await runPrecisionByCategoryTest();
    console.log("");

    const recall = await runRecallAtKTest();
    console.log("");

    const faithfulness = await runFaithfulnessTest();
    console.log("");

    console.log("=== Combined summary ===");
    console.log(`Precision (category): ${precision.precision.toFixed(3)}`);
    console.log(`Recall@K: ${recall.avgRecall.toFixed(3)}`);
    console.log(`Faithfulness: ${faithfulness.avgScore.toFixed(3)}`);
}

main().catch((err) => {
    console.error("All tests execution failed:", err);
    process.exit(1);
});
