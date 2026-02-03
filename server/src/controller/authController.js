import passport from "passport";
import signature from "cookie-signature";
import User from "../models/userModel.js";

const getConnectSidFromCookie = (cookieHeader = "") => {
    const tokenPair = cookieHeader
        .split(";")
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith("connect.sid="));

    if (!tokenPair) return null;
    return tokenPair.slice("connect.sid=".length);
};

const getSessionIdFromToken = (token) => {
    if (!token) return null;
    const decoded = decodeURIComponent(token);
    const raw = decoded.startsWith("s:") ? decoded.slice(2) : decoded;
    return signature.unsign(raw, process.env.SESSION_SECRET) || null;
};

export const googleAuth = passport.authenticate("google", {
    scope: ["profile", "email"],
});

export const googleCallback = (req, res) => {
    res.redirect(process.env.CLIENT_URL);
};

export const dashboard = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    res.json({
        message: "Logged in successfully 🎉",
        user: req.user,
    });
};

export const logout = (req, res) => {
    req.logout(() => {
        res.redirect(process.env.CLIENT_URL);
    });
};

export const sessionUser = async (req, res) => {
    const token =
        req.body?.token ||
        req.headers["x-connect-sid"] ||
        req.query?.token ||
        getConnectSidFromCookie(req.headers.cookie);

    const sessionId = getSessionIdFromToken(token);
    if (!sessionId) {
        return res.status(401).json({ message: "Login required" });
    }

    req.sessionStore.get(sessionId, async (err, session) => {
        if (err || !session) {
            return res.status(401).json({ message: "Login required" });
        }

        const userId = session?.passport?.user;
        if (!userId) {
            return res.status(401).json({ message: "Login required" });
        }

        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(401).json({ message: "Login required" });
            }

            return res.json({ user });
        } catch (error) {
            return res.status(500).json({ message: "Failed to load user" });
        }
    });
};
