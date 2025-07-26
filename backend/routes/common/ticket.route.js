import express from "express";
import { isLoggedIn, requireStaff } from "../../middlewares/middleware.js";
import {
  createSupportTicket,
  getSupportTickets,
  getSupportTicket,
  addTicketResponse,
  updateTicketStatus,
  getSupportCategories,
  getSupportStats,
} from "../../controllers/common/ticket.controller.js";
import { trackRoute } from "../../utils/routeWrapper.js";

const router = express.Router();

router.use(isLoggedIn);

router.get(
  "/categories",
  trackRoute("Tickets", "getSupportCategories"),
  getSupportCategories
);
router.post(
  "/tickets",
  trackRoute("Tickets", "createSupportTicket"),
  createSupportTicket
);
router.get(
  "/tickets",
  trackRoute("Tickets", "getSupportTickets"),
  getSupportTickets
);
router.get(
  "/tickets/:ticketId",
  trackRoute("Tickets", "getSupportTicket"),
  getSupportTicket
);
router.get("/stats", trackRoute("Tickets", "getSupportStats"), getSupportStats);

router.post(
  "/tickets/:ticketId/responses",
  requireStaff,
  trackRoute("Tickets", "addTicketResponse"),
  addTicketResponse
);
router.put(
  "/tickets/:ticketId/status",
  requireStaff,
  trackRoute("Tickets", "updateTicketStatus"),
  updateTicketStatus
);

export default router;
