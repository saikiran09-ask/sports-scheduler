const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const Sport = require("../models/Sport");
const { isLoggedIn } = require("../middleware/auth");

// GET dashboard: available sessions to join, sessions I created, sessions I joined
router.get("/", isLoggedIn, async (req, res) => {
  const now = new Date();

  const availableSessions = await Session.find({
    date: { $gte: now },
    isCancelled: false,
    slotsOpen: { $gt: 0 },
    createdBy: { $ne: req.user.id },
    "joinedPlayers.user": { $ne: req.user.id },
  })
    .populate("sport")
    .populate("createdBy", "name")
    .sort({ date: 1 });

  const mySessions = await Session.find({ createdBy: req.user.id })
    .populate("sport")
    .sort({ date: 1 });

  const joinedSessions = await Session.find({ "joinedPlayers.user": req.user.id })
    .populate("sport")
    .populate("createdBy", "name")
    .sort({ date: 1 });

  res.render("sessions/index", {
    availableSessions,
    mySessions,
    joinedSessions,
    user: req.user,
  });
});

// GET form to create a new session
router.get("/new", isLoggedIn, async (req, res) => {
  const sports = await Sport.find().sort({ name: 1 });
  res.render("sessions/new", { sports, error: null });
});

// POST create a session
router.post("/", isLoggedIn, async (req, res) => {
  try {
    const { sportId, date, venue, prefilledPlayers, slotsOpen } = req.body;

    const players = (prefilledPlayers || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    await Session.create({
      sport: sportId,
      createdBy: req.user.id,
      date: new Date(date),
      venue,
      prefilledPlayers: players,
      slotsOpen: Number(slotsOpen) || 0,
    });

    res.redirect("/sessions");
  } catch (err) {
    console.error(err);
    const sports = await Sport.find().sort({ name: 1 });
    res.render("sessions/new", { sports, error: "Could not create session. Check your inputs." });
  }
});

// POST join an existing session
router.post("/:id/join", isLoggedIn, async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (
    !session ||
    session.isCancelled ||
    session.date < new Date() ||
    session.slotsOpen <= 0 ||
    session.createdBy.equals(req.user.id) ||
    session.joinedPlayers.some((p) => p.user.equals(req.user.id))
  ) {
    return res.redirect("/sessions");
  }

  session.joinedPlayers.push({ user: req.user.id });
  session.slotsOpen -= 1;
  await session.save();

  res.redirect("/sessions");
});

// POST cancel a session you created
router.post("/:id/cancel", isLoggedIn, async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session || !session.createdBy.equals(req.user.id)) {
    return res.redirect("/sessions");
  }

  session.isCancelled = true;
  session.cancelReason = req.body.reason || "No reason given.";
  await session.save();

  res.redirect("/sessions");
});

module.exports = router;
