const express = require("express");
const router = express.Router();

const { protect, franchiseeOrAdmin } = require("../middleware/auth");
const { getFranchiseDashboard } = require("../controllers/franchiseController");

router.get(
  "/dashboard",
  protect,
  franchiseeOrAdmin,
  getFranchiseDashboard,
);

module.exports = router;
