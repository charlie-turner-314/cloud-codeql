#!/bin/bash

set -e
trap 'echo "An error occurred on line $LINENO." >&2' ERR

REPO_URL=$1
LANGUAGE=$2
JOB_ID=$3
REPO_NAME=$(basename "$REPO_URL" .git)
JOB_DIR="codeqlrepos/$JOB_ID"

mkdir -p "$JOB_DIR"
cd "$JOB_DIR"

echo "cloning codebase" > "progress.txt"
git clone "$REPO_URL"

cd "$REPO_NAME"

echo "creating database" > "../progress.txt"
codeql database create codeql-db --language="$LANGUAGE" --ram 512 -J-Xmx1G

echo "analysing database" > "../progress.txt"
codeql database analyze codeql-db --format=csv --output="../codeql-results.csv" --ram 512 -J-Xmx1G

echo "complete" > "../progress.txt"