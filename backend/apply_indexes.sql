-- Apply database indexes for messages table to fix slow queries
-- Run this SQL script directly on your PostgreSQL database

-- Composite index for room-based queries
CREATE INDEX IF NOT EXISTS idx_messages_room_id_timestamp ON messages(room_id, timestamp DESC);

-- Individual indexes
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

-- Index for unread messages
CREATE INDEX IF NOT EXISTS idx_messages_room_id_is_read ON messages(room_id, is_read);

-- CRITICAL: Composite indexes for user-to-user conversation queries
-- These fix the slow "WHERE (sender_id = X AND receiver_id = Y) OR (sender_id = Y AND receiver_id = X)" queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver_timestamp ON messages(sender_id, receiver_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender_timestamp ON messages(receiver_id, sender_id, timestamp DESC);

-- Verify indexes were created
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'messages'
ORDER BY indexname;
