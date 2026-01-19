const express = require("express");
const router = express.Router();
const {
  createInquiry,
  getInquiries,
} = require("../controllers/inquiryController");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/", createInquiry);
router.get("/", protect, adminOnly, getInquiries);

module.exports = router;
