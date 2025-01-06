"use client";

import React, { useMemo, useRef, useState } from "react";

import type { Key } from "@react-types/shared";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/dropdown";
import {
  useDeleteTransaction,
  type TransactionResponseItem,
} from "@/features/transactions/hooks";
import {
  Table,
  SortDescriptor,
  Selection,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/table";
import {
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import { ArrowUp, ArrowDown, Edit, Delete } from "@/app/icons";
import { Spinner } from "@nextui-org/spinner";
import { Input } from "@nextui-org/input";
import { Button, useButton } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Tooltip } from "@nextui-org/tooltip";
import { Pagination } from "@nextui-org/pagination";
import { SearchIcon } from "@nextui-org/shared-icons";
import { Icon } from "@iconify/react";
import { cn } from "@nextui-org/theme";
import { useMemoizedCallback } from "@/hooks";
import { parseISO, format } from "date-fns";
import { AmountCell } from "./amount-cell";

export type ColumnsKey =
  | "createdAt"
  | "amount"
  | "account.name"
  | "category.name"
  | "payee"
  | "notes"
  | "actions";

const INITIAL_VISIBLE_COLUMNS: ColumnsKey[] = [
  "createdAt",
  "amount",
  "account.name",
  "category.name",
  "payee",
  "notes",
  "actions",
];

export const columns = [
  {
    name: "Date",
    uid: "createdAt",
    info: "Transaction date",
    sortDirection: "ascending",
  },
  {
    name: "Amount",
    uid: "amount",
  },
  {
    name: "Account",
    uid: "account.name",
  },
  {
    name: "Category",
    uid: "category.name",
  },
  {
    name: "Payee",
    uid: "payee",
  },
  {
    name: "Notes",
    uid: "notes",
  },
  { name: "Actions", uid: "actions" },
];

interface CategoriesTableProps {
  transactions: TransactionResponseItem[] | [];
  isLoading: boolean;
  onOpenSidebar: (transaction: TransactionResponseItem) => void;
}

export default function TransactionsTable({
  transactions = [],
  isLoading,
  onOpenSidebar,
}: CategoriesTableProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const deleteTransaction = useDeleteTransaction();
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
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
  const [rowsPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });

  const handleDelete = useMemoizedCallback(async (payload, onClose) => {
    const { categoriesToDelete: ids, type } = payload;
    await deleteTransaction.mutateAsync(ids);
    if (type === "bulk") {
      setSelectedKeys(new Set());
    } else {
      const newSelectedKeys =
        selectedKeys === "all"
          ? new Set(transactions.map((item) => item.id))
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
        if (item.uid === sortDescriptor.column) {
          return {
            ...item,
            sortDirection: sortDescriptor.direction,
          };
        }

        return item;
      })
      .filter((column) => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns, sortDescriptor]);

  const filteredItems = useMemo(() => {
    let filteredTransactions = transactions ? [...transactions] : [];
    if (filterValue) {
      filteredTransactions = filteredTransactions.filter(
        (transaction) =>
          transaction?.notes
            ?.toLowerCase()
            .includes(filterValue.toLowerCase()) ||
          transaction?.payee
            ?.toLowerCase()
            .includes(filterValue.toLowerCase()) ||
          transaction?.category?.name
            ?.toLowerCase()
            .includes(filterValue.toLowerCase())
      );
    }
    return filteredTransactions;
  }, [filterValue, transactions]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort(
      (a: TransactionResponseItem, b: TransactionResponseItem) => {
        const col = sortDescriptor.column as keyof TransactionResponseItem;

        let first = a[col] as string;
        let second = b[col] as string;

        const cmp = first < second ? -1 : first > second ? 1 : 0;

        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      }
    );
  }, [sortDescriptor, items]);

  const filterSelectedKeys = useMemo(() => {
    if (selectedKeys === "all") return selectedKeys;
    let resultKeys = new Set<Key>();

    if (filterValue) {
      filteredItems.forEach((item) => {
        const stringId = String(item.id);

        if ((selectedKeys as Set<string>).has(stringId)) {
          resultKeys.add(stringId);
        }
      });
    } else {
      resultKeys = selectedKeys;
    }

    return resultKeys;
  }, [selectedKeys, filteredItems, filterValue]);

  const editRef = useRef<HTMLButtonElement | null>(null);
  const deleteRef = useRef<HTMLButtonElement | null>(null);
  const { getButtonProps: getEditProps } = useButton({ ref: editRef });
  const { getButtonProps: getDeleteProps } = useButton({ ref: deleteRef });
  const getNameInfoProps = useMemoizedCallback(() => ({
    onClick: handleNameClick,
  }));

  const renderCell = useMemoizedCallback(
    (transaction: TransactionResponseItem, columnKey: React.Key) => {
      const transactionKey = columnKey as ColumnsKey;
      switch (transactionKey) {
        case "createdAt":
          return (
            <div className="text-nowrap text-small capitalize text-default-foreground">
              {format(parseISO(transaction[transactionKey]), "PP HH:mm")}
            </div>
          );
        case "amount":
          return (
            <AmountCell
              amount={transaction[transactionKey]}
              currency={transaction.account.currency.name}
            />
          );
        case "account.name":
          return (
            <div className="capitalize text-default-foreground">
              {transaction.account.name}
            </div>
          );
        case "category.name":
          return (
            <div
              className={cn("capitalize text-default-foreground", {
                "text-danger": !transaction.category?.name,
              })}
            >
              {transaction.category?.name || "Uncategorized"}
            </div>
          );
        case "notes":
        case "payee":
          return (
            <div className=" text-default-foreground">
              {transaction[transactionKey]}
            </div>
          );
        case "actions":
          return (
            <div className="flex items-center justify-end gap-2">
              <Edit
                {...getEditProps()}
                className="cursor-pointer text-default-400"
                height={18}
                width={18}
                onClick={() => {
                  onOpenSidebar(transaction);
                }}
              />
              <div className="text-danger">
                <Delete
                  {...getDeleteProps()}
                  className="cursor-pointer"
                  height={18}
                  width={18}
                  onClick={() => {
                    setDeleteCategoriesData({
                      type: "individual",
                      categoriesToDelete: [transaction.id],
                    });
                    onOpen();
                  }}
                />
              </div>
            </div>
          );
        default:
          return null;
      }
    }
  );

  const onSearchChange = useMemoizedCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  });

  const onSelectionChange = useMemoizedCallback((keys: Selection) => {
    if (keys === "all") {
      if (filterValue) {
        const resultKeys = new Set(
          filteredItems.map((item) => String(item.id))
        );

        setSelectedKeys(resultKeys);
      } else {
        setSelectedKeys(keys);
      }
    } else if (keys.size === 0) {
      setSelectedKeys(new Set());
    } else {
      const resultKeys = new Set<Key>();

      keys.forEach((v) => {
        resultKeys.add(v);
      });
      const selectedValue =
        selectedKeys === "all"
          ? new Set(filteredItems.map((item) => String(item.id)))
          : selectedKeys;

      selectedValue.forEach((v) => {
        if (items.some((item) => String(item.id) === v)) {
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
              value={filterValue}
              onValueChange={onSearchChange}
            />
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      className="bg-default-100 text-default-800 w-full md:w-auto"
                      size="sm"
                      startContent={
                        <Icon
                          className="text-default-400"
                          icon="solar:sort-linear"
                          width={16}
                        />
                      }
                    >
                      Sort
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Sort"
                    items={headerColumns.filter(
                      (c) => !["actions", "teams"].includes(c.uid)
                    )}
                  >
                    {(item) => (
                      <DropdownItem
                        key={item.uid}
                        onPress={() => {
                          setSortDescriptor({
                            column: item.uid,
                            direction:
                              sortDescriptor.direction === "ascending"
                                ? "descending"
                                : "ascending",
                          });
                        }}
                      >
                        {item.name}
                      </DropdownItem>
                    )}
                  </DropdownMenu>
                </Dropdown>
              </div>
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
              {filterSelectedKeys === "all"
                ? "All items selected"
                : `${filterSelectedKeys.size} Selected`}
            </div>

            {(filterSelectedKeys === "all" || filterSelectedKeys.size > 0) && (
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
                        filterSelectedKeys === "all"
                          ? transactions?.map((item) => item.id)
                          : (Array.from(filterSelectedKeys) as string[]);
                      setDeleteCategoriesData({
                        type: "bulk",
                        categoriesToDelete: keys,
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
    filterValue,
    visibleColumns,
    filterSelectedKeys,
    headerColumns,
    sortDescriptor,
    onSearchChange,
    setVisibleColumns,
  ]);

  const bottomContent = useMemo(() => {
    return (
      <div className="flex flex-col items-center justify-end px-2 py-2 sm:flex-row">
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>
    );
  }, [filterSelectedKeys, page, pages, filteredItems.length]);

  const handleNameClick = useMemoizedCallback(() => {
    setSortDescriptor({
      column: "name",
      direction:
        sortDescriptor.direction === "ascending" ? "descending" : "ascending",
    });
  });

  return (
    <div className="h-full w-full mt-6">
      <Table
        color="primary"
        isHeaderSticky
        aria-label="Example table with custom cells, pagination and sorting"
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        classNames={{
          td: "before:bg-default-100",
          wrapper: "max-h-96 overflow-auto shadow-none p-0",
          tr: "!shadow-none",
        }}
        selectedKeys={filterSelectedKeys}
        selectionMode="multiple"
        sortDescriptor={sortDescriptor}
        topContent={topContent}
        topContentPlacement="outside"
        onSelectionChange={onSelectionChange}
        onSortChange={setSortDescriptor}
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
              {column.uid === "name" ? (
                <div
                  {...getNameInfoProps()}
                  className="flex w-full cursor-pointer items-center"
                >
                  {column.name}
                  {column.sortDirection === "ascending" ? (
                    <ArrowUp className="ml-1 text-default-400" />
                  ) : (
                    <ArrowDown className="ml-1 text-default-400" />
                  )}
                </div>
              ) : column.info ? (
                <div className="flex min-w-[108px] items-center justify-between">
                  {column.name}
                  <Tooltip content={column.info}>
                    <Icon
                      className="text-default-300"
                      height={16}
                      icon="solar:info-circle-linear"
                      width={16}
                    />
                  </Tooltip>
                </div>
              ) : (
                column.name
              )}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          loadingContent={<Spinner className="mt-4" label="Loading..." />}
          emptyContent={"Bummer! No items found"}
          items={sortedItems}
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
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
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
