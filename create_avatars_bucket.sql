-- Migration: create the "avatars" storage bucket + RLS policies
--
-- Why this is needed: src/components/profile/ProfilePage.tsx already
-- uploads to supabase.storage.from('avatars'), but no migration in this
-- project ever created that bucket or granted any storage.objects
-- policies. Without this, every avatar upload fails (uploadError is
-- non-null) even though the client code is correct — this is why the
-- photo never actually ends up persisted in Supabase.
--
-- Path convention used by the client: "<user_id>/<filename>.jpg"
-- (see ProfilePage.tsx handleAvatarFileChange -> filePath).

-- 1. Create the bucket (public read, since avatars are shown across the
--    app and on the public study-profile page).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 2. Anyone can view avatars (bucket is public, but RLS on storage.objects
--    still needs an explicit SELECT policy).
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects for select
using (bucket_id = 'avatars');

-- 3. A user may only upload into a folder matching their own auth.uid(),
--    i.e. object path must start with "<uid>/".
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
on storage.objects for insert
with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. A user may overwrite (upsert) or delete only their own avatar files.
drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects for update
using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects for delete
using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
);
