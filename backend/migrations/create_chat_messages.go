package migrations

import (
	"log"

	"gorm.io/gorm"
)

// CreateChatMessagesTable creates the chat_messages table for AI assistant memory
func CreateChatMessagesTable(db *gorm.DB) error {
	log.Println("Creating chat_messages table...")

	// Check if table already exists
	if db.Migrator().HasTable("chat_messages") {
		log.Println("chat_messages table already exists, skipping creation")
		return nil
	}

	// Create the table using raw SQL for better control
	sql := `
		CREATE TABLE IF NOT EXISTS chat_messages (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL,
			room_id INTEGER NOT NULL,
			role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
			content TEXT NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);
	`

	if err := db.Exec(sql).Error; err != nil {
		log.Printf("Error creating chat_messages table: %v", err)
		return err
	}

	// Create indexes
	indexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);",
		"CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);",
		"CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);",
	}

	for _, indexSQL := range indexes {
		if err := db.Exec(indexSQL).Error; err != nil {
			log.Printf("Error creating index: %v", err)
			return err
		}
	}

	log.Println("chat_messages table created successfully")
	return nil
}
