const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    sport: { type: mongoose.Schema.Types.ObjectId, ref: "Sport", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    venue: { type: String, required: true, trim: true },

    // names of players already known when the session was created
    prefilledPlayers: [{ type: String, trim: true }],

    // how many additional players are still needed
    slotsOpen: { type: Number, default: 0, min: 0 },

    // players who joined via the app
    joinedPlayers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    isCancelled: { type: Boolean, default: false },
    cancelReason: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
