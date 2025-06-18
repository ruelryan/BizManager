/*
  # Add Sample Sales Data

  1. Sample Sales
    - Creates realistic sales transactions with proper JSON structure
    - Links to existing products and customers
    - Includes current and historical data for reporting

  2. Data Integrity
    - Uses proper UUID references
    - Ensures valid JSON structure for items and payments
    - Includes various payment methods and statuses
*/

-- Insert sample sales data with proper JSON structure
DO $$
DECLARE
    coffee_id uuid;
    pastry_id uuid;
    tea_id uuid;
    honey_id uuid;
    bread_id uuid;
    john_id uuid;
    jane_id uuid;
    bob_id uuid;
    alice_id uuid;
BEGIN
    -- Get product IDs
    SELECT id INTO coffee_id FROM products WHERE name = 'Premium Coffee Beans' LIMIT 1;
    SELECT id INTO pastry_id FROM products WHERE name = 'Artisan Pastry' LIMIT 1;
    SELECT id INTO tea_id FROM products WHERE name = 'Herbal Tea Blend' LIMIT 1;
    SELECT id INTO honey_id FROM products WHERE name = 'Organic Honey' LIMIT 1;
    SELECT id INTO bread_id FROM products WHERE name = 'Specialty Bread' LIMIT 1;
    
    -- Get customer IDs
    SELECT id INTO john_id FROM customers WHERE name = 'John Doe' LIMIT 1;
    SELECT id INTO jane_id FROM customers WHERE name = 'Jane Smith' LIMIT 1;
    SELECT id INTO bob_id FROM customers WHERE name = 'Bob Johnson' LIMIT 1;
    SELECT id INTO alice_id FROM customers WHERE name = 'Alice Brown' LIMIT 1;

    -- Only insert if we don't already have sales data
    IF NOT EXISTS (SELECT 1 FROM sales LIMIT 1) THEN
        -- Insert current sales
        INSERT INTO sales (
            receipt_number,
            items,
            subtotal,
            tax,
            discount,
            total,
            payments,
            customer_id,
            customer_name,
            cashier_id,
            cashier_name,
            status,
            created_at,
            notes
        ) VALUES
        (
            'INV-001',
            jsonb_build_array(
                jsonb_build_object(
                    'productId', coffee_id,
                    'productName', 'Premium Coffee Beans',
                    'quantity', 2,
                    'price', 250.00,
                    'total', 500.00
                ),
                jsonb_build_object(
                    'productId', pastry_id,
                    'productName', 'Artisan Pastry',
                    'quantity', 3,
                    'price', 120.00,
                    'total', 360.00
                )
            ),
            860.00,
            0.00,
            0.00,
            860.00,
            jsonb_build_array(
                jsonb_build_object('method', 'card', 'amount', 860.00)
            ),
            john_id,
            'John Doe',
            'demo-user',
            'Demo User',
            'paid',
            now() - interval '2 days',
            'Regular customer order'
        ),
        (
            'INV-002',
            jsonb_build_array(
                jsonb_build_object(
                    'productId', tea_id,
                    'productName', 'Herbal Tea Blend',
                    'quantity', 1,
                    'price', 180.00,
                    'total', 180.00
                )
            ),
            180.00,
            0.00,
            0.00,
            180.00,
            jsonb_build_array(
                jsonb_build_object('method', 'gcash', 'amount', 180.00)
            ),
            jane_id,
            'Jane Smith',
            'demo-user',
            'Demo User',
            'pending',
            now() - interval '1 day',
            'Payment pending'
        ),
        (
            'INV-003',
            jsonb_build_array(
                jsonb_build_object(
                    'productId', honey_id,
                    'productName', 'Organic Honey',
                    'quantity', 2,
                    'price', 350.00,
                    'total', 700.00
                ),
                jsonb_build_object(
                    'productId', bread_id,
                    'productName', 'Specialty Bread',
                    'quantity', 1,
                    'price', 85.00,
                    'total', 85.00
                )
            ),
            785.00,
            0.00,
            50.00,
            735.00,
            jsonb_build_array(
                jsonb_build_object('method', 'cash', 'amount', 735.00)
            ),
            bob_id,
            'Bob Johnson',
            'demo-user',
            'Demo User',
            'paid',
            now() - interval '3 hours',
            'Bulk order with discount'
        ),
        (
            'INV-004',
            jsonb_build_array(
                jsonb_build_object(
                    'productId', coffee_id,
                    'productName', 'Premium Coffee Beans',
                    'quantity', 1,
                    'price', 250.00,
                    'total', 250.00
                ),
                jsonb_build_object(
                    'productId', pastry_id,
                    'productName', 'Artisan Pastry',
                    'quantity', 2,
                    'price', 120.00,
                    'total', 240.00
                )
            ),
            490.00,
            0.00,
            0.00,
            490.00,
            jsonb_build_array(
                jsonb_build_object('method', 'transfer', 'amount', 490.00)
            ),
            alice_id,
            'Alice Brown',
            'demo-user',
            'Demo User',
            'paid',
            now() - interval '1 hour',
            'Quick morning order'
        ),
        (
            'INV-005',
            jsonb_build_array(
                jsonb_build_object(
                    'productId', tea_id,
                    'productName', 'Herbal Tea Blend',
                    'quantity', 3,
                    'price', 180.00,
                    'total', 540.00
                )
            ),
            540.00,
            0.00,
            0.00,
            540.00,
            jsonb_build_array(
                jsonb_build_object('method', 'gcash', 'amount', 540.00)
            ),
            NULL,
            'Walk-in Customer',
            'demo-user',
            'Demo User',
            'paid',
            now() - interval '30 minutes',
            'Walk-in purchase'
        ),
        -- Historical sales for better reporting (last month)
        (
            'INV-LM-001',
            jsonb_build_array(
                jsonb_build_object(
                    'productId', coffee_id,
                    'productName', 'Premium Coffee Beans',
                    'quantity', 5,
                    'price', 250.00,
                    'total', 1250.00
                )
            ),
            1250.00,
            0.00,
            0.00,
            1250.00,
            jsonb_build_array(
                jsonb_build_object('method', 'card', 'amount', 1250.00)
            ),
            john_id,
            'John Doe',
            'demo-user',
            'Demo User',
            'paid',
            now() - interval '25 days',
            'Bulk order last month'
        ),
        (
            'INV-LM-002',
            jsonb_build_array(
                jsonb_build_object(
                    'productId', honey_id,
                    'productName', 'Organic Honey',
                    'quantity', 3,
                    'price', 350.00,
                    'total', 1050.00
                ),
                jsonb_build_object(
                    'productId', bread_id,
                    'productName', 'Specialty Bread',
                    'quantity', 4,
                    'price', 85.00,
                    'total', 340.00
                )
            ),
            1390.00,
            0.00,
            0.00,
            1390.00,
            jsonb_build_array(
                jsonb_build_object('method', 'cash', 'amount', 1390.00)
            ),
            jane_id,
            'Jane Smith',
            'demo-user',
            'Demo User',
            'paid',
            now() - interval '20 days',
            'Large order last month'
        );
    END IF;

END $$;