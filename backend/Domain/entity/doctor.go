package entity

import "time"

type Doctor struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	UserID          *uint     `json:"user_id" gorm:"unique;index"` // FK to User
	Specialization  string    `json:"specialization" gorm:"not null"`
	LicenseNumber   string    `json:"license_number" gorm:"not null;unique"`
	ExperienceYears int       `json:"experience_years"`
	Bio             string    `json:"bio" gorm:"type:text"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// Relationships
	User User `json:"user" gorm:"foreignKey:UserID"`
}
