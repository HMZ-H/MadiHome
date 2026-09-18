package repository

import "github.com/HMZ-H/Madihome/Domain/entity"

type MessageRepository interface {
	CreateMessage(message *entity.Message) (*entity.Message, error)
	GetMessageByID(id uint) (*entity.Message, error)

	// Listing and pagination
	ListMessagesByRoom(roomID uint, limit, offset int) ([]*entity.Message, error)
	ListMessagesBetweenUsers(senderID, receiverID uint, limit, offset int) ([]*entity.Message, error)

	// Unread and read updates
	ListUnreadMessagesByRoom(roomID uint) ([]*entity.Message, error)
	MarkMessageAsRead(messageID uint) error
	MarkAllMessagesAsReadByRoom(roomID uint) error

	// Maintenance
	UpdateMessage(message *entity.Message) (*entity.Message, error)
	DeleteMessage(messageID uint) error
}
