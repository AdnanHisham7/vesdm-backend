const express = require("express");
const router = express.Router();
const { setup, login } = require("../controllers/authController");

router.post("/setup", setup);
router.post("/login", login);

module.exports = router;
