import express from "express";
import {
  logViolation,
  getMyViolations,
  getAllViolations,
  getDisqualificationStatus,
} from "../controllers/violation.controller.js";
import { authMiddleware, checkAdmin } from "../middleware/auth.middleware.js";

const router = express.Router({ mergeParams: true }); // mergeParams: get :id from parent

router.use(authMiddleware);

// User routes
router.post(  "/",       logViolation);               // POST   .../violations
router.get(   "/me",     getMyViolations);             // GET    .../violations/me
router.get(   "/status", getDisqualificationStatus);  // GET    .../violations/status

// Admin route
router.get(   "/",       checkAdmin, getAllViolations); // GET   .../violations  (admin)

export default router;
