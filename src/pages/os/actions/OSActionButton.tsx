import type { FC } from "react";
import { useState } from "react";
import { useFormik } from "formik";
import {
  ActionButton,
  Button,
  ConfirmationButton,
  Input,
  Modal,
  Select,
  Textarea,
  usePortal,
  useToastNotification,
} from "@canonical/react-components";
import type { QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import type { IconName } from "@canonical/ds-assets";
import DsIcon from "components/DsIcon";

// "begin-downloading" has no ds-assets equivalent
const toDsIconName = (icon: string): IconName =>
  (icon === "begin-downloading" ? "download" : icon) as IconName;

export interface OSActionOption {
  label: string;
  value: string;
}

export interface OSActionField {
  name: string;
  label: string;
  type?: "text" | "number" | "checkbox" | "textarea";
  options?: (string | OSActionOption)[];
  defaultValue?: string;
  help?: string;
  placeholder?: string;
  // Must be filled in, selects then start out empty.
  required?: boolean;
}

export type OSActionValues = Record<string, string | boolean>;
export type OSActionInput = OSActionValues | File | undefined;

interface Props {
  label: string;
  mode: "confirm" | "fields" | "download" | "upload";
  // Upload actions get the file as input and the fields as values.
  run: (input: OSActionInput, values: OSActionValues) => Promise<unknown>;
  successMessage: string;
  icon?: string;
  destructive?: boolean;
  confirmMessage?: string;
  submitLabel?: string;
  fields?: OSActionField[];
  filename?: string;
  invalidateKeys?: QueryKey[];
}

const OSActionButton: FC<Props> = ({
  label,
  mode,
  run,
  successMessage,
  icon,
  destructive,
  confirmMessage,
  submitLabel,
  fields = [],
  filename = "download",
  invalidateKeys = [],
}) => {
  const toastNotify = useToastNotification();
  const queryClient = useQueryClient();
  const { openPortal, closePortal, isOpen, Portal } = usePortal();
  const [loading, setLoading] = useState(false);

  const buttonAppearance = icon
    ? "base"
    : destructive
      ? "negative"
      : "positive";

  const execute = async (
    input: OSActionInput,
    values: OSActionValues,
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await run(input, values);

      if (mode === "download") {
        const url = result as string;
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toastNotify.success(<>{successMessage}</>);
      invalidateKeys.forEach((queryKey) => {
        void queryClient.invalidateQueries({ queryKey });
      });
      return true;
    } catch (e) {
      toastNotify.failure(`${label} failed`, e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  if (mode === "confirm") {
    return (
      <ConfirmationButton
        appearance={buttonAppearance}
        loading={loading}
        className={icon ? "has-icon is-dense" : undefined}
        title={icon ? label : undefined}
        confirmationModalProps={{
          title: label,
          children: <p>{confirmMessage}</p>,
          onConfirm: () => void execute(undefined, {}),
          confirmButtonLabel: submitLabel ?? label,
          confirmButtonAppearance: destructive ? "negative" : "positive",
        }}
      >
        {icon ? <DsIcon icon={toDsIconName(icon)} /> : label}
      </ConfirmationButton>
    );
  }

  // Downloads without options start right away.
  if (mode === "download" && fields.length === 0) {
    return (
      <ActionButton
        appearance={buttonAppearance}
        loading={loading}
        className={icon ? "has-icon is-dense" : undefined}
        title={label}
        onClick={() => void execute(undefined, {})}
      >
        {icon ? <DsIcon icon={toDsIconName(icon)} /> : label}
      </ActionButton>
    );
  }

  const defaultSubmitLabel =
    mode === "upload" ? "Upload" : mode === "download" ? "Download" : label;

  return (
    <>
      <ActionButton
        appearance={buttonAppearance}
        className={icon ? "has-icon is-dense" : undefined}
        title={label}
        onClick={openPortal}
      >
        {icon ? <DsIcon icon={toDsIconName(icon)} /> : label}
      </ActionButton>
      {isOpen && (
        <Portal>
          <OSActionModal
            title={label}
            confirmMessage={confirmMessage}
            fields={fields}
            needsFile={mode === "upload"}
            submitLabel={submitLabel ?? defaultSubmitLabel}
            destructive={destructive}
            loading={loading}
            onClose={closePortal}
            onSubmit={async (values, file) => {
              const ok = await execute(
                mode === "upload" ? file : values,
                values,
              );
              if (ok) {
                closePortal();
              }
            }}
          />
        </Portal>
      )}
    </>
  );
};

interface ModalProps {
  title: string;
  confirmMessage?: string;
  fields: OSActionField[];
  needsFile: boolean;
  submitLabel: string;
  destructive?: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: OSActionValues, file?: File) => Promise<void>;
}

const OSActionModal: FC<ModalProps> = ({
  title,
  confirmMessage,
  fields,
  needsFile,
  submitLabel,
  destructive,
  loading,
  onClose,
  onSubmit,
}) => {
  const [file, setFile] = useState<File | undefined>(undefined);

  const initialValues: OSActionValues = {};
  fields.forEach((field) => {
    if (field.type === "checkbox") {
      initialValues[field.name] = false;
    } else {
      // Selects default to their first option.
      const first = field.options?.[0];
      const firstValue = typeof first === "string" ? first : first?.value;
      initialValues[field.name] =
        field.defaultValue ?? (field.required ? "" : (firstValue ?? ""));
    }
  });

  const formik = useFormik<OSActionValues>({
    initialValues,
    onSubmit: (values) => void onSubmit(values, file),
  });

  const missing = fields.some(
    (field) => field.required && !formik.values[field.name],
  );

  return (
    <Modal
      close={onClose}
      title={title}
      buttonRow={
        <>
          <Button appearance="base" onClick={onClose}>
            Cancel
          </Button>
          <ActionButton
            appearance={destructive ? "negative" : "positive"}
            loading={loading}
            disabled={(needsFile && !file) || missing}
            onClick={() => void formik.submitForm()}
          >
            {submitLabel}
          </ActionButton>
        </>
      }
    >
      {confirmMessage && (
        <p className={destructive ? "u-text--negative" : undefined}>
          {confirmMessage}
        </p>
      )}
      {needsFile && (
        <div className="u-sv2">
          <label className="p-form__label" htmlFor="os-action-file">
            File
          </label>
          <input
            id="os-action-file"
            type="file"
            onChange={(e) => {
              setFile(e.target.files?.[0]);
            }}
          />
        </div>
      )}
      {fields.map((field) => {
        if (field.type === "checkbox") {
          return (
            <Input
              key={field.name}
              type="checkbox"
              label={field.label}
              name={field.name}
              help={field.help}
              checked={Boolean(formik.values[field.name])}
              onChange={formik.handleChange}
            />
          );
        }

        if (field.type === "textarea") {
          return (
            <Textarea
              key={field.name}
              label={field.label}
              name={field.name}
              help={field.help}
              placeholder={field.placeholder}
              rows={6}
              value={String(formik.values[field.name] ?? "")}
              onChange={formik.handleChange}
            />
          );
        }

        // Fall back to free text when there is nothing to pick from.
        if (field.options && field.options.length > 0) {
          return (
            <Select
              key={field.name}
              label={field.label}
              name={field.name}
              help={field.help}
              value={String(formik.values[field.name] ?? "")}
              options={[
                ...(field.required
                  ? [{ label: "Select an option", value: "", disabled: true }]
                  : []),
                ...field.options.map((option) =>
                  typeof option === "string"
                    ? { label: option, value: option }
                    : option,
                ),
              ]}
              onChange={formik.handleChange}
            />
          );
        }

        return (
          <Input
            key={field.name}
            type={field.type ?? "text"}
            label={field.label}
            name={field.name}
            help={field.help}
            placeholder={field.placeholder}
            value={String(formik.values[field.name] ?? "")}
            onChange={formik.handleChange}
          />
        );
      })}
    </Modal>
  );
};

export default OSActionButton;
