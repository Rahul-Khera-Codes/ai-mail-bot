import dotenv from "dotenv";
dotenv.config();
import "./auth/google.js";

import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";

import authRoutes from "./routes/authRoute.js";

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

/* ---------- ROUTES ---------- */
app.use("/auth", authRoutes);

app.listen(process.env.PORT, () =>
    console.log(`🚀 Server running on ${process.env.PORT}`)
);
