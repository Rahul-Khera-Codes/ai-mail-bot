import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";   

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            // 🔹 profile contains Google user info
            const user = {
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                photo: profile.photos[0].value,
            };

            // TODO: save/find user in DB
            return done(null, user);
        }
    )
);

// session support
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
