const Inquiry = require("../models/Inquiry");

const createInquiry = async (req, res) => {
  const inquiry = await Inquiry.create(req.body);
  res.status(201).json({ msg: "Inquiry submitted successfully" });
};

const getInquiries = async (req, res) => {
  const inquiries = await Inquiry.find().sort({ date: -1 });
  res.json(inquiries);
};

module.exports = { createInquiry, getInquiries };
