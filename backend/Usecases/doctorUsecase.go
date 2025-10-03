package usecases

import (
	"errors"
	"time"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
)

type DoctorUsecase struct {
	repo repository.DoctorRepository
}

type DoctorUsecaseInterface interface {
	CreateDoctor(req *schema.CreateDoctorRequest) (*schema.DoctorResponse, error)
	GetDoctorByID(id uint) (*schema.DoctorResponse, error)
	GetDoctorByEmail(email string) (*schema.DoctorResponse, error)
	GetAllDoctors() ([]*schema.DoctorResponse, error)
	UpdateDoctor(id uint, req *schema.UpdateDoctorRequest) (*schema.DoctorResponse, error)
	DeleteDoctor(id uint) error
}

func NewDoctorUsecase(repo repository.DoctorRepository) *DoctorUsecase {
	return &DoctorUsecase{repo: repo}
}

func (uc *DoctorUsecase) CreateDoctor(req *schema.CreateDoctorRequest) (*schema.DoctorResponse, error) {
	// Check if doctor already exists for this user
	if exist, _ := uc.repo.GetDoctorByUserID(req.UserID); exist != nil {
		return nil, errors.New("doctor profile already exists for this user")
	}

	newDoctor := &entity.Doctor{
		UserID:          &req.UserID,
		Specialization:  req.Specialization,
		LicenseNumber:   req.LicenseNumber,
		ExperienceYears: req.ExperienceYears,
		Bio:             req.Bio,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	createdDoctor, err := uc.repo.CreateDoctor(newDoctor)
	if err != nil {
		return nil, err
	}

	return toDoctorResponse(createdDoctor), nil
}

func (uc *DoctorUsecase) GetDoctorByID(id uint) (*schema.DoctorResponse, error) {
	doctor, err := uc.repo.GetDoctorByID(id)
	if err != nil {
		return nil, errors.New("doctor not found")
	}
	return toDoctorResponse(doctor), nil
}

func (uc *DoctorUsecase) GetDoctorByEmail(email string) (*schema.DoctorResponse, error) {
	doctor, err := uc.repo.GetDoctorByEmail(email)
	if err != nil {
		return nil, errors.New("doctor not found")
	}
	return toDoctorResponse(doctor), nil
}

func (uc *DoctorUsecase) GetAllDoctors() ([]*schema.DoctorResponse, error) {
	doctors, err := uc.repo.GetAllDoctors()
	if err != nil {
		return nil, err
	}

	doctorResponses := make([]*schema.DoctorResponse, len(doctors))
	for i, doctor := range doctors {
		doctorResponses[i] = toDoctorResponse(doctor)
	}

	return doctorResponses, nil
}

func (uc *DoctorUsecase) UpdateDoctor(id uint, req *schema.UpdateDoctorRequest) (*schema.DoctorResponse, error) {
	doctor, err := uc.repo.GetDoctorByID(id)
	if err != nil {
		return nil, errors.New("doctor not found")
	}

	// Update fields if provided
	if req.Specialization != "" {
		doctor.Specialization = req.Specialization
	}
	if req.LicenseNumber != "" {
		doctor.LicenseNumber = req.LicenseNumber
	}
	if req.ExperienceYears > 0 {
		doctor.ExperienceYears = req.ExperienceYears
	}
	if req.Bio != "" {
		doctor.Bio = req.Bio
	}

	doctor.UpdatedAt = time.Now()

	updatedDoctor, err := uc.repo.UpdateDoctor(doctor)
	if err != nil {
		return nil, err
	}

	return toDoctorResponse(updatedDoctor), nil
}

func (uc *DoctorUsecase) DeleteDoctor(id uint) error {
	// Check if doctor exists
	_, err := uc.repo.GetDoctorByID(id)
	if err != nil {
		return errors.New("doctor not found")
	}

	return uc.repo.DeleteDoctor(id)
}

// Helper function to convert entity to response
func toDoctorResponse(doctor *entity.Doctor) *schema.DoctorResponse {
	var userID uint
	if doctor.UserID != nil {
		userID = *doctor.UserID
	}

	return &schema.DoctorResponse{
		ID:              doctor.ID,
		UserID:          userID,
		Specialization:  doctor.Specialization,
		LicenseNumber:   doctor.LicenseNumber,
		ExperienceYears: doctor.ExperienceYears,
		Bio:             doctor.Bio,
		CreatedAt:       doctor.CreatedAt,
		UpdatedAt:       doctor.UpdatedAt,
		User: struct {
			ID        uint   `json:"id"`
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
			Email     string `json:"email"`
			Phone     string `json:"phone"`
			Role      string `json:"role"`
		}{
			ID:        doctor.User.ID,
			FirstName: doctor.User.FirstName,
			LastName:  doctor.User.LastName,
			Email:     doctor.User.Email,
			Phone:     doctor.User.Phone,
			Role:      doctor.User.Role,
		},
	}
}
