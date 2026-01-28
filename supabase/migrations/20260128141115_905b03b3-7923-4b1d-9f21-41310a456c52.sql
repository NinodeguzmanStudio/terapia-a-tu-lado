-- Add name and age to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS is_moderator BOOLEAN DEFAULT false;

-- Add category to daily_suggestions if not exists
ALTER TABLE public.daily_suggestions 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'reflexión',
ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT false;

-- Update daily_suggestions RLS for delete (moderators can reset)
CREATE POLICY "Users can delete their own suggestions" 
ON public.daily_suggestions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow moderators to delete chat messages for reset
CREATE POLICY "Users can delete their own messages"
ON public.chat_messages
FOR DELETE
USING (auth.uid() = user_id);