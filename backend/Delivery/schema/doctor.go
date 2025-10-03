package schema

import "time"

// CreateDoctorRequest represents the request to create a new doctor
type CreateDoctorRequest struct {
	UserID          uint   `json:"user_id" validate:"required"`
	Specialization  string `json:"specialization" validate:"required"`
	LicenseNumber   string `json:"license_number" validate:"required"`
	ExperienceYears int    `json:"experience_years"`
	Bio             string `json:"bio"`
}

// UpdateDoctorRequest represents the request to update a doctor
type UpdateDoctorRequest struct {
	Specialization  string `json:"specialization"`
	LicenseNumber   string `json:"license_number"`
	ExperienceYears int    `json:"experience_years"`
	Bio             string `json:"bio"`
}

// DoctorResponse represents the doctor data returned in API responses
type DoctorResponse struct {
	ID              uint      `json:"id"`
	UserID          uint      `json:"user_id"`
	Specialization  string    `json:"specialization"`
	LicenseNumber   string    `json:"license_number"`
	ExperienceYears int       `json:"experience_years"`
	Bio             string    `json:"bio"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// User information
	User struct {
		ID        uint   `json:"id"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
		Role      string `json:"role"`
	} `json:"user"`
}
