package repository

import "github.com/HMZ-H/Madihome/Domain/entity"

// Minimal repository for AI assistant memory
type AIAssistantRepository interface {
	CreateMessage(message *entity.ChatMessage) (*entity.ChatMessage, error)
	GetLastMessages(roomID uint, limit int) ([]*entity.ChatMessage, error)
}
