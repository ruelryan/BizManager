/*
  # Check and create user settings trigger if not exists
  
  1. Changes
     - Adds a conditional check before creating the trigger
     - Only creates the trigger if it doesn't already exist
*/

-- Check if trigger exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    -- Create a trigger to initialize user settings when a new user is created
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION initialize_user_data();
  END IF;
END $$;