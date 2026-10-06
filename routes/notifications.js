const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const userAuth = require("../middleware/userAuth");

// Get user's notifications
router.get("/", userAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    const notifications = await Notification.findAll({
      where: {
        UserId: userId,
      },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
});

// Mark notification as read
router.put("/:id/read", userAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const notificationId = Number(req.params.id);

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        UserId: userId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.is_read = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notification",
      error: error.message,
    });
  }
});

module.exports = router;