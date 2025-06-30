/*
  # Add User Settings Trigger

  1. New Triggers
    - Creates a trigger on auth.users table that automatically initializes user settings when a new user is created
  
  2. Purpose
    - Ensures every new user (including those from OAuth providers like Google) gets an entry in the user_settings table
    - Fixes the issue where Google-authenticated users were missing user settings entries
*/

-- Create a trigger to initialize user settings when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_data();