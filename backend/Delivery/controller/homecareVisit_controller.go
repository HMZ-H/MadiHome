package controller

import (
	"net/http"
	"strconv"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
)

type HomecareVisitController struct {
	homecareVisitUsecase usecases.HomecareVisitUsecaseInterface
}

func NewHomecareVisitController(homecareVisitUsecase usecases.HomecareVisitUsecaseInterface) *HomecareVisitController {
	return &HomecareVisitController{homecareVisitUsecase: homecareVisitUsecase}
}

func (hvc *HomecareVisitController) CreateHomecareVisit(c *gin.Context) {
	var req schema.ScheduleVisitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}

	// Get doctor ID from JWT context
	doctorIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}
	req.DoctorID = doctorIDRaw.(uint)

	visit, err := hvc.homecareVisitUsecase.CreateHomecareVisit(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusCreated, schema.SuccessResponse{
		Success: true,
		Message: "Homecare visit created successfully",
		Data:    visit,
	})
}

func (hvc *HomecareVisitController) GetHomecareVisitByID(c *gin.Context) {
	visitID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid visit ID",
		})
		return
	}
	visit, err := hvc.homecareVisitUsecase.GetHomecareVisitByID(uint(visitID))
	if err != nil {
		c.JSON(http.StatusNotFound, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Homecare visit retrieved successfully",
		Data:    visit,
	})
}

func (hvc *HomecareVisitController) GetHomecareVisitsByUserID(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("user_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid user ID",
		})
		return
	}
	visit, err := hvc.homecareVisitUsecase.GetHomecareVisitsByUserID(uint(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Homecare visits retrieved successfully",
		Data:    visit,
	})
}

// GetHomecareVisitsByDoctorID gets visits for the current doctor
func (hvc *HomecareVisitController) GetHomecareVisitsByDoctorID(c *gin.Context) {
	// Get doctor ID from JWT context
	doctorIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}
	doctorID := doctorIDRaw.(uint)

	visits, err := hvc.homecareVisitUsecase.GetHomecareVisitsByDoctorID(doctorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Doctor visits retrieved successfully",
		Data:    visits,
	})
}

func (hvc *HomecareVisitController) UpdateHomecareVisit(c *gin.Context) {
	visitID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid visit ID",
		})
		return
	}
	var req schema.UpdateVisitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}
	visit, err := hvc.homecareVisitUsecase.UpdateHomecareVisit(uint(visitID), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Homecare visit updated successfully",
		Data:    visit,
	})
}

func (hvc *HomecareVisitController) DeleteHomecareVisit(c *gin.Context) {
	visitID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid visit ID",
		})
		return
	}
	err = hvc.homecareVisitUsecase.DeleteHomecareVisit(uint(visitID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Homecare visit deleted successfully",
	})
}
