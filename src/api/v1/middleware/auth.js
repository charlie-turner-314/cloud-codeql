/*
    This middleware is used to authenticate the user using the JWT token attached to the request
*/

import dotenv from "dotenv";
dotenv.config({ override: true });
import { CognitoJwtVerifier } from "aws-jwt-verify";

console.log(process.env.COGNITO_USER_POOL_ID);

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    tokenUse: "id",
    clientId: process.env.COGNITO_CLIENT_ID
});

const AuthTokenMiddleware = async (req, res, next) => {
    console.log("MIDDLEWARE: Authenticating");

    // get the token from the headers
    const auth = req.headers.authorization;
    if (!auth) {
        console.log("No token found");
        return res.status(401).json({ error: "Not authorised" });
    }

    const token = auth.split(' ')[1];

    // verify the token using aws-jwt-verify
    try {
        const payload = await verifier.verify(token);
        req.user = payload.email
        return next();
    } catch (e) {
        console.log("Invalid token", e);
        return res.status(401).json({ error: "Not authorised" });
    }
};


export default AuthTokenMiddleware;