package Usecases

import (
	"errors"
	"time"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
)

type RoleRequestUsecase struct {
	roleRequestRepo repository.RoleRequestRepository
	userRepo        repository.UserRepository
	doctorRepo      repository.DoctorRepository
}

type RoleRequestUsecaseInterface interface {
	CreateRoleRequest(req *schema.CreateRoleRequestRequest, userID uint) (*schema.RoleRequestResponse, error)
	GetRoleRequestByID(id uint) (*schema.RoleRequestResponse, error)
	GetRoleRequestsByUserID(userID uint) ([]*schema.RoleRequestResponse, error)
	GetAllRoleRequests() ([]*schema.RoleRequestResponse, error)
	GetPendingRoleRequests() ([]*schema.RoleRequestResponse, error)
	UpdateRoleRequest(id uint, req *schema.UpdateRoleRequestRequest, reviewerID uint) (*schema.RoleRequestResponse, error)
	DeleteRoleRequest(id uint) error
}

func NewRoleRequestUsecase(roleRequestRepo repository.RoleRequestRepository, userRepo repository.UserRepository, doctorRepo repository.DoctorRepository) *RoleRequestUsecase {
	return &RoleRequestUsecase{
		roleRequestRepo: roleRequestRepo,
		userRepo:        userRepo,
		doctorRepo:      doctorRepo,
	}
}

func (uc *RoleRequestUsecase) CreateRoleRequest(req *schema.CreateRoleRequestRequest, userID uint) (*schema.RoleRequestResponse, error) {
	// Check if user already has a pending request
	existingRequests, err := uc.roleRequestRepo.GetRoleRequestsByUserID(userID)
	if err == nil {
		for _, request := range existingRequests {
			if request.Status == "pending" {
				return nil, errors.New("you already have a pending role request")
			}
		}
	}

	// Check if user already has the requested role
	user, err := uc.userRepo.GetUserByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user.Role == req.RequestedRole {
		return nil, errors.New("you already have this role")
	}

	// Create role request
	roleRequest := &entity.RoleRequest{
		UserID:        userID,
		RequestedRole: req.RequestedRole,
		Status:        "pending",
		Reason:        req.Reason,
		Documents:     req.Documents,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	createdRequest, err := uc.roleRequestRepo.CreateRoleRequest(roleRequest)
	if err != nil {
		return nil, err
	}

	return uc.toRoleRequestResponse(createdRequest), nil
}

func (uc *RoleRequestUsecase) GetRoleRequestByID(id uint) (*schema.RoleRequestResponse, error) {
	request, err := uc.roleRequestRepo.GetRoleRequestByID(id)
	if err != nil {
		return nil, err
	}

	return uc.toRoleRequestResponse(request), nil
}

func (uc *RoleRequestUsecase) GetRoleRequestsByUserID(userID uint) ([]*schema.RoleRequestResponse, error) {
	requests, err := uc.roleRequestRepo.GetRoleRequestsByUserID(userID)
	if err != nil {
		return nil, err
	}

	var responses []*schema.RoleRequestResponse
	for _, request := range requests {
		responses = append(responses, uc.toRoleRequestResponse(request))
	}

	return responses, nil
}

func (uc *RoleRequestUsecase) GetAllRoleRequests() ([]*schema.RoleRequestResponse, error) {
	requests, err := uc.roleRequestRepo.GetAllRoleRequests()
	if err != nil {
		return nil, err
	}

	var responses []*schema.RoleRequestResponse
	for _, request := range requests {
		responses = append(responses, uc.toRoleRequestResponse(request))
	}

	return responses, nil
}

func (uc *RoleRequestUsecase) GetPendingRoleRequests() ([]*schema.RoleRequestResponse, error) {
	requests, err := uc.roleRequestRepo.GetRoleRequestsByStatus("pending")
	if err != nil {
		return nil, err
	}

	var responses []*schema.RoleRequestResponse
	for _, request := range requests {
		responses = append(responses, uc.toRoleRequestResponse(request))
	}

	return responses, nil
}

func (uc *RoleRequestUsecase) UpdateRoleRequest(id uint, req *schema.UpdateRoleRequestRequest, reviewerID uint) (*schema.RoleRequestResponse, error) {
	request, err := uc.roleRequestRepo.GetRoleRequestByID(id)
	if err != nil {
		return nil, errors.New("role request not found")
	}

	if request.Status != "pending" {
		return nil, errors.New("role request has already been processed")
	}

	// Update the request
	request.Status = req.Status
	request.ReviewedBy = &reviewerID
	request.ReviewNotes = req.ReviewNotes
	request.UpdatedAt = time.Now()

	// If approved, update user role
	if req.Status == "approved" {
		user, err := uc.userRepo.GetUserByID(request.UserID)
		if err != nil {
			return nil, errors.New("user not found")
		}

		user.Role = request.RequestedRole
		_, err = uc.userRepo.UpdateUser(user)
		if err != nil {
			return nil, errors.New("failed to update user role")
		}

		// If requesting doctor role, create doctor profile
		if request.RequestedRole == "doctor" {
			// Check if doctor profile already exists
			existingDoctor, _ := uc.doctorRepo.GetDoctorByUserID(request.UserID)
			if existingDoctor == nil {
				// Create basic doctor profile (user will need to complete it later)
				doctor := &entity.Doctor{
					UserID:          &request.UserID,
					Specialization:  "General Practice", // Default
					LicenseNumber:   "",                 // To be filled by doctor
					ExperienceYears: 0,
					Bio:             "",
					CreatedAt:       time.Now(),
					UpdatedAt:       time.Now(),
				}
				_, err = uc.doctorRepo.CreateDoctor(doctor)
				if err != nil {
					return nil, errors.New("failed to create doctor profile")
				}
			}
		}
	}

	updatedRequest, err := uc.roleRequestRepo.UpdateRoleRequest(request)
	if err != nil {
		return nil, err
	}

	return uc.toRoleRequestResponse(updatedRequest), nil
}

func (uc *RoleRequestUsecase) DeleteRoleRequest(id uint) error {
	return uc.roleRequestRepo.DeleteRoleRequest(id)
}

func (uc *RoleRequestUsecase) toRoleRequestResponse(request *entity.RoleRequest) *schema.RoleRequestResponse {
	response := &schema.RoleRequestResponse{
		ID:            request.ID,
		UserID:        request.UserID,
		RequestedRole: request.RequestedRole,
		Status:        request.Status,
		Reason:        request.Reason,
		Documents:     request.Documents,
		ReviewedBy:    request.ReviewedBy,
		ReviewNotes:   request.ReviewNotes,
		CreatedAt:     request.CreatedAt,
		UpdatedAt:     request.UpdatedAt,
	}

	// Add user information
	response.User.ID = request.User.ID
	response.User.FirstName = request.User.FirstName
	response.User.LastName = request.User.LastName
	response.User.Email = request.User.Email
	response.User.Phone = request.User.Phone
	response.User.Role = request.User.Role

	// Add reviewer information if exists
	if request.Reviewer != nil {
		response.Reviewer = &struct {
			ID        uint   `json:"id"`
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
			Email     string `json:"email"`
		}{
			ID:        request.Reviewer.ID,
			FirstName: request.Reviewer.FirstName,
			LastName:  request.Reviewer.LastName,
			Email:     request.Reviewer.Email,
		}
	}

	return response
}
