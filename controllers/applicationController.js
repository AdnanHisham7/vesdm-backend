const Application = require("../models/Application");
const Student = require("../models/Student");
const { getNextRegistrationNumber } = require("./studentController");

const createApplication = async (req, res) => {
  const { name, email, phone, course, message } = req.body;
  const documents = req.files ? req.files.map((f) => f.filename) : [];

  const application = await Application.create({
    name,
    email,
    phone,
    course,
    message,
    documents,
  });

  res.status(201).json(application);
};

const getApplications = async (req, res) => {
  const applications = await Application.find({ status: "pending" }).populate(
    "course",
    "name"
  );
  res.json(applications);
};

const approveApplication = async (req, res) => {
  const app = await Application.findById(req.params.id);
  if (!app || app.status !== "pending")
    return res.status(400).json({ msg: "Invalid application" });

  const registrationNumber = await getNextRegistrationNumber();

  const student = await Student.create({
    registrationNumber,
    name: app.name,
    email: app.email,
    phone: app.phone,
    course: app.course,
    year: new Date().getFullYear(),
    franchisee: null, // online student
    documents: app.documents,
  });

  app.status = "approved";
  await app.save();

  res.json({ msg: "Application approved", student });
};

const rejectApplication = async (req, res) => {
  const app = await Application.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true }
  );
  res.json({ msg: "Application rejected", app });
};

module.exports = {
  createApplication,
  getApplications,
  approveApplication,
  rejectApplication,
};
