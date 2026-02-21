const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getMyDashboard,
  getMyCourses,
  getMyCourseDetails,
  getMyProfile,
  updateMyProfile,
  getMyCertificates,
  getMyResults,
  getMyResources,
} = require("../controllers/studentPortalController");

// All routes protected + student only
router.use(protect);
router.use((req, res, next) => {
  if (req.user.role !== "student")
    return res.status(403).json({ msg: "Access denied" });
  next();
});

router.get("/dashboard", getMyDashboard);
router.get("/courses", getMyCourses);
router.get("/courses/:courseId", getMyCourseDetails);
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.get("/certificates", getMyCertificates);
router.get("/results", getMyResults);
router.get("/resources", getMyResources);

module.exports = router;
