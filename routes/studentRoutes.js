const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  uploadDocuments,
  uploadCertificate,
  uploadMarklist,
  registerExam,
  publishResult,
  verifyCertificate,
  studentAccess,
  enrollExistingStudent,
  getCourseStudents,
} = require("../controllers/studentController");
const { protect, franchiseeOrAdmin } = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Public endpoints
router.post("/verify-certificate", verifyCertificate);
router.post("/student-access", studentAccess);

// Protected endpoints
router
  .route("/")
  .post(protect, franchiseeOrAdmin, createStudent)
  .get(protect, franchiseeOrAdmin, getStudents);

router
  .route("/:id")
  .get(protect, franchiseeOrAdmin, getStudent)
  .put(protect, franchiseeOrAdmin, updateStudent);

router.post(
  "/:id/upload-documents",
  protect,
  franchiseeOrAdmin,
  upload.array("documents", 10),
  uploadDocuments
);
router.post(
  "/:id/upload-certificate",
  protect,
  franchiseeOrAdmin,
  upload.single("certificate"),
  uploadCertificate
);
router.post(
  "/:id/upload-marklist",
  protect,
  franchiseeOrAdmin,
  upload.single("marklist"),
  uploadMarklist
);
router.post("/:id/register-exam", protect, franchiseeOrAdmin, registerExam);
router.post("/:id/publish-result", protect, franchiseeOrAdmin, publishResult);
router.post("/enroll-existing", protect, franchiseeOrAdmin, enrollExistingStudent);
router.get("/course/:courseId/students", protect, franchiseeOrAdmin, getCourseStudents);

module.exports = router;
