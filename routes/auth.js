const express = require("express");

const { body } = require("express-validator");

const router = express.Router();

const authController = require("../controllers/auth");

const User = require("../models/User");

const bcrypt = require("bcryptjs");

router.post(
  "/signup",
  [
    body("email")
      .notEmpty()
      .withMessage("Email could not be empty")
      .isEmail()
      .withMessage("Email must be right format!")
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });

        if (user) {
          return Promise.reject("User already exists");
        }
      }),
    body("password", "Password must be at  least 6 letters")
      .notEmpty()
      .isLength({ min: 6 })
      .isAlphanumeric()
      .withMessage("Password only contains  alphanumeric characters"),
    body("username", "Username must be at  least 5 letters")
      .notEmpty()
      .isLength({ min: 5 })
      .isAlphanumeric()
      .withMessage("Username only contains  alphanumeric characters"),
  ],
  authController.postSignup
);

router.post(
  "/login",
  [
    body("email")
      .notEmpty()
      .withMessage("Email could not be empty")
      .isEmail()
      .withMessage("Email must be right format!")
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (!user) {
          return Promise.reject("Invalid email");
        }
      }),

    body("password")
      .notEmpty()
      .withMessage("Password could not be empty")
      .custom(async (value, { req }) => {
        if (!req.body.email) {
          throw new Error("Invalid password");
        }

        const user = await User.findOne({ email: req.body.email });

        if (!user) {
          return Promise.reject("Invalid password");
        }

        const isMatchingPassword = await bcrypt.compare(
          value,
          user?.password.toString()
        );
        if (!isMatchingPassword) {
          return Promise.reject("Invalid password");
        }
      }),
  ],

  authController.postLogin
);

module.exports = router;
