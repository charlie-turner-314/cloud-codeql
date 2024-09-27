// on page load, fetch the languages and populate the dropdown

window.onload = function () {
    // fill in the user's jobs
    monitorProgress();

    // fill in the languages dropdown
    fetch("/api/v1/available_languages",
        {
            method: "GET",
            headers: {
                "authorization": `Bearer ${localStorage.getItem("token")}`
            }
        }
    )
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                if (data.error.toLowerCase().includes("authorised")) {
                    return window.location.href = "/login";
                }
                document.querySelector("body").innerText = `Internal server error: ${data.error}`;
                return;
            }
            const select = document.getElementById("language-selector");
            data.languages.forEach(language => {
                const option = document.createElement("option");
                option.value = language;
                option.text = language.charAt(0).toUpperCase() + language.slice(1);
                select.appendChild(option);
            });
        }).catch(error => {
            console.error("Error fetching languages", error);
        });

    fetch("/api/v1/user",
        {
            method: "GET",
            headers: {
                "authorization": `Bearer ${localStorage.getItem("token")}`
            }
        }
    ).then(res => res.json()).then(data => {
        if (data.error) {
            if (data.error.toLowerCase().includes("authorised")) {
                return window.location.href = "/login";
            }
            document.querySelector("body").innerText = `Internal server error: ${data.error}`;
            return;
        }
        document.getElementById("username").innerText = data.user;
        document.getElementById("btn-auth").innerText = "Logout";
        document.getElementById("btn-auth").onclick = () => {
            localStorage.removeItem("token");
            window.location.href = "/logout";
        };
    }
    ).catch(error => {
        console.error("Error fetching user", error);
    });

}

function send() {
    const githubUrl = document.getElementById("github-url").value;
    const language = document.getElementById("language-selector").value
    const analysisType = document.querySelector("input[name='analysis-type']").value;
    // const files = document.getElementById("file-upload").files

    fetch("/api/v1/jobs", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
            githubUrl,
            language,
            analysisType,
        })
    }).then(response => response.json()).then(data => {
        if (data.error) {
            document.getElementById("error").innerText = `Error submitting analysis: ${data.error}`;
            return;
        } if (!data.jobid) {
            document.getElementById("error").innerText = `Error submitting analysis: No job ID returned`;
            return;
        }
        monitorProgress(data.jobid);
    }
    ).catch(error => {
        document.getElementById("error").innerText = `Error submitting analysis: ${error}`;
    });
    // send to top of page
    window.scrollTo(0, 0);
}

function monitorProgress() {
    // poll the server for job progress
    setInterval(() => {
        const jobs = populateJobCards();
        // wait for the jobs to render
        const inProgressJobs = jobs?.filter(job => job.status === "in_progress") || [];
    }, 3000); // Poll every 3 seconds
    // run the first time immediately
    populateJobCards();
}

function fetchResults(jobid) {
    // fetch results for a job as a downlaodable csv
    fetch(`/api/v1/results/${jobid}`,
        {
            method: "GET",
            headers: {
                "authorization": `Bearer ${localStorage.getItem("token")}`
            },
        })
        .then(response => response.json())
        .then(data => {
            const url = data.url
            const a = document.createElement("a");
            a.href = url;
            a.download = `results-${jobid}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        }).catch(error => {
            console.error("Error fetching results", error);
        });
}

function populateJobCards() {
    fetch("/api/v1/jobs",
        {
            method: "GET",
            headers: {
                "authorization": `Bearer ${localStorage.getItem("token")}`
            }
        }
    )
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                if (data.error.toLowerCase().includes("authorised")) {
                    return window.location.href = "/login";
                }
                document.querySelector("body").innerText = `Internal server error: ${data.error}`;
                return;
            }
            data.jobs.forEach(job => {
                addOrEditJobCard(job);
            });
            return data.jobs;
        }).catch(error => {
            console.error("Error fetching jobs", error);
        });
}

const jobProgresses = ["cloning codebase", "creating database", "analysing database", "complete"];
const jobProgressWeights = [20, 45, 60, 100];

function addOrEditJobCard(job) {
    // create a job card for the job (or edit an existing if exists)
    const existingJob = document.querySelector(`[data-job-id="${job.jobid}"]`);
    if (existingJob) {
        // edit the existing job card
        existingJob.querySelector(".job-status").innerText = job.status;
        existingJob.querySelector(".job-completed").innerText = job.completed !== "undefined" ? job.completed : "-";
        if (job.status === "complete") {
            existingJob.querySelector(".job-results").style.display = "inline";
            existingJob.querySelector(".job-results").onclick = () => fetchResults(job.jobid);
        } else {
            existingJob.querySelector(".job-results").style.display = "none";
        }

        // if in progress, show the progress bar and update
        if (job.progress) {
            existingJob.querySelector(".progress-bar-container").style.display = "auto";
            const progressIndex = jobProgresses.indexOf(job.progress);
            const progress = jobProgressWeights[progressIndex];
            existingJob.querySelector(".progress-bar").style.width = `${progress}%`;
            existingJob.querySelector(".progress-bar").innerText = job.progress + "...";

        }
        else {
            existingJob.querySelector(".progress-bar-container").style.display = "none";
        }


        return;
    }
    const container = document.getElementById("job-container");
    const template = document.getElementById("job-template");
    const jobCard = template.content.cloneNode(true);

    jobCard.querySelector(".job-card").setAttribute("data-job-id", job.jobid);
    jobCard.querySelector(".job-repo").innerText = job.repo;
    jobCard.querySelector(".job-language").innerText = job.language;
    jobCard.querySelector(".job-status").innerText = job.status;
    jobCard.querySelector(".job-submitted").innerText = job.submitted;
    jobCard.querySelector(".job-completed").innerText = job.completed !== "undefined" ? job.completed : "-";

    // if (job.progress) {
    //     existingJob.querySelector(".progress-bar-container").style.display = "auto";
    //     const progressIndex = jobProgresses.indexOf(job.progress);
    //     const progress = jobProgressWeights[progressIndex];
    //     existingJob.querySelector(".progress-bar").style.width = `${progress}%`;
    //     existingJob.querySelector(".progress-bar").innerText = job.progress + "...";

    // }
    // else {
    //     existingJob.querySelector(".progress-bar-container").style.display = "none";
    // }
    jobCard.querySelector(".job-delete").onclick = () => {
        fetch("/api/v1/jobs/" + job.jobid,
            {
                method: "DELETE",
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("token")}`
                },
            }
        )
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    container.removeChild(container.querySelector(`[data-job-id="${job.jobid}"]`));
                } else {
                    console.error("Error deleting job");
                }
            }).catch(error => {
                console.error("Error deleting job", error);
            });
    };

    if (job.status === "complete") {
        jobCard.querySelector(".job-results").style.display = "inline";
        jobCard.querySelector(".job-results").onclick = () => fetchResults(job.jobid);
    } else {
        jobCard.querySelector(".job-results").style.display = "none";
    }

    container.appendChild(jobCard);
}

function toggleSelected(element) {
    element.style.backgroundColor = "rgb(120, 180, 180)";
    // unselect all other option_select elements
    const allOptions = document.querySelectorAll(".option_select");
    allOptions.forEach((option) => {
        if (option !== element) {
            option.style.backgroundColor = "white";
        }
    });

    // set the hidden input value
    const hiddenInput = document.querySelector("input[name='analysis-type']");
    hiddenInput.value = element.querySelector("h3").innerText.toLowerCase();
};
