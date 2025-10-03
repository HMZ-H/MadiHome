package controller

import (
	"net/http"
	"strconv"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
)

type UserController struct {
	userUsecase usecases.UserUsecaseInterface
}

func NewUserController(userUsecase usecases.UserUsecaseInterface) *UserController {
	return &UserController{userUsecase: userUsecase}
}

// Register new user
func (h *UserController) Register(c *gin.Context) {
	var req schema.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: "Invalid request: " + err.Error()})
		return
	}

	user, err := h.userUsecase.Register(&req)
	if err != nil {
		if err.Error() == "user already exists" {
			c.JSON(http.StatusConflict, schema.ErrorResponse{Message: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, schema.SuccessResponse{Success: true, Message: "User registered successfully", Data: user})
}

// Login returns access and refresh tokens
func (h *UserController) Login(c *gin.Context) {
	var req schema.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: "Invalid request: " + err.Error()})
		return
	}

	accessToken, refreshToken, userResp, err := h.userUsecase.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{Message: "Invalid credentials"})
		return
	}

	// Optionally set refresh token as HttpOnly cookie
	c.SetCookie("refresh_token", refreshToken, 7*24*3600, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user":          userResp,
	})
}

// Get current user profile
func (h *UserController) Me(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{Message: "Unauthorized"})
		return
	}

	userID := userIDRaw.(uint)
	userResp, err := h.userUsecase.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Profile retrieved", Data: userResp})
}

// Get user by ID
func (h *UserController) GetUserByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: "Invalid ID"})
		return
	}

	user, err := h.userUsecase.GetUserByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "User retrieved", Data: user})
}

// Get user by email
func (h *UserController) GetUserByEmail(c *gin.Context) {
	email := c.Param("email")
	user, err := h.userUsecase.GetUserByEmail(email)
	if err != nil {
		c.JSON(http.StatusNotFound, schema.ErrorResponse{Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "User retrieved", Data: user})
}

// Get all users (admin function - should be restricted)
func (h *UserController) GetAllUsers(c *gin.Context) {
	users, err := h.userUsecase.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Users retrieved", Data: users})
}

// Get doctor's patients (only users with role "user")
func (h *UserController) GetDoctorPatients(c *gin.Context) {
	// Get the logged-in doctor's ID from the context
	doctorIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{Message: "Unauthorized"})
		return
	}

	doctorID := doctorIDRaw.(uint)

	// Get only users with role "user" (patients)
	users, err := h.userUsecase.GetUsersByRole("user")
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Patients retrieved",
		Data: gin.H{
			"doctor_id": doctorID,
			"patients":  users,
		},
	})
}

// Update user
func (h *UserController) UpdateUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: "Invalid ID"})
		return
	}

	var req schema.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: err.Error()})
		return
	}

	updatedUser, err := h.userUsecase.UpdateUser(uint(id), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "User updated", Data: updatedUser})
}

// Change password
func (h *UserController) ChangePassword(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: "Invalid ID"})
		return
	}

	var req struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: err.Error()})
		return
	}

	if err := h.userUsecase.ChangePassword(uint(id), req.OldPassword, req.NewPassword); err != nil {
		c.JSON(http.StatusForbidden, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Password changed"})
}

// Reset password (admin)
func (h *UserController) ResetPassword(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: "Invalid ID"})
		return
	}

	var req struct {
		NewPassword string `json:"new_password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: err.Error()})
		return
	}

	if err := h.userUsecase.ResetPassword(uint(id), req.NewPassword); err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Password reset"})
}

// Verify user
func (h *UserController) VerifyUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: "Invalid ID"})
		return
	}

	if err := h.userUsecase.VerifyUser(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "User verified"})
}

// Delete user
func (h *UserController) DeleteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: "Invalid ID"})
		return
	}

	if err := h.userUsecase.DeleteUser(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "User deleted"})
}
