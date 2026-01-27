export const nameFromURL = (path: string): string => {
  return path.split("/").pop() ?? "";
};

