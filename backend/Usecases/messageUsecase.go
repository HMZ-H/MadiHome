package Usecases

import (
	"errors"
	"time"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	"github.com/HMZ-H/Madihome/Domain/repository"
	"github.com/HMZ-H/Madihome/Infrastructure/realtime"
)

// MessageUsecase coordinates messaging business logic.
type MessageUsecase struct {
	repo repository.MessageRepository
	Hub  *realtime.Hub
}

type MessageUsecaseInterface interface {
	CreateMessage(senderID uint, req *schema.SendMessageRequest) (*schema.MessageResponse, error)
	GetMessageByID(id uint) (*schema.MessageResponse, error)
	GetMessagesByRoomID(roomID uint, limit, offset int) ([]*schema.MessageResponse, error)
	GetMessagesBetweenUsers(userAID, userBID uint, limit, offset int) ([]*schema.MessageResponse, error)
	GetUnreadMessagesByRoomID(roomID uint) ([]*schema.MessageResponse, error)
	MarkMessageAsRead(messageID uint) error
	MarkAllMessagesAsReadByRoomID(roomID uint) error
	UpdateMessage(id uint, req *schema.UpdateMessageRequest) (*schema.MessageResponse, error)
	DeleteMessage(id uint) error
}

func NewMessageUsecase(repo repository.MessageRepository, hub *realtime.Hub) *MessageUsecase {
	return &MessageUsecase{
		repo: repo,
		Hub:  hub,
	}
}

func (uc *MessageUsecase) CreateMessage(senderID uint, req *schema.SendMessageRequest) (*schema.MessageResponse, error) {
	if req == nil {
		return nil, errors.New("request is nil")
	}
	if req.Content == "" {
		return nil, errors.New("content is required")
	}
	if req.ReceiverID == 0 && req.RoomID == 0 {
		return nil, errors.New("receiver_id or room_id is required")
	}

	msg := req.ToEntity(senderID)
	created, err := uc.repo.CreateMessage(msg)
	if err != nil {
		return nil, err
	}

	res := schema.ToMessageResponse(created)

	// ts := time.Time{}
	// if res.Timestamp.IsZero() {
	// 	ts = time.Now().UTC()
	// } else {
	// 	ts = res.Timestamp
	// }

	event := realtime.MessageEvent{
		ID:         res.ID,
		SenderID:   res.SenderID,
		ReceiverID: res.ReceiverID,
		RoomID:     res.RoomID,
		Content:    res.Content,
		Timestamp:  res.Timestamp.UTC().Format(time.RFC3339), // or whatever field name you use for timestamp
		IsRead:     res.IsRead,
	}

	// ✅ Realtime broadcast to both sender and receiver
	if uc.Hub != nil {
		uc.Hub.BroadcastToUser(res.ReceiverID, event)
		uc.Hub.BroadcastToUser(res.SenderID, event)
	}

	return res, nil
}

func (uc *MessageUsecase) GetMessageByID(id uint) (*schema.MessageResponse, error) {
	m, err := uc.repo.GetMessageByID(id)
	if err != nil {
		return nil, err
	}
	return schema.ToMessageResponse(m), nil
}

func (uc *MessageUsecase) GetMessagesByRoomID(roomID uint, limit, offset int) ([]*schema.MessageResponse, error) {
	msgs, err := uc.repo.ListMessagesByRoom(roomID, limit, offset)
	if err != nil {
		return nil, err
	}
	responses := make([]*schema.MessageResponse, 0, len(msgs))
	for _, m := range msgs {
		responses = append(responses, schema.ToMessageResponse(m))
	}
	return responses, nil
}

func (uc *MessageUsecase) GetMessagesBetweenUsers(userAID, userBID uint, limit, offset int) ([]*schema.MessageResponse, error) {
	msgs, err := uc.repo.ListMessagesBetweenUsers(userAID, userBID, limit, offset)
	if err != nil {
		return nil, err
	}
	responses := make([]*schema.MessageResponse, 0, len(msgs))
	for _, m := range msgs {
		responses = append(responses, schema.ToMessageResponse(m))
	}
	return responses, nil
}

func (uc *MessageUsecase) GetUnreadMessagesByRoomID(roomID uint) ([]*schema.MessageResponse, error) {
	msgs, err := uc.repo.ListUnreadMessagesByRoom(roomID)
	if err != nil {
		return nil, err
	}
	responses := make([]*schema.MessageResponse, 0, len(msgs))
	for _, m := range msgs {
		responses = append(responses, schema.ToMessageResponse(m))
	}
	return responses, nil
}

func (uc *MessageUsecase) MarkMessageAsRead(messageID uint) error {
	return uc.repo.MarkMessageAsRead(messageID)
}

func (uc *MessageUsecase) MarkAllMessagesAsReadByRoomID(roomID uint) error {
	return uc.repo.MarkAllMessagesAsReadByRoom(roomID)
}

func (uc *MessageUsecase) UpdateMessage(id uint, req *schema.UpdateMessageRequest) (*schema.MessageResponse, error) {
	if req == nil {
		return nil, errors.New("request is nil")
	}
	if req.Content == "" {
		return nil, errors.New("content is required")
	}
	m, err := uc.repo.GetMessageByID(id)
	if err != nil {
		return nil, err
	}
	m.Content = req.Content
	updated, err := uc.repo.UpdateMessage(m)
	if err != nil {
		return nil, err
	}
	return schema.ToMessageResponse(updated), nil
}

func (uc *MessageUsecase) DeleteMessage(id uint) error {
	return uc.repo.DeleteMessage(id)
}
