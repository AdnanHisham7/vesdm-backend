const Student = require("../models/Student");
const Counter = require("../models/Counter");

const getNextRegistrationNumber = async () => {
  const counter = await Counter.findByIdAndUpdate(
    "studentReg",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
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

const createStudent = async (req, res) => {
  try {
    const { name, email, phone, course, year } = req.body;
    let franchisee = null;
    if (req.user.role === "franchisee") franchisee = req.user._id;
    else if (req.user.role === "admin" && req.body.franchisee)
      franchisee = req.body.franchisee;

    const registrationNumber = await getNextRegistrationNumber();

    const student = await Student.create({
      registrationNumber,
      name,
      email,
      phone,
      course,
      year,
      franchisee,
    }).then((s) => s.populate("course"));

    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const getStudents = async (req, res) => {
  const query =
    req.user.role === "franchisee" ? { franchisee: req.user._id } : {};
  const students = await Student.find(query)
    .populate("course", "name type")
    .select("registrationNumber name course year enrollmentDate");
  res.json(students);
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
  if (!req.file) return res.status(400).json({ msg: "No file" });
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ msg: "Student not found" });
  try {
    checkStudentAccess(req, student);
    student.certificate = req.file.filename;
    await student.save();
    res.json({ msg: "Certificate uploaded", certificate: student.certificate });
  } catch (err) {
    res.status(403).json({ msg: err.message });
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
  const { registrationNumber } = req.body;
  const student = await Student.findOne({ registrationNumber }).populate(
    "course",
    "name"
  );
  if (!student) return res.json({ valid: false });

  res.json({
    valid: !!student.certificate,
    details: {
      registrationNumber: student.registrationNumber,
      name: student.name,
      course: student.course?.name,
      year: student.year,
      enrollmentDate: student.enrollmentDate,
    },
  });
};

const studentAccess = async (req, res) => {
  const { registrationNumber } = req.body;
  const student = await Student.findOne({ registrationNumber }).populate(
    "course"
  );
  if (!student) return res.status(404).json({ msg: "Student not found" });
  res.json(student);
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
};
