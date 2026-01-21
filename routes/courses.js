const express = require("express");
const router = express.Router();
const {
  getCourses,
  createCourse,
  getCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");
const { protect, adminOnly } = require("../middleware/auth");

router.route("/").get(getCourses).post(protect, adminOnly, createCourse);
router
  .route("/:id")
  .get(getCourse)
  .put(protect, adminOnly, updateCourse)
  .delete(protect, adminOnly, deleteCourse);

module.exports = router;