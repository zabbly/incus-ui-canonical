import type { FC } from "react";
import { useSearchParams } from "react-router-dom";
import ResourceLink from "components/ResourceLink";
import type { LxdInstance } from "types/instance";

interface Props {
  instance: LxdInstance;
}

const InstanceClusterMemberChip: FC<Props> = ({ instance }) => {
  const [searchParams] = useSearchParams();

  const buildSearchParams = () => {
    const location = `location=${instance.location}`;
    const existingParams = searchParams
      .get("filter")
      ?.split(" ")
      .filter((part) => !part.startsWith("location="))
      .join(" ");

    if (!existingParams) {
      return location;
    }

    return `${location} ${existingParams}`;
  };

  return (
    <ResourceLink
      type="cluster-member"
      value={instance.location}
      to={`${window.location.pathname}?filter=${buildSearchParams()}`}
    />
  );
};

export default InstanceClusterMemberChip;
