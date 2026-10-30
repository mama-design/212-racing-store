-- The automatic RLS event trigger remains active for its database owner.
-- Client roles must not call this SECURITY DEFINER function through the API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
