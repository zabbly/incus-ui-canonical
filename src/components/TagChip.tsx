import type { FC } from "react";
import { X } from "lucide-react";
import { textColorFor, type TagChip as TagChipData } from "util/instanceTags";

interface Props {
  chip: TagChipData;
  onRemove?: () => void;
}

const TagChip: FC<Props> = ({ chip, onRemove }) => {
  const title = chip.kind === "tag" ? chip.label : `${chip.kind} address`;

  return (
    <span
      className="p-chip is-inline is-dense tag-chip"
      style={{ backgroundColor: chip.color, color: textColorFor(chip.color) }}
      title={title}
    >
      <span className="p-chip__value">{chip.label}</span>
      {onRemove && (
        <button
          type="button"
          className="tag-chip__remove"
          aria-label={`Remove ${chip.label}`}
          onClick={onRemove}
        >
          <X size={12} aria-hidden="true" />
        </button>
      )}
    </span>
  );
};

export default TagChip;
