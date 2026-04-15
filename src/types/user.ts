export type UserRole = "manager" | "cashier";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  passkey: string;
}
