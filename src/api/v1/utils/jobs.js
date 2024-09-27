import mysql from 'mysql2/promise';
import { getDbCredentials } from './dbCredentials.js';
import log from '../../../log.js';

async function connectToDatabase() {
  console.log('Getting credentials...');
  const credentials = await getDbCredentials();
  console.log('Creating connection', credentials);
  const connection = await mysql.createConnection({
    host: credentials.host,
    user: credentials.username,
    password: credentials.password,
    database: credentials.dbname,
    port: credentials.port,
  });
  console.log('Connection created');
  return connection;
}

export async function initializeDatabase() {
  console.log('Initializing database...');
  const connection = await connectToDatabase();
  console.log('Connected to database.');

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS jobs (
      jobid VARCHAR(255) PRIMARY KEY,
      user VARCHAR(255) NOT NULL,
      language VARCHAR(50),
      repo VARCHAR(255),
      status VARCHAR(50),
      submitted DATETIME,
      completed DATETIME
    );
  `;

  await connection.execute(createTableQuery);
  await connection.end();
}

export const upsertJob = async (job) => {
  const connection = await connectToDatabase();

  const upsertQuery = `
    INSERT INTO jobs (jobid, user, language, repo, status, submitted, completed)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      user = VALUES(user),
      language = VALUES(language),
      repo = VALUES(repo),
      status = VALUES(status),
      submitted = VALUES(submitted),
      completed = VALUES(completed);
  `;

  const values = [
    job.jobid,
    job.user,
    job.language,
    job.repo,
    job.status,
    job.submitted ? new Date(job.submitted) : null,
    job.completed ? new Date(job.completed) : null,
  ];

  await connection.execute(upsertQuery, values);
  await connection.end();
};

export const getJobs = async () => {
  const connection = await connectToDatabase();
  const [rows] = await connection.execute('SELECT * FROM jobs');
  await connection.end();
  return rows;
};

export const getJob = async (jobid) => {
  const connection = await connectToDatabase();
  const [rows] = await connection.execute('SELECT * FROM jobs WHERE jobid = ?', [jobid]);
  await connection.end();
  return rows[0];
};

export const getUsersJobs = async (user) => {
  const connection = await connectToDatabase();
  const [rows] = await connection.execute('SELECT * FROM jobs WHERE user = ?', [user]);
  await connection.end();
  return rows;
};

export const deleteJob = async (jobid) => {
  const connection = await connectToDatabase();
  const [result] = await connection.execute('DELETE FROM jobs WHERE jobid = ?', [jobid]);
  await connection.end();

  // Delete associated files from S3 if necessary

  return result.affectedRows > 0;
};