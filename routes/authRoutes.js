const express = require("express");
const { body } = require("express-validator");
const { 
  registerUser, 
  loginUser, 
  verifyOtp, 
  getLoggedInUser, 
  logoutUser, 
  verifyUser
} = require("../controllers/authController");

const { verifyToken } = require("../middleware/authMiddleware");
verifyToken
const router = express.Router();

// Validation rules
const registerValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("username").notEmpty().withMessage("Username is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Routes
router.post("/register", registerValidation, registerUser);
router.get("/verify/:token", verifyUser);
router.post("/login", loginValidation, loginUser);
router.post("/verify-otp", verifyOtp);
router.get("/logout", verifyToken, logoutUser);
router.get("/me", verifyToken, getLoggedInUser);

module.exports = router;
