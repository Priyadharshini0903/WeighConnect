"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";

type DropdownOption = {
  CODE: string;
  NAME: string;
};

type ReportRecord = {
  TRANSNO: number;
  VEHINO: string;
  PRODDESC: string;
  LOGIDESC: string;
  SUPPDESC: string;
  FIRSTWT: number;
  SECONDWT: number;
  NETWT: number;
};

export default function ReportsPage() {
  // State variables
  const [today, setToday] = useState("");

  const [dateType, setDateType] = useState("DateWise");
  const [shift, setShift] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [reportType, setReportType] = useState("");

  const [transporters, setTransporters] = useState<DropdownOption[]>([]);
  const [products, setProducts] = useState<DropdownOption[]>([]);
  const [suppliers, setSuppliers] = useState<DropdownOption[]>([]);
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [formData, setFormData] = useState({
    FROM_DATE: today,
    FROM_TIME: "00:00",
    TO_DATE: today,
    TO_TIME: "23:59",
    Shift_Date: today,
    PROD_CODE: "",
    SUPP_CODE: "",
    TRAN_CODE: "",
  });

  // Get today's date
  useEffect(() => {
    const date = new Date();

    const formattedDate = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    setToday(formattedDate);
    setFormData((prev) => ({
      ...prev,
      FROM_DATE: formattedDate,
      TO_DATE: formattedDate,
      Shift_Date: formattedDate,
    }));
  }, []);

  // Fetch dropdown data when transaction type changes
  useEffect(() => {
    if (!transactionType) {
      setTransporters([]);
      setProducts([]);
      setSuppliers([]);
      return;
    }

    const fetchDropdownData = async () => {
      try {
        const response = await fetch("/api/reports/dropdowns", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionType: transactionType,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setTransporters(data.transporters);
          setProducts(data.products);
          setSuppliers(data.suppliers);
        }
      } catch (error) {
        console.error("Failed to fetch dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, [transactionType]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const reportOptions = [
    { value: "1", label: "First Weighment Pending" },
    { value: "2", label: "Second Weighment Pending" },
    { value: "3", label: "Gate Out Pending" },
    { value: "4", label: "Completed Trips" },
    { value: "5", label: "Completed Trips Summary" },
    { value: "6", label: "Material Wise Trips" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (dateType === "ShiftWise" && !shift) {
      alert("Please select Shift");
      return;
    }

    if (!transactionType) {
      alert("Please select Transaction Type");
      return;
    }

    if (!reportType) {
      alert("Please select Report Type");
      return;
    }

    try {
      setIsLoading(true);
      setHasSearched(false);
      setRecords([]);
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          Datetype: dateType,
          Shift_Name: shift,
          IN_OUT_TYPE: transactionType,
          REPORT_TYPE: reportType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message);
        return;
      }

      console.log("API Response:", result);

      if (result.success) {
        setRecords(result.records || []);
        setHasSearched(true);
      } else {
        alert(result.message || "Failed to generate report");
      }
    } catch (error) {
      console.error("Report API error:", error);
      alert("Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-[#D8CCBC] bg-white px-3 py-2 text-sm outline-none focus:border-[#8B6748] focus:ring-1 focus:ring-[#8B6748]";

  const labelClass = "text-sm font-medium text-[#51402F]";

  return (
    <AppShell>
    <div className="mx-auto max-w-5xl">
      {/* Page Heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#3B2D20]">Weighment Reports</h1>
        <p className="mt-1 text-sm text-[#786B5E]">
          Select report criteria to generate weighment reports.
        </p>
      </div>

      {/* Selection Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[#E3D6C5] bg-[#FFFCF8] p-6 shadow-sm"
      >
        <h2 className="mb-6 border-b border-[#E3D6C5] pb-3 text-lg font-semibold">
          Report Selection Form
        </h2>

        <div className="space-y-6">
          {/* Date Type */}
          <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
            <label className={labelClass}>Select Date Type:</label>

            <div className="flex flex-wrap gap-6 sm:col-span-2">
              {["DateWise", "ShiftWise"].map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    name="dateType"
                    value={type}
                    checked={dateType === type}
                    onChange={() => {
                      setDateType(type);
                      setShift("");
                    }}
                    className="accent-[#6F5038]"
                  />
                  {type === "DateWise" ? "Date Wise" : "Shift Wise"}
                </label>
              ))}
            </div>
          </div>

          {/* Date Wise */}
          {dateType === "DateWise" && (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-4 sm:items-center">
                <label className={labelClass}>From Date:</label>
                <input
                  type="date"
                  className={inputClass}
                  value={formData.FROM_DATE}
                  onChange={(e) => updateField("FROM_DATE", e.target.value)}
                />

                <label className={labelClass}>From Time:</label>
                <input
                  type="time"
                  step="1"
                  className={inputClass}
                  value={formData.FROM_TIME}
                  onChange={(e) => updateField("FROM_TIME", e.target.value)}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-4 sm:items-center">
                <label className={labelClass}>To Date:</label>
                <input
                  type="date"
                  className={inputClass}
                  value={formData.TO_DATE}
                  onChange={(e) => updateField("TO_DATE", e.target.value)}
                />

                <label className={labelClass}>To Time:</label>
                <input
                  type="time"
                  step="1"
                  className={inputClass}
                  value={formData.TO_TIME}
                  onChange={(e) => updateField("TO_TIME", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Shift Wise */}
          {dateType === "ShiftWise" && (
            <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
              <label className={labelClass}>Shift Date:</label>

              <input
                type="date"
                className={inputClass}
                value={formData.Shift_Date}
                onChange={(e) => updateField("Shift_Date", e.target.value)}
              />

              <div className="flex flex-wrap gap-4">
                {["A", "B", "C", "ALL"].map((item) => (
                  <label
                    key={item}
                    className="flex cursor-pointer items-center gap-1 text-sm"
                  >
                    <input
                      type="radio"
                      name="shift"
                      value={item}
                      checked={shift === item}
                      onChange={() => setShift(item)}
                      className="accent-[#6F5038]"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Transaction Type */}
          <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
            <label className={labelClass}>Transaction Type:</label>

            <select
              className={`${inputClass} sm:col-span-2`}
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
            >
              <option value="">Select the IN/OUT</option>
              <option value="C">OUTBOUND (C)</option>
              <option value="R">INBOUND (R)</option>
              <option value="O">OTHERS (O)</option>
            </select>
          </div>

          {/* Product */}
          <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
            <label className={labelClass}>Product Code:</label>

            <select
              className={`${inputClass} sm:col-span-2`}
              value={formData.PROD_CODE}
              onChange={(e) => updateField("PROD_CODE", e.target.value)}
            >
              <option value="">Select the Product</option>

              {products.map((product) => (
                <option key={product.CODE} value={product.CODE}>
                  {product.NAME}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier */}
          <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
            <label className={labelClass}>Supplier Code:</label>

            <select
              className={`${inputClass} sm:col-span-2`}
              value={formData.SUPP_CODE}
              onChange={(e) => updateField("SUPP_CODE", e.target.value)}
            >
              <option value="">Select the Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.CODE} value={supplier.CODE}>
                  {supplier.NAME}
                </option>
              ))}
            </select>
          </div>

          {/* Transporter */}
          <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
            <label className={labelClass}>Transporter Code:</label>

            <select
              className={`${inputClass} sm:col-span-2`}
              value={formData.TRAN_CODE}
              onChange={(e) => updateField("TRAN_CODE", e.target.value)}
            >
              <option value="">Select the Transporter</option>

              {transporters.map((transporter) => (
                <option key={transporter.CODE} value={transporter.CODE}>
                  {transporter.NAME}
                </option>
              ))}
            </select>
          </div>

          {/* Report Type */}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>Report For:</label>

            <div className="space-y-3 sm:col-span-2">
              {reportOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 text-sm text-[#51402F]"
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={option.value}
                    checked={reportType === option.value}
                    onChange={(e) => setReportType(e.target.value)}
                    className="h-4 w-4 accent-[#6F5038]"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end border-t border-[#E3D6C5] pt-5">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-[#3B2D20] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6F5038] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Loading..." : "View Report"}
            </button>
          </div>
        </div>
      </form>
      {hasSearched &&
        (records.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded-xl border border-[#E3D6C5] bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-[#3B2D20]">
              Report Results ({records.length})
            </h2>

            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#F5EEE5] text-[#51402F]">
                <tr>
                  <th className="border p-3">Trans. No.</th>
                  <th className="border p-3">Vehicle No.</th>
                  <th className="border p-3">Product</th>
                  <th className="border p-3">Transporter</th>
                  <th className="border p-3">Supplier</th>
                  <th className="border p-3">First Weight</th>
                  <th className="border p-3">Second Weight</th>
                  <th className="border p-3">Net Weight</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record.TRANSNO} className="hover:bg-[#FFFCF8]">
                    <td className="border p-3">{record.TRANSNO}</td>
                    <td className="border p-3">{record.VEHINO}</td>
                    <td className="border p-3">{record.PRODDESC}</td>
                    <td className="border p-3">{record.LOGIDESC}</td>
                    <td className="border p-3">{record.SUPPDESC}</td>
                    <td className="border p-3">
                      {record.FIRSTWT?.toLocaleString("en-IN")}
                    </td>
                    <td className="border p-3">
                      {record.SECONDWT?.toLocaleString("en-IN")}
                    </td>
                    <td className="border p-3">
                      {record.NETWT?.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-[#E3D6C5] bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-[#3B2D20]">
              No records found
            </p>
            <p className="mt-1 text-sm text-[#786B5E]">
              Try changing your report filters and search again.
            </p>
          </div>
        ))}
    </div>
      </AppShell>
  );

}
