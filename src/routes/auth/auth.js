/*
    API routes for authentication
*/
import express from "express";
import fs from 'fs'
import log from "../../log.js";
import {
    CognitoIdentityProvider,
    SignUpCommand,
    InitiateAuthCommand,
    RevokeTokenCommand
} from "@aws-sdk/client-cognito-identity-provider";



const router = express.Router();
const cognitoClient = new CognitoIdentityProvider({ region: process.env.COGNITO_REGION });

router.get("/login", (req, res) => {
    log("GET /login")
    res.sendFile("login.html", { root: "src/public" })
})
/* Let the browser fetch the styles and scripts for the login page */
router.get("/styles/main.css", (_, res) => res.sendFile("styles/main.css", { root: "src/public" }));
router.get("/scripts/login.js", (_, res) => res.sendFile("scripts/login.js", { root: "src/public" }));

router.post("/login", async (req, res) => {
    const { email, password } = req.body

    const params = {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.COGNITO_CLIENT_ID,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password
        }
    }

    try {
        const command = new InitiateAuthCommand(params)
        const response = await cognitoClient.send(command);
        res.cookie("session", response.AuthenticationResult.IdToken, { httpOnly: true })
        res.json({ token: response.AuthenticationResult.IdToken })
    }
    catch (error) {
        res.status(400).json({ message: error.toString() })
    }


})

router.post("/register", async (req, res) => {

    const { email, password } = req.body

    const params = {
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
            {
                Name: 'email',
                Value: email
            }
        ]
    }

    try {
        const command = new SignUpCommand(params)
        await cognitoClient.send(command);
        res.json({ message: "User registered successfully, please confirm your email in the aws console" })

    } catch (error) {
        console.log(error)
        // if the error contains "LimitExceededException" then consider it a success.
        res.status(400).json({ message: error.toString() })
    }
})

router.get("/logout", (req, res) => {
    // TODO: Revoke a refresh token if used
    // revoke the token and clear the cookie
    // console.log(req.cookies.session)
    // const params = {
    //     Token: req.cookies.session,
    //     ClientId: process.env.COGNITO_CLIENT_ID
    // }
    // const command = new RevokeTokenCommand(params)
    // cognitoClient.send(command)
    res.clearCookie("session")
    res.redirect("/")
});


router.get("/", (req, res, next) => { next() })


export default router