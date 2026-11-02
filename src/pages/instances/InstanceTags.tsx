import type { FC } from "react";
import TagChips from "components/TagChips";
import { useInstances } from "context/useInstances";
import { getInstanceTagChips } from "util/instanceTags";
import type { LxdInstance } from "types/instance";

interface Props {
  instance: LxdInstance;
  emptyText?: string;
}

// Needs the other instances to inherit tag colors from them.
const InstanceTags: FC<Props> = ({ instance, emptyText }) => {
  const { data: instances = [] } = useInstances(instance.project);
  const chips = getInstanceTagChips(
    instance,
    instances.length > 0 ? instances : [instance],
  );

  return <TagChips chips={chips} emptyText={emptyText} />;
};

export default InstanceTags;
