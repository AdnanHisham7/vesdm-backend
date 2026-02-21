const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  createApplication,
  getApplications,
  approveApplication,
  rejectApplication,
} = require("../controllers/applicationController");
const { protect, adminOnly } = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

router.post("/", upload.array("documents", 10), createApplication);
router.get("/", protect, adminOnly, getApplications);
router.post("/:id/approve", protect, adminOnly, approveApplication);
router.post("/:id/reject", protect, adminOnly, rejectApplication);

module.exports = router;
