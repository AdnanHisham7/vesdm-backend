const express = require("express");
const router = express.Router();
const {
  createAdmission,
  getAdmissions,
  updateAdmissionStatus,
} = require("../controllers/admissionController");

// Public: anyone can apply
router.post("/", createAdmission);

// Protected admin routes (add your admin middleware if you have one)
router.get("/", getAdmissions);
router.patch("/:id/status", updateAdmissionStatus);

module.exports = router;
