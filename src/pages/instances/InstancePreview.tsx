import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import { fetchInstancePreview } from "api/instances";
import Loader from "components/Loader";
import { LxdInstance } from "types/instance";

interface Props {
    instance: LxdInstance;
    onFailure: (title: string, e: unknown) => void;
}

const InstancePreview: FC<Props> = ({ instance, onFailure }) => {

    const {
    data: imgData,
    error,
    isLoading,
  } = useQuery({
    queryKey: [queryKeys.instancePreview, instance.project, instance.name],
    queryFn: () => fetchInstancePreview(instance),
    staleTime: 10 * 1000, // 10s
  });

  return (
    <>
      {isLoading ? (
        <Loader text="Loading instance preview..." />
      ) : (
        <img src={imgData} />
      )}
    </>
  );
};

export default InstancePreview;
