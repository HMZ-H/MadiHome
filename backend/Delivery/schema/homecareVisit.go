package schema

import "time"

// ScheduleVisitRequest represents the request to schedule a homecare visit (from approved booking)
type ScheduleVisitRequest struct {
	BookingID   uint      `json:"booking_id" validate:"required"`
	UserID      uint      `json:"user_id" validate:"required"` // User ID (patient)
	DoctorID    uint      `json:"doctor_id" validate:"required"`
	ServiceID   uint      `json:"service_id" validate:"required"`
	CarePlanID  *uint     `json:"care_plan_id"`
	ScheduledAt time.Time `json:"scheduled_at" validate:"required"`
	Notes       string    `json:"notes"`
}

// UpdateVisitRequest represents the request to update a visit
type UpdateVisitRequest struct {
	ScheduledAt *time.Time `json:"scheduled_at"`
	StartTime   *time.Time `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
	Status      string     `json:"status"`
	Notes       string     `json:"notes"`
}

// HomecareVisitResponse represents the homecare visit data
type HomecareVisitResponse struct {
	ID          uint       `json:"id"`
	BookingID   uint       `json:"booking_id"`
	UserID      uint       `json:"user_id"` // User ID (patient)
	DoctorID    uint       `json:"doctor_id"`
	ServiceID   uint       `json:"service_id"`
	CarePlanID  *uint      `json:"care_plan_id"`
	ScheduledAt time.Time  `json:"scheduled_at"`
	StartTime   *time.Time `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
	Status      string     `json:"status"`
	VisitNotes  string     `json:"visit_notes"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// Location from booking
	Address   string   `json:"address"`
	Latitude  *float64 `json:"latitude"`
	Longitude *float64 `json:"longitude"`

	// Include related data
	User struct {
		ID        uint   `json:"id"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
		Address   string `json:"address"`
	} `json:"user"`

	Service struct {
		ID          uint    `json:"id"`
		Name        string  `json:"name"`
		Description string  `json:"description"`
		Duration    int     `json:"duration"`
		Price       float64 `json:"price"`
		Category    string  `json:"category"`
	} `json:"service"`
}
