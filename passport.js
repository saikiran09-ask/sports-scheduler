const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/User");

passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return done(null, false, { message: "Incorrect email or password." });
      }

      const isValid = await user.validatePassword(password);
      if (!isValid) {
        return done(null, false, { message: "Incorrect email or password." });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// store only the user id in the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// look the user back up on every request
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
