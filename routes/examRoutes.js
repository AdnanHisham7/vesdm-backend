const express = require("express");
const router = express.Router();
const {
  createExam,
  getExams,
  getExamStudents,
  publishResults,
  registerStudents,
  getMyExams,
  getExamRegistrationStatus,
} = require("../controllers/examController");
const { protect, franchiseeOrAdmin, adminOnly } = require("../middleware/auth");

router.use(protect);

router.post("/", adminOnly, createExam);
router.post("/:id/register", franchiseeOrAdmin, registerStudents);
router.get("/", franchiseeOrAdmin, getExams);
router.get("/:id", franchiseeOrAdmin, getMyExams);
router.get("/:id/registration-status", franchiseeOrAdmin, getExamRegistrationStatus);
router.get("/:id/students", franchiseeOrAdmin, getExamStudents);
router.post("/:id/publish", adminOnly, publishResults);

module.exports = router;