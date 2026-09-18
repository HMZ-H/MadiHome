package controller

import (
	"net/http"
	"strconv"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
)

type NotificationController struct {
	notificationUsecase *usecases.NotificationUsecase
}

func NewNotificationController(notificationUsecase *usecases.NotificationUsecase) *NotificationController {
	return &NotificationController{notificationUsecase: notificationUsecase}
}

// Get user notifications
func (nc *NotificationController) GetUserNotifications(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}
	userID := userIDRaw.(uint)

	notifications, err := nc.notificationUsecase.GetUserNotifications(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: "Failed to fetch notifications",
		})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Notifications retrieved successfully",
		Data:    notifications,
	})
}

// Get unread notifications
func (nc *NotificationController) GetUnreadNotifications(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}
	userID := userIDRaw.(uint)

	notifications, err := nc.notificationUsecase.GetUnreadNotifications(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: "Failed to fetch unread notifications",
		})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Unread notifications retrieved successfully",
		Data:    notifications,
	})
}

// Mark notification as read
func (nc *NotificationController) MarkNotificationAsRead(c *gin.Context) {
	notificationIDStr := c.Param("id")
	notificationID, err := strconv.ParseUint(notificationIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid notification ID",
		})
		return
	}

	err = nc.notificationUsecase.MarkNotificationAsRead(uint(notificationID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: "Failed to mark notification as read",
		})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Notification marked as read",
	})
}

// Mark all notifications as read
func (nc *NotificationController) MarkAllNotificationsAsRead(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}
	userID := userIDRaw.(uint)

	err := nc.notificationUsecase.MarkAllNotificationsAsRead(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: "Failed to mark all notifications as read",
		})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "All notifications marked as read",
	})
}

// Delete notification
func (nc *NotificationController) DeleteNotification(c *gin.Context) {
	notificationIDStr := c.Param("id")
	notificationID, err := strconv.ParseUint(notificationIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid notification ID",
		})
		return
	}

	err = nc.notificationUsecase.DeleteNotification(uint(notificationID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: "Failed to delete notification",
		})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Notification deleted successfully",
	})
}
