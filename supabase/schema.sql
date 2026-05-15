-- ============================================================
-- Tasqli — Supabase Schema
-- Run this entire file in the Supabase SQL editor.
-- ============================================================


-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users_profiles (
  id               uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            text        NOT NULL,
  full_name        text,
  role             text        NOT NULL DEFAULT 'va'   CHECK (role  IN ('va', 'client')),
  plan             text        NOT NULL DEFAULT 'free' CHECK (plan  IN ('free', 'pro')),
  stripe_customer_id text,
  proposal_count   integer     NOT NULL DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proposals (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  va_id        uuid        NOT NULL REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  client_name  text        NOT NULL,
  service_type text        NOT NULL,
  scope        text        NOT NULL,
  rate         text        NOT NULL,
  timeline     text        NOT NULL,
  content      text        NOT NULL,  -- generated proposal markdown
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  va_id       uuid        NOT NULL REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  description text,
  status      text        NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'in_progress', 'awaiting_review', 'complete', 'on_hold')),
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('va', 'client')),
  UNIQUE (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.files (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid    NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name         text    NOT NULL,
  storage_path text    NOT NULL,
  size_bytes   bigint,
  uploaded_by  uuid    NOT NULL REFERENCES public.users_profiles(id),
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id  uuid        NOT NULL REFERENCES public.users_profiles(id),
  body       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages         ENABLE ROW LEVEL SECURITY;


-- ---- users_profiles ----------------------------------------

CREATE POLICY "users_profiles: own row select"
  ON public.users_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_profiles: own row insert"
  ON public.users_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_profiles: own row update"
  ON public.users_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ---- proposals ---------------------------------------------

CREATE POLICY "proposals: va select"
  ON public.proposals FOR SELECT
  TO authenticated
  USING (va_id = auth.uid());

CREATE POLICY "proposals: va insert"
  ON public.proposals FOR INSERT
  TO authenticated
  WITH CHECK (va_id = auth.uid());

CREATE POLICY "proposals: va update"
  ON public.proposals FOR UPDATE
  TO authenticated
  USING (va_id = auth.uid())
  WITH CHECK (va_id = auth.uid());

CREATE POLICY "proposals: va delete"
  ON public.proposals FOR DELETE
  TO authenticated
  USING (va_id = auth.uid());


-- ---- projects ----------------------------------------------

CREATE POLICY "projects: member or owner select"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    va_id = auth.uid()
    OR id IN (
      SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "projects: authenticated insert"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (va_id = auth.uid());

CREATE POLICY "projects: owner update"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (va_id = auth.uid())
  WITH CHECK (va_id = auth.uid());

CREATE POLICY "projects: owner delete"
  ON public.projects FOR DELETE
  TO authenticated
  USING (va_id = auth.uid());


-- ---- project_members ---------------------------------------

CREATE POLICY "project_members: self or owner select"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR project_id IN (
      SELECT id FROM public.projects WHERE va_id = auth.uid()
    )
  );

CREATE POLICY "project_members: owner insert"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE va_id = auth.uid()
    )
  );


-- ---- files -------------------------------------------------

CREATE POLICY "files: member or owner select"
  ON public.files FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
    )
    OR project_id IN (
      SELECT id FROM public.projects WHERE va_id = auth.uid()
    )
  );

CREATE POLICY "files: member or owner insert"
  ON public.files FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
    )
    OR project_id IN (
      SELECT id FROM public.projects WHERE va_id = auth.uid()
    )
  );

CREATE POLICY "files: uploader delete"
  ON public.files FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());


-- ---- messages ----------------------------------------------

CREATE POLICY "messages: member or owner select"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
    )
    OR project_id IN (
      SELECT id FROM public.projects WHERE va_id = auth.uid()
    )
  );

CREATE POLICY "messages: member or owner insert"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      project_id IN (
        SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
      )
      OR project_id IN (
        SELECT id FROM public.projects WHERE va_id = auth.uid()
      )
    )
  );


-- ============================================================
-- TRIGGER — auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'va'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- STORAGE (manual steps — do NOT run as SQL)
-- ============================================================
--
-- In the Supabase Dashboard → Storage, create a bucket:
--
--   Bucket name : project-files
--   Public      : false  (keep private — files served via signed URLs)
--   RLS         : enabled (enforced by the storage.objects policies below)
--
-- Then add these storage RLS policies via the Dashboard or a
-- second SQL run AFTER the bucket exists:
--
--   Policy 1 — allow project members / owners to SELECT (download):
--     bucket_id = 'project-files'
--     AND (storage.foldername(name))[1] IN (
--       SELECT id::text FROM public.projects
--       WHERE va_id = auth.uid()
--         OR id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
--     )
--
--   Policy 2 — allow project members / owners to INSERT (upload):
--     same condition as SELECT above
--
--   Policy 3 — allow uploader to DELETE:
--     bucket_id = 'project-files'
--     AND owner = auth.uid()
--
-- Files should be stored under the path:  <project_id>/<filename>
-- so the folder-based policy above resolves to the correct project.
--
-- ============================================================
