"use client";

import { useState } from "react";
import TransactionsHistory from "./transactions-history";
import UploadTransactions from "./upload-transactions";

enum VIEW_VARIANTS {
  LIST = "list",
  IMPORT = "import",
}

const TransactionsCard = () => {
  const [view, setView] = useState<VIEW_VARIANTS>(VIEW_VARIANTS.LIST);
  const [importData, setImportData] = useState({
    data: [],
    errors: [],
    meta: {},
  });
  const onCancelImport = () => {
    setView(VIEW_VARIANTS.LIST);
    // setImportData({
    //   data: [],
    //   errors: [],
    //   meta: {},
    // });
  };
  const onSubmit = (data: any) => {
    console.log("onSubmit", data);
  };
  if (view === VIEW_VARIANTS.IMPORT) {
    return (
      <UploadTransactions
        data={importData.data}
        onCancel={onCancelImport}
        onUpload={(data) => {
          setImportData(data);
        }}
      />
    );
  }

  return (
    <TransactionsHistory
      onBulkUpload={() => {
        setView(VIEW_VARIANTS.IMPORT);
      }}
    />
  );
};
export default TransactionsCard;
