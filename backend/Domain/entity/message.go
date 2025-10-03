package entity

import "time"

type Message struct {
	ID         uint      `gorm:"primaryKey"`
	SenderID   uint      `json:"sender_id"`
	ReceiverID uint      `json:"receiver_id"`
	Content    string    `json:"content"`
	Date       time.Time `json:"date"`
}
