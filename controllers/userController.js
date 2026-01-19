const User = require("../models/User");
const bcrypt = require("bcryptjs");

const createUser = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password)
    return res.status(400).json({ msg: "Provide email and password" });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ msg: "User already exists" });

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  const user = await User.create({
    email,
    password: hashed,
    name,
    role: "franchisee",
  });

  res.json({
    msg: "Franchisee created",
    user: { email: user.email, name: user.name },
  });
};

const getUsers = async (req, res) => {
  const users = await User.find({ role: "franchisee" }).select("-password");
  res.json(users);
};

module.exports = { createUser, getUsers };
