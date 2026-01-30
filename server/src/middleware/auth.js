const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        const acceptHeader = req.headers.accept || "";
        const wantsHtml = acceptHeader.includes("text/html");

        if (wantsHtml) {
            return res.redirect(`${process.env.CLIENT_URL}/login`);
        }

        return res.status(401).json({ message: "Login required" });
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admins only" });
    }
    next();
};

export { isAuthenticated, isAdmin };