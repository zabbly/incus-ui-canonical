import type { FC } from "react";
import { memo, useEffect, useState } from "react";
import { SearchBox } from "@canonical/react-components";

export const QUERY = "query";
export const STATUS = "status";
export const TYPE = "type";
export const PROFILE = "profile";
export const CLUSTER_MEMBER = "member";
export const PROJECT = "project";

interface Props {
  initialQuery: string;
  onSearch: (filter: string) => void;
}

const InstanceSearchFilter: FC<Props> = ({ onSearch, initialQuery }) => {
  const [query, setQuery] = useState<string>(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onSearch(query);
    }
  };

  const onInputChange = (input: string) => {
    if (input === "" && query != "") {
      onSearch("");
    }
    setQuery(input);
  };

  return (
    <>
      <h2 className="u-off-screen">Search and filter</h2>
      <SearchBox
        className="search-box margin-right u-no-margin--bottom"
        name="search-instance"
        type="text"
        onChange={onInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Search"
        value={query}
        aria-label="Search"
        externallyControlled={true}
      />
    </>
  );
};

export default memo(InstanceSearchFilter);
