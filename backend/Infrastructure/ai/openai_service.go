package ai

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

const openaiChatURL = "https://api.openai.com/v1/chat/completions"

type OpenAIRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
}

type OpenAIResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
}

type OpenAIService struct {
	apiKey string
	client *http.Client
	model  string
}

func NewOpenAIService(apiKey, model string) AIServiceInterface {
	return &OpenAIService{
		apiKey: apiKey,
		client: &http.Client{Timeout: 30 * time.Second},
		model:  model,
	}
}

func (s *OpenAIService) GetChatCompletion(messages []Message) (string, error) {
	if s.apiKey == "" {
		return "", errors.New("OpenAI API key is not set")
	}

	reqBody, err := json.Marshal(OpenAIRequest{
		Model:    s.model,
		Messages: messages,
		Stream:   false,
	})
	if err != nil {
		return "", fmt.Errorf("failed to marshal OpenAI request: %w", err)
	}

	req, err := http.NewRequest("POST", openaiChatURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return "", fmt.Errorf("failed to create OpenAI request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read OpenAI response body: %w", err)
	}
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("OpenAI API returned status %d: %s", resp.StatusCode, string(body))
	}

	var openaiResp OpenAIResponse
	if err := json.Unmarshal(body, &openaiResp); err != nil {
		return "", err
	}

	if len(openaiResp.Choices) > 0 {
		return openaiResp.Choices[0].Message.Content, nil
	}

	return "", errors.New("no completion returned by OpenAI")
}
