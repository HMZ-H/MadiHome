package usecases

import (
	"errors"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
)

type HomecarePlanUsecase struct {
	repo repository.HomecarePlanRepository
}

type HomecarePlanUsecaseInterface interface {
	CreateHomecarePlan(req *schema.CreateHomecarePlanRequest) (*schema.HomecarePlanResponse, error)
	GetHomecarePlanByID(id uint) (*schema.HomecarePlanResponse, error)
	GetHomecarePlansByDoctor(doctorID uint) ([]*schema.HomecarePlanResponse, error)
	GetHomecarePlansByUser(userID uint) ([]*schema.HomecarePlanResponse, error)
	UpdateHomecarePlan(id uint, req *schema.UpdateHomecarePlanRequest) (*schema.HomecarePlanResponse, error)
	DeleteHomecarePlan(id uint) error
}

func NewHomecarePlanUsecase(repo repository.HomecarePlanRepository) *HomecarePlanUsecase {
	return &HomecarePlanUsecase{repo: repo}
}

func (uc *HomecarePlanUsecase) CreateHomecarePlan(req *schema.CreateHomecarePlanRequest) (*schema.HomecarePlanResponse, error) {
	// Create new plan
	newPlan := &entity.HomecarePlan{
		PatientID:   req.UserID,
		DoctorID:    req.DoctorID, // This should be set from JWT context in controller
		Title:       req.Title,
		Description: req.Description,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		Status:      "active", // Default status
	}
	createdPlan, err := uc.repo.CreateCarePlan(newPlan)
	if err != nil {
		return nil, err
	}
	return toHomecarePlanResponse(createdPlan), nil
}

func (uc *HomecarePlanUsecase) GetHomecarePlanByID(id uint) (*schema.HomecarePlanResponse, error) {
	plan, err := uc.repo.GetCarePlanByID(id)
	if err != nil {
		return nil, errors.New("plan not found")
	}
	return toHomecarePlanResponse(plan), nil
}

func (uc *HomecarePlanUsecase) GetHomecarePlansByDoctor(doctorID uint) ([]*schema.HomecarePlanResponse, error) {
	plans, err := uc.repo.GetCarePlansByDoctor(doctorID)
	if err != nil {
		return nil, errors.New("plans not found")
	}
	var responses []*schema.HomecarePlanResponse
	for _, plan := range plans {
		responses = append(responses, toHomecarePlanResponse(plan))
	}
	return responses, nil
}

func (uc *HomecarePlanUsecase) GetHomecarePlansByUser(userID uint) ([]*schema.HomecarePlanResponse, error) {
	plans, err := uc.repo.GetCarePlansByUser(userID)
	if err != nil {
		return nil, errors.New("plans not found")
	}
	var responses []*schema.HomecarePlanResponse
	for _, plan := range plans {
		responses = append(responses, toHomecarePlanResponse(plan))
	}
	return responses, nil
}

func (uc *HomecarePlanUsecase) UpdateHomecarePlan(id uint, req *schema.UpdateHomecarePlanRequest) (*schema.HomecarePlanResponse, error) {
	plan, err := uc.repo.GetCarePlanByID(id)
	if err != nil {
		return nil, errors.New("plan not found")
	}

	if req.Title != "" {
		plan.Title = req.Title
	}
	if req.Description != "" {
		plan.Description = req.Description
	}
	plan.StartDate = req.StartDate
	plan.EndDate = req.EndDate
	plan.Status = req.Status
	updatedPlan, err := uc.repo.UpdateCarePlan(plan)
	if err != nil {
		return nil, errors.New("failed to update plan")
	}
	return toHomecarePlanResponse(updatedPlan), nil
}

func (uc *HomecarePlanUsecase) DeleteHomecarePlan(id uint) error {
	_, err := uc.repo.GetCarePlanByID(id)
	if err != nil {
		return errors.New("plan not found")
	}
	return uc.repo.DeleteCarePlan(id)
}

func toHomecarePlanResponse(plan *entity.HomecarePlan) *schema.HomecarePlanResponse {
	return &schema.HomecarePlanResponse{
		ID:          plan.ID,
		UserID:      plan.PatientID,
		DoctorID:    plan.DoctorID,
		Title:       plan.Title,
		Description: plan.Description,
		StartDate:   plan.StartDate,
		EndDate:     plan.EndDate,
		Status:      plan.Status,
		CreatedAt:   plan.CreatedAt,
		UpdatedAt:   plan.UpdatedAt,
		User: struct {
			ID        uint   `json:"id"`
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
			Email     string `json:"email"`
			Phone     string `json:"phone"`
		}{
			ID:        plan.Patient.ID,
			FirstName: plan.Patient.FirstName,
			LastName:  plan.Patient.LastName,
			Email:     plan.Patient.Email,
			Phone:     plan.Patient.Phone,
		},
	}
}
