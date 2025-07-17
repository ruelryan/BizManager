-- Complete database reset - Delete all user data
-- Run this in Supabase dashboard SQL editor

-- Delete all user data in correct order (respects foreign keys)
DELETE FROM webhook_events;
DELETE FROM notification_queue;
DELETE FROM payment_transactions;
DELETE FROM subscriptions;
DELETE FROM returns;
DELETE FROM inventory_transactions;
DELETE FROM expenses;
DELETE FROM sales;
DELETE FROM products;
DELETE FROM customers;
DELETE FROM user_settings;

-- Delete auth users (this will cascade to profiles if they exist)
DELETE FROM auth.users;

-- Reset any sequences if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'webhook_events_id_seq') THEN
        ALTER SEQUENCE webhook_events_id_seq RESTART WITH 1;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'notification_queue_id_seq') THEN
        ALTER SEQUENCE notification_queue_id_seq RESTART WITH 1;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'payment_transactions_id_seq') THEN
        ALTER SEQUENCE payment_transactions_id_seq RESTART WITH 1;
    END IF;
END $$;

-- Verify all tables are empty
SELECT 
  schemaname,
  tablename,
  n_tup_ins as "Rows"
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Final verification query
SELECT 
  'webhook_events' as table_name, COUNT(*) as row_count FROM webhook_events
UNION ALL
SELECT 'notification_queue', COUNT(*) FROM notification_queue
UNION ALL  
SELECT 'payment_transactions', COUNT(*) FROM payment_transactions
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'returns', COUNT(*) FROM returns
UNION ALL
SELECT 'inventory_transactions', COUNT(*) FROM inventory_transactions
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'sales', COUNT(*) FROM sales
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'user_settings', COUNT(*) FROM user_settings
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;