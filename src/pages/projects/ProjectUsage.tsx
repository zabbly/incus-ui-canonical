import type { FC } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  EmptyState,
  Icon,
  MainTable,
  ScrollableTable,
  Col,
  Row,
  CustomLayout,
  Spinner,
} from "@canonical/react-components";
import { fetchProjectState } from "api/projects";
import PageHeader from "components/PageHeader";
import { humanFileSize } from "util/helpers";
import { queryKeys } from "util/queryKeys";

const ProjectUsage: FC = () => {
  const { project: projectName } = useParams<{ project: string }>();

  if (!projectName) {
    return <>Missing project</>;
  }

  const { data: usage, isLoading } = useQuery({
    queryKey: [queryKeys.projects, projectName, queryKeys.projectUsage],
    queryFn: async () => fetchProjectState(projectName),
  });

  if (isLoading) {
    return <Spinner className="u-loader" text="Loading..." isMainComponent />;
  }

  const usageValue = (resource: string, val: number): string => {
    if (["disk", "memory"].includes(resource)) {
      return humanFileSize(val);
    }

    return val.toString();
  };

  const resources = Object.entries(usage.resources);
  const headers = [
    { content: "Resource" },
    { content: "Limit" },
    { content: "Usage" },
  ];

  const rows = resources.map(([k, v]) => {
    return {
      key: k,
      className: "u-row",
      columns: [
        {
          content: k,
          role: "rowheader",
          "aria-label": "Resource",
        },
        {
          content: v.Limit >= 0 ? v.Limit : "UNLIMITED",
          role: "cell",
          "aria-label": "Limit",
        },
        {
          content: usageValue(k, v.Usage),
          role: "cell",
          "aria-label": "Usage",
        },
      ],
    };
  });

  return (
    <>
      <CustomLayout
        header={
          <PageHeader>
            <PageHeader.Left>
              <PageHeader.Title>Project usage</PageHeader.Title>
            </PageHeader.Left>
          </PageHeader>
        }
      >
        <Row className="no-grid-gap">
          <Col size={12}>
            {resources.length === 0 && (
              <EmptyState
                className="empty-state"
                image={<Icon name="repository" className="empty-state-icon" />}
                title="No resources found"
              >
                <p>There are no resources in this project.</p>
              </EmptyState>
            )}
            {resources.length > 0 && (
              <ScrollableTable
                dependencies={resources}
                tableId="proect-usage-table"
                belowIds={["status-bar"]}
              >
                <MainTable
                  id="project-usage-table"
                  headers={headers}
                  rows={rows}
                  sortable
                />
              </ScrollableTable>
            )}
          </Col>
        </Row>
      </CustomLayout>
    </>
  );
};

export default ProjectUsage;
