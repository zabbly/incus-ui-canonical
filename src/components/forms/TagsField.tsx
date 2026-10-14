import { useState, type ChangeEvent, type FC, type KeyboardEvent } from "react";
import { Button, CheckboxInput, Field } from "@canonical/react-components";
import { Palette, X } from "lucide-react";
import { useInstances } from "context/useInstances";
import {
  TAG_COLORS_KEY,
  getKnownTags,
  getTagColor,
  serializeKeyValues,
  textColorFor,
  type TagFormValues,
} from "util/instanceTags";
import type { LxdInstance } from "types/instance";

interface Props {
  project: string;
  name: string;
  values: TagFormValues;
  onChange: (values: TagFormValues) => void;
  disabled?: boolean;
  title?: string;
}

const DEFAULT_IP_COLORS = { ipv4: "#17becf", ipv6: "#9467bd" };

const without = (map: Record<string, string>, key: string) =>
  Object.fromEntries(Object.entries(map).filter(([item]) => item !== key));

// Tags as chips, a plain input to add more, suggestions from tags in use.
const TagsField: FC<Props> = ({
  project,
  name,
  values,
  onChange,
  disabled = false,
  title,
}) => {
  const [draft, setDraft] = useState("");
  const { data: instances = [] } = useInstances(project);

  // Only name, project and the draft colors matter for color lookup.
  const preview = {
    name,
    project,
    expanded_config: { [TAG_COLORS_KEY]: serializeKeyValues(values.tagColors) },
  } as unknown as LxdInstance;
  const colorOf = (tag: string) => getTagColor(tag, preview, instances);

  const needle = draft.trim().toLowerCase();
  const suggestions = getKnownTags(instances)
    .filter((item) => !values.tags.includes(item.tag))
    .filter((item) => item.tag.toLowerCase().includes(needle))
    .slice(0, 12);

  const add = (tag: string) => {
    const clean = tag.trim();
    if (clean && !values.tags.includes(clean)) {
      onChange({ ...values, tags: [...values.tags, clean] });
    }
    setDraft("");
  };

  const remove = (tag: string) => {
    onChange({
      ...values,
      tags: values.tags.filter((item) => item !== tag),
      tagColors: without(values.tagColors, tag),
    });
  };

  const toggleIp = (family: "ipv4" | "ipv6", enabled: boolean) => {
    onChange({
      ...values,
      ipTags: enabled
        ? { ...values.ipTags, [family]: DEFAULT_IP_COLORS[family] }
        : without(values.ipTags, family),
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    }
  };

  const colorPicker = (
    value: string,
    label: string,
    onPick: (color: string) => void,
    isDot = false,
  ) => (
    <label
      className={
        isDot ? "tags-field__color tags-field__color--dot" : "tags-field__color"
      }
      title="Change color"
      style={
        isDot
          ? { backgroundColor: value, color: textColorFor(value) }
          : undefined
      }
    >
      <Palette size={12} aria-hidden="true" />
      <input
        type="color"
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => {
          onPick(e.target.value);
        }}
      />
    </label>
  );

  return (
    <Field
      label="Tags"
      forId="tags"
      help="Shown in the instance list and summary."
    >
      <div className="tags-field" title={title}>
        {values.tags.length > 0 && (
          <div className="tags-field__chips">
            {values.tags.map((tag) => {
              const color = colorOf(tag);
              return (
                <span
                  key={tag}
                  className="p-chip is-inline is-dense tags-field__chip"
                  style={{ backgroundColor: color, color: textColorFor(color) }}
                >
                  {colorPicker(color, `Color of ${tag}`, (picked) => {
                    onChange({
                      ...values,
                      tagColors: { ...values.tagColors, [tag]: picked },
                    });
                  })}
                  <span className="p-chip__value">{tag}</span>
                  <button
                    type="button"
                    className="tags-field__remove"
                    disabled={disabled}
                    aria-label={`Remove ${tag}`}
                    onClick={() => {
                      remove(tag);
                    }}
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <div className="tags-field__add">
          <input
            id="tags"
            type="text"
            placeholder="Add a tag and press Enter"
            value={draft}
            disabled={disabled}
            onChange={(e) => {
              setDraft(e.target.value);
            }}
            onKeyDown={onKeyDown}
          />
          <Button
            className="u-no-margin--bottom"
            dense
            type="button"
            disabled={disabled || !draft.trim()}
            onClick={() => {
              add(draft);
            }}
          >
            Add
          </Button>
        </div>
        {suggestions.length > 0 && !disabled && (
          <div className="tags-field__suggestions">
            {suggestions.map((item) => (
              <button
                key={item.tag}
                type="button"
                className="p-chip is-inline is-dense tags-field__suggestion"
                style={{
                  backgroundColor: item.color,
                  color: textColorFor(item.color),
                }}
                title={`Add ${item.tag}`}
                onClick={() => {
                  add(item.tag);
                }}
              >
                <span className="p-chip__value">+ {item.tag}</span>
              </button>
            ))}
          </div>
        )}
        <div className="tags-field__ip">
          {(["ipv4", "ipv6"] as const).map((family) => (
            <span key={family} className="tags-field__ip-option">
              <CheckboxInput
                label={`${family === "ipv4" ? "IPv4" : "IPv6"} address as tag`}
                checked={!!values.ipTags[family]}
                disabled={disabled}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  toggleIp(family, e.target.checked);
                }}
              />
              {values.ipTags[family] &&
                colorPicker(
                  values.ipTags[family],
                  `Color of ${family} tags`,
                  (picked) => {
                    onChange({
                      ...values,
                      ipTags: { ...values.ipTags, [family]: picked },
                    });
                  },
                  true,
                )}
            </span>
          ))}
        </div>
      </div>
    </Field>
  );
};

export default TagsField;
