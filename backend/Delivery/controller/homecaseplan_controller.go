package controller

import (
	"net/http"
	"strconv"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
)

type HomecarePlanController struct {
	homecarePlanUsecase *usecases.HomecarePlanUsecase
}

func NewHomecarePlanController(homecarePlanUsecase *usecases.HomecarePlanUsecase) *HomecarePlanController {
	return &HomecarePlanController{homecarePlanUsecase: homecarePlanUsecase}
}

func (hpc *HomecarePlanController) CreateHomecarePlan(c *gin.Context) {
	var req schema.CreateHomecarePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}

	// Get doctor ID from JWT token context
	doctorIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}
	req.DoctorID = doctorIDRaw.(uint)

	plan, err := hpc.homecarePlanUsecase.CreateHomecarePlan(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusCreated, schema.SuccessResponse{
		Success: true,
		Message: "Homecare plan created successfully",
		Data:    plan,
	})
}

func (hpc *HomecarePlanController) GetHomecarePlanByID(c *gin.Context) {
	planID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid plan ID",
		})
	}
	plan, err := hpc.homecarePlanUsecase.GetHomecarePlanByID(uint(planID))
	if err != nil {
		c.JSON(http.StatusNotFound, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Homecare plan retrieved successfully",
		Data:    plan,
	})
}

func (hpc *HomecarePlanController) GetHomecarePlansByDoctor(c *gin.Context) {
	// Get doctor ID from JWT token context
	doctorIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}
	doctorID := doctorIDRaw.(uint)

	plans, err := hpc.homecarePlanUsecase.GetHomecarePlansByDoctor(doctorID)
	if err != nil {
		c.JSON(http.StatusNotFound, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Homecare plans retrieved successfully",
		Data:    plans,
	})
}

func (hpc *HomecarePlanController) GetHomecarePlansByUser(c *gin.Context) {
	// Get user ID from JWT token context
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}
	userID := userIDRaw.(uint)

	plans, err := hpc.homecarePlanUsecase.GetHomecarePlansByUser(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Homecare plans retrieved successfully",
		Data:    plans,
	})
}

func (hpc *HomecarePlanController) UpdateHomecarePlan(c *gin.Context) {
	planID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid plan ID",
		})
		return
	}
	var req schema.UpdateHomecarePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}
	plan, err := hpc.homecarePlanUsecase.UpdateHomecarePlan(uint(planID), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Homecare plan updated successfully",
		Data:    plan,
	})
}

func (hpc *HomecarePlanController) DeleteHomecarePlan(c *gin.Context) {
	planID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid plan ID",
		})
		return
	}
	err = hpc.homecarePlanUsecase.DeleteHomecarePlan(uint(planID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Homecare plan deleted successfully",
	})
}
