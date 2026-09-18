package realtime

import (
	"sync"
)

// MessageEvent is broadcasted to subscribers
// type MessageEvent struct {
// 	ID         uint   `json:"id"`
// 	SenderID   uint   `json:"sender_id"`
// 	ReceiverID uint   `json:"receiver_id"`
// 	RoomID     uint   `json:"room_id"`
// 	Content    string `json:"content"`
// 	Timestamp  string `json:"timestamp"`
// }

type Client interface {
	Send(event MessageEvent)
}

// Hub manages subscriptions per room and per user
type Hub struct {
	mu          sync.RWMutex
	roomClients map[uint]map[Client]struct{}
	userClients map[uint]map[Client]struct{}
}

func NewHub() *Hub {
	return &Hub{
		roomClients: make(map[uint]map[Client]struct{}),
		userClients: make(map[uint]map[Client]struct{}),
	}
}

func (h *Hub) SubscribeRoom(roomID uint, c Client) func() {
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.roomClients[roomID]; !ok {
		h.roomClients[roomID] = make(map[Client]struct{})
	}
	h.roomClients[roomID][c] = struct{}{}
	return func() { h.unsubscribeRoom(roomID, c) }
}

func (h *Hub) SubscribeUser(userID uint, c Client) func() {
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.userClients[userID]; !ok {
		h.userClients[userID] = make(map[Client]struct{})
	}
	h.userClients[userID][c] = struct{}{}
	return func() { h.unsubscribeUser(userID, c) }
}

func (h *Hub) BroadcastToRoom(roomID uint, evt MessageEvent) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.roomClients[roomID] {
		c.Send(evt)
	}
}

func (h *Hub) BroadcastToUser(userID uint, event MessageEvent) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.userClients[userID]; ok {
		for c := range clients {
			c.Send(event)
		}
	}
}

func (h *Hub) unsubscribeRoom(roomID uint, c Client) {
	if m, ok := h.roomClients[roomID]; ok {
		delete(m, c)
		if len(m) == 0 {
			delete(h.roomClients, roomID)
		}
	}
}

func (h *Hub) unsubscribeUser(userID uint, c Client) {
	if m, ok := h.userClients[userID]; ok {
		delete(m, c)
		if len(m) == 0 {
			delete(h.userClients, userID)
		}
	}
}
