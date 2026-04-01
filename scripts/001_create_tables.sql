-- Users profile table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT,
  name TEXT NOT NULL,
  theme TEXT,
  accent TEXT,
  website TEXT,
  location TEXT,
  username TEXT UNIQUE NOT NULL,
  photo_url TEXT NOT NULL DEFAULT '/assets/twitter-avatar.jpg',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  following TEXT[] NOT NULL DEFAULT '{}',
  followers TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  total_tweets INT NOT NULL DEFAULT 0,
  total_photos INT NOT NULL DEFAULT 0,
  pinned_tweet TEXT,
  cover_photo_url TEXT
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (TRUE);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_delete_own" ON public.users FOR DELETE USING (auth.uid() = id);

-- Tweets table
CREATE TABLE IF NOT EXISTS public.tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT,
  images JSONB,
  parent_id TEXT,
  parent_username TEXT,
  user_likes TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  user_replies INT NOT NULL DEFAULT 0,
  user_retweets TEXT[] NOT NULL DEFAULT '{}'
);

ALTER TABLE public.tweets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tweets_select_all" ON public.tweets FOR SELECT USING (TRUE);
CREATE POLICY "tweets_insert_own" ON public.tweets FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "tweets_update_own" ON public.tweets FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "tweets_delete_own" ON public.tweets FOR DELETE USING (auth.uid() = created_by);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tweet_id UUID NOT NULL REFERENCES public.tweets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tweet_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_select_own" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert_own" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete_own" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- User stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  likes TEXT[] NOT NULL DEFAULT '{}',
  tweets TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_stats_select_all" ON public.user_stats FOR SELECT USING (TRUE);
CREATE POLICY "user_stats_insert_own" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_stats_update_own" ON public.user_stats FOR UPDATE USING (auth.uid() = id);

-- Auto-create user profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  random_username TEXT;
  base_name TEXT;
  is_available BOOLEAN;
BEGIN
  base_name := LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', 'user'), '\s+', '', 'g'));
  IF base_name = '' THEN base_name := 'user'; END IF;

  LOOP
    random_username := base_name || FLOOR(RANDOM() * 10000)::TEXT;
    SELECT NOT EXISTS (SELECT 1 FROM public.users WHERE username = random_username) INTO is_available;
    EXIT WHEN is_available;
  END LOOP;

  INSERT INTO public.users (id, name, username, photo_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    random_username,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '/assets/twitter-avatar.jpg')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_stats (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR each row
  EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for tweet images (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tweet-images', 'tweet-images', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "tweet_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'tweet-images');
CREATE POLICY "tweet_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tweet-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "tweet_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'tweet-images' AND auth.uid() IS NOT NULL);
