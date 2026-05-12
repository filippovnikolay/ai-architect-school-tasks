import { runScenarioTestsAndReport } from "./runner/runScenarioTests";

runScenarioTestsAndReport().catch((err) => {
    console.error(err);
    process.exit(1);
});
