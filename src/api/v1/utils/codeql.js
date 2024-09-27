/*
    Utilities for interacting with codeql for analysis
*/
import dotenv from "dotenv"
dotenv.config({ override: true })
import { spawn } from 'child_process'
import fs from 'fs'
import log from '../../../log.js';
import { performance } from 'perf_hooks';
import { upsertJob } from './jobs.js';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    ListBucketsCommand
}
    from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path'

console.log(process.env.AWS_REGION);
const s3Client = new S3Client({ region: process.env.AWS_REGION });


export const analyzeCode = async (repoUrl, language, jobid) => {
    const startTime = performance.now();

    fs.mkdirSync(`codeqlrepos/${jobid}`, { recursive: true, errorOnExist: false });

    const child = spawn('src/run_codeql.sh', [repoUrl, language, jobid]);

    const progressStream = fs.createWriteStream(`codeqlrepos/${jobid}/stdout.txt`, { flags: 'a' });
    const logStream = fs.createWriteStream(`codeqlrepos/${jobid}/stderr.txt`, { flags: 'a' });

    child.stdout.on('data', (data) => {
        const timestamp = new Date().toISOString();
        const lines = data.toString().split('\n');
        lines.forEach((line) => {
            const formattedLine = `${timestamp} ${line}`;
            logStream.write(formattedLine + '\n');
        });
    });
    child.stderr.pipe(logStream);

    child.on('error', (error) => {
        fs.writeFileSync(`codeqlrepos/${jobid}/progress.txt`, 'error');
    });

    child.on('close', async (code) => {
        if (code !== 0) {
            fs.writeFileSync(`codeqlrepos/${jobid}/progress.txt`, 'error');
        } else {
            // Read the analysis result file
            const resultFilePath = `codeqlrepos/${jobid}/codeql-results.csv`;
            const fileContent = fs.readFileSync(resultFilePath);

            // Upload the result file to S3
            const s3Key = `analysis-results/${jobid}/codeql-results.csv`;
            const uploadParams = {
                Bucket: "n10752846-code-analysis-results",
                Key: s3Key,
                Body: fileContent,
            };

            try {
                const command = new PutObjectCommand(uploadParams);
                await s3Client.send(command);
                console.log('Analysis results uploaded to S3.');

                // Optionally, delete local files after uploading
                fs.rmSync(`codeqlrepos/${jobid}`, { recursive: true, force: true });
            } catch (error) {
                console.error('Error uploading to S3:', error);
            }
        }

        // Update job status in your database
        const jobUpdate = {
            jobid,
            completed: new Date().toISOString(),
            status: code === 0 ? 'completed' : 'error',
        };
        await upsertJob(jobUpdate);

        // clean up the codeql analysis files
        // After successful upload
        fs.rmSync(`codeqlrepos/${jobid}`, { recursive: true, force: true });
    });
};

export const getResults = async (jobid) => {
    const s3Key = `analysis-results/${jobid}/codeql-results.csv`;
    const downloadParams = {
        Bucket: "n10752846-code-analysis-results",
        Key: s3Key,
    };

    try {
        const command = new GetObjectCommand(downloadParams);
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        return { downloadUrl: url };
    } catch (error) {
        console.error('Error retrieving from S3:', error);
        return { error: 'Error retrieving analysis results' };
    }
}
