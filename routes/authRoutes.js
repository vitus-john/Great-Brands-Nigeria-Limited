const express = require("express");
const { body } = require("express-validator");
const { registerUser, verifyUserController, loginUser, verifyOtp } = require("../controllers/authController");

const router = express.Router();

// Validation Rules
const registerValidation = [
  body("firstname").notEmpty().withMessage("Firstname is required"),
  body("lastname").notEmpty().withMessage("Lastname is required"),
  body("username").notEmpty().withMessage("Username is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const otpValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("otp").notEmpty().withMessage("OTP is required"),
]; 

// Routes
router.post("/register", registerValidation, registerUser);
router.get("/verify/:token", verifyUserController);
router.post("/login", loginValidation, loginUser);
router.post("/verify-otp", otpValidation, verifyOtp);

module.exports = router;
