package entity

import (
	"time"
)

type User struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	Email      string    `gorm:"unique" json:"email"`
	Phone      string    `json:"phone"`
	Address    string    `json:"address"`
	Gender     string    `json:"gender"`
	Birthday   string    `json:"birthday"`
	Photo      string    `json:"photo"`
	Role       string    `gorm:"default:'user'" json:"role"`
	Password   string    `json:"-"`
	IsVerified bool      `json:"is_verified"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type RefreshToken struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index"` // FK to User
	Token     string    `gorm:"unique;not null" json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
