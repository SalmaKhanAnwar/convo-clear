-- Fix security issues by setting search_path on functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  team_id UUID;
BEGIN
  -- Create a team for the new user
  INSERT INTO public.teams (name, owner_id)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Team'), NEW.id)
  RETURNING id INTO team_id;
  
  -- Create profile for the user
  INSERT INTO public.profiles (user_id, first_name, last_name, company_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'company_name'
  );
  
  -- Add user as admin of their team
  INSERT INTO public.user_roles (user_id, team_id, role)
  VALUES (NEW.id, team_id, 'admin');
  
  -- Create default integrations (not connected)
  INSERT INTO public.integrations (team_id, platform, is_connected)
  VALUES 
    (team_id, 'meet', false),
    (team_id, 'teams', false),
    (team_id, 'zoom', false);
  
  RETURN NEW;
END;
$$;

-- Fix the update function as well
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;