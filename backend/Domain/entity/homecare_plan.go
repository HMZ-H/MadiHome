package entity

import "time"

// CarePlan represents a patient's care plan
type HomecarePlan struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	PatientID   uint      `json:"patient_id" gorm:"not null;index"` // FK to User (patient)
	DoctorID    uint      `json:"doctor_id" gorm:"not null;index"`  // FK to Doctor
	Title       string    `json:"title"`
	Description string    `json:"description" gorm:"type:text"`
	StartDate   time.Time `json:"start_date"`
	EndDate     time.Time `json:"end_date"`
	Status      string    `json:"status"` // active, completed, paused
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relationships
	Patient User   `json:"patient" gorm:"foreignKey:PatientID"`
	Doctor  Doctor `json:"doctor" gorm:"foreignKey:DoctorID"`
}
