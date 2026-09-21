package ai

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

// Gemini API endpoint pattern
// POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=API_KEY

type geminiContentPart struct {
	Text string `json:"text"`
}

type geminiContent struct {
	Role  string              `json:"role,omitempty"`
	Parts []geminiContentPart `json:"parts"`
}

type geminiRequest struct {
	Contents []geminiContent `json:"contents"`
}

type geminiCandidate struct {
	Content geminiContent `json:"content"`
}

type geminiResponse struct {
	Candidates []geminiCandidate `json:"candidates"`
	// Error format if any
	Error *struct {
		Code    int    `json:"code"`
		Status  string `json:"status"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

type GeminiService struct {
	apiKey string
	client *http.Client
	model  string
}

func NewGeminiService(apiKey, model string) AIServiceInterface {
	return &GeminiService{
		apiKey: apiKey,
		client: &http.Client{Timeout: 30 * time.Second},
		model:  model,
	}
}

func (s *GeminiService) GetChatCompletion(messages []Message) (string, error) {
	if s.apiKey == "" {
		return "", errors.New("gemini API key is not set")
	}

	// Gemini expects alternating user/model roles. Merge consecutive same-role messages.
	var contents []geminiContent
	for _, m := range messages {
		role := "user"
		if m.Role == "assistant" {
			role = "model"
		}
		if len(contents) > 0 && contents[len(contents)-1].Role == role {
			contents[len(contents)-1].Parts = append(contents[len(contents)-1].Parts, geminiContentPart{Text: m.Content})
		} else {
			contents = append(contents, geminiContent{
				Role:  role,
				Parts: []geminiContentPart{{Text: m.Content}},
			})
		}
	}

	reqBody := geminiRequest{Contents: contents}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal Gemini request: %w", err)
	}

	endpoint := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", url.PathEscape(s.model))
	endpoint = endpoint + "?key=" + url.QueryEscape(s.apiKey)

	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("failed to create Gemini request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var gResp geminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&gResp); err != nil {
		return "", fmt.Errorf("failed to decode Gemini response: %w", err)
	}

	if gResp.Error != nil {
		return "", fmt.Errorf("gemini api error %d %s: %s", gResp.Error.Code, gResp.Error.Status, gResp.Error.Message)
	}

	if len(gResp.Candidates) == 0 || len(gResp.Candidates[0].Content.Parts) == 0 {
		return "", errors.New("no completion returned by Gemini")
	}

	return gResp.Candidates[0].Content.Parts[0].Text, nil
}
