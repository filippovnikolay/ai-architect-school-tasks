# Resume Analysis RAG Dashboard

## Description
GenAI application that analyzes resume documents, extracts candidate insights, and visualizes the result.
![img.png](screenshots/img.png)

This implementation uses:

- **GenAI / LLM:** Azure OpenAI (`openai` SDK)
- **RAG Vector Store:** Chroma Cloud (`chromadb`)
- **Data ingestion:** CSV resume corpus
- **Visualization:** HTML + Chart.js dashboard

## Requirements

### 1) Analyze documents and extract + visualize data

Implemented:

- Resume corpus is ingested into a vector collection and retrieved by semantic query.
- Top candidates are analyzed by LLM with scoring per category:
  - `skillsMatch`
  - `experience`
  - `domain`
  - `seniority`
- Best candidate and per-candidate results are exported to JSON.
- Dashboard visualizations:
  - **Bar chart** for total weighted score
  - **Radar chart** for per-category score breakdown
  - Best-match summary with per-category reasoning

Main files:

- `src/task2/app/main.ts`
- `src/task2/core/ingest.ts`
- `src/task2/core/retrieve.ts`
- `src/task2/core/qa.ts`
- `src/task2/ui/index.html`
- `src/task2/ui/dashboard.js`

### 2) At least one evaluation metric with small dataset

Implemented:

- Evaluation dataset with multiple labeled test queries:
  - `src/task2/tests/evalDataset.ts`
- Metrics scripts:
  - **Precision**: `src/task2/tests/precisionByCategory.ts`
  - **Recall**: `src/task2/tests/recallAtK.ts`
  - **Groundedness**: `src/task2/tests/groundedness.ts`
  - **Faithfulness**: `src/task2/tests/faithfulness.ts`
- Unified runner:
  - `src/task2/tests/runAllTests.ts`

```
=== Detailed report: all categories ===
Total: 10
Correct: 10
Precision: 1.000

[OK] expected=INFORMATION-TECHNOLOGY predictedAny=AVIATION, INFORMATION-TECHNOLOGY, DESIGNER, CONSULTANT, CHEF ids=23464505, 83816738, 85101052, 22351830, 28176889
  query: Senior Java Spring backend engineer with REST APIs and microservices
[OK] expected=INFORMATION-TECHNOLOGY predictedAny=INFORMATION-TECHNOLOGY, ENGINEERING, BPO, INFORMATION-TECHNOLOGY, DESIGNER ids=83816738, 26456899, 41152404, 20674668, 13557622
  query: Frontend developer with React, TypeScript, and modern UI testing
[OK] expected=HR predictedAny=HR, HEALTHCARE, HEALTHCARE, CONSULTANT, INFORMATION-TECHNOLOGY ids=18297650, 17864043, 26908066, 39441617, 26480367
  query: Technical recruiter focused on IT hiring and candidate sourcing
[OK] expected=HR predictedAny=HR, HR, HR, HR, HR ids=18316239, 87968870, 15375009, 93112113, 23914451
  query: HR generalist with onboarding, employee relations, and policy management
[OK] expected=BUSINESS-DEVELOPMENT predictedAny=BUSINESS-DEVELOPMENT, BUSINESS-DEVELOPMENT, ARTS, SALES, SALES ids=39875803, 14752209, 25157655, 37735467, 10464113
  query: Sales manager skilled in account growth, upselling, and client retention
[OK] expected=SALES predictedAny=BUSINESS-DEVELOPMENT, SALES, SALES, SALES, SALES ids=13574264, 29928796, 40987524, 17410700, 20423658
  query: Retail sales representative with lead generation and closing experience
[OK] expected=AVIATION predictedAny=AVIATION, AVIATION, AVIATION, AVIATION, AVIATION ids=42546558, 29221006, 22232367, 77626587, 21287405
  query: Commercial pilot with flight operations, safety checks, and multilingual communication
[OK] expected=AVIATION predictedAny=AVIATION, AVIATION, AVIATION, AVIATION, AVIATION ids=82738323, 11752500, 11804712, 91431878, 92283635
  query: Aircraft maintenance specialist with avionics troubleshooting and FAA compliance
[OK] expected=HEALTHCARE predictedAny=ARTS, HEALTHCARE, HEALTHCARE, FITNESS, TEACHER ids=24061629, 20736486, 16132195, 10969918, 69005326
  query: Certified nursing assistant for hospital patient care and vital signs monitoring
[OK] expected=HEALTHCARE predictedAny=ADVOCATE, ADVOCATE, FITNESS, HEALTHCARE, HEALTHCARE ids=27182111, 37640804, 24219583, 14667957, 16132195
  query: Nurse with emergency triage and inpatient care experience


=== Recall@K report ===
Total queries: 10
Average recall: 0.677

[id] recall=1.000 matched=2/2 query=Senior Java Spring backend engineer with REST APIs and microservices
[id] recall=1.000 matched=1/1 query=Frontend developer with React, TypeScript, and modern UI testing
[id] recall=0.500 matched=1/2 query=Technical recruiter focused on IT hiring and candidate sourcing
[id] recall=0.600 matched=3/5 query=HR generalist with onboarding, employee relations, and policy management
[id] recall=0.000 matched=0/1 query=Sales manager skilled in account growth, upselling, and client retention
[id] recall=1.000 matched=1/1 query=Retail sales representative with lead generation and closing experience
[category] recall=1.000 matched=1/1 query=Commercial pilot with flight operations, safety checks, and multilingual communication
[id] recall=1.000 matched=1/1 query=Aircraft maintenance specialist with avionics troubleshooting and FAA compliance
[id] recall=0.000 matched=0/3 query=Certified nursing assistant for hospital patient care and vital signs monitoring
[id] recall=0.667 matched=2/3 query=Nurse with emergency triage and inpatient care experience

=== Faithfulness report ===
Total queries: 10
Unsupported answers: 5/10
Average faithfulness score: 0.470

[UNSUPPORTED] score=0.000 query=Senior Java Spring backend engineer with REST APIs and microservices
  reason: The CONTEXT does not mention any candidate numbered 83816738 or provide evidence about such a candidate having over 3 years of experience and the specific skills and qualifications stated in the CLAIM.
[SUPPORTED] score=0.900 query=Frontend developer with React, TypeScript, and modern UI testing
  reason: Candidate 83816738 has over 3 years of experience in software development including both frontend and backend using Java and frameworks such as ReactJS and AngularJS. The candidate has worked extensively with frontend UI technologies and testing automation tools like Selenium and Cucumber, aligning well with the frontend developer role focused on React and TypeScript with UI testing. Although TypeScript is not explicitly mentioned, the overall experience and skills strongly support the claim that the candidate is a good fit.
[SUPPORTED] score=0.950 query=Technical recruiter focused on IT hiring and candidate sourcing
  reason: Candidate 18297650 has 10+ years of specialized experience in IT recruiting covering software engineering, database, network, and security roles with extensive hands-on recruiting, use of relevant tools (e.g., Taleo), and leadership responsibilities, strongly supporting the claim's details.
[SUPPORTED] score=0.950 query=HR generalist with onboarding, employee relations, and policy management
  reason: Candidate 18316239 has over 9 years of HR generalist experience and possesses relevant skills with HRIS systems UltiPro and PeopleSoft. The context details demonstrated success in employee recruitment, retention (notably an 89% retention rate), policy development, training, and relevant certification (PHR), aligning well with the vacancy requirements for onboarding, employee relations, and policy management.
[UNSUPPORTED] score=0.000 query=Sales manager skilled in account growth, upselling, and client retention
  reason: The CONTEXT does not provide any information about Candidate 14752209 outperforming other candidates or explicitly showing very strong skills match in business development, extensive relevant experience particularly in account and sales management roles, excellent domain alignment in retail and consumer packaged goods, or seniority as director managing large teams and major accounts. The evaluation must be strict and limited to the provided CONTEXT, which lacks comparative or conclusive details to support the CLAIM.
[SUPPORTED] score=0.950 query=Retail sales representative with lead generation and closing experience
  reason: Context confirms Candidate 13574264 is a Business Development Director since January 2010, leading 52 employees with significant P&L responsibility at a $45MM automotive dealership. The candidate has over 15 years of relevant experience including sales manager roles since 2004 in automotive sales and business development, strong domain alignment with automotive dealership operations, and exceptional skills match with CRM tools such as DealerSocket as described.
[SUPPORTED] score=0.950 query=Commercial pilot with flight operations, safety checks, and multilingual communication
  reason: Candidate 42546558's experience as an Aviation Operation Specialist includes managing sensitive flight data, communication with aviators, maintenance crews, and use of digital mapping systems. The candidate holds secret security clearance and has leadership and training experience. Additionally, bilingual skills in English/Spanish are noted. This matches the vacancy requirements closely.
[UNSUPPORTED] score=0.000 query=Aircraft maintenance specialist with avionics troubleshooting and FAA compliance
  reason: The context provides a detailed profile of candidate 11804712, including supervisory experience managing over 200 technicians, expertise in troubleshooting mechanical and electrical systems including avionics, and a strong educational background. However, it does not explicitly mention FAA compliance or provide comparative scores reflecting superior skills match, depth of experience, domain knowledge, and seniority compared to other candidates, as stated in the claim. Without explicit evidence for FAA compliance and comparative scores, the claim is not fully supported by the context.
[UNSUPPORTED] score=0.000 query=Certified nursing assistant for hospital patient care and vital signs monitoring
  reason: The context describes Candidate 20736486's background and roles but does not compare their overall scores or explicitly state they have the highest overall scores or the best fit compared to other candidates. There is no direct evidence validating the claim of highest scores, strongest alignment, or comprehensive experience superiority.
[UNSUPPORTED] score=0.000 query=Nurse with emergency triage and inpatient care experience
  reason: The CONTEXT does not provide explicit scores or comparative rankings for Candidate 27182111 across all criteria as described in the CLAIM. While detailed experience is given, the exact scores and the statement that the candidate has the highest scores on all criteria and is a perfect match are not evidenced.

=== Combined summary ===
Precision (category): 1.000
Recall@K: 0.677
Faithfulness: 0.470

```

## Optional (Ninja) Challenges

### Corpus update handling w/o Vector DB rebuild

Implemented in `src/task2/core/ingest.ts`:

- Incremental sync based on content hash
- Upsert only changed/new records
- Delete removed records
- Persist state file: `src/task2/output/corpus-state.json`

### Access control aware RAG

Implemented in retrieval API:

- `retrieve(query, k, categories?)` accepts allowed category list
- Uses vector-store filter (`$in`) to emulate user access scope
- Used in `src/task2/app/main.ts` via hardcoded `allowedCategories`

### Evaluate RAG: precision, recall, faithfulness/groundedness

Implemented:

- Precision, Recall, Faithfulness scripts
- All-in-one execution script

## Datasets

- Resume corpus (local CSV):
  - `src/task2/data/resume.csv`
- Evaluation set (labeled test prompts):
  - `src/task2/tests/evalDataset.ts`

## How to Run

### 1) Generate analysis output JSON

```bash
npx ts-node src/task2/app/main.ts
```

Output files:

- `src/task2/output/data.json`
- `src/task2/output/corpus-state.json`

### 2) Open dashboard

Open in browser:

- `src/task2/ui/index.html`

The dashboard reads:

- `src/task2/output/data.json`

### 3) Run evaluation metrics

`src/task2/tests/runAllTests.ts`


## Environment Variables

Required in `.env`:

- `OPENAI_API_KEY`
- `CHROMA_API_KEY`
- `CHROMA_TENANT`
