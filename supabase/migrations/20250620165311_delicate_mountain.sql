-- Create expenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    category text NOT NULL,
    date date NOT NULL,
    payment_method text NOT NULL,
    receipt text,
    notes text,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for expenses
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
  DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
  DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
  DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
  
  -- Create new policies
  CREATE POLICY "Users can view own expenses" ON expenses
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can insert own expenses" ON expenses
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can update own expenses" ON expenses
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can delete own expenses" ON expenses
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);

-- Add currency column to user_settings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' AND column_name = 'currency'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN currency text DEFAULT 'PHP';
  END IF;
END $$;