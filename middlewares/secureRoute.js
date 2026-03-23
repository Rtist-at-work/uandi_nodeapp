const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// const secureRoute = async (req, res, next) => {
//   try {
//     let token = req.cookies?.auth_token;

//     if (!token) {
//      next()
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id)
//     // const user = await User.findById(decoded.userId).select("-password");

//     if (!user) {
//       const err = new Error("Unauthorized access - user not found");
//       err.statusCode = 401;
//       throw err;
//     }

//     req.userId = decoded.userId;

//     next();
//   } catch (error) {
//     return res.status(401).json({ error: "Unauthorized Please Login" });
//   }
// };

const secureRoute = {
  optionalAuth: (req, res, next) => {
    const token = req.cookies?.auth_token;
    console.log('token :', token)
    if (!token) {
      req.user = {id : null, role : null};
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id, role: decoded.role }; // userId, role
      next();
    } catch (err) {
      req.user = {id : null, role : null};
      next();
    }
  },

  requireAuth: (req, res, next) => {

    const token = req.cookies?.auth_token;

    console.log('token :', token)

    if (!token) {
      return res.status(401).json({ message: "Login required" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded)
      req.user = { id: decoded.id, role: decoded.role };
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  },
};

module.exports = secureRoute;
