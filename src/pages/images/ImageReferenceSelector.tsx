import type { FC } from "react";
import { useState } from "react";
import {
  Button,
  Form,
  Icon,
  Input,
  Modal,
  Select,
} from "@canonical/react-components";
import { useSupportedFeatures } from "context/useSupportedFeatures";
import { useNavigate } from "react-router-dom";
import type { LxdImageType, RemoteImage } from "types/image";
import {
  defaultImageServers,
  getImageServerHost,
  IMAGE_SERVERS_KEY,
  parseImageServers,
} from "util/imageServers";
import { instanceCreationTypes } from "util/instanceOptions";
import { ROOT_PATH } from "util/rootPath";

interface Props {
  imageType?: LxdImageType;
  initialAlias?: string;
  initialProtocol?: string;
  initialServer?: string;
  onBack: () => void;
  onClose: () => void;
  onSelect: (image: RemoteImage, type?: LxdImageType) => void;
}

interface ImageSource {
  label: string;
  protocol: string;
  registryName?: string;
  server?: string;
  value: string;
}

const normalizeServer = (server?: string) =>
  server?.replace(/\/+$/, "").toLowerCase();

const ImageReferenceSelector: FC<Props> = ({
  imageType,
  initialAlias = "",
  initialProtocol,
  initialServer,
  onBack,
  onClose,
  onSelect,
}) => {
  const navigate = useNavigate();
  const [referenceType, setReferenceType] = useState<LxdImageType>(
    imageType ?? "container",
  );
  const effectiveImageType = imageType ?? referenceType;
  const { settings } = useSupportedFeatures();
  const legacyServers = parseImageServers(
    settings?.config?.[IMAGE_SERVERS_KEY],
  );
  const availableLegacyServers = [...legacyServers, ...defaultImageServers]
    .filter(
      (server, index, servers) =>
        index === servers.findIndex((item) => item.name === server.name),
    )
    .filter(
      (server) =>
        effectiveImageType !== "virtual-machine" || server.protocol !== "oci",
    );
  const legacyRemoteSources: ImageSource[] = availableLegacyServers.map(
    (server) => ({
      label: server.name || server.url,
      protocol: server.protocol,
      server: server.url,
      value: server.url,
    }),
  );
  const sources = legacyRemoteSources;
  const initialSource =
    sources.find(
      (source) =>
        source.protocol === initialProtocol &&
        (normalizeServer(source.server) === normalizeServer(initialServer) ||
          (source.protocol === "oci" &&
            getImageServerHost(source.server) ===
              getImageServerHost(initialServer))),
    ) ??
    sources.find((source) => source.protocol === initialProtocol) ??
    sources[0];
  const [sourceName, setSourceName] = useState("");
  const [alias, setAlias] = useState(initialAlias);
  const selectedSource =
    sources.find((source) => source.value === sourceName) ?? initialSource;
  const normalizedAlias = alias.trim();

  const selectReference = () => {
    if (!selectedSource || !normalizedAlias) {
      return;
    }

    onSelect(
      {
        aliases: normalizedAlias,
        arch: "",
        created_at: Date.now(),
        os: "",
        protocol: selectedSource.protocol,
        registryName: selectedSource.registryName,
        release: "",
        server: selectedSource.server,
        title: `${selectedSource.label}:${normalizedAlias}`,
        type: effectiveImageType,
      },
      effectiveImageType,
    );
  };

  const manageRemotes = () => {
    onClose();
    const path = `${ROOT_PATH}/ui/settings?query=${encodeURIComponent(
      IMAGE_SERVERS_KEY,
    )}`;
    void navigate(path);
  };

  return (
    <Modal
      buttonRow={
        <>
          <Button
            appearance="base"
            className="u-no-margin--bottom"
            onClick={onBack}
            type="button"
          >
            Back
          </Button>
          <Button
            appearance="positive"
            className="u-no-margin--bottom"
            disabled={!selectedSource || !normalizedAlias}
            onClick={selectReference}
            type="button"
          >
            Continue
          </Button>
        </>
      }
      close={onClose}
      title="Use image reference"
    >
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          selectReference();
        }}
      >
        {!imageType && (
          <Select
            id="image-reference-type"
            label="Instance type"
            name="image-reference-type"
            onChange={(event) => {
              setReferenceType(event.target.value as LxdImageType);
            }}
            options={instanceCreationTypes}
            value={referenceType}
          />
        )}
        <Select
          id="image-source"
          help="Select a standard Incus image remote or a custom Web UI remote. OCI remotes are available for containers only. Remotes configured only in the local Incus CLI are not available to the browser."
          label="Remote"
          name="image-source"
          onChange={(event) => {
            setSourceName(event.target.value);
          }}
          options={sources.map(({ label, value }) => ({ label, value }))}
          required
          value={selectedSource?.value ?? ""}
        />
        <Button
          appearance="base"
          className="u-no-margin--top"
          hasIcon
          onClick={manageRemotes}
          type="button"
        >
          <Icon name="plus" />
          <span>Configure Web UI remotes</span>
        </Button>
        <Input
          autoFocus
          help={
            <>
              Enter the image reference exactly as it appears on the remote,
              using <code>organisation/repository:version</code>.
            </>
          }
          label="Image (organisation/repository:version)"
          name="image-alias"
          onChange={(event) => {
            setAlias(event.target.value);
          }}
          required
          type="text"
          value={alias}
        />
        <Input type="submit" hidden value="Select image reference" />
      </Form>
    </Modal>
  );
};

export default ImageReferenceSelector;
