package schema

import "time"

// CreateCarePlanRequest represents the request to create a care plan
type CreateHomecarePlanRequest struct {
	UserID      uint      `json:"user_id" validate:"required"` // User ID (patient)
	DoctorID    uint      `json:"doctor_id,omitempty"`         // Doctor ID (set from JWT context)
	Title       string    `json:"title" validate:"required"`
	Description string    `json:"description"`
	StartDate   time.Time `json:"start_date" validate:"required"`
	EndDate     time.Time `json:"end_date" validate:"required"`
	// Status is automatically set to "active" when created
}

// UpdateCarePlanRequest represents the request to update a care plan
type UpdateHomecarePlanRequest struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartDate   time.Time `json:"start_date"`
	EndDate     time.Time `json:"end_date"`
	Status      string    `json:"status"`
}

// CarePlanResponse represents the care plan data
type HomecarePlanResponse struct {
	ID          uint      `json:"id"`
	UserID      uint      `json:"user_id"` // User ID (patient)
	DoctorID    uint      `json:"doctor_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartDate   time.Time `json:"start_date"`
	EndDate     time.Time `json:"end_date"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Include user information
	User struct {
		ID        uint   `json:"id"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
	} `json:"user"`
}
