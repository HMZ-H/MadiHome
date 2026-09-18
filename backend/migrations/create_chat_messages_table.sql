-- Create chat_messages table for AI assistant memory
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_chat_messages_room_id (room_id),
    INDEX idx_chat_messages_created_at (created_at),
    INDEX idx_chat_messages_user_id (user_id)
);

-- Add foreign key constraints if users table exists
-- ALTER TABLE chat_messages ADD CONSTRAINT fk_chat_messages_user_id 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

