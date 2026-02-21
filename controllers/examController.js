const Exam = require("../models/Exam");
const Student = require("../models/Student");

// 1. Create a new Exam Event
const createExam = async (req, res) => {
  try {
    const {
      name,
      subject,
      date,
      deadline,
      time,
      duration,
      totalMarks,
      passingMarks,
      courseId,
    } = req.body;

    if (req.user.role !== "admin")
      return res.status(403).json({ msg: "Only admin can create exams" });

    if (new Date(deadline) > new Date(date)) {
      return res
        .status(400)
        .json({ msg: "Deadline cannot be after the exam date" });
    }

    const exam = await Exam.create({
      name,
      subject,
      date,
      deadline,
      time,
      duration,
      totalMarks,
      passingMarks,
      course: courseId,
      createdBy: req.user._id,
      createdByRole: "admin",
    });

    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// 2. Get Exams created by this Franchisee
const getMyExams = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "admin") {
      query.createdByRole = "admin";
    } else {
      // Franchise sees exams that have their students
      const studentIds = await Student.find({
        franchisee: req.user._id,
      }).distinct("_id");
      query.studentsRegistered = { $in: studentIds };
    }

    const exams = await Exam.find(query)
      .populate("course", "name type")
      .sort({ date: -1 });

    res.json(exams);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get students categorized by registration status for a specific exam
const getExamRegistrationStatus = async (req, res) => {
  try {
    const examId = req.params.id;
    const franchiseId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ msg: "Exam not found" });

    const allFranchiseStudents = await Student.find({
      franchisee: franchiseId,
    }).select("name registrationNumber");

    // Convert the array of ObjectIDs to an array of Strings for comparison
    const registeredIds = exam.studentsRegistered.map((id) => id.toString());

    const registered = [];
    const available = [];

    allFranchiseStudents.forEach((student) => {
      // Use .toString() on the student ID as well
      if (registeredIds.includes(student._id.toString())) {
        registered.push(student);
      } else {
        available.push(student);
      }
    });

    res.json({ registered, available });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const registerStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const examId = req.params.id;

    const exam = await Exam.findById(examId);
    if (new Date() > new Date(exam.deadline)) {
      return res.status(403).json({ msg: "Registration deadline has passed" });
    }

    // Use $addToSet on the Exam model to prevent duplicates in studentsRegistered array
    await Exam.findByIdAndUpdate(examId, {
      $addToSet: { studentsRegistered: { $each: studentIds } },
    });

    // Add exam reference to each student (Your existing student update logic is good)
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $addToSet: { exams: { examId: exam._id, course: exam.course } } },
    );

    res.json({ msg: `Successfully processed ${studentIds.length} students` });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// 3. Get Students registered for a specific Exam
const getExamStudents = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate({
      path: "studentsRegistered",
      select: "name registrationNumber exams franchisee",
      populate: { path: "franchisee", select: "name" },
    });

    if (!exam) return res.status(404).json({ msg: "Exam not found" });

    let filteredStudents = exam.studentsRegistered;

    // Filter by franchise if user is not admin
    if (req.user.role === "franchisee") {
      filteredStudents = exam.studentsRegistered.filter(
        (s) =>
          s.franchisee &&
          s.franchisee._id.toString() === req.user._id.toString(),
      );
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    res.json(filteredStudents);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const getOpenExams = async (req, res) => {
  try {
    const today = new Date();

    // An "Open" exam is one where:
    // 1. The deadline has not passed (deadline >= today)
    // 2. (Optional) You might want only published exams
    const openExams = await Exam.find({
      deadline: { $gte: today },
      // isPublished: true // Uncomment if you use the published flag
    })
      .populate("course", "name type")
      .sort({ deadline: 1 }); // Show soonest deadlines first

    res.json(openExams);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// 2. General Get Exams (Modified to handle ?status=open)
const getExams = async (req, res) => {
  try {
    console.log("Consoled getExams with query:", req.query);
    const { status } = req.query;
    let query = {};

    // Logic for franchisee: only see exams they created or all exams?
    // Usually, franchisees need to see ALL exams to register students.
    // If you want to limit to what they created: query.createdBy = req.user._id;

    if (status === "open") {
      query.deadline = { $gte: new Date() };
    }

    const exams = await Exam.find(query)
      .populate("course", "name type")
      .sort({ date: -1 });

    res.json(exams);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// 4. Publish Results (Bulk Update)
const publishResults = async (req, res) => {
  try {
    const { results } = req.body;
    const examId = req.params.id;

    if (!examId || !Array.isArray(results)) {
      return res.status(400).json({ msg: "Invalid data" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ msg: "Exam not found" });

    // --- NEW CONSTRAINT: Check if Exam Date has passed ---
    const today = new Date();
    const examDate = new Date(exam.date);

    // Set both to midnight for a pure "date" comparison if preferred,
    // or keep as is for exact time comparison.
    if (today < examDate) {
      return res.status(403).json({
        msg: "Results cannot be published before the examination date.",
      });
    }

    // Franchisee access check
    if (
      req.user.role === "franchisee" &&
      exam.franchisee.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // Optional: prevent re-publish
    // if (exam.isPublished) return res.status(400).json({ msg: "Results already published" });

    const getGrade = (percentage) => {
      if (percentage >= 90) return "A+";
      if (percentage >= 80) return "A";
      if (percentage >= 70) return "B+";
      if (percentage >= 60) return "B";
      if (percentage >= 50) return "C";
      if (percentage >= 40) return "D";
      return "F";
    };

    for (const { studentId, marks } of results) {
      if (marks < 0 || marks > exam.totalMarks) continue;

      const student = await Student.findById(studentId);
      if (!student) continue;

      let examRecord = student.exams.find(
        (e) => e.examId && e.examId.toString() === examId,
      );

      if (!examRecord) {
        examRecord = { examId };
        student.exams.push(examRecord);
      }

      examRecord.marks = marks;
      const percentage = (marks / exam.totalMarks) * 100;
      examRecord.grade = getGrade(percentage);
      examRecord.publishedDate = new Date();
      examRecord.course = examRecord.course || exam.course; // ensure course is set

      await student.save();
    }

    exam.isPublished = true;
    exam.publishedAt = new Date();
    await exam.save();

    res.json({ msg: "Results Published Successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  createExam,
  getExamRegistrationStatus,
  getExamStudents,
  getExams,
  getOpenExams,
  getMyExams,
  publishResults,
  registerStudents,
};
