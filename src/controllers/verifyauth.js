const jwt = require("jsonwebtoken");

const verifyauth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ status: false, message: "No token provided" });
        }
        const decoded = await jwt.verify(token, process.env.KEY);
        console.log(decoded)
        req.user = decoded; // Attach decoded user data to the request
        next();
    } catch (err) {
        console.log(err);
        return res.status(401).json({ status: false, message: "Invalid or expired token" });
    }
};

module.exports = verifyauth;
