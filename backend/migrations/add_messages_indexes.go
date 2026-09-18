package migrations

import (
	"log"

	"gorm.io/gorm"
)

// AddMessagesIndexes adds performance indexes to the messages table
func AddMessagesIndexes(db *gorm.DB) error {
	log.Println("Adding indexes to messages table...")

	// Check if messages table exists
	if !db.Migrator().HasTable("messages") {
		log.Println("messages table does not exist, skipping index creation")
		return nil
	}

	// Create indexes for better performance
	indexes := []string{
		// Composite index for the most common query: WHERE room_id = ? ORDER BY timestamp DESC
		"CREATE INDEX IF NOT EXISTS idx_messages_room_id_timestamp ON messages(room_id, timestamp DESC);",

		// Individual indexes for other common queries
		"CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);",
		"CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);",
		"CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);",
		"CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);",

		// Index for unread messages query
		"CREATE INDEX IF NOT EXISTS idx_messages_room_id_is_read ON messages(room_id, is_read);",

		// Composite indexes for messages between users query - critical for performance
		"CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver_timestamp ON messages(sender_id, receiver_id, timestamp DESC);",
		"CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender_timestamp ON messages(receiver_id, sender_id, timestamp DESC);",
	}

	for _, indexSQL := range indexes {
		if err := db.Exec(indexSQL).Error; err != nil {
			log.Printf("Error creating index: %v", err)
			return err
		}
		log.Printf("Created index: %s", indexSQL)
	}

	log.Println("Messages table indexes created successfully")
	return nil
}

