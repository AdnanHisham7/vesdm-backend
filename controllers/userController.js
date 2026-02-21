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

  const user = await User.create({
    email,
    password: hashed,
    name,
    role: "franchisee",
  });

  console.log(process.versions);
  // Send credentials email
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { 
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Franchisee Account Credentials",
    text: `Hello ${name},

Your franchisee account has been created.

Login details:
Email: ${email}
Temporary Password: ${plainPassword}

Login here: ${process.env.FRONTEND_URL || "http://localhost:3000"}/login

Please change your password after logging in.

Best regards,
The Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send email:", error);
    // Still return success – admin can resend manually if needed
  }

  res.json({
    msg: "Franchisee created successfully. Credentials sent to email.",
    user: { email: user.email, name: user.name },
  });
};

const getUsers = async (req, res) => {
  const users = await User.find({ role: "franchisee" }).select("-password");
  res.json(users);
};

module.exports = { createUser, getUsers };
