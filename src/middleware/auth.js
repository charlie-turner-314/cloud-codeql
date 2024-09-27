import { CognitoJwtVerifier } from "aws-jwt-verify";

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    tokenUse: "id", // Change to "access" if verifying access tokens
    clientId: process.env.COGNITO_CLIENT_ID,
});

export async function verifyToken(req, res, next) {
    const token = req.cookies.session; // Adjust if your token is stored elsewhere
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const payload = await verifier.verify(token);
        req.user = payload;
        next();
    } catch (err) {
        console.error('Token verification failed:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }
}