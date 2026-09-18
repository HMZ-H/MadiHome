package schema

import (
	"time"

	"github.com/HMZ-H/Madihome/Domain/entity"
)

// Patient creates booking request
type CreateBookingRequest struct {
	UserID         uint     `json:"user_id,omitempty"` // Set from JWT context
	ServiceID      uint     `json:"service_id" validate:"required"`
	PreferredDate  string   `json:"preferred_date" validate:"required"` // "2025-10-05T10:00:00Z"
	PatientAddress string   `json:"patient_address" validate:"required"`
	Latitude       *float64 `json:"latitude"`
	Longitude      *float64 `json:"longitude"`
	PatientNotes   string   `json:"patient_notes"`
}

// Doctor updates booking (accept/reject)
type UpdateBookingRequest struct {
	Status      string   `json:"status" validate:"required,oneof=accepted rejected"`
	DoctorNotes string   `json:"doctor_notes"`
	ActualPrice *float64 `json:"actual_price"`
	DoctorID    *uint    `json:"doctor_id,omitempty"` // Set by controller from JWT context
}

// Complete booking after visit
type CompleteBookingRequest struct {
	Status      string   `json:"status" validate:"required,oneof=completed cancelled"`
	DoctorNotes string   `json:"doctor_notes"`
	ActualPrice *float64 `json:"actual_price"`
}

type BookingResponse struct {
	ID             uint      `json:"id"`
	UserID         uint      `json:"user_id"`
	ServiceID      uint      `json:"service_id"`
	DoctorID       *uint     `json:"doctor_id"`
	PreferredDate  time.Time `json:"preferred_date"`
	Status         string    `json:"status"`
	PatientAddress string    `json:"patient_address"`
	Latitude       *float64  `json:"latitude"`
	Longitude      *float64  `json:"longitude"`
	PatientNotes   string    `json:"patient_notes"`
	DoctorNotes    string    `json:"doctor_notes"`
	EstimatedPrice *float64  `json:"estimated_price"`
	ActualPrice    *float64  `json:"actual_price"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Nested data
	User    UserResponse            `json:"user"`
	Service HomecareServiceResponse `json:"service"`
	Doctor  *DoctorResponse         `json:"doctor,omitempty"`
}

// ToEntity converts BookingResponse to entity.Booking
func (br *BookingResponse) ToEntity() *entity.Booking {
	booking := &entity.Booking{
		ID:             br.ID,
		UserID:         br.UserID,
		ServiceID:      br.ServiceID,
		DoctorID:       br.DoctorID,
		PreferredDate:  br.PreferredDate,
		Status:         br.Status,
		PatientAddress: br.PatientAddress,
		Latitude:       br.Latitude,
		Longitude:      br.Longitude,
		PatientNotes:   br.PatientNotes,
		DoctorNotes:    br.DoctorNotes,
		EstimatedPrice: br.EstimatedPrice,
		ActualPrice:    br.ActualPrice,
		CreatedAt:      br.CreatedAt,
		UpdatedAt:      br.UpdatedAt,
	}

	// Add User relation
	booking.User = entity.User{
		ID:        br.User.ID,
		FirstName: br.User.FirstName,
		LastName:  br.User.LastName,
		Email:     br.User.Email,
		Phone:     br.User.Phone,
		Role:      br.User.Role,
	}

	// Add Service relation
	booking.Service = entity.HomecareService{
		ID:          br.Service.ID,
		DoctorID:    br.Service.DoctorID,
		Name:        br.Service.Name,
		Description: br.Service.Description,
		Duration:    br.Service.Duration,
		Price:       br.Service.Price,
		Category:    br.Service.Category,
		IsActive:    br.Service.IsActive,
		CreatedAt:   br.Service.CreatedAt,
		UpdatedAt:   br.Service.UpdatedAt,
	}

	// Add Doctor relation if available
	if br.Doctor != nil {
		booking.Doctor = &entity.Doctor{
			ID:              br.Doctor.ID,
			UserID:          &br.Doctor.UserID,
			Specialization:  br.Doctor.Specialization,
			LicenseNumber:   br.Doctor.LicenseNumber,
			ExperienceYears: br.Doctor.ExperienceYears,
			Bio:             br.Doctor.Bio,
			CreatedAt:       br.Doctor.CreatedAt,
			UpdatedAt:       br.Doctor.UpdatedAt,
		}
	}

	return booking
}
