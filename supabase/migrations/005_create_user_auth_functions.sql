-- RPC Functions for user management with Supabase Auth

create or replace function create_manager_with_auth(
  p_name text,
  p_email text,
  p_password text,
  p_phone text default null,
  p_available boolean default true
)
returns jsonb as $$
declare
  v_auth_id uuid;
  v_manager_id uuid;
begin
  -- Create auth user
  insert into auth.users (email, encrypted_password, email_confirmed_at)
  values (p_email, crypt(p_password, gen_salt('bf')), now())
  returning id into v_auth_id;

  -- Create manager
  insert into managers (auth_id, name, email, phone, available)
  values (v_auth_id, p_name, p_email, p_phone, p_available)
  returning id into v_manager_id;

  return jsonb_build_object('auth_id', v_auth_id, 'manager_id', v_manager_id);
exception when others then
  return jsonb_build_object('error', SQLERRM);
end;
$$ language plpgsql security definer;

create or replace function create_expert_with_auth(
  p_name text,
  p_email text,
  p_password text,
  p_phone text default null,
  p_specialty text default null,
  p_zone text default null
)
returns jsonb as $$
declare
  v_auth_id uuid;
  v_expert_id uuid;
begin
  -- Create auth user
  insert into auth.users (email, encrypted_password, email_confirmed_at)
  values (p_email, crypt(p_password, gen_salt('bf')), now())
  returning id into v_auth_id;

  -- Create expert
  insert into experts (auth_id, name, email, phone, specialty, zone)
  values (v_auth_id, p_name, p_email, p_phone, p_specialty, p_zone)
  returning id into v_expert_id;

  return jsonb_build_object('auth_id', v_auth_id, 'expert_id', v_expert_id);
exception when others then
  return jsonb_build_object('error', SQLERRM);
end;
$$ language plpgsql security definer;

create or replace function create_client_with_auth(
  p_name text,
  p_email text,
  p_password text,
  p_phone text default null,
  p_policy_number text default null,
  p_status text default 'Actiu'
)
returns jsonb as $$
declare
  v_auth_id uuid;
  v_client_id uuid;
begin
  -- Create auth user
  insert into auth.users (email, encrypted_password, email_confirmed_at)
  values (p_email, crypt(p_password, gen_salt('bf')), now())
  returning id into v_auth_id;

  -- Create client
  insert into clients (auth_id, name, email, phone, policy_number, status)
  values (v_auth_id, p_name, p_email, p_phone, p_policy_number, p_status)
  returning id into v_client_id;

  return jsonb_build_object('auth_id', v_auth_id, 'client_id', v_client_id);
exception when others then
  return jsonb_build_object('error', SQLERRM);
end;
$$ language plpgsql security definer;

create or replace function create_admin_with_auth(
  p_name text,
  p_email text,
  p_password text,
  p_phone text default null,
  p_active boolean default true
)
returns jsonb as $$
declare
  v_auth_id uuid;
  v_admin_id uuid;
begin
  -- Create auth user
  insert into auth.users (email, encrypted_password, email_confirmed_at)
  values (p_email, crypt(p_password, gen_salt('bf')), now())
  returning id into v_auth_id;

  -- Create admin
  insert into admins (auth_id, name, email, phone, active)
  values (v_auth_id, p_name, p_email, p_phone, p_active)
  returning id into v_admin_id;

  return jsonb_build_object('auth_id', v_auth_id, 'admin_id', v_admin_id);
exception when others then
  return jsonb_build_object('error', SQLERRM);
end;
$$ language plpgsql security definer;

-- Grant execute permissions
grant execute on function create_manager_with_auth to anon, authenticated;
grant execute on function create_expert_with_auth to anon, authenticated;
grant execute on function create_client_with_auth to anon, authenticated;
grant execute on function create_admin_with_auth to anon, authenticated;
