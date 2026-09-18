package controller

import (
	"net/http"
	"strconv"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
)

type RoleRequestController struct {
	roleRequestUsecase usecases.RoleRequestUsecaseInterface
}

func NewRoleRequestController(roleRequestUsecase usecases.RoleRequestUsecaseInterface) *RoleRequestController {
	return &RoleRequestController{
		roleRequestUsecase: roleRequestUsecase,
	}
}

// CreateRoleRequest creates a new role request
func (r *RoleRequestController) CreateRoleRequest(c *gin.Context) {
	var req schema.CreateRoleRequestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Message: "Invalid request format: " + err.Error(),
		})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{
			Message: "User not authenticated",
		})
		return
	}

	roleRequest, err := r.roleRequestUsecase.CreateRoleRequest(&req, userID.(uint))
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Role request submitted successfully",
		"request": roleRequest,
	})
}

// GetRoleRequestByID gets a role request by ID
func (r *RoleRequestController) GetRoleRequestByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Message: "Invalid request ID",
		})
		return
	}

	roleRequest, err := r.roleRequestUsecase.GetRoleRequestByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, schema.ErrorResponse{
			Message: "Role request not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"request": roleRequest,
	})
}

// GetUserRoleRequests gets role requests for the current user
func (r *RoleRequestController) GetUserRoleRequests(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{
			Message: "User not authenticated",
		})
		return
	}

	requests, err := r.roleRequestUsecase.GetRoleRequestsByUserID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Message: "Failed to fetch role requests",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"requests": requests,
	})
}

// GetAllRoleRequests gets all role requests (admin only)
func (r *RoleRequestController) GetAllRoleRequests(c *gin.Context) {
	requests, err := r.roleRequestUsecase.GetAllRoleRequests()
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Message: "Failed to fetch role requests",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"requests": requests,
	})
}

// GetPendingRoleRequests gets pending role requests (admin only)
func (r *RoleRequestController) GetPendingRoleRequests(c *gin.Context) {
	requests, err := r.roleRequestUsecase.GetPendingRoleRequests()
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Message: "Failed to fetch pending role requests",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"requests": requests,
	})
}

// UpdateRoleRequest updates a role request (admin only)
func (r *RoleRequestController) UpdateRoleRequest(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Message: "Invalid request ID",
		})
		return
	}

	var req schema.UpdateRoleRequestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Message: "Invalid request format: " + err.Error(),
		})
		return
	}

	// Get reviewer ID from context (set by auth middleware)
	reviewerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{
			Message: "User not authenticated",
		})
		return
	}

	roleRequest, err := r.roleRequestUsecase.UpdateRoleRequest(uint(id), &req, reviewerID.(uint))
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Role request updated successfully",
		"request": roleRequest,
	})
}

// DeleteRoleRequest deletes a role request
func (r *RoleRequestController) DeleteRoleRequest(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Message: "Invalid request ID",
		})
		return
	}

	err = r.roleRequestUsecase.DeleteRoleRequest(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Message: "Failed to delete role request",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Role request deleted successfully",
	})
}
