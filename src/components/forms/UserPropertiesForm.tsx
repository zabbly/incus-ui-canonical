import type { FC } from "react";
import { Button, Icon, Input } from "@canonical/react-components";
import type {
  InstanceAndProfileFormikProps,
  InstanceAndProfileFormValues,
} from "./instanceAndProfileFormValues";
import { getConfigurationRowBase } from "components/ConfigurationRow";
import ScrollableConfigurationTable from "components/forms/ScrollableConfigurationTable";
import type { EditInstanceFormValues } from "pages/instances/EditInstance";
import { focusField } from "util/formFields";
import { ensureEditMode } from "util/instanceEdit";

export interface UserPropertyFormValues {
  name: string;
  value: string;
  nameEnabled: boolean;
}

export const userPropPrefix = "user.";

export const userPropertiesFromConfig = (
  config: Record<string, string>,
): Record<string, string> => {
  return Object.entries(config ?? {}).filter(([k]) =>
    k.startsWith(userPropPrefix),
  );
};

export const userPropertiesPayload = (
  config: Record<string, string>,
  values: InstanceAndProfileFormValues,
) => {
  const result = Object.fromEntries(
    Object.entries(config)
      .filter(([k]) => k.startsWith(userPropPrefix))
      .map(([k]) => [k, undefined]),
  );

  const userProperties = values.userProperties as UserPropertyFormValues[];
  userProperties.forEach((item: UserPropertyFormValues) => {
    result[item.name] = item.value;
  });
  return result;
};

const removePrefix = (value: string, prefix: string): string => {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
};

const userPropertiesFromValues = (formik: InstanceAndProfileFormikProps) => {
  const userProperties = formik.values
    .userProperties as UserPropertyFormValues[];
  return userProperties.filter((item) => item.value != null);
};

interface Props {
  formik: InstanceAndProfileFormikProps;
}

const UserPropertiesForm: FC<Props> = ({ formik }) => {
  const addUserProperty = () => {
    const userProperties = userPropertiesFromValues(formik);
    const copy = [...userProperties];

    copy.push({ name: userPropPrefix, value: "", nameEditable: true });

    formik.setFieldValue("userProperties", copy);
  };

  const removeUserProperty = (index: number) => {
    const userProperties = userPropertiesFromValues(formik);
    const copy = [...userProperties];
    copy.splice(index, 1);
    formik.setFieldValue("userProperties", copy);
  };

  const focusUserProperty = (id: number) => {
    focusField(`userProperties.${id}.name`);
  };

  const readOnly = (formik.values as EditInstanceFormValues).readOnly;

  return (
    <ScrollableConfigurationTable
      rows={[
        ...userPropertiesFromValues(formik).map((item, index: number) => {
          return getConfigurationRowBase({
            configuration: (
              <div style={{ display: "flex" }}>
                <div>
                  {readOnly || !item.nameEditable ? (
                    item.name
                  ) : (
                    <div className="u-flex u-align-items-center u-gap--small">
                      <label
                        htmlFor={`userProperties.${index}.name`}
                        className="u-no-margin"
                      >
                        user.
                      </label>
                      <Input
                        required
                        name={`userProperties.${index}.name`}
                        id={`userProperties.${index}.name`}
                        onBlur={formik.handleBlur}
                        onChange={(e) =>
                          void formik.setFieldValue(
                            `userProperties.${index}.name`,
                            `${userPropPrefix}${e.target.value}`,
                          )
                        }
                        value={removePrefix(
                          (
                            formik.values
                              .userProperties as UserPropertyFormValues[]
                          )[index].name,
                          userPropPrefix,
                        )}
                        type="text"
                      />
                    </div>
                  )}
                </div>
                <div>
                  {readOnly && item.nameEditable && (
                    <Button
                      onClick={() => {
                        ensureEditMode(formik);
                        focusUserProperty(index);
                      }}
                      type="button"
                      appearance="base"
                      title={formik.values.editRestriction ?? "Edit property"}
                      className="u-no-margin--top"
                      hasIcon
                      dense
                      disabled={!!formik.values.editRestriction}
                    >
                      <Icon name="edit" />
                    </Button>
                  )}
                </div>
              </div>
            ),
            inherited: "",
            override: (
              <div style={{ display: "flex" }}>
                <div>
                  {readOnly ? (
                    item.value
                  ) : (
                    <Input
                      required
                      name={`userProperties.${index}.value`}
                      id={`userProperties.${index}.value`}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      value={
                        (
                          formik.values
                            .userProperties as UserPropertyFormValues[]
                        )[index].value
                      }
                      type="text"
                    />
                  )}
                </div>
                <div>
                  {readOnly && (
                    <Button
                      onClick={() => {
                        ensureEditMode(formik);
                        focusUserProperty(index);
                      }}
                      type="button"
                      appearance="base"
                      title="Edit property"
                      className="u-no-margin--top"
                      hasIcon
                      dense
                      disabled={!!formik.values.editRestriction}
                    >
                      <Icon name="edit" />
                    </Button>
                  )}
                </div>
                <div>
                  <Button
                    onClick={() => {
                      ensureEditMode(formik);
                      removeUserProperty(index);
                    }}
                    type="button"
                    appearance="base"
                    title="Remove"
                    className="profile-remove-btn"
                    hasIcon
                    dense
                    disabled={!!formik.values.editRestriction}
                  >
                    <Icon name="delete" />
                  </Button>
                </div>
              </div>
            ),
          });
        }),

        getConfigurationRowBase({
          configuration: "",
          inherited: "",
          override: (
            <Button
              onClick={() => {
                ensureEditMode(formik);
                addUserProperty();
              }}
              type="button"
              hasIcon
              disabled={!!formik.values.editRestriction}
              title={formik.values.editRestriction}
            >
              <Icon name="plus" />
              <span>Add property</span>
            </Button>
          ),
        }),
      ]}
    />
  );
};

export default UserPropertiesForm;
