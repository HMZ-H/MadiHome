package schema

import (
	"time"

	"github.com/HMZ-H/Madihome/Domain/entity"
)

// SendMessageRequest represents the payload to create/send a message
type SendMessageRequest struct {
	ReceiverID uint   `json:"receiver_id" validate:"required"`
	RoomID     uint   `json:"room_id"`
	Content    string `json:"content" validate:"required"`
}

// UpdateMessageRequest represents updating a message (e.g., content edits)
type UpdateMessageRequest struct {
	Content string `json:"content" validate:"required"`
}

// MessageResponse is the API shape returned to clients
type MessageResponse struct {
	ID         uint      `json:"id"`
	SenderID   uint      `json:"sender_id"`
	ReceiverID uint      `json:"receiver_id"`
	RoomID     uint      `json:"room_id"`
	Content    string    `json:"content"`
	Timestamp  time.Time `json:"timestamp"`
	IsRead     bool      `json:"is_read"`
}

// ToResponse maps an entity.Message to MessageResponse
func ToMessageResponse(m *entity.Message) *MessageResponse {
	if m == nil {
		return nil
	}
	return &MessageResponse{
		ID:         m.ID,
		SenderID:   m.SenderID,
		ReceiverID: m.ReceiverID,
		RoomID:     m.RoomID,
		Content:    m.Content,
		Timestamp:  m.Timestamp,
		IsRead:     m.IsRead,
	}
}

// ToEntity maps a SendMessageRequest to entity.Message; caller fills SenderID and Timestamp
func (r *SendMessageRequest) ToEntity(senderID uint) *entity.Message {
	return &entity.Message{
		SenderID:   senderID,
		ReceiverID: r.ReceiverID,
		RoomID:     r.RoomID,
		Content:    r.Content,
		Timestamp:  time.Now().UTC(),
		IsRead:     false,
	}
}
