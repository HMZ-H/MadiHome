package repository

import (
	"github.com/HMZ-H/Madihome/Domain/entity"
	"gorm.io/gorm"
)

type AIChatRepository struct {
	db *gorm.DB
}

func NewAIChatRepository(db *gorm.DB) *AIChatRepository {
	return &AIChatRepository{db: db}
}

// Save user or assistant message
func (r *AIChatRepository) CreateMessage(message *entity.ChatMessage) (*entity.ChatMessage, error) {
	if err := r.db.Create(message).Error; err != nil {
		return nil, err
	}
	return message, nil
}

// Fetch last N messages for AI memory
func (r *AIChatRepository) GetLastMessages(roomID uint, limit int) ([]*entity.ChatMessage, error) {
	var messages []*entity.ChatMessage
	q := r.db.Where("room_id = ?", roomID).Order("created_at DESC")
	if limit > 0 {
		q = q.Limit(limit)
	}
	if err := q.Find(&messages).Error; err != nil {
		return nil, err
	}
	// Reverse to chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
	return messages, nil
}
