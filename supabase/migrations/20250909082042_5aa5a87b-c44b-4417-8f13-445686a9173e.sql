-- Secure integrations table: prevent token leakage while preserving team access to non-sensitive fields
BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Ensure a SELECT policy exists for team members (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'integrations' AND policyname = 'Team members can view team integrations'
  ) THEN
    CREATE POLICY "Team members can view team integrations"
    ON public.integrations
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.team_id = integrations.team_id
          AND ur.user_id = auth.uid()
      )
    );
  END IF;
END
$$;

-- Column-level protection: revoke read access to sensitive token columns from all frontend roles
REVOKE SELECT ON COLUMN public.integrations.access_token FROM PUBLIC, anon, authenticated;
REVOKE SELECT ON COLUMN public.integrations.refresh_token FROM PUBLIC, anon, authenticated;

COMMIT;