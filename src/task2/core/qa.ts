import { AzureOpenAI } from "openai";
import type { Resume } from "./retrieve";

const MODEL = "gpt-4.1-mini-2025-04-14";

export type CandidateScores = {
    skillsMatch: number;
    experience: number;
    domain: number;
    seniority: number;
};

export type CandidateEvaluation = {
    candidateId: string;
    category: string;
    scores: CandidateScores;
    evaluation: {
        skillsMatch: string;
        experience: string;
        domain: string;
        seniority: string;
    };
};

export type BestCandidate = {
    candidateId: string;
    reason: string;
};

export type Response = {
    bestCandidate: BestCandidate;
    candidates: CandidateEvaluation[];
};

export async function analyzeTopCandidates(
    client: AzureOpenAI,
    query: string,
    docs: Resume[]
): Promise<Response> {
    const context = docs
        .map(
            (d) =>
                `\n---RESUME START---\n"
                Candidate id: ${d.id}\nCategory: ${d.category ?? "n/a"}\n${d.text ?? ""}
                `.trim()
        )
        .join("\n---RESUME END---\n");

    const prompt = `
        You are an experienced HR assistant specialized in resume screening.
        
        Your tasks:
        
        1. Evaluate ALL candidates based ONLY on the provided resumes.
        2. Assign a score from 0 to 100 for EACH evaluation criterion.
        3. Scores must be realistic, consistent, and comparable across candidates.
        4. Avoid giving similar scores to all candidates — differentiate clearly.
        5. Select the SINGLE best candidate based on overall performance.
        6. Provide an explanation for each evaluation criteria based on the provided resume screening.
        7. For each candidate in output, return candidate category exactly from the provided resume context.
        
        STRICT RULES:
        - Do NOT use external knowledge.
        - If a skill or experience is missing → assign a lower score.
        - Be objective and consistent across all candidates.
        
        Evaluation criteria (each scored 0–100):
        - skillsMatch: match with required skills and technologies
        - experience: relevance and depth of experience
        - domain: domain/industry alignment
        - seniority: seniority level fit
        
        IMPORTANT:
        - Scores must reflect actual differences between candidates.
        - At least one candidate should clearly outperform others.
        
        Input:
        
        RESUMES:
        ${context}
        
        VACANCY DESCRIPTION:
        ${query}
`.trim();

    const res = await client.chat.completions.create({
        model: MODEL,
        messages: [
            { role: "user", content: prompt }
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "candidate_evaluation",
                schema: {
                    type: "object",
                    properties: {
                        bestCandidate: {
                            type: "object",
                            properties: {
                                candidateId: { type: "string" },
                                reason: { type: "string" }
                            },
                            required: ["candidateId", "reason"],
                            additionalProperties: false
                        },
                        candidates: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    candidateId: { type: "string" },
                                    category: { type: "string" },
                                    scores: {
                                        type: "object",
                                        properties: {
                                            skillsMatch: { type: "number" },
                                            experience: { type: "number" },
                                            domain: { type: "number" },
                                            seniority: { type: "number" }
                                        },
                                        required: [
                                            "skillsMatch",
                                            "experience",
                                            "domain",
                                            "seniority"
                                        ],
                                        additionalProperties: false
                                    },
                                    evaluation: {
                                        type: "object",
                                        properties: {
                                            skillsMatch: { type: "string" },
                                            experience: { type: "string" },
                                            domain: { type: "string" },
                                            seniority: { type: "string" }
                                        },
                                        required: [
                                            "skillsMatch",
                                            "experience",
                                            "domain",
                                            "seniority"
                                        ],
                                        additionalProperties: false
                                    }
                                },
                                required: [
                                    "candidateId",
                                    "category",
                                    "scores",
                                    "evaluation"
                                ],
                                additionalProperties: false
                            }
                        }
                    },
                    required: ["bestCandidate", "candidates"],
                    additionalProperties: false
                }
            }
        }
    });

    const content = res.choices[0].message.content;

    if (!content) {
        throw new Error("Empty response from model");
    }

    let parsed;

    try {
        parsed = JSON.parse(content);
    } catch (e) {
        console.error("Failed to parse LLM response:", content);
        throw new Error("Invalid JSON from LLM");
    }

    return {
        bestCandidate: parsed.bestCandidate,
        candidates: parsed.candidates
    };
}
