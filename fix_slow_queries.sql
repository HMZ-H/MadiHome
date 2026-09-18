-- Fix slow SQL queries by adding database indexes
-- Connect to your PostgreSQL database and run this SQL

-- Drop existing indexes if they exist (to avoid conflicts)
DROP INDEX IF EXISTS idx_messages_room_id_timestamp;
DROP INDEX IF EXISTS idx_messages_room_id;
DROP INDEX IF EXISTS idx_messages_timestamp;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_messages_receiver_id;
DROP INDEX IF EXISTS idx_messages_room_id_is_read;
DROP INDEX IF EXISTS idx_messages_sender_receiver_timestamp;
DROP INDEX IF EXISTS idx_messages_receiver_sender_timestamp;

-- Create optimized indexes for messages table
CREATE INDEX idx_messages_room_id_timestamp ON messages(room_id, timestamp DESC);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_room_id_is_read ON messages(room_id, is_read);

-- CRITICAL: These indexes fix the slow conversation queries
CREATE INDEX idx_messages_sender_receiver_timestamp ON messages(sender_id, receiver_id, timestamp DESC);
CREATE INDEX idx_messages_receiver_sender_timestamp ON messages(receiver_id, sender_id, timestamp DESC);

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'messages'
ORDER BY indexname;

-- Show query performance improvement
EXPLAIN ANALYZE SELECT * FROM "messages" 
WHERE (sender_id = 25 AND receiver_id = 19) OR (sender_id = 19 AND receiver_id = 25) 
ORDER BY timestamp DESC LIMIT 50;