package realtime

import (
	"sync"
	"testing"
)

type mockClient struct {
	mu     sync.Mutex
	events []MessageEvent
}

func (m *mockClient) Send(evt MessageEvent) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.events = append(m.events, evt)
}

func (m *mockClient) getEvents() []MessageEvent {
	m.mu.Lock()
	defer m.mu.Unlock()
	cp := make([]MessageEvent, len(m.events))
	copy(cp, m.events)
	return cp
}

func TestSubscribeAndBroadcastToUser(t *testing.T) {
	hub := NewHub()
	c := &mockClient{}

	unsub := hub.SubscribeUser(1, c)
	defer unsub()

	evt := MessageEvent{ID: 10, SenderID: 2, ReceiverID: 1, Content: "hello"}
	hub.BroadcastToUser(1, evt)

	events := c.getEvents()
	if len(events) != 1 {
		t.Fatalf("expected 1 event, got %d", len(events))
	}
	if events[0].Content != "hello" {
		t.Errorf("expected content 'hello', got %q", events[0].Content)
	}
}

func TestSubscribeAndBroadcastToRoom(t *testing.T) {
	hub := NewHub()
	c1 := &mockClient{}
	c2 := &mockClient{}

	unsub1 := hub.SubscribeRoom(100, c1)
	unsub2 := hub.SubscribeRoom(100, c2)
	defer unsub1()
	defer unsub2()

	evt := MessageEvent{ID: 5, RoomID: 100, Content: "room msg"}
	hub.BroadcastToRoom(100, evt)

	if len(c1.getEvents()) != 1 {
		t.Error("c1 should receive 1 event")
	}
	if len(c2.getEvents()) != 1 {
		t.Error("c2 should receive 1 event")
	}
}

func TestUnsubscribeUser(t *testing.T) {
	hub := NewHub()
	c := &mockClient{}

	unsub := hub.SubscribeUser(1, c)
	unsub()

	hub.BroadcastToUser(1, MessageEvent{Content: "after unsub"})

	if len(c.getEvents()) != 0 {
		t.Error("should not receive events after unsubscribe")
	}
}

func TestUnsubscribeRoom(t *testing.T) {
	hub := NewHub()
	c := &mockClient{}

	unsub := hub.SubscribeRoom(50, c)
	unsub()

	hub.BroadcastToRoom(50, MessageEvent{Content: "after unsub"})

	if len(c.getEvents()) != 0 {
		t.Error("should not receive events after room unsubscribe")
	}
}

func TestBroadcastToNonexistentUser(t *testing.T) {
	hub := NewHub()
	hub.BroadcastToUser(999, MessageEvent{Content: "nobody"})
}

func TestBroadcastToNonexistentRoom(t *testing.T) {
	hub := NewHub()
	hub.BroadcastToRoom(999, MessageEvent{Content: "nobody"})
}

func TestMultipleClientsPerUser(t *testing.T) {
	hub := NewHub()
	c1 := &mockClient{}
	c2 := &mockClient{}

	unsub1 := hub.SubscribeUser(1, c1)
	unsub2 := hub.SubscribeUser(1, c2)
	defer unsub1()
	defer unsub2()

	hub.BroadcastToUser(1, MessageEvent{Content: "multi"})

	if len(c1.getEvents()) != 1 || len(c2.getEvents()) != 1 {
		t.Error("both clients should receive the event")
	}
}

func TestTypingEvent(t *testing.T) {
	hub := NewHub()
	c := &mockClient{}

	unsub := hub.SubscribeUser(2, c)
	defer unsub()

	typing := MessageEvent{Type: "typing", SenderID: 1, ReceiverID: 2}
	hub.BroadcastToUser(2, typing)

	events := c.getEvents()
	if len(events) != 1 {
		t.Fatalf("expected 1 event, got %d", len(events))
	}
	if events[0].Type != "typing" {
		t.Errorf("expected type 'typing', got %q", events[0].Type)
	}
}
