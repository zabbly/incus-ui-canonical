import { FC } from "react";
import {
  Button,
  EmptyState,
  Icon,
  MainTable,
  Row,
  useNotify,
} from "@canonical/react-components";
import { fetchNetworkAcls } from "api/networks";
import BaseLayout from "components/BaseLayout";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import Loader from "components/Loader";
import { Link, useNavigate, useParams } from "react-router-dom";
import NotificationRow from "components/NotificationRow";
import HelpLink from "components/HelpLink";
import { useDocs } from "context/useDocs";
import { useSmallScreen } from "context/useSmallScreen";

const NetworkAclList: FC = () => {
  const docBaseLink = useDocs();
  const navigate = useNavigate();
  const notify = useNotify();
  const { project } = useParams<{ project: string }>();
  const isSmallScreen = useSmallScreen();

  if (!project) {
    return <>Missing project</>;
  }

  const {
    data: acls = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: [queryKeys.projects, project, queryKeys.networkAcls],
    queryFn: () => fetchNetworkAcls(project),
  });

  if (error) {
    notify.failure("Loading network ACLs failed", error);
  }

  const hasAcls = acls.length > 0;

  const headers = [
    { content: "Name", sortKey: "name" },
    { content: "Description", sortKey: "description" },
    { content: "Used by", sortKey: "usedBy", className: "u-align--right" },
  ];

  const rows = acls.map((acl) => {
    return {
      columns: [
        {
          content: (
            <Link to={`/ui/project/${project}/network-acls/${acl.name}`}>
              {acl.name}
            </Link>
          ),
          role: "rowheader",
          "aria-label": "Name",
        },
        {
          content: acl.description,
          role: "rowheader",
          "aria-label": "Description",
        },
        {
          content: acl.used_by?.length ?? "0",
          role: "rowheader",
          className: "u-align--right",
          "aria-label": "Used by",
        },
      ],
      sortData: {
        name: acl.name.toLowerCase(),
        description: acl.description?.toLowerCase(),
        usedBy: acl.used_by?.length ?? 0,
      },
    };
  });

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      <BaseLayout
        title={
          <HelpLink
            href={`${docBaseLink}/explanation/networks/`}
            title="Learn more about networking"
          >
            ACLs
          </HelpLink>
        }
        controls={
          <>
            <Button
              appearance="positive"
              className="u-no-margin--bottom"
              onClick={() =>
                navigate(`/ui/project/${project}/network-acls/create`)
              }
              hasIcon={!isSmallScreen}
            >
              {!isSmallScreen && <Icon name="plus" light />}
              <span>Create ACL</span>
            </Button>
          </>
        }
      >
        <NotificationRow />
        <Row>
          {hasAcls && (
            <MainTable
              headers={headers}
              rows={rows}
              paginate={30}
              responsive
              sortable
              className="u-table-layout--auto"
              emptyStateMsg="No data to display"
            />
          )}
          {!isLoading && !hasAcls && (
            <EmptyState
              className="empty-state"
              image={<Icon className="empty-state-icon" name="exposed" />}
              title="No network ACLs found"
            >
              <p>There are no network ACLs in this project.</p>
              <p>
                <a
                  href={`${docBaseLink}/explanation/network-acls/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more about network ACLs
                  <Icon className="external-link-icon" name="external-link" />
                </a>
              </p>
            </EmptyState>
          )}
        </Row>
      </BaseLayout>
    </>
  );
};

export default NetworkAclList;
