import { Router } from "express";
import passport from "passport";
import { isAuthenticated } from "../middleware/auth.js";
import {
    getMessages,
    handleGmailCallback,
    syncMessages,
} from "../controller/gmailController.js";

const router = Router();

router.get(
    "/connect",
    isAuthenticated,
    passport.authenticate("gmail-connect", {
        accessType: "offline",
        prompt: "consent",
        includeGrantedScopes: true,
        scope: [
            "https://www.googleapis.com/auth/gmail.readonly",
            "profile",
            "email",
        ],
    })
);

router.get(
    "/callback",
    passport.authenticate("gmail-connect", {
        failureRedirect: "/error",
    }),
    handleGmailCallback
);

//for demo only to fetch the data from mail
router.get("/messages", isAuthenticated, getMessages);

router.post("/sync", isAuthenticated, syncMessages);

export default router;
