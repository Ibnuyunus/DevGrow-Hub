ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category TEXT;
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);