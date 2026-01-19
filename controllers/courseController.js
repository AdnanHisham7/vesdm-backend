const Course = require("../models/Course");

const getCourses = async (req, res) => {
  const courses = await Course.find();
  res.json(courses);
};

const createCourse = async (req, res) => {
  const course = await Course.create(req.body);
  res.status(201).json(course);
};

const getCourse = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ msg: "Course not found" });
  res.json(course);
};

const updateCourse = async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!course) return res.status(404).json({ msg: "Course not found" });
  res.json(course);
};

const deleteCourse = async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) return res.status(404).json({ msg: "Course not found" });
  res.json({ msg: "Course deleted" });
};

module.exports = {
  getCourses,
  createCourse,
  getCourse,
  updateCourse,
  deleteCourse,
};
