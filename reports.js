const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const Sport   = require("../models/Sport");
const { isLoggedIn, isAdmin } = require("../middleware/auth");

// GET /reports — admin-only analytics dashboard
router.get("/", isLoggedIn, isAdmin, async (req, res) => {
  try {
    // All sessions (populated)
    const allSessions = await Session.find()
      .populate("sport", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    // Summary numbers
    const totalSessions     = allSessions.length;
    const cancelledSessions = allSessions.filter((s) => s.isCancelled).length;
    const activeSessions    = totalSessions - cancelledSessions;
    const totalJoins        = allSessions.reduce((sum, s) => sum + s.joinedPlayers.length, 0);

    // Per-sport aggregation
    const sportMap = {};
    allSessions.forEach((s) => {
      const name = s.sport ? s.sport.name : "Unknown";
      if (!sportMap[name]) sportMap[name] = { total: 0, active: 0, cancelled: 0, joins: 0 };
      sportMap[name].total += 1;
      if (s.isCancelled) sportMap[name].cancelled += 1;
      else sportMap[name].active += 1;
      sportMap[name].joins += s.joinedPlayers.length;
    });

    // Convert to sorted array (descending by total)
    const reportRows = Object.entries(sportMap)
      .map(([sport, data]) => ({ sport, ...data }))
      .sort((a, b) => b.total - a.total);

    // 10 most-recent sessions for the activity log
    const recentSessions = allSessions.slice(0, 10);

    res.render("reports/index", {
      totalSessions,
      activeSessions,
      cancelledSessions,
      totalJoins,
      reportRows,
      recentSessions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load reports.");
  }
});

module.exports = router;
