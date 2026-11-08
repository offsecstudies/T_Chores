// Public login alias only. Passwords are managed exclusively by Supabase Auth.
export const familyGuestEmail = "family@teddy-chores.example";
export function loginEmail(value: string): string {
  return value.trim().toLowerCase() === "family"
    ? familyGuestEmail
    : value.trim();
}
