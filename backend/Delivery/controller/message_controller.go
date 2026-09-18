package controller

import (
	"net/http"
	"strconv"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
)

type MessageController struct {
	messageUsecase *usecases.MessageUsecase
}

func NewMessageController(messageUsecase *usecases.MessageUsecase) *MessageController {
	return &MessageController{messageUsecase: messageUsecase}
}

// SendMessage handles creating a new message
func (mc *MessageController) SendMessage(c *gin.Context) {
	var req schema.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Extract sender ID from JWT context (set by auth middleware)
	senderID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	senderIDUint, ok := senderID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	message, err := mc.messageUsecase.CreateMessage(senderIDUint, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Message sent successfully",
		"data":    message,
	})
}

// GetMessageByID handles retrieving a specific message
func (mc *MessageController) GetMessageByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	message, err := mc.messageUsecase.GetMessageByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    message,
	})
}

// GetMessagesByRoom handles retrieving messages for a specific room
func (mc *MessageController) GetMessagesByRoom(c *gin.Context) {
	roomIDStr := c.Param("roomId")
	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}

	// Parse pagination parameters
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		offset = 0
	}

	messages, err := mc.messageUsecase.GetMessagesByRoomID(uint(roomID), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    messages,
		"meta": gin.H{
			"limit":  limit,
			"offset": offset,
			"count":  len(messages),
		},
	})
}

// GetMessagesBetweenUsers handles retrieving messages between two users
func (mc *MessageController) GetMessagesBetweenUsers(c *gin.Context) {
	// Extract current user ID from JWT
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDUint, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get other user ID from query parameter
	otherUserIDStr := c.Query("other_user_id")
	if otherUserIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "other_user_id parameter is required"})
		return
	}

	otherUserID, err := strconv.ParseUint(otherUserIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid other_user_id"})
		return
	}

	// Prevent querying conversation with self; this can cause pointless repeats in UI
	if uint(otherUserID) == userIDUint {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot open conversation with yourself"})
		return
	}

	// Parse pagination parameters
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		offset = 0
	}

	messages, err := mc.messageUsecase.GetMessagesBetweenUsers(userIDUint, uint(otherUserID), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    messages,
		"meta": gin.H{
			"limit":  limit,
			"offset": offset,
			"count":  len(messages),
		},
	})
}

// GetUnreadMessagesByRoom handles retrieving unread messages for a room
func (mc *MessageController) GetUnreadMessagesByRoom(c *gin.Context) {
	roomIDStr := c.Param("roomId")
	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}

	messages, err := mc.messageUsecase.GetUnreadMessagesByRoomID(uint(roomID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    messages,
		"count":   len(messages),
	})
}

// MarkMessageAsRead handles marking a message as read
func (mc *MessageController) MarkMessageAsRead(c *gin.Context) {
	messageIDStr := c.Param("id")
	messageID, err := strconv.ParseUint(messageIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	err = mc.messageUsecase.MarkMessageAsRead(uint(messageID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Message marked as read",
	})
}

// MarkAllMessagesAsReadByRoom handles marking all messages in a room as read
func (mc *MessageController) MarkAllMessagesAsReadByRoom(c *gin.Context) {
	roomIDStr := c.Param("roomId")
	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}

	err = mc.messageUsecase.MarkAllMessagesAsReadByRoomID(uint(roomID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "All messages in room marked as read",
	})
}

// UpdateMessage handles updating a message
func (mc *MessageController) UpdateMessage(c *gin.Context) {
	messageIDStr := c.Param("id")
	messageID, err := strconv.ParseUint(messageIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	var req schema.UpdateMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message, err := mc.messageUsecase.UpdateMessage(uint(messageID), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Message updated successfully",
		"data":    message,
	})
}

// DeleteMessage handles deleting a message
func (mc *MessageController) DeleteMessage(c *gin.Context) {
	messageIDStr := c.Param("id")
	messageID, err := strconv.ParseUint(messageIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	err = mc.messageUsecase.DeleteMessage(uint(messageID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Message deleted successfully",
	})
}
