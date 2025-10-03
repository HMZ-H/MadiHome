package entity

import "time"

// HomecareVisit represents a scheduled homecare visit (created from approved booking)
type HomecareVisit struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	BookingID   uint       `json:"booking_id" gorm:"not null;index"` // FK to Booking
	PatientID   uint       `json:"patient_id" gorm:"not null;index"` // FK to User (patient)
	DoctorID    uint       `json:"doctor_id" gorm:"not null;index"`  // FK to Doctor
	ServiceID   uint       `json:"service_id" gorm:"not null;index"` // FK to HomecareService
	CarePlanID  *uint      `json:"care_plan_id" gorm:"index"`        // FK to CarePlan (optional)
	ScheduledAt time.Time  `json:"scheduled_at"`
	StartTime   *time.Time `json:"start_time"`                        // When visit actually started
	EndTime     *time.Time `json:"end_time"`                          // When visit actually ended
	Status      string     `json:"status" gorm:"default:'scheduled'"` // scheduled, in_progress, completed, cancelled
	VisitNotes  string     `json:"visit_notes" gorm:"type:text"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// Relationships
	Booking  Booking         `json:"booking" gorm:"foreignKey:BookingID"`
	Patient  User            `json:"patient" gorm:"foreignKey:PatientID"`
	Doctor   Doctor          `json:"doctor" gorm:"foreignKey:DoctorID"`
	Service  HomecareService `json:"service" gorm:"foreignKey:ServiceID"`
	CarePlan *HomecarePlan   `json:"care_plan,omitempty" gorm:"foreignKey:CarePlanID"`
}
