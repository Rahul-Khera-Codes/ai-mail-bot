import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import GmailConnection from "../models/gmailConnectionModel.js";
import { encrypt } from "../utils/encrypt.js";

passport.use(
    "gmail-connect",
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/gmail/callback",
            accessType: "offline",
            prompt: "consent",
            passReqToCallback: true, 
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                const adminUserId = req.user?.id;
                const googleEmail = profile.emails?.[0]?.value;

                if (!adminUserId) {
                    return done(new Error("No authenticated user found"), null);
                }

                if (!googleEmail) {
                    return done(new Error("No email returned from Google"), null);
                }

                let connection;

                if (refreshToken) {
                    const encryptedToken = encrypt(refreshToken);
                    connection = await GmailConnection.findOneAndUpdate(
                        {
                            admin_user_id: adminUserId,
                            google_account_email: googleEmail,
                        },
                        {
                            refresh_token: encryptedToken,
                            scope: "gmail.readonly",
                            sync_status: "connected",
                        },
                        { upsert: true, new: true }
                    );
                } else {
                    connection = await GmailConnection.findOne({
                        admin_user_id: adminUserId,
                        google_account_email: googleEmail,
                    });

                    if (!connection) {
                        return done(
                            new Error(
                                "No refresh token received. Revoke access and reconnect."
                            ),
                            null
                        );
                    }
                }

                return done(null, connection);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);
