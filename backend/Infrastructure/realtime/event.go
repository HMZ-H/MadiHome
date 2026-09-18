package realtime

type MessageEvent struct {
	Type       string `json:"type,omitempty"`
	ID         uint   `json:"id,omitempty"`
	SenderID   uint   `json:"sender_id"`
	ReceiverID uint   `json:"receiver_id"`
	RoomID     uint   `json:"room_id"`
	Content    string `json:"content,omitempty"`
	Timestamp  string `json:"timestamp,omitempty"`
	IsRead     bool   `json:"is_read,omitempty"`
}
