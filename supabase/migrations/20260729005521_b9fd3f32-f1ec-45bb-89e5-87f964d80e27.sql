
-- link_clicks
CREATE TABLE public.link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.custom_links(id) ON DELETE CASCADE,
  session_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX link_clicks_link_id_idx ON public.link_clicks(link_id, created_at DESC);
GRANT SELECT, INSERT ON public.link_clicks TO anon, authenticated;
GRANT ALL ON public.link_clicks TO service_role;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clicks public insert" ON public.link_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "clicks owner read" ON public.link_clicks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.custom_links cl WHERE cl.id = link_id AND cl.user_id = auth.uid()));

-- profile_themes
CREATE TABLE public.profile_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  accent_color TEXT NOT NULL DEFAULT '#a855f7',
  background_url TEXT,
  particle_color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_themes TO authenticated;
GRANT ALL ON public.profile_themes TO service_role;
ALTER TABLE public.profile_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "themes owner all" ON public.profile_themes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- custom_domains
CREATE TABLE public.custom_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  domain TEXT NOT NULL UNIQUE,
  verification_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_domains TO authenticated;
GRANT ALL ON public.custom_domains TO service_role;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "domains owner all" ON public.custom_domains FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- update bump_link_click to also log to link_clicks
CREATE OR REPLACE FUNCTION public.bump_link_click(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.custom_links SET click_count = click_count + 1 WHERE id = link_id;
  INSERT INTO public.link_clicks (link_id) VALUES (link_id);
END;
$$;
