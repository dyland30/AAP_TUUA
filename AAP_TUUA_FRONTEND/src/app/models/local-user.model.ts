import { Role } from './role.model';

export interface LocalUser {
  id: string | null;
  name: string | null;
  email: string | null;
  password_salt: string | null;
  password_hash: string | null;
  password_reset_token: string | null;
  password_reset_token_expires_at: string | null;
  created_at: string | null;
  modified_at: string | null;
  created_by: string | null;
  modified_by: string | null;
  is_active: boolean;
  is_deleted: boolean;
  is_verified: boolean;
  verification_code: string | null;
  reset_password_code: string | null;
  last_login_at: string | null;
  is_external: boolean;
  password: string | null;
  confirm_password: string | null;
  roles: Role[] | null;
}
