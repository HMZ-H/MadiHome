package schema

import "time"

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
