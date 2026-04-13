/**
 * Non-technical note:
 * This file is our shared "question sheet" for quality checks.
 * Each item represents a hiring request we expect the RAG system to handle.
 */
export type EvalCase = {
    query: string;
    expectedCategory: string;
    retrievalK?: number;
    /**
     * Optional known relevant candidate IDs for recall checks.
     * If empty, recall test falls back to category-level relevance.
     */
    relevantCandidateIds?: string[];
};

export const EVAL_SET: EvalCase[] = [
    {
        query: "Senior Java Spring backend engineer with REST APIs and microservices",
        expectedCategory: "INFORMATION-TECHNOLOGY",
        relevantCandidateIds: ["83816738", "22351830"],
    },
    {
        query: "Frontend developer with React, TypeScript, and modern UI testing",
        expectedCategory: "INFORMATION-TECHNOLOGY",
        relevantCandidateIds: ["83816738"],
    },
    {
        query: "Technical recruiter focused on IT hiring and candidate sourcing",
        expectedCategory: "HR",
        relevantCandidateIds: ["18297650", "91930382"],
    },
    {
        query: "HR generalist with onboarding, employee relations, and policy management",
        expectedCategory: "HR",
        relevantCandidateIds: ["15375009", "93112113", "11763983", "18316239", "18084150"],
    },
    {
        query: "Sales manager skilled in account growth, upselling, and client retention",
        expectedCategory: "BUSINESS-DEVELOPMENT",
        relevantCandidateIds: ["82118447"],
    },
    {
        query: "Retail sales representative with lead generation and closing experience",
        expectedCategory: "SALES",
        relevantCandidateIds: ["13574264"],
    },
    {
        query: "Commercial pilot with flight operations, safety checks, and multilingual communication",
        expectedCategory: "AVIATION",
        relevantCandidateIds: [],
    },
    {
        query: "Aircraft maintenance specialist with avionics troubleshooting and FAA compliance",
        expectedCategory: "AVIATION",
        relevantCandidateIds: ["11804712"],
    },
    {
        query: "Certified nursing assistant for hospital patient care and vital signs monitoring",
        expectedCategory: "HEALTHCARE",
        relevantCandidateIds: ["27182111", "16356151", "24219583"],
    },
    {
        query: "Nurse with emergency triage and inpatient care experience",
        expectedCategory: "HEALTHCARE",
        relevantCandidateIds: ["27182111", "46772262", "37640804"],
    },
];
