const express = require("express");
const router = express.Router();
const Sport = require("../models/Sport");
const { isLoggedIn, isAdmin } = require("../middleware/auth");

// GET list of sports the admin has created (User story: "Admins can create sports")
router.get("/", isLoggedIn, isAdmin, async (req, res) => {
  const sports = await Sport.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
  res.render("sports/index", { sports, user: req.user });
});

// POST create a new sport
router.post("/", isLoggedIn, isAdmin, async (req, res) => {
  const { name } = req.body;
  if (name && name.trim()) {
    await Sport.create({ name: name.trim(), createdBy: req.user.id });
  }
  res.redirect("/sports");
});

module.exports = router;
