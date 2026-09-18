package controller

import (
	"net/http"
	"strconv"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
)

type DoctorController struct {
	doctorUsecase usecases.DoctorUsecaseInterface
}

func NewDoctorController(doctorUsecase usecases.DoctorUsecaseInterface) *DoctorController {
	return &DoctorController{doctorUsecase: doctorUsecase}
}

// CreateDoctor creates a new doctor
func (dc *DoctorController) CreateDoctor(c *gin.Context) {
	var req schema.CreateDoctorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: "Invalid request: " + err.Error()})
		return
	}

	doctor, err := dc.doctorUsecase.CreateDoctor(&req)
	if err != nil {
		if err.Error() == "doctor already exists" {
			c.JSON(http.StatusConflict, schema.ErrorResponse{Message: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, schema.SuccessResponse{Success: true, Message: "Doctor created successfully", Data: doctor})
}

// GetDoctorByID gets a doctor by ID
func (dc *DoctorController) GetDoctorByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: "Invalid ID"})
		return
	}

	doctor, err := dc.doctorUsecase.GetDoctorByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Doctor retrieved", Data: doctor})
}

// GetDoctorByEmail gets a doctor by email
func (dc *DoctorController) GetDoctorByEmail(c *gin.Context) {
	email := c.Param("email")
	doctor, err := dc.doctorUsecase.GetDoctorByEmail(email)
	if err != nil {
		c.JSON(http.StatusNotFound, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Doctor retrieved", Data: doctor})
}

// GetAllDoctors gets all doctors
func (dc *DoctorController) GetAllDoctors(c *gin.Context) {
	doctors, err := dc.doctorUsecase.GetAllDoctors()
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Doctors retrieved", Data: doctors})
}

// UpdateDoctor updates a doctor
func (dc *DoctorController) UpdateDoctor(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: "Invalid ID"})
		return
	}

	var req schema.UpdateDoctorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: err.Error()})
		return
	}

	updatedDoctor, err := dc.doctorUsecase.UpdateDoctor(uint(id), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Doctor updated", Data: updatedDoctor})
}

// DeleteDoctor deletes a doctor
func (dc *DoctorController) DeleteDoctor(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Message: "Invalid ID"})
		return
	}

	if err := dc.doctorUsecase.DeleteDoctor(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{Success: true, Message: "Doctor deleted"})
}
