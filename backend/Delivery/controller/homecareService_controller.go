package controller

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
)

type HomecareServiceController struct {
	homecareServiceUsecase *usecases.HomecareUsecaseService
}

func NewHomecareServiceController(homecareServiceUsecase *usecases.HomecareUsecaseService) *HomecareServiceController {
	return &HomecareServiceController{homecareServiceUsecase: homecareServiceUsecase}
}

func (hsc *HomecareServiceController) CreateHomecareService(c *gin.Context) {
	var req schema.CreateHomecareServiceRequest
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
	userID := userIDRaw.(uint)

	// Get the actual doctor ID from user ID
	doctor, err := hsc.homecareServiceUsecase.GetDoctorByUserID(userID)
	if err != nil {
		c.JSON(http.StatusForbidden, schema.ErrorResponse{
			Success: false,
			Message: "Doctor profile not found for this user",
		})
		return
	}
	req.DoctorID = doctor.ID

	service, err := hsc.homecareServiceUsecase.CreateHomecareService(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusCreated, schema.SuccessResponse{
		Success: true,
		Message: "Homecare service created successfully",
		Data:    service,
	})
}

func (hsc *HomecareServiceController) BulkCreateHomecareServices(c *gin.Context) {
	var req schema.BulkCreateServicesRequest
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
	userID := userIDRaw.(uint)

	// Get the actual doctor ID from user ID
	doctor, err := hsc.homecareServiceUsecase.GetDoctorByUserID(userID)
	if err != nil {
		c.JSON(http.StatusForbidden, schema.ErrorResponse{
			Success: false,
			Message: "Doctor profile not found for this user",
		})
		return
	}

	// Set doctor ID for all services
	for i := range req.Services {
		req.Services[i].DoctorID = doctor.ID
	}

	response, err := hsc.homecareServiceUsecase.BulkCreateHomecareServices(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	// Determine HTTP status based on results
	status := http.StatusCreated
	if response.Summary.Failed > 0 && response.Summary.Success == 0 {
		status = http.StatusBadRequest // All failed
	} else if response.Summary.Failed > 0 {
		status = http.StatusMultiStatus // Partial success
	}

	c.JSON(status, schema.SuccessResponse{
		Success: response.Summary.Success > 0,
		Message: fmt.Sprintf("Bulk create completed: %d created, %d failed", response.Summary.Success, response.Summary.Failed),
		Data:    response,
	})
}

func (hsc *HomecareServiceController) GetHomecareServiceByID(c *gin.Context) {
	serviceID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid service ID",
		})
		return
	}
	service, err := hsc.homecareServiceUsecase.GetHomecareServiceByID(uint(serviceID))
	if err != nil {
		c.JSON(http.StatusNotFound, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Homecare service retrieved successfully",
		Data:    service,
	})
}

func (hsc *HomecareServiceController) GetHomecareServiceByName(c *gin.Context) {
	name := c.Param("name")
	service, err := hsc.homecareServiceUsecase.GetHomecareServiceByName(name)
	if err != nil {
		c.JSON(http.StatusNotFound, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Homecare service retrieved successfully",
		Data:    service,
	})
}

func (hsc *HomecareServiceController) GetAllHomecareServices(c *gin.Context) {
	var filter schema.ServiceFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Invalid query parameters"})
		return
	}

	if filter.Search == "" && filter.Category == "" && filter.MinPrice == nil && filter.MaxPrice == nil && filter.IsActive == nil && filter.Page == 0 {
		services, err := hsc.homecareServiceUsecase.GetAllHomecareServices()
		if err != nil {
			c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Success: false, Message: err.Error()})
			return
		}
		c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Homecare services retrieved successfully", Data: services})
		return
	}

	services, total, err := hsc.homecareServiceUsecase.SearchServices(&filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Success: false, Message: err.Error()})
		return
	}
	filter.Normalize()
	c.JSON(http.StatusOK, schema.PaginatedResponse{
		Success:  true,
		Message:  "Homecare services retrieved successfully",
		Data:     services,
		Page:     filter.Page,
		PageSize: filter.PageSize,
		Total:    total,
	})
}

func (hsc *HomecareServiceController) GetHomecareServicesByDoctor(c *gin.Context) {
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

	// Get the actual doctor ID from user ID
	doctor, err := hsc.homecareServiceUsecase.GetDoctorByUserID(userID)
	if err != nil {
		c.JSON(http.StatusForbidden, schema.ErrorResponse{
			Success: false,
			Message: "Doctor profile not found for this user",
		})
		return
	}

	services, err := hsc.homecareServiceUsecase.GetHomecareServicesByDoctor(doctor.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Doctor's homecare services retrieved successfully",
		Data:    services,
	})
}

func (hsc *HomecareServiceController) UpdateHomecareService(c *gin.Context) {
	serviceID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid service ID",
		})
		return
	}
	var req schema.UpdateHomecareServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}
	service, err := hsc.homecareServiceUsecase.UpdateHomecareService(uint(serviceID), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Homecare service updated successfully",
		Data:    service,
	})
}

func (hsc *HomecareServiceController) DeleteHomecareService(c *gin.Context) {
	serviceID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid service ID",
		})
	}
	err = hsc.homecareServiceUsecase.DeleteHomecareService(uint(serviceID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Homecare service deleted successfully",
	})
}
