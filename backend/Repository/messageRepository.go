package repository

import (
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
	"gorm.io/gorm"
)

type MessageRepository struct {
	db *gorm.DB
}

func NewMessageRepository(db *gorm.DB) repository.MessageRepository {
	return &MessageRepository{db: db}
}

func (r *MessageRepository) CreateMessage(message *entity.Message) (*entity.Message, error) {
	if err := r.db.Create(message).Error; err != nil {
		return nil, err
	}
	return message, nil
}

func (r *MessageRepository) GetMessageByID(id uint) (*entity.Message, error) {
	var msg entity.Message
	if err := r.db.First(&msg, id).Error; err != nil {
		return nil, err
	}
	return &msg, nil
}

func (r *MessageRepository) ListMessagesByRoom(roomID uint, limit, offset int) ([]*entity.Message, error) {
	var messages []*entity.Message
	q := r.db.Where("room_id = ?", roomID).Order("timestamp DESC")
	if limit > 0 {
		q = q.Limit(limit)
	}
	if offset > 0 {
		q = q.Offset(offset)
	}
	if err := q.Find(&messages).Error; err != nil {
		return nil, err
	}
	return messages, nil
}

func (r *MessageRepository) ListMessagesBetweenUsers(senderID, receiverID uint, limit, offset int) ([]*entity.Message, error) {
	var messages []*entity.Message
	q := r.db.Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		senderID, receiverID, receiverID, senderID,
	).Order("timestamp DESC")
	if limit > 0 {
		q = q.Limit(limit)
	}
	if offset > 0 {
		q = q.Offset(offset)
	}
	if err := q.Find(&messages).Error; err != nil {
		return nil, err
	}
	return messages, nil
}

func (r *MessageRepository) ListUnreadMessagesByRoom(roomID uint) ([]*entity.Message, error) {
	var messages []*entity.Message
	if err := r.db.Where("room_id = ? AND is_read = ?", roomID, false).Order("timestamp DESC").Find(&messages).Error; err != nil {
		return nil, err
	}
	return messages, nil
}

func (r *MessageRepository) MarkMessageAsRead(messageID uint) error {
	return r.db.Model(&entity.Message{}).Where("id = ?", messageID).Update("is_read", true).Error
}

func (r *MessageRepository) MarkAllMessagesAsReadByRoom(roomID uint) error {
	return r.db.Model(&entity.Message{}).Where("room_id = ?", roomID).Update("is_read", true).Error
}

func (r *MessageRepository) UpdateMessage(message *entity.Message) (*entity.Message, error) {
	if err := r.db.Save(message).Error; err != nil {
		return nil, err
	}
	return message, nil
}

func (r *MessageRepository) DeleteMessage(messageID uint) error {
	return r.db.Delete(&entity.Message{}, messageID).Error
}
