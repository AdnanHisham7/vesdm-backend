const Exam = require("../models/Exam");
const Student = require("../models/Student");
const mongoose = require("mongoose");

exports.getFranchiseDashboard = async (req, res) => {
  try {
    const franchiseId = req.user._id;

    // 1. Get all students under this franchise
    const students = await Student.find({ franchisee: franchiseId })
      .populate("enrolledCourses.course", "name"); // populate course name

    const studentCount = students.length;

    // 2. Calculate ongoing & completed enrollments
    let ongoingCourses = 0;
    let completedCourses = 0;
    const courseEnrollmentMap = new Map(); // courseId → {name, count}

    students.forEach(student => {
      student.enrolledCourses.forEach(enrollment => {
        const courseId = enrollment.course?._id?.toString();
        const courseName = enrollment.course?.name || "Unknown Course";

        // Count status
        if (enrollment.status === "ongoing") {
          ongoingCourses++;
        } else if (enrollment.status === "completed") {
          completedCourses++;
        }

        // Track enrollments per course
        if (courseId) {
          if (!courseEnrollmentMap.has(courseId)) {
            courseEnrollmentMap.set(courseId, { name: courseName, count: 0 });
          }
          courseEnrollmentMap.get(courseId).count++;
        }
      });
    });

    // 3. Top courses (most enrolled) — sorted descending, limit 8
    const topCourses = Array.from(courseEnrollmentMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 4. Upcoming exams created by this franchise
    const exams = await Exam.find({ createdBy: franchiseId });
    const upcomingExams = exams
      .filter(e => new Date(e.date) > new Date() && !e.isPublished)
      .slice(0, 6)
      .map(e => ({
        name: e.name,
        date: e.date,
        registered: e.studentsRegistered?.length || 0,
        course: e.course?.toString() || null, // optional
      }));

    // 5. Certificates issued
    const certificatesIssued = students.reduce((sum, s) => 
      sum + s.enrolledCourses.filter(c => !!c.certificate?.file).length, 
    0);

    // 6. Monthly growth (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyGrowth = await Student.aggregate([
      {
        $match: {
          franchisee: franchiseId,
          enrollmentDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$enrollmentDate" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Final response
    res.json({
      totalStudents: studentCount,
      ongoingCourses,           // ← added (total ongoing enrollments)
      completedCourses,
      certificatesIssued,
      topCourses,               // ← added (array of {name, count})
      upcomingExamsCount: upcomingExams.length,
      upcomingExams,
      monthlyGrowth
    });

  } catch (err) {
    console.error("Franchise dashboard error:", err);
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined 
    });
  }
};