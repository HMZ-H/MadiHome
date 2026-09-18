package schema

import "time"

type NotificationResponse struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Type      string    `json:"type"`
	IsRead    bool      `json:"is_read"`
	Data      string    `json:"data"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateNotificationRequest struct {
	UserID  uint   `json:"user_id" validate:"required"`
	Title   string `json:"title" validate:"required"`
	Message string `json:"message" validate:"required"`
	Type    string `json:"type" validate:"required,oneof=booking visit system"`
	Data    string `json:"data"`
}

type MarkNotificationReadRequest struct {
	NotificationID uint `json:"notification_id" validate:"required"`
}
