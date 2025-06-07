"use client";

import React, { useMemo, useState, useEffect } from "react";
import { debounce } from "lodash";
import dynamic from "next/dynamic";
import { useMediaQuery } from "usehooks-ts";
import type { Key } from "@react-types/shared";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { CalendarDate } from "@internationalized/date";
import {
  useDeleteTransaction,
  type TransactionResponseItem,
} from "@/features/transactions/hooks";
import {
  SortDescriptor,
  Selection,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

import { ArrowUp, ArrowDown } from "@/app/icons";
import { Spinner } from "@heroui/spinner";

import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Pagination } from "@heroui/pagination";
import { SearchIcon } from "@heroui/shared-icons";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/theme";
import { useMemoizedCallback } from "@/hooks";
import { parseISO, format } from "date-fns";
import { AmountCell } from "./amount-cell";
import { AccountName } from "@/components/common";

// Temporary fix for hydration error caused by selectionMode="multiple" Table prop
// https://github.com/heroui-inc/heroui/issues/4385
const Table = dynamic(() => import("@heroui/table").then((c) => c.Table), {
  ssr: false,
});

export type ColumnsKey =
  | "createdAt"
  | "amount"
  | "account.name"
  | "account.institution.name"
  | "category.name"
  | "payee"
  | "notes"
  | "actions";

const INITIAL_VISIBLE_COLUMNS: ColumnsKey[] = [
  "createdAt",
  "amount",
  "account.name",
  "account.institution.name",
  "category.name",
  "payee",
  "notes",
  "actions",
];

export const columns = [
  {
    name: "Date",
    uid: "createdAt",
    sortDirection: "ascending",
  },
  {
    name: "Amount",
    uid: "amount",
    sortDirection: "ascending",
  },
  {
    name: "Account",
    uid: "account.name",
    sortDirection: "ascending",
  },
  {
    name: "Institution",
    uid: "account.institution.name",
    sortDirection: "ascending",
  },
  {
    name: "Category",
    uid: "category.name",
    sortDirection: "ascending",
  },
  {
    name: "Payee",
    uid: "payee",
    sortDirection: "ascending",
  },
  {
    name: "Notes",
    uid: "notes",
    sortDirection: "ascending",
  },
  { name: "Actions", uid: "actions" },
];

interface TransactionTableProps {
  onOpenSidebar: (transaction: TransactionResponseItem) => void;
  data?: TransactionResponseItem[] | undefined;
  isLoading: boolean;
  tableSettings: {
    currentPage: number;
    pageSize: number;
    sortBy: {
      column: string;
      direction: "ascending" | "descending";
    };
    globalFilter: string;
    start?: CalendarDate;
    end?: CalendarDate;
  };
  setTableSettings: React.Dispatch<
    React.SetStateAction<{
      currentPage: number;
      pageSize: number;
      sortBy: {
        column: string;
        direction: "ascending" | "descending";
      };
      globalFilter: string;
      start?: CalendarDate;
      end?: CalendarDate;
    }>
  >;
  count: number;
}

export default function TransactionsTable({
  onOpenSidebar,
  isLoading,
  data,
  tableSettings,
  setTableSettings,
  count,
}: TransactionTableProps) {
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [pageQuantity, setPageQuantity] = useState(1);
  const { sortBy, pageSize, currentPage } = tableSettings;
  useEffect(() => {
    setSelectedKeys(new Set([]));
  }, [data]);

  useEffect(() => {
    if (!isLoading) {
      const quantity = Math.ceil(count / pageSize) || 1;
      setPageQuantity(quantity);
    }
  }, [count, pageSize, JSON.stringify(data), isLoading]);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const deleteTransaction = useDeleteTransaction();

  const [deleteCategoriesData, setDeleteCategoriesData] = useState<{
    type: "bulk" | "individual";
    categoriesToDelete: string[];
  }>({
    type: "individual",
    categoriesToDelete: [],
  });
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const isTablet = useMediaQuery("(max-width: 1023px)");

  const handleDelete = useMemoizedCallback(async (payload, onClose) => {
    const { categoriesToDelete: ids, type } = payload;
    await deleteTransaction.mutateAsync(ids);
    if (type === "bulk") {
      setSelectedKeys(new Set());
    } else {
      const newSelectedKeys =
        selectedKeys === "all"
          ? new Set(data?.map((item) => item.id))
          : new Set(selectedKeys);
      ids.forEach((id: string) => {
        newSelectedKeys.delete(id);
      });
      setSelectedKeys(newSelectedKeys);
    }
    onClose();
  });

  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return columns;
    return columns
      .map((item) => {
        if (item.uid === sortBy.column) {
          return {
            ...item,
            sortDirection: sortBy.direction,
          };
        }

        return item;
      })
      .filter((column) => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns, sortBy]);

  const getColumnProps = useMemoizedCallback((columnName) => ({
    onClick: () => handleColumnNameClick(columnName),
  }));

  const renderCell = useMemoizedCallback(
    (transaction: TransactionResponseItem, columnKey: React.Key) => {
      const transactionKey = columnKey as ColumnsKey;
      switch (transactionKey) {
        case "createdAt":
          return (
            <div className="text-nowrap text-small capitalize text-default-foreground">
              <div className="text-default-400 block lg:hidden">
                Transaction date:
              </div>
              {format(parseISO(transaction[transactionKey]), "PP HH:mm")}
            </div>
          );
        case "amount":
          return (
            <>
              <div className="text-default-400 block lg:hidden">Amount:</div>
              <AmountCell
                amount={transaction[transactionKey]}
                currency={transaction.account.currency.name}
              />
            </>
          );
        case "account.name":
          return (
            <>
              <div className="text-default-400 block lg:hidden">Account:</div>
              <AccountName
                name={transaction.account.name}
                last4={transaction.account.last4}
              />
            </>
          );
        case "account.institution.name":
          return (
            <>
              <div className="text-default-400 block lg:hidden">Bank:</div>
              <div className="capitalize text-default-foreground">
                {transaction.account.institution.name}
              </div>
            </>
          );
        case "category.name":
          return (
            <>
              <div className="text-default-400 block lg:hidden">Category:</div>
              <div
                className={cn("capitalize text-default-foreground", {
                  "text-danger": !transaction.category?.name,
                })}
              >
                {transaction.category?.name || "Uncategorized"}
              </div>
            </>
          );
        case "notes":
          return (
            <>
              <div className="text-default-400 block lg:hidden">Notes:</div>
              <div className="text-default-foreground">
                {transaction[transactionKey]}
              </div>
            </>
          );
        case "payee":
          return (
            <>
              <div className="text-default-400 block lg:hidden">Payee:</div>
              <div className="flex items-center gap-x-2 text-default-foreground">
                {transaction?.payee && (
                  <div className="w-5 h-5 rounded-full bg-default-200 flex items-center text-xs justify-center">
                    {transaction?.payee[0]?.toUpperCase()}
                  </div>
                )}
                <div>{transaction[transactionKey]}</div>
              </div>
            </>
          );
        case "actions":
          return (
            <div className="flex items-center justify-end gap-2 flex-col md:flex-row">
              <Button
                isIconOnly={!isTablet}
                size="sm"
                aria-label="edit account"
                variant={isTablet ? "flat" : "light"}
                className={
                  isTablet ? "text-default-400 w-full" : "text-default-400"
                }
                onPress={() => {
                  onOpenSidebar(transaction);
                }}
              >
                <Icon icon="solar:pen-2-outline" width={22} />
              </Button>
              <Button
                isIconOnly={!isTablet}
                size="sm"
                color="danger"
                aria-label="delete account"
                variant={isTablet ? "flat" : "light"}
                className={isTablet ? "w-full" : ""}
                onPress={() => {
                  setDeleteCategoriesData({
                    type: "individual",
                    categoriesToDelete: [transaction.id],
                  });
                  onOpen();
                }}
              >
                <Icon icon="solar:close-circle-bold" width={22} />
              </Button>
            </div>
          );
        default:
          return null;
      }
    }
  );

  const onSearchChange = useMemoizedCallback(
    debounce((value?: string) => {
      setTableSettings((prev) => ({
        ...prev,
        globalFilter: value || "",
        page: 1,
      }));
    }, 500)
  );

  // loadash debaouce function to changes state with delay
  const onSelectionChange = useMemoizedCallback((keys: Selection) => {
    if (keys === "all") {
      setSelectedKeys(keys);
    } else if (keys.size === 0) {
      setSelectedKeys(new Set());
    } else {
      const resultKeys = new Set<Key>();
      keys.forEach((v) => {
        resultKeys.add(v);
      });
      const selectedValue =
        selectedKeys === "all"
          ? new Set(data?.map((item) => String(item.id)))
          : selectedKeys;

      selectedValue.forEach((v) => {
        if (data?.some((item) => String(item.id) === v)) {
          return;
        }
        resultKeys.add(v);
      });
      setSelectedKeys(new Set(resultKeys));
    }
  });

  const topContent = useMemo(() => {
    return (
      <div className="flex items-center gap-4 overflow-auto px-[6px] py-[4px]">
        <div className="flex items-center gap-3 w-full flex-col md:flex-row">
          <div className="flex items-center gap-4 flex-col md:flex-row md:w-auto w-full">
            <Input
              className="min-w-[300px] md:w-auto w-full"
              endContent={
                <SearchIcon className="text-default-400" width={16} />
              }
              placeholder="Search by notes, payee or category"
              size="sm"
              onValueChange={onSearchChange}
            />
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Dropdown closeOnSelect={false}>
                  <DropdownTrigger>
                    <Button
                      className="bg-default-100 text-default-800 w-full md:w-auto"
                      size="sm"
                      startContent={
                        <Icon
                          className="text-default-400"
                          icon="solar:sort-horizontal-linear"
                          width={16}
                        />
                      }
                    >
                      Columns
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    disallowEmptySelection
                    aria-label="Columns"
                    items={columns.filter((c) => !["actions"].includes(c.uid))}
                    selectedKeys={visibleColumns}
                    selectionMode="multiple"
                    onSelectionChange={setVisibleColumns}
                  >
                    {(item) => (
                      <DropdownItem key={item.uid}>{item.name}</DropdownItem>
                    )}
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          </div>

          <Divider className="h-5 hidden md:flex" orientation="vertical" />
          <div className="flex items-center gap-4 w-full md:w-auto md:justify-start justify-between h-8 md:h-auto">
            <div className="whitespace-nowrap text-sm text-default-800">
              {selectedKeys === "all"
                ? "All items selected"
                : `${selectedKeys.size} Selected`}
            </div>

            {(selectedKeys === "all" || selectedKeys.size > 0) && (
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="bg-default-100 text-default-800 w-auto"
                    endContent={
                      <Icon
                        className="text-default-400"
                        icon="solar:alt-arrow-down-linear"
                      />
                    }
                    size="sm"
                    variant="flat"
                  >
                    Selected Actions
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Selected Actions">
                  <DropdownItem
                    key="bulk-delete"
                    onPress={() => {
                      const keys =
                        selectedKeys === "all"
                          ? data?.map((item) => item.id)
                          : (Array.from(selectedKeys) as string[]);
                      setDeleteCategoriesData({
                        type: "bulk",
                        categoriesToDelete: keys ?? [],
                      });
                      onOpen();
                    }}
                  >
                    Bulk delete
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
          </div>
        </div>
      </div>
    );
  }, [
    visibleColumns,
    headerColumns,
    sortBy,
    onSearchChange,
    setVisibleColumns,
    onOpen,
    data,
  ]);

  const bottomContent = useMemo(() => {
    // console.log("@currentPage", currentPage);
    // console.log("@pages", pages);
    return (
      <div className="flex flex-col items-center justify-end px-2 py-2 sm:flex-row">
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={currentPage}
          total={pageQuantity}
          onChange={(page) => {
            setTableSettings((prev) => ({
              ...prev,
              currentPage: page,
            }));
          }}
        />
      </div>
    );
  }, [currentPage, pageQuantity]);

  const handleColumnNameClick = async (column: string) => {
    const newDirection =
      sortBy.direction === "ascending" ? "descending" : "ascending";
    setTableSettings((prev) => ({
      ...prev,
      sortBy: {
        column,
        direction: newDirection,
      },
    }));
  };
  const onSortChange = useMemoizedCallback((sortDescriptor: SortDescriptor) => {
    setTableSettings((prev) => ({
      ...prev,
      sortBy: {
        column: sortDescriptor.column.toString(),
        direction:
          sortDescriptor.direction === "ascending" ? "ascending" : "descending",
      },
    }));
  });

  return (
    <div className="h-full w-full mt-6">
      <Table
        key={`table-tablet-${isTablet}`}
        color="primary"
        isHeaderSticky
        aria-label="Example table with custom cells, pagination and sorting"
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        classNames={{
          td: "before:bg-default-100",
          wrapper: "max-h-96 overflow-auto shadow-none p-0",
          thead: "hidden lg:table-header-group",
          tr: `!shadow-none ${isTablet ? "flex flex-col" : ""}`,
        }}
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        sortDescriptor={sortBy}
        topContent={topContent}
        topContentPlacement="outside"
        onSelectionChange={onSelectionChange}
        onSortChange={onSortChange}
        hideHeader={isTablet}
      >
        <TableHeader columns={headerColumns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "end" : "start"}
              className={cn([
                column.uid === "actions"
                  ? "flex items-center justify-end px-[20px]"
                  : "",
              ])}
            >
              {column.uid !== "actions" ? (
                <div
                  {...getColumnProps(column.uid)}
                  className="flex w-full cursor-pointer items-center"
                >
                  {column.name}
                  {column.sortDirection === "ascending" ? (
                    <ArrowUp className="ml-1 text-default-400" />
                  ) : (
                    <ArrowDown className="ml-1 text-default-400" />
                  )}
                </div>
              ) : (
                column.name
              )}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          loadingContent={<Spinner size="lg" variant="dots" />}
          emptyContent={"No items found"}
          items={data || []}
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="opaque">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {deleteCategoriesData.categoriesToDelete.length > 1
                  ? "Bulk delete"
                  : "Delete"}
              </ModalHeader>
              <ModalBody>
                <p>
                  You are about to delete{" "}
                  <strong>
                    {deleteCategoriesData.categoriesToDelete.length} transaction
                    {deleteCategoriesData.categoriesToDelete.length > 1
                      ? "s"
                      : ""}
                  </strong>
                  . Are you sure you want to proceed?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  data-delete="bulk"
                  isLoading={deleteTransaction.isPending}
                  onPress={() => {
                    handleDelete(deleteCategoriesData, onClose);
                  }}
                >
                  Yes
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
