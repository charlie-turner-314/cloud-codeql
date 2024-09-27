/*
    This file contains the API endpoints for the application
*/
import express from "express"
import availableLanguages from "./utils/available_languages.js"
import { analyzeCode, getResults } from "./utils/codeql.js";
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import AuthTokenMiddleware from "./middleware/auth.js";
import {
    deleteJob, getJob, getJobs, getUsersJobs, upsertJob
} from "./utils/jobs.js";
import log from "../../log.js";

const router = express.Router();

router.get("/user", AuthTokenMiddleware, (req, res) => {
    res.json({ user: req.user })
}
)

/*
    Serve the available languages for the application
*/
router.get("/available_languages", AuthTokenMiddleware, availableLanguages)

/*
    Analyse the code from the given github URL
*/
router.post("/jobs", AuthTokenMiddleware, async (req, res) => {
    const jobid = uuidv4();
    const job = {
        jobid,
        user: req.user,
        status: 'in_progress',
        language: req.body.language,
        repo: req.body.githubUrl,
        submitted: new Date().toISOString(),
    };

    await upsertJob(job); // Save to database
    analyzeCode(req.body.githubUrl, req.body.language, jobid); // Start analysis

    res.json({ success: true, message: "Analysis started", jobid });
});

router.get("/jobs", AuthTokenMiddleware, async (req, res) => {
    const user = req.user;
    const jobs = await getUsersJobs(user);
    res.json({ jobs });
});

router.delete("/jobs/:jobid", AuthTokenMiddleware, async (req, res) => {
    const jobid = req.params.jobid;
    const user = req.user;

    const job = await getJob(jobid);
    if (!job || job.user !== user) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const result = await deleteJob(jobid);
    res.json({ success: result });
});



router.get('/results/:jobid', AuthTokenMiddleware, async (req, res) => {
    const jobid = req.params.jobid
    log("GET /results/" + jobid)
    const job = getJob(jobid)
    if (!job) {
        return res.status(404).json({ error: "Job not found" })
    }
    if (job.user !== req.user) {
        return res.status(403).json({ error: "Forbidden" })
    }
    const result = await getResults(jobid)
    res.json(result)
});





export default router
