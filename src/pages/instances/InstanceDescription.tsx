import { useState, type FC, type KeyboardEvent } from "react";
import {
  ActionButton,
  Button,
  Icon,
  Textarea,
  useToastNotification,
} from "@canonical/react-components";
import { useQueryClient } from "@tanstack/react-query";
import RichDescription from "components/RichDescription";
import { updateInstance } from "api/instances";
import { useEventQueue } from "context/eventQueue";
import { queryKeys } from "util/queryKeys";
import { useInstanceEntitlements } from "util/entitlements/instances";
import type { LxdInstance } from "types/instance";

interface Props {
  instance: LxdInstance;
}

// Shows the description with an inline editor for users who may edit.
const InstanceDescription: FC<Props> = ({ instance }) => {
  const [isEditing, setEditing] = useState(false);
  const [isPreview, setPreview] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [draft, setDraft] = useState("");
  const toastNotify = useToastNotification();
  const eventQueue = useEventQueue();
  const queryClient = useQueryClient();
  const { canEditInstance } = useInstanceEntitlements();

  const startEditing = () => {
    setDraft(instance.description ?? "");
    setPreview(false);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
  };

  const save = () => {
    const description = draft.trim();
    if (description === (instance.description ?? "")) {
      setEditing(false);
      return;
    }

    setSaving(true);
    updateInstance({ ...instance, description }, instance.project)
      .then((operation) => {
        eventQueue.set(
          operation.metadata.id,
          () => {
            toastNotify.success(
              <>
                Description of <strong>{instance.name}</strong> updated.
              </>,
            );
            setEditing(false);
          },
          (msg) =>
            toastNotify.failure("Description update failed.", new Error(msg)),
          () => {
            setSaving(false);
            queryClient.invalidateQueries({
              queryKey: [queryKeys.instances],
            });
          },
        );
      })
      .catch((e) => {
        setSaving(false);
        toastNotify.failure("Description update failed.", e);
      });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      cancel();
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      save();
    }
  };

  if (!isEditing) {
    return (
      <div className="instance-description">
        <RichDescription description={instance.description} />
        {canEditInstance(instance) && (
          <Button
            appearance="base"
            className="u-no-margin--bottom instance-description__edit"
            dense
            hasIcon
            onClick={startEditing}
            title="Edit description"
            aria-label="Edit description"
          >
            <Icon name="edit" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="instance-description" onKeyDown={onKeyDown}>
      {isPreview ? (
        <div className="instance-description__preview">
          <RichDescription description={draft} />
        </div>
      ) : (
        <Textarea
          autoFocus
          aria-label="Description"
          className="u-no-margin--bottom"
          rows={6}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
        />
      )}
      <div className="instance-description__actions">
        <Button
          appearance="base"
          className="u-no-margin--bottom"
          dense
          onClick={() => {
            setPreview(!isPreview);
          }}
        >
          {isPreview ? "Edit" : "Preview"}
        </Button>
        <Button
          className="u-no-margin--bottom"
          dense
          disabled={isSaving}
          onClick={cancel}
        >
          Cancel
        </Button>
        <ActionButton
          appearance="positive"
          className="u-no-margin--bottom"
          dense
          loading={isSaving}
          onClick={save}
        >
          Save
        </ActionButton>
      </div>
    </div>
  );
};

export default InstanceDescription;
