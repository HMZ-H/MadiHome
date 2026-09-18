package Usecases

import (
	"errors"
	"time"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
)

type HomecareUsecaseService struct {
	repo       repository.HomecareServiceRepository
	doctorRepo repository.DoctorRepository
}

type HomecareUsecaseServiceInterface interface {
	CreateHomecareService(req *schema.CreateHomecareServiceRequest) (*schema.HomecareServiceResponse, error)
	BulkCreateHomecareServices(req *schema.BulkCreateServicesRequest) (*schema.BulkCreateServicesResponse, error)
	GetHomecareServiceByID(id uint) (*schema.HomecareServiceResponse, error)
	GetHomecareServiceByName(name string) (*schema.HomecareServiceResponse, error)
	GetHomecareServicesByDoctor(doctorID uint) ([]*schema.HomecareServiceResponse, error)
	GetAllHomecareServices() ([]*schema.HomecareServiceResponse, error)
	UpdateHomecareService(id uint, req *schema.UpdateHomecareServiceRequest) (*schema.HomecareServiceResponse, error)
	DeleteHomecareService(id uint) error
	GetDoctorByUserID(userID uint) (*schema.DoctorResponse, error)
	CreateHomecareVisit(req *schema.ScheduleVisitRequest) (*schema.HomecareVisitResponse, error)
	GetHomecareVisitByID(id uint) (*schema.HomecareVisitResponse, error)
	GetHomecareVisitsByDoctor(doctorID uint) ([]*schema.HomecareVisitResponse, error)
	GetHomecareVisitsByUser(userID uint) ([]*schema.HomecareVisitResponse, error)
	UpdateHomecareVisit(id uint, req *schema.UpdateVisitRequest) (*schema.HomecareVisitResponse, error)
	DeleteHomecareVisit(id uint) error
}

func NewHomecareUsecaseService(repo repository.HomecareServiceRepository, doctorRepo repository.DoctorRepository) *HomecareUsecaseService {
	return &HomecareUsecaseService{repo: repo, doctorRepo: doctorRepo}
}

func (uc *HomecareUsecaseService) CreateHomecareService(req *schema.CreateHomecareServiceRequest) (*schema.HomecareServiceResponse, error) {
	// Check if service with same name already exists
	existingService, _ := uc.repo.GetHomecareServiceByName(req.Name)
	if existingService != nil {
		return nil, errors.New("service with this name already exists")
	}

	// Create new service
	newService := &entity.HomecareService{
		DoctorID:    &req.DoctorID,
		Name:        req.Name,
		Description: req.Description,
		Duration:    req.Duration,
		Price:       req.Price,
		Category:    req.Category,
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	createdService, err := uc.repo.CreateHomecareService(newService)
	if err != nil {
		return nil, err
	}

	return toHomecareServiceResponse(createdService), nil
}

func (uc *HomecareUsecaseService) GetHomecareServiceByID(id uint) (*schema.HomecareServiceResponse, error) {
	service, err := uc.repo.GetHomecareServiceByID(id)
	if err != nil {
		return nil, errors.New("service not found")
	}
	return toHomecareServiceResponse(service), nil
}

func (uc *HomecareUsecaseService) GetHomecareServiceByName(name string) (*schema.HomecareServiceResponse, error) {
	service, err := uc.repo.GetHomecareServiceByName(name)
	if err != nil {
		return nil, errors.New("service not found")
	}
	return toHomecareServiceResponse(service), nil
}

func (uc *HomecareUsecaseService) GetHomecareServicesByDoctor(doctorID uint) ([]*schema.HomecareServiceResponse, error) {
	services, err := uc.repo.GetHomecareServicesByDoctor(doctorID)
	if err != nil {
		return nil, err
	}

	serviceResponse := make([]*schema.HomecareServiceResponse, len(services))
	for i, service := range services {
		serviceResponse[i] = toHomecareServiceResponse(service)
	}
	return serviceResponse, nil
}

func (uc *HomecareUsecaseService) GetAllHomecareServices() ([]*schema.HomecareServiceResponse, error) {
	services, err := uc.repo.GetAllHomecareServices()
	if err != nil {
		return nil, err
	}

	serviceResponse := make([]*schema.HomecareServiceResponse, len(services))
	for i, service := range services {
		serviceResponse[i] = toHomecareServiceResponse(service)
	}
	return serviceResponse, nil
}

func (uc *HomecareUsecaseService) UpdateHomecareService(id uint, req *schema.UpdateHomecareServiceRequest) (*schema.HomecareServiceResponse, error) {
	service, err := uc.repo.GetHomecareServiceByID(id)
	if err != nil {
		return nil, errors.New("service not found")
	}
	if req.Name != "" {
		service.Name = req.Name
	}
	if req.Description != "" {
		service.Description = req.Description
	}
	if req.Duration != 0 {
		service.Duration = req.Duration
	}
	if req.Price != 0 {
		service.Price = req.Price
	}
	if req.Category != "" {
		service.Category = req.Category
	}
	// IsActive is always provided in update requests, so we can set it directly
	service.IsActive = req.IsActive
	service.UpdatedAt = time.Now()
	updatedService, err := uc.repo.UpdateHomecareService(service)
	if err != nil {
		return nil, err
	}
	return toHomecareServiceResponse(updatedService), nil
}

func (uc *HomecareUsecaseService) DeleteHomecareService(id uint) error {
	_, err := uc.repo.GetHomecareServiceByID(id)
	if err != nil {
		return errors.New("service not found")
	}
	return uc.repo.DeleteHomecareService(id)
}

func (uc *HomecareUsecaseService) BulkCreateHomecareServices(req *schema.BulkCreateServicesRequest) (*schema.BulkCreateServicesResponse, error) {
	response := &schema.BulkCreateServicesResponse{
		Created: []schema.HomecareServiceResponse{},
		Failed: []struct {
			Service schema.CreateHomecareServiceRequest `json:"service"`
			Error   string                              `json:"error"`
		}{},
	}

	for _, serviceReq := range req.Services {
		createdService, err := uc.CreateHomecareService(&serviceReq)
		if err != nil {
			response.Failed = append(response.Failed, struct {
				Service schema.CreateHomecareServiceRequest `json:"service"`
				Error   string                              `json:"error"`
			}{
				Service: serviceReq,
				Error:   err.Error(),
			})
		} else {
			response.Created = append(response.Created, *createdService)
		}
	}

	response.Summary.Total = len(req.Services)
	response.Summary.Success = len(response.Created)
	response.Summary.Failed = len(response.Failed)

	return response, nil
}

func (uc *HomecareUsecaseService) GetDoctorByUserID(userID uint) (*schema.DoctorResponse, error) {
	doctor, err := uc.doctorRepo.GetDoctorByUserID(userID)
	if err != nil {
		return nil, errors.New("doctor profile not found")
	}

	return &schema.DoctorResponse{
		ID:              doctor.ID,
		UserID:          *doctor.UserID,
		Specialization:  doctor.Specialization,
		LicenseNumber:   doctor.LicenseNumber,
		ExperienceYears: doctor.ExperienceYears,
		Bio:             doctor.Bio,
		CreatedAt:       doctor.CreatedAt,
		UpdatedAt:       doctor.UpdatedAt,
	}, nil
}

func toHomecareServiceResponse(service *entity.HomecareService) *schema.HomecareServiceResponse {
	return &schema.HomecareServiceResponse{
		ID:          service.ID,
		DoctorID:    service.DoctorID,
		Name:        service.Name,
		Description: service.Description,
		Duration:    service.Duration,
		Price:       service.Price,
		Category:    service.Category,
		IsActive:    service.IsActive,
		CreatedAt:   service.CreatedAt,
		UpdatedAt:   service.UpdatedAt,
	}
}
