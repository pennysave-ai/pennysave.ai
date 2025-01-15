"use client";

import { useState, useCallback } from "react";
import { Card } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { format, parse } from "date-fns";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/table";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { useCSVReader } from "react-papaparse";
import { Icon } from "@iconify/react";
import { cn } from "@nextui-org/theme";

import { useGetAccounts } from "@/features/accounts/hooks";
import {
  CreateTransaction,
  useBulkCreateTransactions,
} from "@/features/transactions/hooks";
import { convertAmountToMilliunits } from "@/lib/utils";
import HeaderDropdown from "./header-dropdown";
import RowSteps from "./row-steps";

type CSVData = { [key: string]: string }[];

interface UploadTransactionsProps {
  data: CSVData;
  onCancel: () => void;
  onUpload: (data: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const dateFormat = "yyyy-MM-dd HH:mm:ss.SSSxxx";
const csvFormat = "yyyy-MM-dd HH:mm:ss";

const requiredOptions = ["amount", "date", "payee"];

interface SelectedColumnsState {
  [key: string]: string | null;
}

// TODO add a paywall for this feature
// TODO add error message if the wrong file is uploaded
// TODO Add a rows lmitation for uploading though the test showed that it can handle 20000 rows
// it's might be risky to upload a large file
export default function UploadTransactions({
  data,
  onCancel,
  onUpload,
}: UploadTransactionsProps) {
  const { CSVReader } = useCSVReader();
  const [zoneHover, setZoneHover] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedColumns, setSelectedColumns] = useState<SelectedColumnsState>(
    {}
  );
  const [dataErrors, setDataErrors] = useState("");
  const { data: accountsData } = useGetAccounts();
  const createTransactions = useBulkCreateTransactions();
  const [selectedAccount, setSelectedAccount] = useState("");
  const [mappedData, setMappedData] = useState<CreateTransaction[]>([]);
  const body = data.slice(0, 20);

  const onChange = useCallback(
    (columnIndex: number, selectedValue: string | null) => {
      // if column index is null remove previpusly selected column
      if (selectedValue === null) {
        setSelectedColumns((prevSelected) => {
          const newSelected = { ...prevSelected };
          delete newSelected[columnIndex];
          return newSelected;
        });
        return;
      }
      setSelectedColumns((prevSelected) => {
        return {
          ...prevSelected,
          [columnIndex]: selectedValue,
        };
      });
    },
    []
  );

  const mapData = useCallback(
    async (
      selectedColumns: SelectedColumnsState,
      data: { [key: string]: string }[]
    ) => {
      try {
        const mappedData = await asyncMapData(selectedColumns, data);
        setMappedData(mappedData);
      } catch (error) {
        if (error instanceof RangeError) {
          setDataErrors(
            "Picked date is not in the correct format, the correct format is yyyy-MM-dd HH:mm:ss"
          );
          return;
        }
        return;
      }
      setCurrentStep(2);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const asyncMapData = async (
    selectedColumns: SelectedColumnsState,
    data: CSVData
  ) => {
    const mappedData = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = {};
      for (const [key, value] of Object.entries(selectedColumns)) {
        switch (value) {
          case "amount":
            const sanitizedStr = row[key].replace(/[$,]/g, "");
            const amount = parseFloat(sanitizedStr);
            obj[value] = convertAmountToMilliunits(amount);
            break;
          case "date":
            obj["createdAt"] = format(
              parse(row[key], csvFormat, new Date()),
              dateFormat
            );
            break;
          default:
            if (value) obj[value] = row[key];
        }
      }
      mappedData.push(obj);
    }
    return mappedData;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onUploadAccepted = useCallback((results: any) => {
    setZoneHover(false);
    setCurrentStep(1);
    const body = [];
    const data = results.data;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const obj: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
      for (let j = 0; j < row.length; j++) {
        obj[j] = row[j];
      }
      body.push(obj);
    }
    onUpload({
      data: [...body],
      errors: results.errors,
      meta: results.meta,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async (
    mappedData: CreateTransaction[],
    selectedAccount: string
  ) => {
    const dataWithAccount = [];
    for (let i = 0; i < mappedData.length; i++) {
      const obj = {
        ...mappedData[i],
        accountId: selectedAccount,
      };
      dataWithAccount.push(obj);
    }
    try {
      await createTransactions.mutateAsync(dataWithAccount);
    } catch (error) {
      // TODO: handle errors
      console.log("Error", error);
    }
  };

  const uploadData = useCallback(
    async (mappedData: CreateTransaction[], selectedAccount: string) => {
      try {
        await handleUpload(mappedData, selectedAccount);
        setCurrentStep(3);
      } catch (error) {
        // TODO: handle errors
        console.log("Error", error);
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="px-4 flex w-full flex-col items-center -mt-[72px] lg:-mt-18">
      <Card className="w-full p-8 max-w-screen-2xl">
        <div className="flex sm:flex-row flex-col justify-between">
          <div className="flex items-center sm:mb-0 mb-4">
            <h1 className="text-2xl font-[700] leading-[32px]">
              Bulk upload Transactions
            </h1>
          </div>
          <div className="gap-3 flex sm:flex-row flex-col">
            {currentStep === 1 && (
              <Button
                color="primary"
                isDisabled={
                  !requiredOptions.every((option) =>
                    Object.values(selectedColumns).includes(option)
                  )
                }
                onPress={() => mapData(selectedColumns, data)}
              >
                Next
              </Button>
            )}
            {currentStep !== 3 && (
              <Button color="danger" onPress={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 mt-4">
          <RowSteps
            color="primary"
            currentStep={currentStep}
            steps={[
              {
                title: "Select or drag and drop your file",
              },
              {
                title: "Review and map columns",
              },
              {
                title: "Upload data",
              },
            ]}
          />
        </div>
        {currentStep === 0 && (
          <CSVReader
            onUploadAccepted={onUploadAccepted}
            onDragOver={(event: DragEvent) => {
              event.preventDefault();
              setZoneHover(true);
            }}
            onDragLeave={(event: DragEvent) => {
              event.preventDefault();
              setZoneHover(false);
            }}
          >
            {(
              { getRootProps }: any // eslint-disable-line @typescript-eslint/no-explicit-any
            ) => (
              <div
                className={cn(
                  "mt-4 flex items-center justify-center h-32 border-dashed border-2 border-default-200 rounded-lg bg-default-100 text-default-400 cursor-pointer",
                  {
                    "shadow-inner": zoneHover,
                  }
                )}
                {...getRootProps()}
              >
                <div className="flex items-center gap-2">
                  <Icon icon="solar:file-download-bold" width={44} />
                  <div>Drop CSV file here or click to upload</div>
                </div>
              </div>
            )}
          </CSVReader>
        )}
        {currentStep === 1 && (
          <>
            {dataErrors && (
              <div className="text-danger text-sm mt-3">{dataErrors}</div>
            )}
            <div className="text-sm mt-3 flex items-center gap-1">
              Please select the following required columns:
              {requiredOptions.map((option: string, i) => (
                <div
                  key={i}
                  className={cn("capitalize", {
                    "text-primary":
                      Object.values(selectedColumns).includes(option),
                  })}
                >
                  {option}
                </div>
              ))}
            </div>
            <Table
              color="primary"
              isHeaderSticky
              bottomContent={
                <div>
                  {data.length > 20 && (
                    <div className="text-default-400 text-sm">
                      {`Showing only 20 of ${data.length} records
                `}
                    </div>
                  )}
                </div>
              }
              bottomContentPlacement="outside"
              classNames={{
                wrapper: "max-h-96 overflow-auto shadow-none p-0 mt-4",
                tr: "!shadow-none",
              }}
              selectionMode="none"
              topContentPlacement="outside"
            >
              <TableHeader>
                {Object.keys(data[0]).map((_, i) => {
                  return (
                    <TableColumn key={i}>
                      <HeaderDropdown
                        onChange={onChange}
                        columnIndex={i}
                        disabledKeys={Object.values(selectedColumns).filter(
                          (value) => value !== null
                        )}
                      />
                    </TableColumn>
                  );
                })}
              </TableHeader>
              <TableBody emptyContent="Bummer! No items found">
                {body.map((item, i) => (
                  <TableRow key={i}>
                    {(columnKey) => {
                      return <TableCell>{item[columnKey]}</TableCell>;
                    }}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        {currentStep === 2 && (
          <div className="flex justify-center mt-4">
            <div className="bg-default-100 p-6 rounded-lg max-w-md w-full flex flex-col gap-y-6">
              <h4 className="text-default-600 text-sm">
                Please select an account with which these transactions will be
                associated. Please note: all transactions will be set as
                Uncategorized.
              </h4>
              <Autocomplete
                isRequired
                onSelectionChange={(id) => {
                  if (id) setSelectedAccount(id as string);
                }}
                defaultItems={
                  accountsData?.data.map(({ id, name, currency }) => ({
                    key: id,
                    label: `${name} (${currency})`,
                  })) || []
                }
                label="Account"
                variant="bordered"
              >
                {(item) => (
                  <AutocompleteItem key={item.key}>
                    {item.label}
                  </AutocompleteItem>
                )}
              </Autocomplete>
              <Button
                color="primary"
                className="w-full"
                isLoading={createTransactions.isPending}
                isDisabled={!selectedAccount || createTransactions.isPending}
                onPress={() => uploadData(mappedData, selectedAccount)}
              >
                Upload
              </Button>
            </div>
          </div>
        )}
        {currentStep === 3 && (
          <div className="flex justify-center mt-4">
            <div className="bg-default-100 p-6 rounded-lg max-w-md w-full flex flex-col gap-y-6 items-center">
              <h4 className="text-default-600 text-sm">
                Success! Your transactions have been successfully uploaded.
              </h4>
              <div className="text-primary">
                <Icon icon="solar:check-circle-linear" width={48} />
              </div>
              <Button color="primary" className="w-full" onPress={onCancel}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
