const Resource = require("../models/Resource");
const Student = require("../models/Student");

const getMyDashboard = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id })
    .populate("enrolledCourses.course");

  if (!student) {
    return res.status(404).json({ msg: "Student not found" });
  }

  const certificatesCount = student.enrolledCourses.filter(
    (enrollment) => enrollment.certificate?.file
  ).length;

  res.json({
    enrolledCount: student.enrolledCourses.length,
    ongoingCount: student.enrolledCourses.filter((e) => e.status === "ongoing").length,
    completedCount: student.enrolledCourses.filter((e) => e.status === "completed").length,
    certificatesCount,
    resultsCount: student.exams.length,
    registrationNumber: student.registrationNumber || "Not assigned",
    studentName: student.name,
  });
};

const getMyCourses = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id }).populate(
    "enrolledCourses.course",
  );

  // console.log(student);
  if (!student) return res.status(404);

  const courses = student.enrolledCourses.map((e) => ({
    id: e.course._id,
    name: e.course.name,
    type: e.course.type,
    description: e.course.description,
    duration: e.course.duration,
    fee: e.course.fee,
    progress: e.progress,
    status: e.status,
    enrollmentDate: e.enrollmentDate,
  }));
  // console.log(courses, "Courses")
  res.json(courses);
};

const getMyCourseDetails = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id }).populate(
    "enrolledCourses.course",
  );
  if (!student) return res.status(404);

  const enrollment = student.enrolledCourses.find(
    (e) => e.course._id.toString() === req.params.courseId,
  );
  if (!enrollment)
    return res.status(404).json({ msg: "Not enrolled in this course" });

  res.json({
    course: enrollment.course,
    enrollment: {
      progress: enrollment.progress,
      status: enrollment.status,
      enrollmentDate: enrollment.enrollmentDate,
    },
  });
};

const getMyProfile = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id }).populate(
    "enrolledCourses.course",
  );
  if (!student) return res.status(404);

  res.json(student);
};

const updateMyProfile = async (req, res) => {
  const allowed = ["name", "email", "phone"];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const student = await Student.findByIdAndUpdate(req.user._id, updates, {
    new: true,
  });
  res.json(student);
};

const getMyCertificates = async (req, res) => {
  console.log(req.user);
  const student = await Student.findOne({ user: req.user._id });
  console.log("MY CERTFICATES", student);
  res.json(student.certificates || []);
};

const getMyResults = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate({
        path: "exams.examId",
        select: "name subject date course totalMarks",   // ← added totalMarks here
        populate: { path: "course", select: "name" }
      })
      .populate("exams.course", "name");

    if (!student) return res.status(404).json({ msg: "Student not found" });

    const results = student.exams
      .filter((e) => e.publishedDate && e.examId)
      .map((e) => {
        const courseData = e.examId.course || e.course;

        return {
          examId: e.examId._id,
          examName: e.examId.name,
          subject: e.examId.subject || "-",
          marks: e.marks,
          totalMarks: e.examId.totalMarks,           // ← now available
          grade: e.grade,
          publishedDate: e.publishedDate,
          course: courseData
        };
      });

    res.json(results);
  } catch (err) {
    console.error("Error in getMyResults:", err);
    res.status(500).json({ msg: err.message });
  }
};

const getMyResources = async (req, res) => {
  try {
    const { courseId } = req.query;

    const student = await Student.findOne({ user: req.user._id }).populate(
      "enrolledCourses.course",
    );

    if (!student) {
      return res.status(404).json({ msg: "Student profile not found" });
    }

    // Check enrollment for specific courseId
    if (courseId) {
      const isEnrolled = student.enrolledCourses.some(
        (e) => e.course._id.toString() === courseId,
      );

      if (!isEnrolled) {
        return res.status(403).json({ msg: "Not enrolled in this course" });
      }

      const resources = await Resource.find({ course: courseId })
        .populate("course", "name")
        .sort({ uploadDate: -1 });

      return res.json(resources);
    }

    // All resources from all enrolled courses (no courseId provided)
    if (student.enrolledCourses.length === 0) {
      return res.json([]);
    }

    const enrolledCourseIds = student.enrolledCourses.map((e) => e.course._id);

    const resources = await Resource.find({
      course: { $in: enrolledCourseIds },
    })
      .populate("course", "name")
      .sort({ uploadDate: -1 });

    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  getMyDashboard,
  getMyCourses,
  getMyCourseDetails,
  getMyProfile,
  updateMyProfile,
  getMyCertificates,
  getMyResults,
  getMyResources,
};
