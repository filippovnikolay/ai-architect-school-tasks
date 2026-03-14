import "dotenv/config";
import {AzureOpenAI} from "openai";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.join(__dirname, "..", ".env")
});

async function main() {
    const apiKey = process.env.DIAL_API_KEY ?? "";

    if (!apiKey) {
        throw new Error(
            "Missing credentials. Please set DIAL_API_KEY in your .env file."
        );
    }

    const client = new AzureOpenAI({
        apiKey,
        apiVersion: "2024-02-01",
        endpoint: "https://ai-proxy.lab.epam.com"
    });

    const deploymentName = "gpt-4o-mini-2024-07-18";

    const systemPrompt = `
        ### Initial instructions ###
        You are an AI agent that follows the ReAct (Reason + Act) pattern to solve problems or answer questions step-by-step.
        
        At each step:
        1. Think about the problem.
        2. Decide the next action.
        3. Observe the result of that action.
        4. Continue until the solution is reached.
        
        ### Rules ###
        - Always follow the exact output format below.
        - Repeat the Thought → Action → Observation cycle as needed.
        - Before producing the final answer, perform a self-verification step to check correctness.
        - If the verification reveals an issue, continue reasoning until the correct solution is found.
        - Stop only when you are confident in the verified result.
        
        ### Output format ###
        Use this format exactly:     
        Thought: reasoning about the problem
        Action: the next step to take
        Observation: result of the action
        Final Answer: the final verified solution
`.trim();

    const rl = readline.createInterface({ input, output });
    let userQuestion = "";
    try {
        userQuestion = (await rl.question("Enter your question: ")).trim();
    } finally {
        rl.close();
    }

    const response = await client.chat.completions.create({
        model: deploymentName,
        temperature: 0,
        messages: [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: userQuestion
            }
        ]
    });

    const answer = response.choices?.[0]?.message?.content ?? "";
    console.log("\n=== Assistant ===\n");
    console.log(answer);
}


main().catch((err) => {
    console.error(err);
    process.exit(1);
});