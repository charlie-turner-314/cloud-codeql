import dotenv from "dotenv"
const res = dotenv.config({ override: true })

import express from "express"
import api_router from "./api/v1/router.js"
import cookieParser from "cookie-parser";
import AuthTokenMiddleware from "./api/v1/middleware/auth.js"
import authRouter from "./routes/auth/auth.js"
import { initializeDatabase } from './api/v1/utils/jobs.js';

// Initialize the database

await initializeDatabase();

// Start server after initializing the database
const app = express();

// ----- Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ----- REST data API
app.use("/api/v1", AuthTokenMiddleware, api_router)

// ----- Frontend Routes
app.use("/", authRouter, express.static("src/public"))

// ----- Catch all route
app.use((req, res) => {
    res.status(404).send(
        "404: URL Not Found. Redirecting to home page"
    )
})




app.listen(process.env.PORT, () => {
    console.log("Server is running on port 3000")
});