import { useState, type ChangeEvent, type FC, type KeyboardEvent } from "react";
import {
  ActionButton,
  Button,
  CheckboxInput,
  Icon,
  Input,
  useToastNotification,
} from "@canonical/react-components";
import { useQueryClient } from "@tanstack/react-query";
import TagChip from "components/TagChip";
import InstanceTags from "pages/instances/InstanceTags";
import { updateInstance } from "api/instances";
import { useEventQueue } from "context/eventQueue";
import { useInstances } from "context/useInstances";
import { queryKeys } from "util/queryKeys";
import { useInstanceEntitlements } from "util/entitlements/instances";
import {
  IP_TAGS_KEY,
  TAG_COLORS_KEY,
  TAGS_KEY,
  getKnownTags,
  getTagColor,
  parseKeyValues,
  parseTags,
  serializeKeyValues,
  serializeTags,
} from "util/instanceTags";
import type { LxdInstance } from "types/instance";

interface Props {
  instance: LxdInstance;
}

const DEFAULT_IP_COLORS = { ipv4: "#17becf", ipv6: "#9467bd" };

// Tags are edited in place, like the Proxmox summary.
const InstanceTagsEditor: FC<Props> = ({ instance }) => {
  const [isEditing, setEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [ipTags, setIpTags] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const toastNotify = useToastNotification();
  const eventQueue = useEventQueue();
  const queryClient = useQueryClient();
  const { canEditInstance } = useInstanceEntitlements();
  const { data: instances = [] } = useInstances(instance.project);

  const config = instance.expanded_config ?? instance.config;
  const known = getKnownTags(instances);
  const listId = `known-tags-${instance.name}`;

  // Instance with the draft colors applied, for the color inputs.
  const preview = {
    ...instance,
    expanded_config: {
      ...config,
      [TAG_COLORS_KEY]: serializeKeyValues(colors),
    },
  };

  const startEditing = () => {
    setTags(parseTags(config[TAGS_KEY]));
    setColors(parseKeyValues(config[TAG_COLORS_KEY]));
    setIpTags(parseKeyValues(config[IP_TAGS_KEY]));
    setDraft("");
    setEditing(true);
  };

  const addTag = () => {
    const tag = draft.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setDraft("");
  };

  const without = (map: Record<string, string>, key: string) =>
    Object.fromEntries(Object.entries(map).filter(([item]) => item !== key));

  const removeTag = (tag: string) => {
    setTags(tags.filter((item) => item !== tag));
    setColors(without(colors, tag));
  };

  const toggleIp = (family: "ipv4" | "ipv6", enabled: boolean) => {
    setIpTags(
      enabled
        ? { ...ipTags, [family]: DEFAULT_IP_COLORS[family] }
        : without(ipTags, family),
    );
  };

  const save = () => {
    const next = { ...instance.config };
    const tagColors = Object.fromEntries(
      Object.entries(colors).filter(([tag]) => tags.includes(tag)),
    );
    next[TAGS_KEY] = tags.length ? serializeTags(tags) : undefined;
    next[TAG_COLORS_KEY] = Object.keys(tagColors).length
      ? serializeKeyValues(tagColors)
      : undefined;
    next[IP_TAGS_KEY] = Object.keys(ipTags).length
      ? serializeKeyValues(ipTags)
      : undefined;

    setSaving(true);
    updateInstance({ ...instance, config: next }, instance.project)
      .then((operation) => {
        eventQueue.set(
          operation.metadata.id,
          () => {
            toastNotify.success(
              <>
                Tags of <strong>{instance.name}</strong> updated.
              </>,
            );
            setEditing(false);
          },
          (msg) => {
            toastNotify.failure("Tag update failed.", new Error(msg));
          },
          () => {
            setSaving(false);
            queryClient.invalidateQueries({ queryKey: [queryKeys.instances] });
          },
        );
      })
      .catch((e) => {
        setSaving(false);
        toastNotify.failure("Tag update failed.", e);
      });
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Escape") {
      setEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="tag-chips">
        <InstanceTags instance={instance} />
        {canEditInstance(instance) && (
          <Button
            appearance="base"
            className="u-no-margin--bottom"
            dense
            hasIcon
            type="button"
            onClick={startEditing}
            title="Edit tags"
            aria-label="Edit tags"
          >
            <Icon name="edit" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="tag-editor">
      <div className="tag-editor__row">
        {tags.map((tag) => (
          <span key={tag} className="tag-editor__tag">
            <TagChip
              chip={{
                label: tag,
                color: getTagColor(tag, preview, instances),
                kind: "tag",
              }}
              onRemove={() => {
                removeTag(tag);
              }}
            />
            <input
              type="color"
              className="tag-editor__color"
              value={getTagColor(tag, preview, instances)}
              title={`Color of ${tag}`}
              aria-label={`Color of ${tag}`}
              onChange={(e) => {
                setColors({ ...colors, [tag]: e.target.value });
              }}
            />
          </span>
        ))}
      </div>
      <div className="tag-editor__row">
        <Input
          type="text"
          className="u-no-margin--bottom tag-editor__input"
          placeholder="Add tag"
          aria-label="New tag"
          list={listId}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
          onKeyDown={onInputKeyDown}
          autoFocus
        />
        <datalist id={listId}>
          {known
            .filter((item) => !tags.includes(item.tag))
            .map((item) => (
              <option key={item.tag} value={item.tag} />
            ))}
        </datalist>
        <Button
          className="u-no-margin--bottom"
          dense
          type="button"
          onClick={addTag}
        >
          Add
        </Button>
      </div>
      <div className="tag-editor__row">
        {(["ipv4", "ipv6"] as const).map((family) => (
          <span key={family} className="tag-editor__tag">
            <CheckboxInput
              label={`${family === "ipv4" ? "IPv4" : "IPv6"} as tag`}
              checked={!!ipTags[family]}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                toggleIp(family, e.target.checked);
              }}
            />
            {ipTags[family] && (
              <input
                type="color"
                className="tag-editor__color"
                value={ipTags[family]}
                title={`Color of ${family} tags`}
                aria-label={`Color of ${family} tags`}
                onChange={(e) => {
                  setIpTags({ ...ipTags, [family]: e.target.value });
                }}
              />
            )}
          </span>
        ))}
      </div>
      <div className="tag-editor__actions">
        <Button
          className="u-no-margin--bottom"
          dense
          type="button"
          disabled={isSaving}
          onClick={() => {
            setEditing(false);
          }}
        >
          Cancel
        </Button>
        <ActionButton
          appearance="positive"
          className="u-no-margin--bottom"
          dense
          type="button"
          loading={isSaving}
          onClick={save}
        >
          Save
        </ActionButton>
      </div>
    </div>
  );
};

export default InstanceTagsEditor;
