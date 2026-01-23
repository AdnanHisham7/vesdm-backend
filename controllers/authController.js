const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const setup = async (req, res) => {
  const { email, password, name } = req.body;
  console.log(email, password, name);
  if (!email || !password)
    return res.status(400).json({ msg: "Provide email and password" });

  const count = await User.countDocuments({});
  if (count > 0)
    return res.status(400).json({ msg: "Initial setup already completed" });

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  const user = await User.create({
    email,
    password: hashed,
    name,
    role: "admin",
  });

  res.json({ msg: "Initial admin created successfully" });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ msg: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  res.json({
    token,
    user: { id: user._id, email: user.email, name: user.name, role: user.role },
  });
};

const getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json({
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role 
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = { setup, login, getMe };
