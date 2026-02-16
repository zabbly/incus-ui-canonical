import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { fetchOS } from "api/os";
import type { IncusOSSettings } from "types/os";
import { queryKeys } from "util/queryKeys";

export const useIncusOS = (target: string): UseQueryResult<IncusOSSettings> => {
  return useQuery({
    queryKey: [queryKeys.os, target],
    queryFn: async () => fetchOS(target),
  });
};
