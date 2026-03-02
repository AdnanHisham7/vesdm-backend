const User = require("../models/User");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const generateRandomPassword = (length = 12) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const createUser = async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ msg: "Provide email and name" });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ msg: "User already exists" });

  const plainPassword = generateRandomPassword();
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(plainPassword, salt);

  // 1. Create the user
  const user = await User.create({
    email,
    password: hashed,
    name,
    role: "franchisee",
  });

  // 2. Prepare Email
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { 
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Franchisee Account Credentials",
    text: `Hello ${name}, ... Password: ${plainPassword} ...`,
  };

  // 3. Attempt to send email
  try {
    await transporter.sendMail(mailOptions);
    
    // Success response
    res.json({
      msg: "Franchisee created successfully. Credentials sent to email.",
      user: { email: user.email, name: user.name },
    });

  } catch (error) {
    console.error("Failed to send email, rolling back user creation:", error);
    
    // ROLLBACK: Delete the user we just created so the admin can try again
    await User.findByIdAndDelete(user._id);
    
    return res.status(500).json({ 
      msg: "Failed to send credentials email. User was not created. Please check your SMTP settings and try again." 
    });
  }
};

const getUsers = async (req, res) => {
  const users = await User.find({ role: "franchisee" }).select("-password");
  res.json(users);
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.role === "admin")
      return res.status(403).json({ msg: "Cannot delete an admin account" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "Franchisee deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

module.exports = { createUser, getUsers, deleteUser };
