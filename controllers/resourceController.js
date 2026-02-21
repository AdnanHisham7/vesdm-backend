const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Resource = require("../models/Resource");

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* =========================
   MULTER CONFIG
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

/* =========================
   HELPERS
========================= */
const getResourceType = (file) => {
  if (file.mimetype.startsWith("video/")) return "VIDEO";
  const ext = path.extname(file.originalname).slice(1).toUpperCase();
  const map = {
    PDF: "PDF",
    DOC: "DOCX",
    DOCX: "DOCX",
    XLS: "XLSX",
    XLSX: "XLSX",
  };
  return map[ext] || ext || "FILE";
};

/* =========================
   CONTROLLERS
========================= */
// GET all resources (global, no franchise filter)
const getResources = async (req, res) => {
  try {
    const resources = await Resource.find()
      .populate("course", "name")
      .sort({ uploadDate: -1 });
    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// CREATE resource
const createResource = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "File is required" });
    const { title, description, category, course } = req.body;
    if (!title || !course)
      return res.status(400).json({ msg: "Title and course are required" });

    const resource = await Resource.create({
      title,
      description: description || "",
      category: category || "guides",
      type: getResourceType(req.file),
      fileUrl: `/uploads/${req.file.filename}`,
      size: (req.file.size / (1024 * 1024)).toFixed(2) + " MB",
      course,
    });
    await resource.populate("course", "name");
    res.json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// UPDATE resource
const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ msg: "Resource not found" });

    if (req.body.title) resource.title = req.body.title;
    if (req.body.description !== undefined) resource.description = req.body.description;
    if (req.body.category) resource.category = req.body.category;
    if (req.body.course) resource.course = req.body.course;

    if (req.file) {
      resource.type = getResourceType(req.file);
      resource.fileUrl = `/uploads/${req.file.filename}`;
      resource.size = (req.file.size / (1024 * 1024)).toFixed(2) + " MB";
    }

    await resource.save();
    await resource.populate("course", "name");
    res.json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// DELETE resource
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ msg: "Resource not found" });
    res.json({ msg: "Resource deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  upload,
  getResources,
  createResource,
  updateResource,
  deleteResource,
};