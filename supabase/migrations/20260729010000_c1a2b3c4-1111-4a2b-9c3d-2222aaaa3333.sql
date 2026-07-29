-- limit custom_links to 1 per user (1 link per account/email)
ALTER TABLE public.custom_links
  ADD CONSTRAINT custom_links_one_per_user UNIQUE (user_id);

-- switch default accent color to blue to match new brand palette
ALTER TABLE public.profiles ALTER COLUMN accent_color SET DEFAULT '#3b82f6';
ALTER TABLE public.profile_themes ALTER COLUMN accent_color SET DEFAULT '#3b82f6';
