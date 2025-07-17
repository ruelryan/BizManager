-- Migration: Add trial management fields to user_settings
-- Created: 2025-01-17
-- Purpose: Improve free trial handling and tracking

-- Add trial management columns to user_settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS is_in_trial BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE;

-- Create indexes for trial queries
CREATE INDEX IF NOT EXISTS idx_user_settings_trial_status ON user_settings(is_in_trial);
CREATE INDEX IF NOT EXISTS idx_user_settings_trial_end_date ON user_settings(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_user_settings_trial_used ON user_settings(trial_used);

-- Create a function to automatically end expired trials
CREATE OR REPLACE FUNCTION check_and_end_expired_trials()
RETURNS void AS $$
BEGIN
  -- Update users whose trials have expired
  UPDATE user_settings 
  SET 
    is_in_trial = FALSE,
    plan = 'free'
  WHERE 
    is_in_trial = TRUE 
    AND trial_end_date IS NOT NULL 
    AND trial_end_date <= NOW();
    
  -- Log the number of trials ended
  RAISE NOTICE 'Ended % expired trials', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Create a function to start a free trial for a user
CREATE OR REPLACE FUNCTION start_user_trial(user_id_param UUID)
RETURNS void AS $$
BEGIN
  -- Check if user has already used their trial
  IF EXISTS (
    SELECT 1 FROM user_settings 
    WHERE user_id = user_id_param AND trial_used = TRUE
  ) THEN
    RAISE EXCEPTION 'User has already used their free trial';
  END IF;
  
  -- Start the trial
  INSERT INTO user_settings (
    user_id,
    is_in_trial,
    trial_start_date,
    trial_end_date,
    trial_used,
    plan
  ) VALUES (
    user_id_param,
    TRUE,
    NOW(),
    NOW() + INTERVAL '14 days',
    TRUE,
    'free'
  ) ON CONFLICT (user_id) DO UPDATE SET
    is_in_trial = TRUE,
    trial_start_date = NOW(),
    trial_end_date = NOW() + INTERVAL '14 days',
    trial_used = TRUE,
    plan = 'free';
    
  RAISE NOTICE 'Started 14-day free trial for user %', user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get trial status for a user
CREATE OR REPLACE FUNCTION get_user_trial_status(user_id_param UUID)
RETURNS TABLE (
  is_in_trial BOOLEAN,
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  trial_used BOOLEAN,
  days_remaining INTEGER,
  trial_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.is_in_trial,
    us.trial_start_date,
    us.trial_end_date,
    us.trial_used,
    CASE 
      WHEN us.trial_end_date IS NOT NULL AND us.is_in_trial = TRUE THEN
        GREATEST(0, EXTRACT(days FROM (us.trial_end_date - NOW()))::INTEGER)
      ELSE 0
    END as days_remaining,
    CASE 
      WHEN us.trial_end_date IS NOT NULL THEN
        us.trial_end_date <= NOW()
      ELSE FALSE
    END as trial_expired
  FROM user_settings us
  WHERE us.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Update existing users to have proper trial status
-- This is safe to run multiple times
UPDATE user_settings 
SET 
  is_in_trial = FALSE,
  trial_used = FALSE
WHERE 
  is_in_trial IS NULL 
  OR trial_used IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN user_settings.is_in_trial IS 'Whether user is currently in their 14-day free trial';
COMMENT ON COLUMN user_settings.trial_start_date IS 'When the user started their free trial';
COMMENT ON COLUMN user_settings.trial_end_date IS 'When the user''s free trial expires';
COMMENT ON COLUMN user_settings.trial_used IS 'Whether user has used their one-time free trial (prevents re-activation)';
COMMENT ON FUNCTION check_and_end_expired_trials() IS 'Automatically ends trials that have expired';
COMMENT ON FUNCTION start_user_trial(UUID) IS 'Starts a 14-day free trial for a user (one-time only)';
COMMENT ON FUNCTION get_user_trial_status(UUID) IS 'Returns comprehensive trial status for a user';