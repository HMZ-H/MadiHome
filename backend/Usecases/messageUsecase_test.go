package Usecases

import (
	"errors"
	"testing"
	"time"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Infrastructure/realtime"
)

type mockMessageRepo struct {
	messages map[uint]*entity.Message
	nextID   uint
}

func newMockMessageRepo() *mockMessageRepo {
	return &mockMessageRepo{messages: make(map[uint]*entity.Message), nextID: 1}
}

func (m *mockMessageRepo) CreateMessage(msg *entity.Message) (*entity.Message, error) {
	msg.ID = m.nextID
	m.nextID++
	if msg.Timestamp.IsZero() {
		msg.Timestamp = time.Now().UTC()
	}
	m.messages[msg.ID] = msg
	return msg, nil
}

func (m *mockMessageRepo) GetMessageByID(id uint) (*entity.Message, error) {
	msg, ok := m.messages[id]
	if !ok {
		return nil, errors.New("not found")
	}
	return msg, nil
}

func (m *mockMessageRepo) ListMessagesByRoom(roomID uint, limit, offset int) ([]*entity.Message, error) {
	var result []*entity.Message
	for _, msg := range m.messages {
		if msg.RoomID == roomID {
			result = append(result, msg)
		}
	}
	return result, nil
}

func (m *mockMessageRepo) ListMessagesBetweenUsers(a, b uint, limit, offset int) ([]*entity.Message, error) {
	var result []*entity.Message
	for _, msg := range m.messages {
		if (msg.SenderID == a && msg.ReceiverID == b) || (msg.SenderID == b && msg.ReceiverID == a) {
			result = append(result, msg)
		}
	}
	return result, nil
}

func (m *mockMessageRepo) ListUnreadMessagesByRoom(roomID uint) ([]*entity.Message, error) {
	var result []*entity.Message
	for _, msg := range m.messages {
		if msg.RoomID == roomID && !msg.IsRead {
			result = append(result, msg)
		}
	}
	return result, nil
}

func (m *mockMessageRepo) MarkMessageAsRead(id uint) error {
	msg, ok := m.messages[id]
	if !ok {
		return errors.New("not found")
	}
	msg.IsRead = true
	return nil
}

func (m *mockMessageRepo) MarkAllMessagesAsReadByRoom(roomID uint) error {
	for _, msg := range m.messages {
		if msg.RoomID == roomID {
			msg.IsRead = true
		}
	}
	return nil
}

func (m *mockMessageRepo) UpdateMessage(msg *entity.Message) (*entity.Message, error) {
	m.messages[msg.ID] = msg
	return msg, nil
}

func (m *mockMessageRepo) DeleteMessage(id uint) error {
	if _, ok := m.messages[id]; !ok {
		return errors.New("not found")
	}
	delete(m.messages, id)
	return nil
}

func TestCreateMessageSuccess(t *testing.T) {
	repo := newMockMessageRepo()
	hub := realtime.NewHub()
	uc := NewMessageUsecase(repo, hub)

	req := &schema.SendMessageRequest{
		ReceiverID: 2,
		RoomID:     0,
		Content:    "Hello doctor",
	}

	resp, err := uc.CreateMessage(1, req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.SenderID != 1 {
		t.Errorf("expected sender 1, got %d", resp.SenderID)
	}
	if resp.ReceiverID != 2 {
		t.Errorf("expected receiver 2, got %d", resp.ReceiverID)
	}
	if resp.Content != "Hello doctor" {
		t.Errorf("expected content 'Hello doctor', got %q", resp.Content)
	}
	if resp.IsRead {
		t.Error("new message should be unread")
	}
}

func TestCreateMessageNilRequest(t *testing.T) {
	repo := newMockMessageRepo()
	uc := NewMessageUsecase(repo, nil)

	_, err := uc.CreateMessage(1, nil)
	if err == nil {
		t.Error("expected error for nil request")
	}
}

func TestCreateMessageEmptyContent(t *testing.T) {
	repo := newMockMessageRepo()
	uc := NewMessageUsecase(repo, nil)

	req := &schema.SendMessageRequest{ReceiverID: 2, Content: ""}
	_, err := uc.CreateMessage(1, req)
	if err == nil {
		t.Error("expected error for empty content")
	}
}

func TestCreateMessageNoReceiver(t *testing.T) {
	repo := newMockMessageRepo()
	uc := NewMessageUsecase(repo, nil)

	req := &schema.SendMessageRequest{Content: "hi"}
	_, err := uc.CreateMessage(1, req)
	if err == nil {
		t.Error("expected error when no receiver or room")
	}
}

func TestCreateMessageBroadcastsToHub(t *testing.T) {
	repo := newMockMessageRepo()
	hub := realtime.NewHub()
	uc := NewMessageUsecase(repo, hub)

	receiverClient := &mockHubClient{}
	senderClient := &mockHubClient{}

	hub.SubscribeUser(2, receiverClient)
	hub.SubscribeUser(1, senderClient)

	req := &schema.SendMessageRequest{ReceiverID: 2, Content: "broadcast test"}
	_, err := uc.CreateMessage(1, req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(receiverClient.events) == 0 {
		t.Error("receiver should get a broadcast event")
	}
	if len(senderClient.events) == 0 {
		t.Error("sender should get a confirmation event")
	}
}

func TestGetMessageByID(t *testing.T) {
	repo := newMockMessageRepo()
	uc := NewMessageUsecase(repo, nil)

	req := &schema.SendMessageRequest{ReceiverID: 2, Content: "find me"}
	created, _ := uc.CreateMessage(1, req)

	found, err := uc.GetMessageByID(created.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found.Content != "find me" {
		t.Errorf("expected 'find me', got %q", found.Content)
	}
}

func TestGetMessageByIDNotFound(t *testing.T) {
	repo := newMockMessageRepo()
	uc := NewMessageUsecase(repo, nil)

	_, err := uc.GetMessageByID(999)
	if err == nil {
		t.Error("expected error for nonexistent message")
	}
}

func TestMarkMessageAsRead(t *testing.T) {
	repo := newMockMessageRepo()
	uc := NewMessageUsecase(repo, nil)

	req := &schema.SendMessageRequest{ReceiverID: 2, Content: "mark me"}
	created, _ := uc.CreateMessage(1, req)

	err := uc.MarkMessageAsRead(created.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	found, _ := uc.GetMessageByID(created.ID)
	if !found.IsRead {
		t.Error("message should be marked as read")
	}
}

func TestGetMessagesBetweenUsers(t *testing.T) {
	repo := newMockMessageRepo()
	uc := NewMessageUsecase(repo, nil)

	uc.CreateMessage(1, &schema.SendMessageRequest{ReceiverID: 2, Content: "msg1"})
	uc.CreateMessage(2, &schema.SendMessageRequest{ReceiverID: 1, Content: "msg2"})
	uc.CreateMessage(1, &schema.SendMessageRequest{ReceiverID: 3, Content: "msg3"})

	msgs, err := uc.GetMessagesBetweenUsers(1, 2, 50, 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(msgs) != 2 {
		t.Errorf("expected 2 messages between users 1 and 2, got %d", len(msgs))
	}
}

func TestUpdateMessage(t *testing.T) {
	repo := newMockMessageRepo()
	uc := NewMessageUsecase(repo, nil)

	created, _ := uc.CreateMessage(1, &schema.SendMessageRequest{ReceiverID: 2, Content: "original"})

	updated, err := uc.UpdateMessage(created.ID, &schema.UpdateMessageRequest{Content: "edited"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Content != "edited" {
		t.Errorf("expected 'edited', got %q", updated.Content)
	}
}

func TestUpdateMessageEmptyContent(t *testing.T) {
	repo := newMockMessageRepo()
	uc := NewMessageUsecase(repo, nil)

	_, err := uc.UpdateMessage(1, &schema.UpdateMessageRequest{Content: ""})
	if err == nil {
		t.Error("expected error for empty content")
	}
}

func TestDeleteMessage(t *testing.T) {
	repo := newMockMessageRepo()
	uc := NewMessageUsecase(repo, nil)

	created, _ := uc.CreateMessage(1, &schema.SendMessageRequest{ReceiverID: 2, Content: "delete me"})

	err := uc.DeleteMessage(created.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	_, err = uc.GetMessageByID(created.ID)
	if err == nil {
		t.Error("expected error for deleted message")
	}
}

type mockHubClient struct {
	events []realtime.MessageEvent
}

func (m *mockHubClient) Send(evt realtime.MessageEvent) {
	m.events = append(m.events, evt)
}
