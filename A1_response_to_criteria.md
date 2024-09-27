# Assignment 1 - Web Server - Response to Criteria

## Overview

- **Name:** Charlie Turner
- **Student number:** n10752846
- **Application name:** Static Code Analysis
- **Two line description:** This app allows users to run static code analysis on their codebase,
  allowing them to specify a github repository to analyse. They can download the results of the analysis.

## Core criteria

### Docker image

- **ECR Repository name:** ecr-n10752846
- **Video timestamp:** 0:15
- **Relevant files:**
  - ./Dockerfile
  - ./.dockerignore
  - ./build_push_docker.sh

### Docker image running on EC2

- **EC2 instance ID:** i-0c8ba98191867d8c2
- **Video timestamp:** 0:20

### User login functionality

- **One line description:** CSV user credentials, absolutely not secure. JWT cookies for session, same token used for API auth.
- **Video timestamp:** 0:35
- **Relevant files:**
  - /src/routes/auth/auth.js
  - /src/middleware/auth.js
  - /src/api/v1/middleware/auth.js

### User dependent functionality

- **One line description:** Users own 'jobs' which are the source code and resulting analysis. Users can only view, download and delete their own jobs.
- **Video timestamp:** 0:50
- ## **Relevant files:**
  - /src/data/jobs.csv
  - /src/api/v1/router.js
  - /src/api/v1/utils/jobs.js

### Web client

- **One line description:** Two-page web client using HTML/CSS/JS. One for authentication and one for application.
- **Video timestamp:** 0:40
- ## **Relevant files:**
  - /src/public/
  - /src/server.js

### REST API

- **One line description:** REST API with noun endpoints and HTTP methods for CRUD operations on jobs. Status codes used to indicate success/failure/missing resources.
- **Video timestamp:** 1:35
- ## **Relevant files:**
  - /src/api/v1/router.js
  - /src/api/v1/

### Two kinds of data

#### First kind

- **One line description:** Job metadata. User ownership of jobs and job status.
- **Type:** Structured
- **Rationale:** Job metadata is stored in a CSV file. This is a simple and effective way to store structured data and allows for easy integration of a database in future.
- **Video timestamp:** 2:10
- ## **Relevant files:**
  - /src/data/jobs.csv
  - /src/api/v1/utils/jobs.js

#### Second kind

- **One line description:** Source code and analysis results.
- **Type:** Unstructured
- **Rationale:** Source code is a collection of files which does not require database storage. Analysis results are stored alongside the source code (to allow possibility of using SARIF or CSV output) but could be moved to a database in future.
- **Video timestamp:** 2:25
- ## **Relevant files:**
  - /src/api/v1/utils/codeql.js
  - /src/run_codeql.sh
  - /src/api/v1/utils/jobs.js

### CPU intensive task

- **One line description:** CodeQL analysis of source code.
- **Video timestamp:** 3:20
- ## **Relevant files:**
  - /src/run_codeql.sh
  - /src/api/v1/utils/codeql.js

### CPU load testing method

- **One line description:** Manual job submission with a reasonably sized codebase. Monitoring CPU usage with 'top'. API can be used to automate if larger scale testing is required.
- **Video timestamp:** 3:00
- ## **Relevant files:**
  - N/A - manual testing through client

## Additional criteria

### Extensive REST API features

- **One line description:** Versioned (v1) and middleware used for authenticating requests (but not much more than that so can't really claim it)
- **Video timestamp:**
- ## **Relevant files:**

### Use of external API(s)

- **One line description:** Not attempted
- **Video timestamp:**
- ## **Relevant files:**

### Extensive web client features

- **One line description:** Not attempted
- **Video timestamp:**
- ## **Relevant files:**

### Sophisticated data visualisations

- **One line description:** Not attempted
- **Video timestamp:**
- ## **Relevant files:**

### Additional kinds of data

- **One line description:** Not attempted
- **Video timestamp:**
- ## **Relevant files:**

### Significant custom processing

- **One line description:** Not attempted
- **Video timestamp:**
- ## **Relevant files:**

### Live progress indication

- **One line description:** Web client polls API for job status and updates progress bar accordingly during analysis. Shell script used to update job status during analysis steps.
- **Video timestamp:** 3:15
- ## **Relevant files:**
  - /src/public/scripts/index.js
  - /src/api/v1/router.js
  - /src/run_codeql.sh

### Infrastructure as code

- **One line description:** Not attempted
- **Video timestamp:**
- ## **Relevant files:**

### Other

- **One line description:** Not attempted
- **Video timestamp:**
- ## **Relevant files:**
