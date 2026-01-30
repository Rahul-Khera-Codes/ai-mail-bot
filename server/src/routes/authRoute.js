import { Router } from "express";
import passport from "passport";
import {
    googleAuth,
    googleCallback,
    dashboard,
    logout,
} from "../controller/authController.js";

const router = Router();

router.get("/google", googleAuth);

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    googleCallback
);

router.get("/dashboard", dashboard);

router.get("/logout", logout);

export default router;
