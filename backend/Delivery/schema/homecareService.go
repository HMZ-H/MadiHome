package schema

import "time"

// CreateHomecareServiceRequest represents the request to create a new homecare service
type CreateHomecareServiceRequest struct {
	DoctorID    uint    `json:"doctor_id,omitempty"` // Set from JWT context
	Name        string  `json:"name" validate:"required"`
	Description string  `json:"description"`
	Duration    int     `json:"duration" validate:"required"`
	Price       float64 `json:"price" validate:"required"`
	Category    string  `json:"category" validate:"required"`
}

// Bulk create multiple services at once
type BulkCreateServicesRequest struct {
	Services []CreateHomecareServiceRequest `json:"services" validate:"required,min=1,max=20"`
}

type BulkCreateServicesResponse struct {
	Created []HomecareServiceResponse `json:"created"`
	Failed  []struct {
		Service CreateHomecareServiceRequest `json:"service"`
		Error   string                       `json:"error"`
	} `json:"failed"`
	Summary struct {
		Total   int `json:"total"`
		Success int `json:"success"`
		Failed  int `json:"failed"`
	} `json:"summary"`
}

// UpdateHomecareServiceRequest represents the request to update a homecare service
type UpdateHomecareServiceRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Duration    int     `json:"duration"`
	Price       float64 `json:"price"`
	Category    string  `json:"category"`
	IsActive    bool    `json:"is_active"`
}

// HomecareServiceResponse represents the homecare service data
type HomecareServiceResponse struct {
	ID          uint      `json:"id"`
	DoctorID    *uint     `json:"doctor_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Duration    int       `json:"duration"`
	Price       float64   `json:"price"`
	Category    string    `json:"category"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// DoctorHomecareSummary represents a summary of doctor's homecare activities
type DoctorHomecareSummary struct {
	TotalServices   int `json:"total_services"`
	TotalVisits     int `json:"total_visits"`
	ScheduledVisits int `json:"scheduled_visits"`
	CompletedVisits int `json:"completed_visits"`
	ActiveCarePlans int `json:"active_care_plans"`
	TotalPatients   int `json:"total_patients"`
}
