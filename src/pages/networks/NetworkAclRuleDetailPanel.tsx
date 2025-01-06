import { FC } from "react";
import { Button, Icon, useNotify } from "@canonical/react-components";
import SidePanel from "components/SidePanel";

interface Props {
  rule: Object;
  onClosePanel: () => void;
}

const NetworkAclRuleDetailPanel: FC<Props> = ({ rule, onClosePanel }) => {
  return (
    <SidePanel
      className="u-hide--medium u-hide--small"
      width="narrow"
      pinned
    >
      <SidePanel.Container className="detail-panel profile-detail-panel">
        <SidePanel.Sticky>
          <SidePanel.Header>
            <SidePanel.HeaderTitle>ACL rule summary</SidePanel.HeaderTitle>
            <SidePanel.HeaderControls>
              <Button
                appearance="base"
                className="u-no-margin--bottom"
                hasIcon
                onClick={onClosePanel}
                aria-label="Close"
              >
                <Icon name="close" />
              </Button>
            </SidePanel.HeaderControls>
          </SidePanel.Header>
        </SidePanel.Sticky>
        <SidePanel.Content>
          <table className="u-table-layout--auto u-no-margin--bottom">
            <tbody>
              <tr>
                <th className="u-text--muted">Action</th>
                <td>
                  { rule.action }
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">State</th>
                <td>
                  { rule.state }
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">Description</th>
                <td>
                  { rule.description }
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">Source</th>
                <td>
                  { rule.source }
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">Destination</th>
                <td>
                  { rule.destination }
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">Protocol</th>
                <td>
                  { rule.protocol }
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">Source port</th>
                <td>
                  { rule.source_port }
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">Destination port</th>
                <td>
                  { rule.destination_port }
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">ICMP type</th>
                <td>
                  { rule.icmp_type }
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">ICMP code</th>
                <td>
                  { rule.icmp_code }
                </td>
              </tr>
            </tbody>
          </table>
        </SidePanel.Content>
      </SidePanel.Container>
    </SidePanel>
  );
};

export default NetworkAclRuleDetailPanel;
