package entity

import "time"

type Booking struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	UserID         uint      `json:"user_id" gorm:"not null;index"`
	ServiceID      uint      `json:"service_id" gorm:"not null;index"`
	DoctorID       *uint     `json:"doctor_id" gorm:"index"` // Assigned when doctor accepts
	PreferredDate  time.Time `json:"preferred_date"`
	Status         string    `json:"status" gorm:"default:'pending'"` // pending, accepted, rejected, completed, cancelled
	PatientAddress string    `json:"patient_address" gorm:"not null"`
	Latitude       *float64  `json:"latitude"`
	Longitude      *float64  `json:"longitude"`
	PatientNotes   string    `json:"patient_notes" gorm:"type:text"`
	DoctorNotes    string    `json:"doctor_notes" gorm:"type:text"`
	EstimatedPrice *float64  `json:"estimated_price"`
	ActualPrice    *float64  `json:"actual_price"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Relationships
	User    User            `json:"user" gorm:"foreignKey:UserID"`
	Service HomecareService `json:"service" gorm:"foreignKey:ServiceID"`
	Doctor  *Doctor         `json:"doctor,omitempty" gorm:"foreignKey:DoctorID"`
}
