const Admission = require("../models/Admission");

const createAdmission = async (req, res) => {
  try {
    const admission = await Admission.create(req.body);
    res
      .status(201)
      .json({ message: "Application submitted successfully", admission });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getAdmissions = async (req, res) => {
  try {
    const admissions = await Admission.find()
      .populate("course")
      .sort({ createdAt: -1 });
    res.json(admissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateAdmissionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    const admission = await Admission.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).populate("course");
    if (!admission)
      return res.status(404).json({ error: "Admission not found" });
    res.json(admission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { createAdmission, getAdmissions, updateAdmissionStatus };
