package controller

import (
	"net/http"

	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
)

type HomecareAIHandler struct {
	usecase *usecases.HomecareAIAssistantUsecase
}

func NewHomecareAIHandler(usecase *usecases.HomecareAIAssistantUsecase) *HomecareAIHandler {
	return &HomecareAIHandler{usecase: usecase}
}

func (h *HomecareAIHandler) HandleChat(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req struct {
		RoomID  uint   `json:"room_id"`
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.usecase.GetAssistantResponse(userID.(uint), req.RoomID, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"reply": resp})
}
