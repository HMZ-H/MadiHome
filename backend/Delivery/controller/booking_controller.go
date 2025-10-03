package controller

import (
	"net/http"
	"strconv"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
)

type BookingController struct {
	bookingUsecase *usecases.BookingUsecase
}

func NewBookingController(bookingUsecase *usecases.BookingUsecase) *BookingController {
	return &BookingController{bookingUsecase: bookingUsecase}
}

// Patient creates a booking
func (bc *BookingController) CreateBooking(c *gin.Context) {
	var req schema.CreateBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}

	// Get user ID from JWT token context
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}
	req.UserID = userIDRaw.(uint)

	booking, err := bc.bookingUsecase.CreateBooking(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, schema.SuccessResponse{
		Success: true,
		Message: "Booking created successfully",
		Data:    booking,
	})
}

// Get booking by ID
func (bc *BookingController) GetBookingByID(c *gin.Context) {
	bookingID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid booking ID",
		})
		return
	}

	booking, err := bc.bookingUsecase.GetBookingByID(uint(bookingID))
	if err != nil {
		c.JSON(http.StatusNotFound, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Booking retrieved successfully",
		Data:    booking,
	})
}

// Patient gets their own bookings
func (bc *BookingController) GetUserBookings(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}
	userID := userIDRaw.(uint)

	bookings, err := bc.bookingUsecase.GetBookingsByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "User bookings retrieved successfully",
		Data:    bookings,
	})
}

// Doctor gets bookings assigned to them
func (bc *BookingController) GetDoctorBookings(c *gin.Context) {
	doctorIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}
	doctorID := doctorIDRaw.(uint)

	bookings, err := bc.bookingUsecase.GetBookingsByDoctorID(doctorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Doctor bookings retrieved successfully",
		Data:    bookings,
	})
}

// Doctor gets pending bookings (not assigned to any doctor yet)
func (bc *BookingController) GetPendingBookings(c *gin.Context) {
	bookings, err := bc.bookingUsecase.GetBookingsByStatus("pending")
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Pending bookings retrieved successfully",
		Data:    bookings,
	})
}

// Doctor accepts or rejects a booking
func (bc *BookingController) UpdateBooking(c *gin.Context) {
	bookingID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid booking ID",
		})
		return
	}

	var req schema.UpdateBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}

	booking, err := bc.bookingUsecase.UpdateBooking(uint(bookingID), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Booking updated successfully",
		Data:    booking,
	})
}

// Doctor completes a booking after visit
func (bc *BookingController) CompleteBooking(c *gin.Context) {
	bookingID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid booking ID",
		})
		return
	}

	var req schema.CompleteBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}

	booking, err := bc.bookingUsecase.CompleteBooking(uint(bookingID), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Booking completed successfully",
		Data:    booking,
	})
}

// Delete booking (admin only or booking owner)
func (bc *BookingController) DeleteBooking(c *gin.Context) {
	bookingID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid booking ID",
		})
		return
	}

	err = bc.bookingUsecase.DeleteBooking(uint(bookingID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Booking deleted successfully",
	})
}
