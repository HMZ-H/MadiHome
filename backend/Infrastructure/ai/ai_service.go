package ai

type Message struct {
	Role    string `json:"role"`    // "system", "user", "assistant"
	Content string `json:"content"` // message text
}

type AIServiceInterface interface {
	GetChatCompletion(messages []Message) (string, error)
}
