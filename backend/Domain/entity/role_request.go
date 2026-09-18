package entity

import (
	"time"

	"gorm.io/gorm"
)

type RoleRequest struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	UserID        uint           `json:"user_id" gorm:"not null"`
	RequestedRole string         `json:"requested_role" gorm:"not null"`
	Status        string         `json:"status" gorm:"default:'pending'"` // pending, approved, rejected
	Reason        string         `json:"reason" gorm:"type:text"`
	Documents     string         `json:"documents" gorm:"type:text"` // JSON string of document URLs
	ReviewedBy    *uint          `json:"reviewed_by"`                // ID of the admin who reviewed
	ReviewNotes   string         `json:"review_notes" gorm:"type:text"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	// Relationships
	User     User  `json:"user" gorm:"foreignKey:UserID"`
	Reviewer *User `json:"reviewer" gorm:"foreignKey:ReviewedBy"`
}
