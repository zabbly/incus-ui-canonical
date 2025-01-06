import { FC, useState } from "react";
import { EmptyState, Icon, MainTable, Row } from "@canonical/react-components";
import { LxdNetworkAcl, LxdNetworkAclRule, LxdNetworkAclRuleType } from "types/network";
import { useDocs } from "context/useDocs";
import { Link } from "react-router-dom";
import ScrollableTable from "components/ScrollableTable";
import DeleteNetworkAclRuleBtn from "pages/networks/actions/DeleteNetworkAclRuleBtn";
import NetworkAclRuleDetailPanel from "./NetworkAclRuleDetailPanel";

interface Props {
  acl: LxdNetworkAcl;
  type: string;
  project: string;
}

const NetworkAclRules: FC<Props> = ({ acl, type, project }) => {
  const docBaseLink = useDocs();
  const [selectedRule, setSelectedRule] = useState(-1);

  const ruleType: keyof LxdNetworkAcl = type as LxdNetworkAclRuleType;
  const rules = acl[ruleType] as LxdNetworkAclRule[];
  const hasRules = rules.length > 0;

  const closeDetailPanel = () => setSelectedRule(-1);

  const headers = [
    { content: "Action", sortKey: "action" },
    { content: "State", sortKey: "state" },
    { content: "Description", sortKey: "description" },
    { content: "Source", sortKey: "source" },
    { content: "Destination", sortKey: "destination" },
    { "aria-label": "Actions", className: "u-align--right actions" },
  ];

  const rows = rules.map((rule: LxdNetworkAclRule, index: number) => {
    const openDetailPanel = () => setSelectedRule(index);

    return {
      className: selectedRule === index ? "u-row-selected" : "u-row",
      columns: [
        {
          content: rule.action,
          "aria-label": "Action",
          onClick: openDetailPanel,
        },
        {
          content: rule.state,
          "aria-label": "State",
          onClick: openDetailPanel,
        },
        {
          content: rule.description,
          "aria-label": "Description",
          onClick: openDetailPanel,
        },
        {
          content: rule.source,
          "aria-label": "Source",
          onClick: openDetailPanel,
        },
        {
          content: rule.destination,
          "aria-label": "Destination",
          onClick: openDetailPanel,
        },
        {
          content: (
            <>
              <DeleteNetworkAclRuleBtn
                acl={acl}
                project={project}
                index={index}
                type={type}
                onDelete={closeDetailPanel}
              />
            </>
          ),
          className: "u-align--right actions",
          "aria-label": "Actions",
        },
      ],
      sortData: {
        action: rule.action,
        state: rule.state,
        description: rule.description,
      },
    };
  });

  return (
    <>
      <Link
        className="p-button--positive u-no-margin--bottom u-float-right"
        to={`/ui/project/${project}/network-acls/${acl.name}/rules/create/${type}`}
      >
        Create rule
      </Link>
      <Row>
        {hasRules && (
          <ScrollableTable
            dependencies={rules}
            tableId="network-acl-rules-table"
            belowIds={["status-bar"]}
          >
            <MainTable
              id="network-acl-rules-table"
              headers={headers}
              expanding
              rows={rows}
              paginate={30}
              sortable
              defaultSort="action"
              defaultSortDirection="ascending"
              className="network-acl-rule-list u-table-layout--auto network-acl-rules-table u-selectable-table-rows"
              emptyStateMsg="No data to display"
            />
          </ScrollableTable>
        )}
        {!hasRules && (
          <EmptyState
            className="empty-state"
            image={<Icon className="empty-state-icon" name="exposed" />}
            title="No network ACL rules found"
          >
            <p>There are no network ACL rules in this project.</p>
            <p>
              <a
                href={`${docBaseLink}/howto/network_acls/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more about network ACLs.
                <Icon className="external-link-icon" name="external-link" />
              </a>
            </p>
          </EmptyState>
        )}
      </Row>
      {selectedRule != -1 && (
        <NetworkAclRuleDetailPanel
          rule={rules[selectedRule]}
          onClosePanel={closeDetailPanel}
        />
      )}
    </>
  );
};

export default NetworkAclRules;
