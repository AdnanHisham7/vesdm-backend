const express = require("express");
const router = express.Router();
const { setup, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/setup", setup);
router.post("/login", login);
router.get("/me", protect, getMe);

module.exports = router;
