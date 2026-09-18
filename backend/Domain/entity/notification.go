package entity

import "time"

type Notification struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"not null;index"`
	Title     string    `json:"title" gorm:"not null"`
	Message   string    `json:"message" gorm:"not null"`
	Type      string    `json:"type" gorm:"not null"` // 'booking', 'visit', 'system'
	IsRead    bool      `json:"is_read" gorm:"default:false"`
	Data      string    `json:"data" gorm:"type:text"` // JSON data for additional info
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}
