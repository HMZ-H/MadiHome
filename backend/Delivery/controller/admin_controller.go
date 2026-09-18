package controller

import (
	"net/http"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
)

type AdminController struct {
	userUsecase    usecases.UserUsecaseInterface
	doctorUsecase  usecases.DoctorUsecaseInterface
	bookingUsecase usecases.BookingUsecaseInterface
}

func NewAdminController(
	userUsecase usecases.UserUsecaseInterface,
	doctorUsecase usecases.DoctorUsecaseInterface,
	bookingUsecase usecases.BookingUsecaseInterface,
) *AdminController {
	return &AdminController{
		userUsecase:    userUsecase,
		doctorUsecase:  doctorUsecase,
		bookingUsecase: bookingUsecase,
	}
}

// GetAllUsers returns all users for admin dashboard
func (a *AdminController) GetAllUsers(c *gin.Context) {
	users, err := a.userUsecase.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Message: "Failed to fetch users",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
	})
}

// GetAllDoctors returns all doctors for admin dashboard
func (a *AdminController) GetAllDoctors(c *gin.Context) {
	doctors, err := a.doctorUsecase.GetAllDoctors()
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Message: "Failed to fetch doctors",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"doctors": doctors,
	})
}

// GetAllBookings returns all bookings for admin dashboard
func (a *AdminController) GetAllBookings(c *gin.Context) {
	bookings, err := a.bookingUsecase.GetAllBookings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Message: "Failed to fetch bookings",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bookings": bookings,
	})
}

// VerifyUser verifies a user account
func (a *AdminController) VerifyUser(c *gin.Context) {
	userID := c.Param("id")

	user, err := a.userUsecase.VerifyUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Message: "Failed to verify user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User verified successfully",
		"user":    user,
	})
}

// UnverifyUser unverifies a user account
func (a *AdminController) UnverifyUser(c *gin.Context) {
	userID := c.Param("id")

	user, err := a.userUsecase.UnverifyUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Message: "Failed to unverify user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User unverified successfully",
		"user":    user,
	})
}

// DeleteUser deletes a user (admin only)
func (a *AdminController) DeleteUser(c *gin.Context) {
	userID := c.Param("id")

	// Convert string to uint
	var userIDUint uint
	for _, char := range userID {
		if char >= '0' && char <= '9' {
			userIDUint = userIDUint*10 + uint(char-'0')
		}
	}

	err := a.userUsecase.DeleteUserWithCascade(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Message: "Failed to delete user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted successfully",
	})
}
