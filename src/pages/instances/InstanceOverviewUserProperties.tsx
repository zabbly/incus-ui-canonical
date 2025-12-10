import type { FC } from "react";
import { userPropertiesFromConfig } from "components/forms/UserPropertiesForm";
import type { LxdInstance } from "types/instance";

interface Props {
  instance: LxdInstance;
}

const InstanceOverviewUserProperties: FC<Props> = ({ instance }) => {
  const userProperties = userPropertiesFromConfig(instance.config);

  return (
    <table>
      <tbody>
        {userProperties.map(([key, value]) => (
          <tr key={key as string}>
            <th className="u-text--muted">{key}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default InstanceOverviewUserProperties;
