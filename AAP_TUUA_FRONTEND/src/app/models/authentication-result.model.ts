export interface AuthenticationResult {
  user_id: string | null;
  email: string | null;
  token: string;
  expires_in: number;
  token_type: string;
}
