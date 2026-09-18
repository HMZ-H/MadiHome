package entity

import "time"

type Message struct {
	ID         uint      `gorm:"primaryKey"`
	SenderID   uint      `json:"sender_id"`
	ReceiverID uint      `json:"receiver_id"`
	RoomID     uint      `json:"room_id"`
	Content    string    `json:"content"`
	Timestamp  time.Time `json:"timestamp"`
	IsRead     bool      `json:"is_read"`
	IsOnline   bool      `json:"is_online"`
	IsOffline  bool      `json:"is_offline"`
}
