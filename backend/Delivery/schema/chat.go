package schema

type SendChatMessageRequest struct {
	UserID  uint   `json:"user_id"`
	RoomID  uint   `json:"room_id"`
	Message string `json:"message"`
}

type ChatMessageResponse struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}
