package usecases

import (
	"errors"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
)

type HomecareVisitUsecase struct {
	repo repository.HomecareVisitRepository
}

type HomecareVisitUsecaseInterface interface {
	CreateHomecareVisit(req *schema.ScheduleVisitRequest) (*schema.HomecareVisitResponse, error)
	GetHomecareVisitByID(id uint) (*schema.HomecareVisitResponse, error)
	// GetHomecareVisitsByDoctor(doctorID uint) ([]*schema.HomecareVisitResponse, error)
	GetHomecareVisitsByUserID(userID uint) (*schema.HomecareVisitResponse, error)
	UpdateHomecareVisit(id uint, req *schema.UpdateVisitRequest) (*schema.HomecareVisitResponse, error)
	DeleteHomecareVisit(id uint) error
}

func NewHomecareVisitUsecase(repo repository.HomecareVisitRepository) *HomecareVisitUsecase {
	return &HomecareVisitUsecase{repo: repo}
}

func (uc *HomecareVisitUsecase) CreateHomecareVisit(req *schema.ScheduleVisitRequest) (*schema.HomecareVisitResponse, error) {
	// Check if user exists
	user, err := uc.repo.GetHomecareVisitsByUserID(req.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user != nil {
		return nil, errors.New("user already has a visit scheduled")
	}

	service, err := uc.repo.GetHomecareVisitsBySeviceID(req.ServiceID)
	if err != nil {
		return nil, errors.New("service not found")
	}
	if service != nil {
		return nil, errors.New("service already has a visit scheduled")
	}

	newVisit := &entity.HomecareVisit{
		BookingID:   req.BookingID,
		PatientID:   req.UserID,
		DoctorID:    req.DoctorID,
		ServiceID:   req.ServiceID,
		CarePlanID:  req.CarePlanID,
		ScheduledAt: req.ScheduledAt,
		Status:      "scheduled",
		VisitNotes:  req.Notes,
	}
	createdVisit, err := uc.repo.CreateHomecareVisit(newVisit)
	if err != nil {
		return nil, err
	}
	return toHomecareVisitResponse(createdVisit), nil
}

func (uc *HomecareVisitUsecase) GetHomecareVisitByID(id uint) (*schema.HomecareVisitResponse, error) {
	visit, err := uc.repo.GetHomecareVisitByID(id)
	if err != nil {
		return nil, errors.New("visit not found")
	}
	return toHomecareVisitResponse(visit), nil
}

func (uc *HomecareVisitUsecase) GetHomecareVisitsBySeviceID(serviceID uint) (*schema.HomecareVisitResponse, error) {
	visits, err := uc.repo.GetHomecareVisitsBySeviceID(serviceID)
	if err != nil {
		return nil, errors.New("visits not found")
	}
	return toHomecareVisitResponse(visits), nil
}

func (uc *HomecareVisitUsecase) GetHomecareVisitsByUserID(userID uint) (*schema.HomecareVisitResponse, error) {
	visits, err := uc.repo.GetHomecareVisitsByUserID(userID)
	if err != nil {
		return nil, errors.New("visits not found")
	}
	return toHomecareVisitResponse(visits), nil
}

func (uc *HomecareVisitUsecase) UpdateHomecareVisit(id uint, req *schema.UpdateVisitRequest) (*schema.HomecareVisitResponse, error) {
	visit, err := uc.repo.GetHomecareVisitByID(id)
	if err != nil {
		return nil, errors.New("visit not found")
	}
	if req.ScheduledAt != nil {
		visit.ScheduledAt = *req.ScheduledAt
	}
	visit.StartTime = req.StartTime
	visit.EndTime = req.EndTime
	visit.Status = req.Status
	visit.VisitNotes = req.Notes
	updatedVisit, err := uc.repo.UpdateHomecareVisit(visit)
	if err != nil {
		return nil, err
	}
	return toHomecareVisitResponse(updatedVisit), nil
}

func (uc *HomecareVisitUsecase) DeleteHomecareVisit(id uint) error {
	_, err := uc.repo.GetHomecareVisitByID(id)
	if err != nil {
		return errors.New("visit not found")
	}
	return uc.repo.DeleteHomecareVisit(id)
}

func toHomecareVisitResponse(visit *entity.HomecareVisit) *schema.HomecareVisitResponse {
	return &schema.HomecareVisitResponse{
		ID:          visit.ID,
		BookingID:   visit.BookingID,
		UserID:      visit.PatientID,
		DoctorID:    visit.DoctorID,
		ServiceID:   visit.ServiceID,
		CarePlanID:  visit.CarePlanID,
		ScheduledAt: visit.ScheduledAt,
		StartTime:   visit.StartTime,
		EndTime:     visit.EndTime,
		Status:      visit.Status,
		VisitNotes:  visit.VisitNotes,
		CreatedAt:   visit.CreatedAt,
		UpdatedAt:   visit.UpdatedAt,
		// Location comes from booking now
		Address:   visit.Booking.PatientAddress,
		Latitude:  visit.Booking.Latitude,
		Longitude: visit.Booking.Longitude,
		User: struct {
			ID        uint   `json:"id"`
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
			Email     string `json:"email"`
			Phone     string `json:"phone"`
			Address   string `json:"address"`
		}{
			ID:        visit.Patient.ID,
			FirstName: visit.Patient.FirstName,
			LastName:  visit.Patient.LastName,
			Email:     visit.Patient.Email,
			Phone:     visit.Patient.Phone,
			Address:   visit.Patient.Address,
		},
	}
}
