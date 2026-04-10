export function validateHandle(handle: string): string | null {
  const clean = handle.trim();
  if (clean.length < 3) return "Handle must be at least 3 characters.";
  if (clean.length > 20) return "Handle must be at most 20 characters.";
  if (!/^[a-zA-Z0-9_\-]+$/.test(clean)) return "Handle contains invalid characters.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 10) return "Password must be at least 10 characters.";
  const lower = password.toLowerCase();
  const banned = ["password", "123456", "qwerty", "letmein", "admin"];
  if (banned.some((entry) => lower.includes(entry))) return "Password is too common.";
  return null;
}
