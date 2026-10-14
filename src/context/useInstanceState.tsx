import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "context/auth";
import { fetchInstanceState } from "api/metrics";
import { queryKeys } from "util/queryKeys";
import type { LxdInstance, LxdInstanceState } from "types/instance";

// Uses the state API; /1.0/metrics names differ between LXD and Incus.
export const useInstanceState = (
  instance: LxdInstance,
  enabled = true,
): UseQueryResult<LxdInstanceState> => {
  const { isRestricted } = useAuth();

  return useQuery({
    queryKey: [queryKeys.instances, instance.name, instance.project, "state"],
    queryFn: async () => fetchInstanceState(instance.name, instance.project),
    refetchInterval: 15 * 1000,
    enabled: enabled && !isRestricted,
  });
};
