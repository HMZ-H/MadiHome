package entity

import "time"

// HomecareService represents different types of homecare services
type HomecareService struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	DoctorID    *uint     `json:"doctor_id" gorm:"index"` // FK to Doctor who created the service
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description" gorm:"type:text"`
	Duration    int       `json:"duration"` // Duration in minutes
	Price       float64   `json:"price"`
	Category    string    `json:"category"` // medical, nursing, therapy, etc.
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relationships
	Doctor Doctor `json:"doctor" gorm:"foreignKey:DoctorID"`
}
