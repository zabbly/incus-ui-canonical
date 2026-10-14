import type { FC } from "react";
import TagChip from "components/TagChip";
import type { TagChip as TagChipData } from "util/instanceTags";

interface Props {
  chips: TagChipData[];
  emptyText?: string;
}

const TagChips: FC<Props> = ({ chips, emptyText = "-" }) => {
  if (chips.length === 0) {
    return emptyText;
  }

  return (
    <div className="tag-chips">
      {chips.map((chip) => (
        <TagChip key={`${chip.kind}:${chip.label}`} chip={chip} />
      ))}
    </div>
  );
};

export default TagChips;
