export const lowercaseKeys = <T,>(obj: T): T => {
  if (!obj || typeof obj !== "object") {
    return obj;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key.toLowerCase()] = value;
  }
  return result as T;
};
