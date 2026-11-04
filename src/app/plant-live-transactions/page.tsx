
"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";



const transactions = [
  {
    passNo: "PASS1001",
    transNo: "TRN1001",
    rfNo: "RF001",
    truckNo: "TN01AB1234",
    productCode: "CEM001",
    productDesc: "OPC Cement",
    transporterCode: "T001",
    transporterDesc: "ABC Transport",
    firstWt: "28500",
    firstWtDate: "30-10-2026",
    firstWtTime: "09:15 AM",
  },
  {
    passNo: "PASS1002",
    transNo: "TRN1002",
    rfNo: "RF002",
    truckNo: "TN02CD5678",
    productCode: "CEM002",
    productDesc: "PPC Cement",
    transporterCode: "T002",
    transporterDesc: "XYZ Logistics",
    firstWt: "31200",
    firstWtDate: "30-10-2026",
    firstWtTime: "09:25 AM",
  },
  {
    passNo: "PASS1003",
    transNo: "TRN1003",
    rfNo: "RF003",
    truckNo: "TN03EF9012",
    productCode: "CEM001",
    productDesc: "OPC Cement",
    transporterCode: "T001",
    transporterDesc: "ABC Transport",
    firstWt: "29800",
    firstWtDate: "30-10-2026",
    firstWtTime: "09:40 AM",
  },
];

const allColumns = [
  "Task",
  "S.No.",
  "Trans. No.",
  "RF No",
  "Truck No.",
  "Product Code",
  "Product Desc.",
  "Transporter Code",
  "Transporter Desc.",
  "First Wt",
  "First Wt Date",
  "First Wt Time",
];





export default function PlantLiveTransactionsPage() {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("1");

  const [openTaskFor, setOpenTaskFor] = useState<string | null>(null);

  const [replaceCardTransaction, setReplaceCardTransaction] =
    useState<(typeof transactions)[number] | null>(null);

  const [rfCode, setRfCode] = useState("");
  const [message, setMessage] = useState("");


const [approveTransaction, setApproveTransaction] =
  useState<(typeof transactions)[number] | null>(null);


const [approvalMessage, setApprovalMessage] = useState("");
const [approvalLoading, setApprovalLoading] = useState(false);


  const [showColumns, setShowColumns] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    ...allColumns,
  ]);

  const filteredTransactions = transactions.filter((item) =>
    Object.values(item).some((value) =>
      value.toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / pageSize)
  );

  const startIndex = (currentPage - 1) * pageSize;

  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + pageSize
  );


  const [approvalDetails, setApprovalDetails] = useState({
  TruckNumber: "",
  Pass_no: "",
  failure_date_time: "",
  expected_weight: "",
  Actual_net_weight: "",
  Allow_wt_lower: "",
  Allow_wt_higher: "",
});

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredTransactions.map((item, index) => {
      const row: Record<string, string | number> = {};

      if (visibleColumns.includes("Task")) row["Task"] = "Actions";
      if (visibleColumns.includes("S.No.")) row["S.No."] = index + 1;
      if (visibleColumns.includes("Trans. No."))
        row["Trans. No."] = item.transNo;
      if (visibleColumns.includes("RF No")) row["RF No"] = item.rfNo;
      if (visibleColumns.includes("Truck No."))
        row["Truck No."] = item.truckNo;
      if (visibleColumns.includes("Product Code"))
        row["Product Code"] = item.productCode;
      if (visibleColumns.includes("Product Desc."))
        row["Product Desc."] = item.productDesc;
      if (visibleColumns.includes("Transporter Code"))
        row["Transporter Code"] = item.transporterCode;
      if (visibleColumns.includes("Transporter Desc."))
        row["Transporter Desc."] = item.transporterDesc;
      if (visibleColumns.includes("First Wt"))
        row["First Wt"] = item.firstWt;
      if (visibleColumns.includes("First Wt Date"))
        row["First Wt Date"] = item.firstWtDate;
      if (visibleColumns.includes("First Wt Time"))
        row["First Wt Time"] = item.firstWtTime;

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, "Plant_Live_Transactions.xlsx");
  };

  // Export to PDF
  const exportToPDF = () => {
    const headers = allColumns.filter((column) =>
      visibleColumns.includes(column)
    );

    const body = filteredTransactions.map((item, index) => {
      const values: Record<string, string | number> = {
        Task: "Actions",
        "S.No.": index + 1,
        "Trans. No.": item.transNo,
        "RF No": item.rfNo,
        "Truck No.": item.truckNo,
        "Product Code": item.productCode,
        "Product Desc.": item.productDesc,
        "Transporter Code": item.transporterCode,
        "Transporter Desc.": item.transporterDesc,
        "First Wt": item.firstWt,
        "First Wt Date": item.firstWtDate,
        "First Wt Time": item.firstWtTime,
      };

      return headers.map((column) => values[column]);
    });

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(16);
    doc.text("Plant Live Transactions", 14, 15);

    doc.setFontSize(9);
    doc.text(`Total Records: ${filteredTransactions.length}`, 14, 22);

    autoTable(doc, {
      head: [headers],
      body,
      startY: 28,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [111, 80, 56],
        textColor: [255, 255, 255],
      },
      margin: {
        left: 10,
        right: 10,
      },
    });

    doc.save("Plant_Live_Transactions.pdf");
  };

  // Get RF card number
  const handleGetRFCard = async () => {
    setMessage("");

    try {
      const response = await fetch("/checkinout/GetTag", {
        method: "POST",
      });

      const responseData = await response.text();
      const result = JSON.parse(responseData);

      if (result.title === "success") {
        setRfCode(result.message);
      } else {
        setMessage(result.message || "Unable to get RF card number.");
      }
    } catch {
      setMessage("GetTag endpoint is not connected yet.");
    }
  };

  // Replace RF card
  const handleReplaceCard = async () => {
    if (!replaceCardTransaction) return;

    if (!rfCode.trim()) {
      setMessage("Please enter the RF card number.");
      return;
    }

    setMessage("");

    try {
      const response = await fetch("/checkinout/updateRfCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          PASS_NO: replaceCardTransaction.passNo,
          RF_CODE: rfCode,
        }),
      });

      const responseData = await response.text();
      const result = JSON.parse(responseData);

      setMessage(result.message || "Request completed.");
    } catch {
      setMessage("updateRfCode endpoint is not connected yet.");
    }
  };

// Approve Weight
async function handleApproveWeight(transaction: (typeof transactions)[number]) {
  setApproveTransaction(transaction);
  setApprovalLoading(true);
  setApprovalMessage("");

  try {
    const response = await fetch("/checkinout/ApproveWtForm", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        PASS_NO: transaction.passNo,
      }),
    });

    const html = await response.text();
    const parsedHtml = new DOMParser().parseFromString(html, "text/html");

    const getValue = (id: string) =>
      parsedHtml.getElementById(id)?.getAttribute("value") || "";

    setApprovalDetails({
      TruckNumber: getValue("TruckNumber"),
      Pass_no: getValue("Pass_no"),
      failure_date_time: getValue("failure_date_time"),
      expected_weight: getValue("expected_weight"),
      Actual_net_weight: getValue("Actual_net_weight"),
      Allow_wt_lower: getValue("Allow_wt_lower"),
      Allow_wt_higher: getValue("Allow_wt_higher"),
    });
  } catch {
    setApprovalMessage("Unable to load approval details.");
  } finally {
    setApprovalLoading(false);
  }
}

// Approval Status
const updateApprovalStatus = async (status: "Y" | "R") => {
  if (!approveTransaction) return;

  setApprovalMessage("");

  try {
    const response = await fetch("/checkinout/updateApproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        PASS_NO: approveTransaction.passNo,
        status,
      }),
    });

    const result = await response.json();

    setApprovalMessage(result.message || "Request completed.");
  } catch {
    setApprovalMessage(
      "updateApproval endpoint is not connected yet."
    );
  }
};

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold">
            Plant Live Transactions
          </h1>
          <p className="mt-1 text-sm text-[#786B5E]">
            View and manage pending plant transactions.
          </p>
        </div>

        {/* Table section */}
        <div className="rounded-xl border border-[#E3D6C5] bg-[#FFFCF8] p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Pending Transactions</h2>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={exportToExcel}
                className="rounded-lg bg-[#2F7654] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Export Excel
              </button>

              <button
                onClick={exportToPDF}
                className="rounded-lg bg-[#B5473C] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Export PDF
              </button>

              <button
                onClick={() => setShowColumns(!showColumns)}
                className="rounded-lg border border-[#E3D6C5] px-4 py-2 text-sm"
              >
                Columns ⚙
              </button>

              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                  setGoToPage("1");
                }}
                className="w-full rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-4 py-2 text-sm sm:w-72"
              />
            </div>
          </div>

          {/* Show / Hide columns */}
          {showColumns && (
            <div className="mb-5 rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] p-4">
              <div className="mb-3 flex justify-between">
                <h3 className="text-sm font-semibold">
                  Show / Hide Columns
                </h3>
                <button onClick={() => setShowColumns(false)}>
                  Close ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {allColumns.map((column) => (
                  <label
                    key={column}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(column)}
                      onChange={(e) => {
                        setVisibleColumns((previous) =>
                          e.target.checked
                            ? [...previous, column]
                            : previous.filter((item) => item !== column)
                        );
                      }}
                    />
                    {column}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Transactions table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="bg-[#EEE5D8] text-[#3B2D20]">
                <tr>
                  {allColumns
                    .filter((heading) =>
                      visibleColumns.includes(heading)
                    )
                    .map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 font-semibold"
                      >
                        {heading}
                      </th>
                    ))}
                </tr>
              </thead>

              <tbody>
                {paginatedTransactions.map((item, index) => (
                  <tr
                    key={item.transNo}
                    className="border-b border-[#E3D6C5] hover:bg-[#F6F2EA]"
                  >
                    {visibleColumns.includes("Task") && (
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenTaskFor(
                                openTaskFor === item.transNo
                                  ? null
                                  : item.transNo
                              )
                            }
                            className="rounded-lg border border-[#E3D6C5] px-3 py-1.5 text-sm hover:bg-[#EEE5D8]"
                          >
                            Task ▼
                          </button>

                          {openTaskFor === item.transNo && (
                            <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-lg border border-[#E3D6C5] bg-white py-1 shadow-lg">
                              <button
                                onClick={() => {
                                  setReplaceCardTransaction(item);
                                  setRfCode("");
                                  setMessage("");
                                  setOpenTaskFor(null);
                                }}
                                className="block w-full px-4 py-2 text-left text-sm hover:bg-[#F6F2EA]"
                              >
                                Replace Card
                              </button>

                                <button
                                    onClick={() => handleApproveWeight(item)}
                                    className="block w-full px-4 py-2 text-left text-sm hover:bg-[#F6F2EA]">
                                    Approve Weight
                                </button>

                             </div>
                          )}
                        </div>
                      </td>
                    )}

                    {visibleColumns.includes("S.No.") && (
                      <td className="px-4 py-3">
                        {startIndex + index + 1}
                      </td>
                    )}

                    {visibleColumns.includes("Trans. No.") && (
                      <td className="px-4 py-3">{item.transNo}</td>
                    )}

                    {visibleColumns.includes("RF No") && (
                      <td className="px-4 py-3">{item.rfNo}</td>
                    )}

                    {visibleColumns.includes("Truck No.") && (
                      <td className="px-4 py-3">{item.truckNo}</td>
                    )}

                    {visibleColumns.includes("Product Code") && (
                      <td className="px-4 py-3">{item.productCode}</td>
                    )}

                    {visibleColumns.includes("Product Desc.") && (
                      <td className="px-4 py-3">{item.productDesc}</td>
                    )}

                    {visibleColumns.includes("Transporter Code") && (
                      <td className="px-4 py-3">{item.transporterCode}</td>
                    )}

                    {visibleColumns.includes("Transporter Desc.") && (
                      <td className="px-4 py-3">{item.transporterDesc}</td>
                    )}

                    {visibleColumns.includes("First Wt") && (
                      <td className="px-4 py-3">{item.firstWt}</td>
                    )}

                    {visibleColumns.includes("First Wt Date") && (
                      <td className="px-4 py-3">{item.firstWtDate}</td>
                    )}

                    {visibleColumns.includes("First Wt Time") && (
                      <td className="px-4 py-3">{item.firstWtTime}</td>
                    )}
                  </tr>
                ))}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={Math.max(1, visibleColumns.length)}
                      className="px-4 py-8 text-center"
                    >
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#786B5E]">
              <span>
                Showing{" "}
                {filteredTransactions.length === 0
                  ? 0
                  : startIndex + 1}{" "}
                to{" "}
                {Math.min(
                  startIndex + pageSize,
                  filteredTransactions.length
                )}{" "}
                of {filteredTransactions.length} entries
              </span>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                  setGoToPage("1");
                }}
                className="rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-3 py-2"
              >
                {[10, 20, 50, 100, 200, 500, 1000, 5000].map(
                  (size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const nextPage = Math.max(1, currentPage - 1);
                  setCurrentPage(nextPage);
                  setGoToPage(String(nextPage));
                }}
                disabled={currentPage === 1}
                className="rounded-lg border border-[#E3D6C5] px-3 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>

              <span className="px-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => {
                  const nextPage = Math.min(
                    totalPages,
                    currentPage + 1
                  );
                  setCurrentPage(nextPage);
                  setGoToPage(String(nextPage));
                }}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-[#E3D6C5] px-3 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>

              <input
                type="number"
                min="1"
                max={totalPages}
                value={goToPage}
                onChange={(e) => setGoToPage(e.target.value)}
                className="w-16 rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-2 py-2 text-sm"
              />

              <button
                onClick={() => {
                  const page = Number(goToPage);

                  if (
                    Number.isInteger(page) &&
                    page >= 1 &&
                    page <= totalPages
                  ) {
                    setCurrentPage(page);
                  }
                }}
                className="rounded-lg bg-[#6F5038] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5A402D]"
              >
                Go
              </button>
            </div>
          </div>
        </div>

        {/* Replace Card modal */}
        {replaceCardTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-[#FFFCF8] p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#3B2D20]">
                  Change RF card for Pass No:{" "}
                  {replaceCardTransaction.passNo}
                </h2>

                <button
                  onClick={() => setReplaceCardTransaction(null)}
                  className="text-xl text-[#786B5E]"
                >
                  ×
                </button>
              </div>

              <label className="mb-2 block text-sm font-semibold">
                New RF Card No
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={rfCode}
                  onChange={(e) => setRfCode(e.target.value)}
                  placeholder="Enter RF card number"
                  className="min-w-0 flex-1 rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-3 py-2 text-sm"
                />

                <button
                  onClick={handleGetRFCard}
                  className="rounded-lg bg-[#6F5038] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5A402D]"
                >
                  Get
                </button>
              </div>

              {message && (
                <p className="mt-3 text-sm text-[#B5473C]">
                  {message}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setReplaceCardTransaction(null);
                    setMessage("");
                  }}
                  className="rounded-lg border border-[#E3D6C5] px-4 py-2 text-sm"
                >
                  Close
                </button>

                <button
                  onClick={handleReplaceCard}
                  className="rounded-lg bg-[#6F5038] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5A402D]"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        )}

{/* Approve Weight modal */}
{approveTransaction && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-2xl rounded-xl bg-[#FFFCF8] p-6 shadow-xl">

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#3B2D20]">
          Approve weight for {approveTransaction.passNo}
        </h2>

        <button
          onClick={() => {
            setApproveTransaction(null);
            setApprovalMessage("");
          }}
          className="text-xl text-[#786B5E]"
        >
          ×
        </button>
      </div>

      {approvalLoading && (
        <p className="py-6 text-center text-sm text-[#786B5E]">
          Loading approval details...
        </p>
      )}

     {!approvalLoading && (
  <div className="space-y-3">
    {([
      ["Truck No", "TruckNumber"],
      ["Pass No", "Pass_no"],
      ["Transaction Date time", "failure_date_time"],
      ["Expected Weight (MT)", "expected_weight"],
      ["Actual Weight (MT)", "Actual_net_weight"],
      ["Allowed Lower Limit (MT)", "Allow_wt_lower"],
      ["Allowed Higher Limit (MT)", "Allow_wt_higher"],
    ] as const).map(([label, field]) => (
      <div
        key={field}
        className="grid grid-cols-1 gap-1 sm:grid-cols-2 sm:items-center"
      >
        <label className="text-sm font-medium text-[#3B2D20]">
          {label}
        </label>

        <input
          type="text"
          readOnly
          value={approvalDetails[field]}
          className="w-full rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-3 py-2 text-sm text-[#3B2D20]"
        />
      </div>
    ))}
  </div>
)}
      
      {approvalMessage && (
        <p className="mt-4 rounded-lg bg-[#F6F2EA] p-3 text-sm text-[#B5473C]">
          {approvalMessage}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => updateApprovalStatus("R")}
          disabled={approvalLoading}
          className="rounded-lg bg-[#B5473C] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
          Reject
        </button>

        <button
          onClick={() => updateApprovalStatus("Y")}
          disabled={approvalLoading}
          className="rounded-lg bg-[#2F7654] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Approve
        </button>
      </div>

    </div>
  </div>
)}











      </div>
    </AppShell>
  );
}
