import { Router } from "express";
import {
  exchangeAuthCode,
  getUserProfile,
  gitHubAuth,
  gitHubAuthCallback,
  googleAuth,
  googleAuthCallback,
  loginUser,
  logoutUser,
  registerUser,
  removeProfileImage,
  requestPasswordReset,
  resetPassword,
  updateProfileImage,
  updateUserProfile,
  verifyOTP,
  requestAccountReactivation,
  checkReactivationStatus,
} from "../controllers/auth.controller.js";
import isLoggedIn from "../middlewares/isLoggedIn.js";

const router = Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/login", loginUser);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

// NEW REACTIVATION ROUTES
router.post("/request-reactivation", requestAccountReactivation);
router.get("/reactivation-status/:userId", checkReactivationStatus);

router.get("/google", googleAuth);
router.get("/github", gitHubAuth);

router.get("/google/callback", googleAuthCallback);
router.get("/github/callback", gitHubAuthCallback);

router.post("/exchange-code", exchangeAuthCode);

router.get("/profile", isLoggedIn, getUserProfile);
router.post("/logout", isLoggedIn, logoutUser);
router.post("/profile/image", isLoggedIn, updateProfileImage);
router.delete("/profile/image", isLoggedIn, removeProfileImage);

router.put("/update-profile", isLoggedIn, updateUserProfile);

export default router;
