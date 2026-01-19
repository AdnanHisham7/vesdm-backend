const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token)
    return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  res.status(403).json({ msg: "Admin access required" });
};

const franchiseeOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "franchisee"))
    return next();
  res.status(403).json({ msg: "Access denied" });
};

module.exports = { protect, adminOnly, franchiseeOrAdmin };
