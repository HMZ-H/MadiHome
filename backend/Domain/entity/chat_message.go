package entity

import "time"

// ChatMessage represents a message in the conversation
type ChatMessage struct {
	ID        uint `gorm:"primaryKey"`
	UserID    uint
	RoomID    uint
	Role      string // "user", "assistant", "system"
	Content   string
	CreatedAt time.Time
}
