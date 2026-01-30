import { Router } from "express";
import passport from "passport";
import {
    googleAuth,
    googleCallback,
    dashboard,
    logout,
} from "../controller/authController.js";

const router = Router();

// Start Google login
router.get("/google", googleAuth);

// Google callback
router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    googleCallback
);

// Protected route
router.get("/dashboard", dashboard);

// Logout
router.get("/logout", logout);

export default router;
