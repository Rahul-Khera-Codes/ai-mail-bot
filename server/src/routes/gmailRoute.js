import { Router } from "express";
import passport from "passport";
import { google } from "googleapis";
import { isAuthenticated } from "../middleware/auth.js";
import GmailConnection from "../models/gmailConnectionModel.js";
import { decrypt } from "../utils/encrypt.js";

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
    (req, res) => {
        res.redirect(`${process.env.CLIENT_URL}/gmail-connected`);
    }
);

//for demo only to fetch the data from mail
router.get("/messages", isAuthenticated, async (req, res) => {
    try {
        const adminUserId = req.user?.id;
        const connection = await GmailConnection.findOne({
            admin_user_id: adminUserId,
        }).sort({ updatedAt: -1 });

        if (!connection) {
            return res
                .status(404)
                .json({ message: "No Gmail connection found" });
        }

        const refreshToken = decrypt(connection.refresh_token);
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI || "/auth/gmail/callback"
        );

        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const gmail = google.gmail({ version: "v1", auth: oauth2Client });

        const maxResults = Math.min(
            Math.max(parseInt(req.query.maxResults, 10) || 20, 1),
            100
        );
        const fetchAll = req.query.all === "true";
        const maxTotal = Math.max(parseInt(req.query.maxTotal, 10) || 200, 1);

        const labelIds = req.query.labelIds
            ? req.query.labelIds.split(",").filter(Boolean)
            : undefined;

        const q = req.query.q || undefined;

        const collectMessages = async () => {
            const allMessages = [];
            let nextPageToken = req.query.pageToken || undefined;

            do {
                const listRes = await gmail.users.messages.list({
                    userId: "me",
                    maxResults,
                    pageToken: nextPageToken,
                    q,
                    labelIds,
                });

                const messages = listRes.data.messages || [];
                allMessages.push(...messages);
                nextPageToken = listRes.data.nextPageToken;

                if (!fetchAll) {
                    return {
                        messages,
                        nextPageToken,
                        resultSizeEstimate: listRes.data.resultSizeEstimate,
                    };
                }
            } while (fetchAll && nextPageToken && allMessages.length < maxTotal);

            return {
                messages: allMessages.slice(0, maxTotal),
                nextPageToken: fetchAll ? nextPageToken : undefined,
                resultSizeEstimate: allMessages.length,
            };
        };

        const { messages, nextPageToken, resultSizeEstimate } =
            await collectMessages();

        const messageDetails = await Promise.all(
            messages.map(async (msg) => {
                const detail = await gmail.users.messages.get({
                    userId: "me",
                    id: msg.id,
                    format: "metadata",
                    metadataHeaders: ["Subject", "From", "Date"],
                });

                const headers = detail.data.payload?.headers || [];
                const headerMap = headers.reduce((acc, header) => {
                    acc[header.name] = header.value;
                    return acc;
                }, {});

                return {
                    id: detail.data.id,
                    threadId: detail.data.threadId,
                    snippet: detail.data.snippet,
                    subject: headerMap.Subject || "",
                    from: headerMap.From || "",
                    date: headerMap.Date || "",
                };
            })
        );

        return res.json({
            messages: messageDetails,
            nextPageToken,
            resultSizeEstimate,
            fetchedCount: messageDetails.length,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch Gmail messages",
            error: error.message,
        });
    }
});

export default router;
