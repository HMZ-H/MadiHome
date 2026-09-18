package controller

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	"github.com/HMZ-H/Madihome/Infrastructure/realtime"
	"github.com/HMZ-H/Madihome/Infrastructure/security"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type WSController struct {
	hub      *realtime.Hub
	jwt      *security.JWTService
	messages usecases.MessageUsecaseInterface
}

func NewWSController(hub *realtime.Hub, jwt *security.JWTService, messages usecases.MessageUsecaseInterface) *WSController {
	return &WSController{hub: hub, jwt: jwt, messages: messages}
}

func newUpgrader() websocket.Upgrader {
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:5173,http://localhost:3000"
	}
	origins := strings.Split(allowedOrigins, ",")
	originSet := make(map[string]bool, len(origins))
	for _, o := range origins {
		originSet[strings.TrimSpace(o)] = true
	}

	return websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			return originSet[origin]
		},
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
}

type wsClient struct {
	conn *websocket.Conn
}

func (c *wsClient) Send(evt realtime.MessageEvent) {
	_ = c.conn.WriteJSON(evt)
}

func (wsc *WSController) HandleWS(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Token required"})
		return
	}

	claims, err := wsc.jwt.ValidateToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Invalid or expired token"})
		return
	}

	var userID uint
	if v, ok := claims["user_id"]; ok {
		switch t := v.(type) {
		case float64:
			userID = uint(t)
		case int:
			userID = uint(t)
		}
	}
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Invalid token claims"})
		return
	}

	upgrader := newUpgrader()
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	conn.SetReadLimit(4096)
	_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	client := &wsClient{conn: conn}

	unsubUser := wsc.hub.SubscribeUser(userID, client)
	defer unsubUser()

	if roomIDStr := c.Query("room_id"); roomIDStr != "" {
		if rid, err := parseUint(roomIDStr); err == nil {
			unsubRoom := wsc.hub.SubscribeRoom(rid, client)
			defer unsubRoom()
		}
	}

	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}()

	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			break
		}
		var evt realtime.MessageEvent
		if err := json.Unmarshal(data, &evt); err != nil {
			continue
		}

		switch evt.Type {
		case "typing":
			typing := realtime.MessageEvent{
				Type:       "typing",
				SenderID:   userID,
				ReceiverID: evt.ReceiverID,
			}
			if evt.ReceiverID != 0 {
				wsc.hub.BroadcastToUser(evt.ReceiverID, typing)
			}
			continue

		case "ping":
			continue
		}

		req := &schema.SendMessageRequest{
			ReceiverID: evt.ReceiverID,
			RoomID:     evt.RoomID,
			Content:    evt.Content,
		}
		saved, err := wsc.messages.CreateMessage(userID, req)
		if err != nil {
			continue
		}

		out := realtime.MessageEvent{
			Type:       "message",
			ID:         saved.ID,
			SenderID:   saved.SenderID,
			ReceiverID: saved.ReceiverID,
			RoomID:     saved.RoomID,
			Content:    saved.Content,
			Timestamp:  saved.Timestamp.UTC().Format(time.RFC3339),
		}
		if out.RoomID != 0 {
			wsc.hub.BroadcastToRoom(out.RoomID, out)
		}
		if out.ReceiverID != 0 {
			wsc.hub.BroadcastToUser(out.ReceiverID, out)
		}
		if out.SenderID != 0 {
			wsc.hub.BroadcastToUser(out.SenderID, out)
		}
	}
}

func parseUint(s string) (uint, error) {
	u, err := strconv.ParseUint(s, 10, 32)
	return uint(u), err
}
