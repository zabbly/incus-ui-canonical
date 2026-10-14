import { useState, type ChangeEvent, type FC, type KeyboardEvent } from "react";
import classnames from "classnames";
import { CheckboxInput, Field } from "@canonical/react-components";
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

// Chip input with suggestions from tags already in use.
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
    if (e.key === "Backspace" && !draft && values.tags.length > 0) {
      remove(values.tags[values.tags.length - 1]);
    }
  };

  return (
    <Field
      label="Tags"
      forId="tags"
      help="Shown in the instance list and summary. Enter adds a tag."
    >
      <div
        className={classnames("tags-field", { "is-disabled": disabled })}
        title={title}
      >
        {values.tags.map((tag) => {
          const color = colorOf(tag);
          return (
            <span
              key={tag}
              className="tags-field__chip"
              style={{ backgroundColor: color, color: textColorFor(color) }}
            >
              <label className="tags-field__color" title="Change color">
                <Palette size={12} aria-hidden="true" />
                <input
                  type="color"
                  value={color}
                  disabled={disabled}
                  aria-label={`Color of ${tag}`}
                  onChange={(e) => {
                    onChange({
                      ...values,
                      tagColors: { ...values.tagColors, [tag]: e.target.value },
                    });
                  }}
                />
              </label>
              <span>{tag}</span>
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
        <input
          id="tags"
          type="text"
          className="tags-field__input"
          placeholder={values.tags.length > 0 ? "" : "Add tag"}
          value={draft}
          disabled={disabled}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {suggestions.length > 0 && !disabled && (
        <div className="tags-field__suggestions">
          {suggestions.map((item) => (
            <button
              key={item.tag}
              type="button"
              className="tags-field__suggestion"
              style={{
                backgroundColor: item.color,
                color: textColorFor(item.color),
              }}
              onClick={() => {
                add(item.tag);
              }}
            >
              + {item.tag}
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
            {values.ipTags[family] && (
              <label
                className="tags-field__color tags-field__color--dot"
                title="Change color"
                style={{
                  backgroundColor: values.ipTags[family],
                  color: textColorFor(values.ipTags[family]),
                }}
              >
                <Palette size={12} aria-hidden="true" />
                <input
                  type="color"
                  value={values.ipTags[family]}
                  disabled={disabled}
                  aria-label={`Color of ${family} tags`}
                  onChange={(e) => {
                    onChange({
                      ...values,
                      ipTags: { ...values.ipTags, [family]: e.target.value },
                    });
                  }}
                />
              </label>
            )}
          </span>
        ))}
      </div>
    </Field>
  );
};

export default TagsField;
