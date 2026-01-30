import passport from "passport";

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
