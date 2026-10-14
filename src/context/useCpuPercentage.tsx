import { useEffect, useRef, useState } from "react";
import type { LxdInstance, LxdInstanceState } from "types/instance";
import {
  getCpuAllocatedTime,
  getCpuPercentage,
  type CpuSample,
} from "util/instanceState";

// Needs two state samples, stays undefined until the second one arrived.
export const useCpuPercentage = (
  instance: LxdInstance,
  state: LxdInstanceState | undefined,
  updatedAt: number,
): number | undefined => {
  const key = `${instance.project}/${instance.name}`;
  const prev = useRef<{ key: string; sample?: CpuSample }>({ key });
  const [percentage, setPercentage] = useState<number>();

  useEffect(() => {
    if (prev.current.key !== key) {
      prev.current = { key };
      setPercentage(undefined);
    }
    if (!state?.cpu || !updatedAt) {
      return;
    }

    const next = { time: updatedAt, usage: state.cpu.usage };
    const last = prev.current.sample;
    if (last?.time === next.time) {
      return;
    }
    if (last) {
      setPercentage(
        getCpuPercentage(last, next, getCpuAllocatedTime(instance, state)),
      );
    }
    prev.current.sample = next;
  }, [key, updatedAt, instance, state]);

  return percentage;
};
