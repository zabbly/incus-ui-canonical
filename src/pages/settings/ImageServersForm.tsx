import type { FC } from "react";
import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Icon,
  Input,
  Select,
  useNotify,
  useToastNotification,
} from "@canonical/react-components";
import { useQueryClient } from "@tanstack/react-query";
import { updateSettings } from "api/server";
import type { ConfigField } from "types/config";
import { queryKeys } from "util/queryKeys";
import ResourceLabel from "components/ResourceLabel";
import { useServerEntitlements } from "util/entitlements/server";
import type { ImageServer } from "util/imageServers";
import {
  IMAGE_SERVERS_KEY,
  parseImageServers,
  serializeImageServers,
} from "util/imageServers";

interface Props {
  configField: ConfigField;
  value?: string;
}

const emptyServer: ImageServer = {
  name: "",
  url: "",
  protocol: "simplestreams",
};

const ImageServersForm: FC<Props> = ({ configField, value }) => {
  const [isEditMode, setEditMode] = useState(false);
  const [servers, setServers] = useState<ImageServer[]>(
    parseImageServers(value),
  );
  const notify = useNotify();
  const toastNotify = useToastNotification();
  const queryClient = useQueryClient();
  const { canEditServerConfiguration } = useServerEntitlements();

  useEffect(() => {
    if (!isEditMode) {
      setServers(parseImageServers(value));
    }
  }, [isEditMode, value]);

  const settingLabel = (
    <ResourceLabel bold type="setting" value={configField.key} />
  );

  const updateServer = (index: number, patch: Partial<ImageServer>) => {
    setServers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const addServer = () => {
    setServers((prev) => [...prev, { ...emptyServer }]);
  };

  const removeServer = (index: number) => {
    setServers((prev) => prev.filter((_, i) => i !== index));
  };

  const onCancel = () => {
    setServers(parseImageServers(value));
    setEditMode(false);
  };

  const handleSave = () => {
    const cleaned = servers
      .map((server) => ({
        ...server,
        name: server.name.trim(),
        url: server.url.trim(),
      }))
      .filter((server) => server.url.length > 0);

    const newValue = cleaned.length > 0 ? serializeImageServers(cleaned) : "";

    updateSettings({ [IMAGE_SERVERS_KEY]: newValue })
      .then(() => {
        toastNotify.success(<>Setting {settingLabel} updated.</>);
        setEditMode(false);
      })
      .catch((e) => {
        notify.failure("Setting update failed", e, settingLabel);
      })
      .finally(() => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.settings] });
        queryClient.invalidateQueries({ queryKey: [queryKeys.images] });
      });
  };

  const isFormValid = servers.every((server) => server.url.trim().length > 0);

  if (!isEditMode) {
    const summary =
      servers.length > 0
        ? servers.map((server) => server.name || server.url).join(", ")
        : "-";
    return (
      <Button
        appearance="base"
        className="readmode-button u-no-margin"
        onClick={() => {
          setEditMode(true);
        }}
        hasIcon
        disabled={!canEditServerConfiguration()}
        title={
          canEditServerConfiguration()
            ? ""
            : "You do not have permission to edit server configuration"
        }
      >
        <div className="readmode-value u-truncate">{summary}</div>
        <Icon name="edit" className="edit-icon" />
      </Button>
    );
  }

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      {servers.map((server, index) => (
        <div key={index} className="image-server-row">
          <Input
            type="text"
            label="Name"
            aria-label={`Image remote ${index + 1} name`}
            value={server.name}
            onChange={(e) => {
              updateServer(index, { name: e.target.value });
            }}
          />
          <Input
            type="text"
            label="URL"
            placeholder={
              server.protocol === "oci"
                ? "https://docker.io"
                : "https://example.com"
            }
            aria-label={`Image remote ${index + 1} URL`}
            value={server.url}
            onChange={(e) => {
              updateServer(index, { url: e.target.value });
            }}
          />
          <Select
            label="Protocol"
            aria-label={`Image remote ${index + 1} protocol`}
            options={[
              { label: "OCI", value: "oci" },
              { label: "Simple streams", value: "simplestreams" },
            ]}
            onChange={(e) => {
              updateServer(index, {
                protocol: e.target.value as ImageServer["protocol"],
              });
            }}
            value={server.protocol}
          />
          <Button
            type="button"
            appearance="base"
            hasIcon
            aria-label={`Remove image remote ${index + 1}`}
            onClick={() => {
              removeServer(index);
            }}
          >
            <Icon name="delete" />
          </Button>
        </div>
      ))}
      <Button type="button" appearance="base" hasIcon onClick={addServer}>
        <Icon name="plus" />
        <span>Add remote</span>
      </Button>
      <hr />
      <Button appearance="base" type="button" onClick={onCancel}>
        Cancel
      </Button>
      <Button appearance="positive" type="submit" disabled={!isFormValid}>
        Save
      </Button>
    </Form>
  );
};

export default ImageServersForm;
