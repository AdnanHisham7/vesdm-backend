const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth"); // added adminOnly
const {
  upload,
  getResources,
  createResource,
  updateResource,
  deleteResource,
} = require("../controllers/resourceController");

router.get("/", protect, getResources);
router.post("/", protect, adminOnly, upload.single("file"), createResource);
router.put("/:id", protect, adminOnly, upload.single("file"), updateResource);
router.delete("/:id", protect, adminOnly, deleteResource);

module.exports = router;