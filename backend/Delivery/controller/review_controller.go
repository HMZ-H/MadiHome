package controller

import (
	"net/http"
	"strconv"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
)

type ReviewController struct {
	reviewUsecase *usecases.ReviewUsecase
}

func NewReviewController(reviewUsecase *usecases.ReviewUsecase) *ReviewController {
	return &ReviewController{reviewUsecase: reviewUsecase}
}

func (rc *ReviewController) CreateReview(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{Success: false, Message: "Unauthorized"})
		return
	}
	userID := userIDRaw.(uint)

	var req schema.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Invalid request: " + err.Error()})
		return
	}

	review, err := rc.reviewUsecase.CreateReview(userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, schema.SuccessResponse{Success: true, Message: "Review created successfully", Data: review})
}

func (rc *ReviewController) GetDoctorReviews(c *gin.Context) {
	doctorID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Invalid doctor ID"})
		return
	}

	reviews, err := rc.reviewUsecase.GetReviewsByDoctorID(uint(doctorID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Success: false, Message: "Failed to fetch reviews"})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Reviews retrieved successfully", Data: reviews})
}

func (rc *ReviewController) GetDoctorRating(c *gin.Context) {
	doctorID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Invalid doctor ID"})
		return
	}

	rating, err := rc.reviewUsecase.GetDoctorRating(uint(doctorID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Success: false, Message: "Failed to fetch rating"})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Rating retrieved successfully", Data: rating})
}

func (rc *ReviewController) GetMyReviews(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{Success: false, Message: "Unauthorized"})
		return
	}
	userID := userIDRaw.(uint)

	reviews, err := rc.reviewUsecase.GetReviewsByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Success: false, Message: "Failed to fetch reviews"})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Reviews retrieved successfully", Data: reviews})
}

func (rc *ReviewController) UpdateReview(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{Success: false, Message: "Unauthorized"})
		return
	}
	userID := userIDRaw.(uint)

	reviewID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Invalid review ID"})
		return
	}

	var req schema.UpdateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Invalid request: " + err.Error()})
		return
	}

	review, err := rc.reviewUsecase.UpdateReview(uint(reviewID), userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Review updated successfully", Data: review})
}

func (rc *ReviewController) DeleteReview(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{Success: false, Message: "Unauthorized"})
		return
	}
	userID := userIDRaw.(uint)

	reviewID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Invalid review ID"})
		return
	}

	err = rc.reviewUsecase.DeleteReview(uint(reviewID), userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Review deleted successfully"})
}
