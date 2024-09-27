// dbCredentials.js

import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });

export async function getDbCredentials() {
    const command = new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_NAME });
    try {
        const response = await secretsClient.send(command);
        const secret = JSON.parse(response.SecretString);
        return secret; // Contains username, password, host, port, dbname
    } catch (error) {
        console.error("Error retrieving database credentials:", error);
        throw error;
    }
}