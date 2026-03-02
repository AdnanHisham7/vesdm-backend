const Student = require("../models/Student");
const Counter = require("../models/Counter");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const getNextRegistrationNumber = async () => {
  const counter = await Counter.findByIdAndUpdate(
    "studentReg",
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  const year = new Date().getFullYear();
  return `VESDM${year}${String(counter.seq).padStart(5, "0")}`;
};

const checkStudentAccess = async (req, student) => {
  if (req.user.role === "franchisee") {
    if (
      !student.franchisee ||
      student.franchisee.toString() !== req.user._id.toString()
    ) {
      throw new Error("Access denied");
    }
  }
};

const generateRandomPassword = (length = 12) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const createStudent = async (req, res) => {
  try {
    const { name, email, phone, course, year } = req.body;

    // Validation...
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "Email is already registered" });

    const plainPassword = generateRandomPassword();
    const hashed = await bcrypt.hash(plainPassword, 10);

    // 1. Create Auth User
    const newUser = await User.create({
      name,
      email,
      password: hashed,
      role: "student",
    });

    // 2. Try Sending Email immediately after User creation
    const transporter = nodemailer.createTransport({
      /* ... config ... */
    });
    const mailOptions = {
      /* ... options ... */
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      // ROLLBACK: If email fails, delete the user so they can try again
      await User.findByIdAndDelete(newUser._id);
      return res
        .status(500)
        .json({ msg: "Email failed. Account creation cancelled." });
    }

    // 3. ONLY IF EMAIL SUCCEEDED: Create the Student Profile and Increment Counter
    const registrationNumber = await getNextRegistrationNumber();

    const studentData = {
      registrationNumber,
      name,
      email,
      phone,
      year,
      franchisee: req.user.role === "franchisee" ? req.user._id : null,
      enrolledCourses: [{ course }],
      user: newUser._id,
      enrollmentDate: new Date(),
    };

    const student = await Student.create(studentData);
    await student.populate("enrolledCourses.course");

    res.status(201).json(student);
  } catch (err) {
    // This catches DB errors or logic errors
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

const getStudents = async (req, res) => {
  try {
    const query =
      req.user.role === "franchisee" ? { franchisee: req.user._id } : {};

    const students = await Student.find(query)
      .populate({
        path: "enrolledCourses.course",
        select: "name type", // already good
      })
      .select(
        "registrationNumber name email phone enrolledCourses year enrollmentDate",
      )
      .lean(); // optional: faster, plain JS objects

    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Server error while fetching students" });
  }
};

const getStudent = async (req, res) => {
  const student = await Student.findById(req.params.id).populate("course");
  if (!student) return res.status(404).json({ msg: "Student not found" });
  try {
    checkStudentAccess(req, student);
    res.json(student);
  } catch (err) {
    res.status(403).json({ msg: err.message });
  }
};

const updateStudent = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ msg: "Student not found" });
  try {
    checkStudentAccess(req, student);
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("course");
    res.json(updated);
  } catch (err) {
    res.status(403).json({ msg: err.message });
  }
};

const uploadDocuments = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ msg: "Student not found" });
  try {
    checkStudentAccess(req, student);
    const newDocs = req.files.map((file) => file.filename);
    student.documents.push(...newDocs);
    await student.save();
    res.json({ msg: "Documents uploaded", documents: student.documents });
  } catch (err) {
    res.status(403).json({ msg: err.message });
  }
};

const uploadCertificate = async (req, res) => {
  if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

  try {
    const { courseId } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ msg: "Student not found" });

    await checkStudentAccess(req, student);

    // Find the specific course enrollment
    const enrollment = student.enrolledCourses.find(
      (e) => e.course.toString() === courseId,
    );

    if (!enrollment) {
      return res
        .status(404)
        .json({ msg: "Student is not enrolled in this course" });
    }

    const certNumber =
      `${student.registrationNumber}-${courseId.substring(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`.toUpperCase();

    // Set certificate data and update status
    enrollment.certificate = {
      file: req.file.filename,
      issueDate: new Date(),
      number: certNumber,
    };
    enrollment.status = "completed";
    enrollment.completedDate = new Date();

    await student.save();

    res.json({
      msg: "Certificate issued and course marked as completed",
      certificate: enrollment.certificate,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const uploadMarklist = async (req, res) => {
  if (!req.file) return res.status(400).json({ msg: "No file" });
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ msg: "Student not found" });
  try {
    checkStudentAccess(req, student);
    student.marklist = req.file.filename;
    await student.save();
    res.json({ msg: "Marklist uploaded", marklist: student.marklist });
  } catch (err) {
    res.status(403).json({ msg: err.message });
  }
};

const registerExam = async (req, res) => {
  const { examName } = req.body;
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ msg: "Student not found" });
  try {
    checkStudentAccess(req, student);
    let exam = student.exams.find((e) => e.examName === examName);
    if (!exam) {
      student.exams.push({ examName, registered: true });
    } else {
      exam.registered = true;
    }
    await student.save();
    res.json({ msg: `Registered for ${examName}` });
  } catch (err) {
    res.status(403).json({ msg: err.message });
  }
};

const publishResult = async (req, res) => {
  const { examName, marks, grade } = req.body;
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ msg: "Student not found" });
  try {
    checkStudentAccess(req, student);
    let exam = student.exams.find((e) => e.examName === examName);
    if (!exam) {
      student.exams.push({
        examName,
        registered: true,
        marks,
        grade,
        publishedDate: new Date(),
      });
    } else {
      exam.marks = marks;
      exam.grade = grade;
      exam.publishedDate = new Date();
    }
    await student.save();
    res.json({ msg: `Result published for ${examName}` });
  } catch (err) {
    res.status(403).json({ msg: err.message });
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const { registrationNumber } = req.body; // The Certificate Number
    console.log("VERIFY CERTIFICATE", registrationNumber);
    // Search for student where any enrolledCourse has this certificate number
    const student = await Student.findOne({
      "enrolledCourses.certificate.number": registrationNumber
        .trim()
        .toUpperCase(),
    }).populate("enrolledCourses.course", "name");

    if (!student) {
      return res
        .status(404)
        .json({ valid: false, msg: "Certificate not found" });
    }

    const enrollment = student.enrolledCourses.find(
      (e) => e.certificate?.number === registrationNumber.trim().toUpperCase(),
    );

    res.json({
      valid: true,
      details: {
        studentName: student.name,
        certificateNumber: enrollment.certificate.number,
        program: enrollment.course?.name,
        issueDate: enrollment.certificate.issueDate,
        registrationNumber: student.registrationNumber,
        validity: "Lifetime",
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const studentAccess = async (req, res) => {
  const { registrationNumber } = req.body;
  const student = await Student.findOne({ registrationNumber }).populate(
    "course",
  );
  if (!student) return res.status(404).json({ msg: "Student not found" });
  res.json(student);
};

const enrollExistingStudent = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ msg: "Student not found" });

    // Access Check: Ensure franchise owns this student
    if (
      req.user.role === "franchisee" &&
      student.franchisee.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // Check if already enrolled
    const isAlreadyEnrolled = student.enrolledCourses.find(
      (e) => e.course.toString() === courseId,
    );

    if (isAlreadyEnrolled) {
      return res
        .status(400)
        .json({ msg: "Student already enrolled in this course" });
    }

    // Add new enrollment
    student.enrolledCourses.push({
      course: courseId,
      enrollmentDate: new Date(),
      status: "ongoing",
      progress: 0,
    });

    await student.save();
    res.json({ msg: "Enrolled successfully", student });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Update getCourseStudents to filter by franchise
const getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const query = {
      "enrolledCourses.course": courseId,
    };

    // If franchisee, only show THEIR students in this course
    if (req.user.role === "franchisee") {
      query.franchisee = req.user._id;
    }

    const students = await Student.find(query);
    res.json(students);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ msg: "Student not found" });

    // Delete linked User account if exists
    if (student.user) {
      await User.findByIdAndDelete(student.user);
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ msg: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

module.exports = {
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
  deleteStudent,
};
