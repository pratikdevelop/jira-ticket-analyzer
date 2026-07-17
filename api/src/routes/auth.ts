import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

/**
 * ======================================
 * Public Routes
 * ======================================
 */

// Register
router.post(
  "/signup",
  AuthController.signup
);

// Login
router.post(
  "/login",
  AuthController.login
);

// Refresh Access Token
router.post(
  "/refresh",
  AuthController.refresh
);

// Forgot Password
router.post(
  "/forgot-password",
  AuthController.forgotPassword
);

// Reset Password
router.post(
  "/reset-password",
  AuthController.resetPassword
);

// Verify Email
router.post(
  "/verify-email",
  AuthController.verifyEmail
);

// Resend Verification Email
router.post(
  "/resend-verification",
  AuthController.resendVerification
);

/**
 * ======================================
 * Protected Routes
 * ======================================
 */

// Current User Profile
router.get(
  "/profile",
  protect,
  AuthController.profile
);

// Logout Current Device
router.post(
  "/logout",
  protect,
  AuthController.logout
);

// Logout All Devices
router.post(
  "/logout-all",
  protect,
  AuthController.logoutAll
);

export default router;