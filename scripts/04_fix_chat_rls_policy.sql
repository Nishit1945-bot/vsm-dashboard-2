-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create own chats" ON chats;

-- Create a new policy that allows authenticated users to insert chats
-- The policy will automatically set user_id to auth.uid() if not provided
CREATE POLICY "Users can create own chats" ON chats
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also ensure the policy allows users to see their own chats
DROP POLICY IF EXISTS "Users can view own chats" ON chats;

CREATE POLICY "Users can view own chats" ON chats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own chats
DROP POLICY IF EXISTS "Users can update own chats" ON chats;

CREATE POLICY "Users can update own chats" ON chats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own chats
DROP POLICY IF EXISTS "Users can delete own chats" ON chats;

CREATE POLICY "Users can delete own chats" ON chats
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
