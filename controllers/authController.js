const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

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

  if (!email || !password) return res.status(400).json({ msg: "Provide credentials" });

  // Try admin/franchisee
  let user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "30d" });
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  }

  // Try student
  const query = email.includes('@') ? { email } : { registrationNumber: email.toUpperCase() };
  const student = await Student.findOne(query);
  if (student && student.password && await bcrypt.compare(password, student.password)) {
    const token = jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: "30d" });
    return res.json({
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: 'student',
        regNumber: student.registrationNumber
      }
    });
  }

  res.status(400).json({ msg: "Invalid credentials" });
};

const getMe = async (req, res) => {
  if (req.role === 'student') {
    const student = await Student.findById(req.userId).select('-password');
    if (!student) return res.status(404).json({ msg: "Not found" });
    return res.json({
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: 'student',
        regNumber: student.registrationNumber
      }
    });
  }

  const user = await User.findById(req.userId).select('-password');
  if (!user) return res.status(404).json({ msg: "Not found" });
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

module.exports = { setup, login, getMe };
