import dotenv from "dotenv";
dotenv.config();
import "./auth/google.js";
import "./auth/gmail.js";

import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoute.js";
import gmailRoute from "./routes/gmailRoute.js";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

connectDB();

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            sameSite: "lax",     
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

/* ---------- ROUTES ---------- */
app.use("/auth", authRoutes);

app.use("/auth/gmail", gmailRoute);

app.listen(process.env.PORT, () =>
    console.log(`🚀 Server running on ${process.env.PORT}`)
);
