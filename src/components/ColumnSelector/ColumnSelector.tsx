import React, { HTMLProps, ReactElement } from "react";
import type {
  ClassName,
  PropsWithSpread,
} from "@canonical/react-components";
import classnames from "classnames";
import {
  Button,
  CheckboxInput,
  Col,
  ContextualMenu,
  Icon,
  Row,
  Tooltip,
} from "@canonical/react-components";
import "./ColumnSelector.scss";

export type Props = PropsWithSpread<
  {
    /**
     * Optional classes to add to the contextual menu.
     */
    className?: ClassName;
    /**
     * All columns of the table.
     */
    columns: string[];
    /**
     * Columns of the table that can be hidden by the user
     */
    hideableColumns: string[];
    /**
     * Columns of the table hidden by the user
     */
    userHidden: string[];
    /**
     * Columns of the table hidden because the available space is not sufficient
     */
    sizeHidden: string[];
    /**
     * Function that sets columns hidden by the user
     */
    setUserHidden: (columns: string[]) => void;
    /**
     * Function that sets columns order
     */
    setColumnOrder: (columns: string[]) => void;
  },
  HTMLProps<HTMLElement>
>;

/**
This is a [React](https://reactjs.org/) component that extends from the Vanilla [Select](https://vanillaframework.io/docs/base/forms#select) element.
The aim of this component is to provide a dropdown menu to control the visibility of columns within a table.
This component allows users to customize their view, hiding or showing columns as needed, while also handling columns that are automatically hidden on smaller screens.
*/
const ColumnSelector = ({
  className,
  columns,
  hideableColumns,
  userHidden,
  sizeHidden,
  setUserHidden,
  setColumnOrder,
}: Props): React.JSX.Element => {
  const selectedCount = columns.length - userHidden.length;

  const toggleHiddenColumn = (column: string): void => {
    if (userHidden.includes(column)) {
      setUserHidden(userHidden.filter((c) => c !== column));
    } else {
      setUserHidden([...userHidden, column]);
    }
  };

  const wrapTooltip = (element: ReactElement, column: string): ReactElement => {
    if(!hideableColumns.includes(column)) return (
      <Tooltip
        message={
          <>
            The column cannot be hidden.
          </>
        }
        position="left"
      >
        {element}
      </Tooltip>
    );

    if (!sizeHidden.includes(column)) return element;

    return (
      <Tooltip
        message={
          <>
            Screen is too narrow to fit the column.
            <br />
            Disable columns above or use a bigger screen.
          </>
        }
        position="left"
      >
        {element}
      </Tooltip>
    );
  };

  const moveUp = (index: number) => {
    if (index <= 0) return columns;

    const newColumns = [...columns];
    const temp = newColumns[index - 1];
    newColumns[index - 1] = newColumns[index];
    newColumns[index] = temp;

    setColumnOrder(newColumns);
  }

  const moveDown = (index: number) => {
    if (index >= columns.length - 1) return columns;

    const newColumns = [...columns];
    const temp = newColumns[index + 1];
    newColumns[index + 1] = newColumns[index];
    newColumns[index] = temp;

    setColumnOrder(newColumns);
  }

  return (
    <ContextualMenu
      className={classnames(className, "column-selector-toggle")}
      dropdownProps={{ "aria-label": "columns menu" }}
      position="right"
      toggleClassName="has-icon"
      toggleProps={{
        "aria-label": "Columns selection toggle",
      }}
      toggleLabel={<Icon name="settings" />}
      toggleAppearance="base"
      title="Columns"
    >
      <div className="column-selector-column-list">
        <CheckboxInput
          checked={userHidden.length === 0}
          indeterminate={selectedCount > 0 && selectedCount < columns.length}
          label={`${selectedCount} out of ${columns.length} columns selected`}
          onChange={() => {
            if (userHidden.length > 0) {
              setUserHidden([]);
            } else {
              setUserHidden(hideableColumns);
            }
          }}
        />
        <hr />
        {columns.map((column, i) => (
          <div key={column} className="column-container">
            {wrapTooltip(
              <CheckboxInput
                aria-label={column}
                labelClassName={classnames({
                  "size-hidden": sizeHidden.includes(column),
                })}
                checked={!userHidden.includes(column)}
                label={column}
                onChange={() => {
                  toggleHiddenColumn(column);
                }}
                disabled={sizeHidden.includes(column) || !hideableColumns.includes(column)}
              />,
              column,
            )}
            <div className="order-buttons-container">
              <Button
                onClick={() => moveUp(i)}
                type="button"
                appearance="base"
                hasIcon
                className="u-no-margin--bottom order-button"
                disabled={(i <= 0)}
              >
                <Icon name="chevron-up" className="order-icon"/>
              </Button>
              <Button
                onClick={() => moveDown(i)}
                type="button"
                appearance="base"
                hasIcon
                className="u-no-margin--bottom order-button"
                disabled={(i >= (columns.length - 1))}
              >
                <Icon name="chevron-down" className="order-icon" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ContextualMenu>
  );
};

export default ColumnSelector;
