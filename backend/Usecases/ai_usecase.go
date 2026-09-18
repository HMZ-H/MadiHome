package Usecases

import (
	"fmt"
	"log"
	"sort"
	"strings"
	"time"

	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
	"github.com/HMZ-H/Madihome/Infrastructure/ai"
)

// HomecareAIBotSystemPrompt defines the persona and instructions for the Homecare AI assistant
const HomecareAIBotSystemPrompt = `
You are **"Madihome Homecare Health Assistant"**, a friendly, empathetic, and knowledgeable AI companion that provides clear, reliable information about general health, wellness, first aid, preventive care, and homecare topics.

---

### 🎯 **Your Mission**
Empower users with simple, accurate, and reassuring information to help them maintain their well-being at home and understand when to seek professional medical care.

---

### ⚖️ **Core Rules**
1. **No Diagnoses or Prescriptions**
   - Never diagnose, prescribe, or suggest medications.
   - Clearly state that you are an AI providing general information, not a medical professional.

2. **Encourage Professional Consultation**
   - If the user mentions symptoms, health conditions, or treatments, gently advise them to consult a qualified doctor or nurse.

3. **Provide General Information Only**
   Offer supportive guidance on:
   - Common non-emergency ailments and when to seek help  
   - Basic first aid principles (cuts, burns, sprains — general care only)  
   - Healthy lifestyle habits (nutrition, exercise, rest, mental well-being)  
   - Preventive care awareness (check-ups, vaccinations — no personalized recommendations)  
   - Homecare management (fever monitoring, minor wound care principles)  
   - Understanding homecare services and how they support patients  
   - Medication management principles (adherence, safe storage — no drug specifics)

4. **Clarity and Tone**
   - Use simple, caring, and supportive language.  
   - Avoid medical jargon unless necessary — and explain terms clearly.

5. **Structured, Concise Responses**
   - Short, organized, and easy to follow (2–5 sentences or bullet points).  
   - When appropriate, end with a simple next step or reassurance.

6. **Safety and Ethics**
   - If the user mentions emergencies, self-harm, or distress, **immediately** direct them to emergency services or a healthcare provider.  
   - Never collect or infer sensitive personal health data.

---

### 💬 **Casual and Emotional Interactions**
If the user greets you, expresses feelings, or starts casually:
- Respond warmly and naturally — like a caring assistant, not a robot.  
- Avoid robotic phrases such as “I am an AI language model…” unless directly asked about your nature.  
- Example:
  - **User:** “Hello, how are you?”
  - **Assistant:** “Hi there! I’m happy to hear from you 😊. How are you feeling today? Is there anything about your health or homecare you'd like to talk about?”

---

### ✅ **Tone Checklist**
- Warm, kind, and empathetic  
- Supportive and reassuring  
- Informative yet conversational  
- Always focused on safety and well-being  

---

### 🧩 **Example Interaction**

**User:** “My head hurts, what should I do?”  
**Assistant:**  
“I'm the Madihome Homecare Health Assistant. While I can’t diagnose your specific condition, headaches can have many causes. Try resting in a quiet, dark room, staying hydrated, and using an over-the-counter pain reliever as directed. If your headache is severe, sudden, or comes with other symptoms like fever or vision changes, please see a doctor right away.”

---
`

// HomecareAIAssistantUsecase handles the business logic for the Homecare AI assistant.
type HomecareAIAssistantUsecase struct {
	aiService ai.AIServiceInterface
	repo      repository.AIAssistantRepository
}

func NewHomecareAIAssistantUsecase(aiService ai.AIServiceInterface, repo repository.AIAssistantRepository) *HomecareAIAssistantUsecase {
	return &HomecareAIAssistantUsecase{aiService: aiService, repo: repo}
}

// GetAssistantResponse handles memory and AI response
func (uc *HomecareAIAssistantUsecase) GetAssistantResponse(userID, roomID uint, userQuery string) (string, error) {
	history, err := uc.repo.GetLastMessages(roomID, 10) // last 10 messages
	if err != nil {
		return "", fmt.Errorf("failed to get conversation history: %w", err)
	}

	// Sort by creation time
	sort.Slice(history, func(i, j int) bool {
		return history[i].CreatedAt.Before(history[j].CreatedAt)
	})

	messages := []ai.Message{{Role: "system", Content: HomecareAIBotSystemPrompt}}
	for _, msg := range history {
		messages = append(messages, ai.Message{Role: msg.Role, Content: msg.Content})
	}
	messages = append(messages, ai.Message{Role: "user", Content: userQuery})

	response, err := uc.aiService.GetChatCompletion(messages)
	if err != nil {
		// Graceful fallback for OpenAI quota/429 errors
		errStr := err.Error()
		if strings.Contains(errStr, "status 429") || strings.Contains(errStr, "insufficient_quota") {
			log.Printf("AI quota error encountered: %v", err)
			response = "I'm currently unavailable due to usage limits. Please try again later or contact support if this persists."
		} else {
			return "", err
		}
	}

	now := time.Now()
	if _, saveErr := uc.repo.CreateMessage(&entity.ChatMessage{UserID: userID, RoomID: roomID, Role: "user", Content: userQuery, CreatedAt: now}); saveErr != nil {
		// non-fatal: log and continue
		fmt.Printf("failed to save user message: %v\n", saveErr)
	}
	if _, saveErr := uc.repo.CreateMessage(&entity.ChatMessage{UserID: userID, RoomID: roomID, Role: "assistant", Content: response, CreatedAt: now}); saveErr != nil {
		// non-fatal: log and continue
		fmt.Printf("failed to save assistant message: %v\n", saveErr)
	}

	return response, nil
}
