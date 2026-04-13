async function loadData() {
    const res = await fetch("../output/data.json");
    return res.json();
}

function computeTotal(scores) {
    return (
        scores.skillsMatch * 0.4 +
        scores.experience * 0.3 +
        scores.domain * 0.2 +
        scores.seniority * 0.1
    );
}

function renderBest(best, candidates) {
    document.getElementById("bestName").innerHTML =
        `${best.candidateId} 
     <span class="badge">BEST MATCH</span>`;

    const bestCandidateDetails = candidates.find(
        c => c.candidateId === best.candidateId
    );
    const evaluation = bestCandidateDetails?.evaluation ?? {};

    const reasonBlocks = [
        {
            title: "Skills",
            value: evaluation.skillsMatch ?? bestCandidateDetails?.reasonSkillsMatch
        },
        {
            title: "Experience",
            value: evaluation.experience ?? bestCandidateDetails?.reasonExperience
        },
        {
            title: "Domain",
            value: evaluation.domain ?? bestCandidateDetails?.reasonDomain
        },
        {
            title: "Seniority",
            value: evaluation.seniority ?? bestCandidateDetails?.reasonSeniority
        }
    ]
        .map(section =>
            section.value
                ? `<div><strong>${section.title}:</strong> ${section.value}</div>`
                : ""
        )
        .join("");

    document.getElementById("bestReason").innerHTML =
        `<div>${best.reason}</div>${reasonBlocks ? `<hr>${reasonBlocks}` : ""}`;
}

function renderBarChart(candidates, bestId) {
    const sorted = [...candidates].sort(
        (a, b) => computeTotal(b.scores) - computeTotal(a.scores)
    );

    const labels = sorted.map(c => c.candidateId);
    const values = sorted.map(c => computeTotal(c.scores));

    new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Total Score",
                data: values,
                backgroundColor: sorted.map(c =>
                    c.candidateId === bestId ? "gold" : "lightgray"
                )
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

function renderRadarChart(candidates) {
    const labels = ["Skills", "Experience", "Domain", "Seniority"];

    const datasets = candidates.map(c => ({
        label: c.candidateId,
        data: [
            c.scores.skillsMatch,
            c.scores.experience,
            c.scores.domain,
            c.scores.seniority
        ]
    }));

    new Chart(document.getElementById("radarChart"), {
        type: "radar",
        data: {
            labels,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            scales: {
                r: {
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        stepSize: 20,
                        backdropColor: "transparent",
                        font: {
                            size: 10
                        }
                    },
                    pointLabels: {
                        font: {
                            size: 12
                        }
                    }
                }
            },

            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 11
                        },
                        boxWidth: 12
                    }
                }
            }
        }
    });
}

async function init() {
    const data = await loadData();

    renderBest(data.bestCandidate, data.candidates);

    renderBarChart(data.candidates, data.bestCandidate.candidateId);

    renderRadarChart(data.candidates);
}

init();
