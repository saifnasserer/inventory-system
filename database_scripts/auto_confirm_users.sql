-- Trigger to automatically confirm users when they are added to public.users
-- This effectively "auto-confirms" users created by the Super Admin

CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the auth.users table to set email_confirmed_at
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_confirm_user ON public.users;

CREATE TRIGGER trg_auto_confirm_user
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_user();
