const express = require("express");
const passport = require("passport");
const router = express.Router();
const User = require("../models/User");

// GET signup form
router.get("/signup", (req, res) => {
  res.render("auth/signup", { error: null });
});

// POST create account
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.render("auth/signup", { error: "An account with that email already exists." });
    }

    // Only allow choosing "admin" here for demo/setup convenience.
    // In a real product you'd invite admins separately - but the course
    // lesson on multi-user auth treats role as a simple discriminator field.
    const user = new User({
      name,
      email,
      password,
      role: role === "admin" ? "admin" : "player",
    });
    await user.save();

    req.login(user, (err) => {
      if (err) return res.render("auth/signup", { error: "Something went wrong, please log in." });
      return res.redirect(user.role === "admin" ? "/sports" : "/sessions");
    });
  } catch (err) {
    console.error(err);
    res.render("auth/signup", { error: "Something went wrong. Please try again." });
  }
});

// GET login form
router.get("/login", (req, res) => {
  res.render("auth/login", { error: null });
});

// POST login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.render("auth/login", { error: info?.message || "Login failed." });
    }
    req.login(user, (err) => {
      if (err) return next(err);
      return res.redirect(user.role === "admin" ? "/sports" : "/sessions");
    });
  })(req, res, next);
});

// POST logout
router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/auth/login");
  });
});

module.exports = router;
