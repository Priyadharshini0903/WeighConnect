"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

type Weighbridge = {
  WBID: number;
  PLANTCODE: string | null;
  PLANTID: string | null;
  WBNAME: string | null;
  WBLOCATION: string | null;
  WBTYPE: string | null;
  DIOIP: string | null;
  DIOPORT: string | null;
  DIOSTATUS: string | null;
  RFIDIP1: string | null;
  RFIDPORT1: string | null;
  RFIDIP2: string | null;
  RFIDPORT2: string | null;
  RFSTATUS1?: string | null;
  RFSTATUS2?: string | null;
  RFTYPE1?: number | null;
  RFTYPE2?: number | null;
  DSPIP1: string | null;
  DSPPORT1: string | null;
  DSPIP2: string | null;
  DSPPORT2: string | null;
  DSPTYPE1?: string | null;
  DSPTYPE2?: string | null;
  DSPSTATUS1?: string | null;
  DSPSTATUS2?: string | null;
  WBSTATUS: string | null;
  STARTDATETIME: string | null;
  WBRUNMODE: string | null;
  WBPROCESSTYPE: number | null;
  INDICATORTYPE: string | null;
  CLIENTIP?: string | null;
  RTSP_URL1?: string | null;
  RTSP_URL2?: string | null;
  ENTRYTIMEOUT?: string | null;
  WEIGHTSTABLETIME?: string | null;
  PROCESSCLEARTIMEOUT?: string | null;
  PROCESSCLEARWEIGHT?: string | null;
};

type ApiResponse = {
  success: boolean;
  records: Weighbridge[];
  totalRecords: number;
  message?: string;
};

type FormField = {
  key: keyof Weighbridge;
  label: string;
};

const columns = [
  { key: "WBID", label: "WB ID" },
  { key: "WBNAME", label: "WB Name" },
  { key: "WBLOCATION", label: "WB Location" },
  { key: "WBTYPE", label: "WB Type" },
  { key: "PLANTCODE", label: "Plant Code" },
  { key: "PLANTID", label: "Plant ID" },
  { key: "DIOIP", label: "DIO IP" },
  { key: "DIOPORT", label: "DIO Port" },
  { key: "RFIDIP1", label: "RFID 1 IP" },
  { key: "RFIDPORT1", label: "RFID 1 Port" },
  { key: "RFIDIP2", label: "RFID 2 IP" },
  { key: "RFIDPORT2", label: "RFID 2 Port" },
  { key: "DSPIP1", label: "Display 1 IP" },
  { key: "DSPPORT1", label: "Display 1 Port" },
  { key: "DSPIP2", label: "Display 2 IP" },
  { key: "DSPPORT2", label: "Display 2 Port" },
  { key: "WBSTATUS", label: "WB Status" },
  { key: "WBRUNMODE", label: "Run Mode" },
  { key: "WBPROCESSTYPE", label: "Process Type" },
  { key: "INDICATORTYPE", label: "Indicator Type" },
] as const;

const leftFields: FormField[] = [
  { key: "PLANTCODE", label: "Plant Code" },
  { key: "WBLOCATION", label: "WB Location" },
  { key: "DIOIP", label: "Controller IP" },
  { key: "RFIDIP1", label: "Reader 1 IP" },
  { key: "RFIDIP2", label: "Reader 2 IP" },
  { key: "DSPIP1", label: "Display 1 IP" },
  { key: "DSPIP2", label: "Display 2 IP" },
  { key: "RTSP_URL1", label: "RTSP URL 1" },
  { key: "RTSP_URL2", label: "RTSP URL 2" },
  { key: "ENTRYTIMEOUT", label: "Entry Timeout" },
  { key: "WEIGHTSTABLETIME", label: "Weight Stable Time" },
];

const rightFields: FormField[] = [
  { key: "WBNAME", label: "Weighbridge Name" },
  { key: "PLANTID", label: "Plant ID" },
  { key: "DIOPORT", label: "Controller Port" },
  { key: "RFIDPORT1", label: "Reader 1 Port" },
  { key: "RFIDPORT2", label: "Reader 2 Port" },
  { key: "DSPPORT1", label: "Display 1 Port" },
  { key: "DSPPORT2", label: "Display 2 Port" },
  { key: "PROCESSCLEARTIMEOUT", label: "Process Clear Timeout" },
  { key: "PROCESSCLEARWEIGHT", label: "Process Clear Weight" },
];

type EditableField =
  | "PLANTCODE"
  | "PLANTID"
  | "WBNAME"
  | "WBLOCATION"
  | "DIOIP"
  | "DIOPORT"
  | "RFIDIP1"
  | "RFIDPORT1"
  | "RFIDIP2"
  | "RFIDPORT2"
  | "DSPIP1"
  | "DSPPORT1"
  | "DSPIP2"
  | "DSPPORT2"
  | "WBSTATUS"
  | "WBRUNMODE"
  | "WBTYPE"
  | "INDICATORTYPE"
  | "WBPROCESSTYPE"
  | "RTSP_URL1"
  | "RTSP_URL2"
  | "ENTRYTIMEOUT"
  | "WEIGHTSTABLETIME"
  | "PROCESSCLEARTIMEOUT"
  | "PROCESSCLEARWEIGHT";

type EditForm = Record<EditableField, string>;

const editableFields: EditableField[] = [
  "PLANTCODE", "PLANTID", "WBNAME", "WBLOCATION",
  "DIOIP", "DIOPORT",
  "RFIDIP1", "RFIDPORT1", "RFIDIP2", "RFIDPORT2",
  "DSPIP1", "DSPPORT1", "DSPIP2", "DSPPORT2",
  "WBSTATUS", "WBRUNMODE", "WBTYPE", "INDICATORTYPE",
  "WBPROCESSTYPE", "RTSP_URL1", "RTSP_URL2",
  "ENTRYTIMEOUT", "WEIGHTSTABLETIME",
  "PROCESSCLEARTIMEOUT", "PROCESSCLEARWEIGHT",
];

export default function PlantWBConfigurationPage() {
  const [search, setSearch] = useState("");
  const [weighbridges, setWeighbridges] = useState<Weighbridge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedWB, setSelectedWB] = useState<Weighbridge | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);

  const fetchWeighbridges = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/settings/plant-wb-configuration",
        { cache: "no-store" }
      );

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load configurations.");
      }

      setWeighbridges(data.records || []);
    } catch (err) {
      console.error("WEIGHBRIDGE FETCH ERROR:", err);
      setError(
        err instanceof Error ? err.message : "Unable to load records."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeighbridges();
  }, [fetchWeighbridges]);

  const filteredWeighbridges = weighbridges.filter((wb) =>
    Object.values(wb).some((value) =>
      String(value ?? "").toLowerCase().includes(search.toLowerCase())
    )
  );

  function displayValue(value: string | number | null | undefined) {
    return value === null || value === undefined || value === ""
      ? "-"
      : String(value);
  }

  function formatDate(value: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  function getStatusClass(status: string | null) {
    if (status?.toLowerCase() === "true") {
      return "bg-green-100 text-green-700";
    }
    if (status?.toLowerCase() === "false") {
      return "bg-red-100 text-red-700";
    }
    return "bg-gray-100 text-gray-600";
  }

  function openUpdateForm(wb: Weighbridge) {
    const form = {} as EditForm;

    editableFields.forEach((key) => {
      const value = wb[key];
      form[key] = value === null || value === undefined
        ? ""
        : String(value);
    });

    setSelectedWB(wb);
    setEditForm(form);
    setOpenMenu(null);
  }

  function updateField(key: EditableField, value: string) {
    setEditForm((previous) =>
      previous ? { ...previous, [key]: value } : previous
    );
  }
async function updateConfiguration() {
  if (!selectedWB || !editForm) return;

  try {
    setSaving(true);

    const formData = {
      WBID: selectedWB.WBID,
      ...editForm,
    };

    const response = await fetch(
      "/api/settings/plant-wb-configuration",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.message || "Update failed.");
      return;
    }

    alert(data.message || "Configuration updated successfully.");

    closeUpdateForm();

    // Reload the latest records from Oracle.
    await fetchWeighbridges();

  } catch (error) {
    console.error("UPDATE CONFIGURATION ERROR:", error);
    alert("Unable to update configuration. Please try again.");
  } finally {
    setSaving(false);
  }
}
  function closeUpdateForm() {
    setSelectedWB(null);
    setEditForm(null);
  }

  function renderTextField(field: FormField) {
    if (!editForm) return null;

    const key = field.key as EditableField;

    return (
      <div key={field.key} className="mb-3">
        <label className="mb-1 block text-sm font-medium text-[#3B2D20]">
          {field.label}
        </label>
        <input
          type="text"
          value={editForm[key] ?? ""}
          onChange={(e) => updateField(key, e.target.value)}
          className="w-full rounded-lg border border-[#E3D6C5] bg-white px-3 py-2 text-sm outline-none focus:border-[#6F5038]"
        />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#3B2D20]">
            Plant WB Configuration
          </h1>
          <p className="mt-1 text-sm text-[#786B5E]">
            View and update plant weighbridge configurations.
          </p>
        </div>

        <div className="rounded-xl border border-[#E3D6C5] bg-[#FFFCF8] p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#3B2D20]">
                Weighbridge Configurations
              </h2>
              <p className="mt-1 text-sm text-[#786B5E]">
                {loading
                  ? "Loading records..."
                  : `${filteredWeighbridges.length} of ${weighbridges.length} records`}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search weighbridges..."
                className="w-full rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-4 py-2 text-sm outline-none focus:border-[#6F5038] sm:w-64"
              />

              <button
                onClick={fetchWeighbridges}
                disabled={loading}
                className="rounded-lg border border-[#6F5038] px-4 py-2 text-sm font-semibold text-[#6F5038] hover:bg-[#EEE5D8] disabled:opacity-50"
              >
                {loading ? "Loading..." : "↻ Refresh"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1900px] text-left text-sm">
              <thead className="bg-[#EEE5D8] text-[#3B2D20]">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Task</th>
                  {columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-4 py-3">
                      {column.label}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-4 py-3">Start Date</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + 2} className="px-4 py-10 text-center">
                      Loading weighbridge configurations...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={columns.length + 2} className="px-4 py-10 text-center text-red-600">
                      Unable to load records.
                    </td>
                  </tr>
                ) : filteredWeighbridges.length ? (
                  filteredWeighbridges.map((wb) => (
                    <tr
                      key={wb.WBID}
                      className="border-b border-[#E3D6C5] hover:bg-[#F6F2EA]"
                    >
                      <td className="relative px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu(openMenu === wb.WBID ? null : wb.WBID)
                          }
                          className="rounded-lg px-3 py-1 text-xl font-bold text-[#6F5038] hover:bg-[#EEE5D8]"
                          aria-label={`Actions for weighbridge ${wb.WBID}`}
                        >
                          ⋮
                        </button>

                        {openMenu === wb.WBID && (
                          <div className="absolute left-3 top-10 z-20 min-w-32 rounded-lg border border-[#E3D6C5] bg-white py-1 shadow-lg">
                            <button
                              type="button"
                              onClick={() => openUpdateForm(wb)}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#3B2D20] hover:bg-[#F6F2EA]"
                            >
                              <span>✎</span> Update
                            </button>
                          </div>
                        )}
                      </td>

                      {columns.map((column) => {
                        const value = wb[column.key];

                        return (
                          <td key={column.key} className="whitespace-nowrap px-4 py-3">
                            {column.key === "WBSTATUS" ? (
                              <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(value as string | null)}`}>
                                {displayValue(value)}
                              </span>
                            ) : column.key === "WBTYPE" ? (
                              displayValue(value) === "1"
                                ? "UNI-DIRECTIONAL"
                                : displayValue(value) === "2"
                                  ? "BI-DIRECTIONAL"
                                  : displayValue(value)
                            ) : (
                              displayValue(value)
                            )}
                          </td>
                        );
                      })}

                      <td className="whitespace-nowrap px-4 py-3">
                        {formatDate(wb.STARTDATETIME)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 2} className="px-4 py-10 text-center text-[#786B5E]">
                      No weighbridge configuration records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Update Configuration Modal */}
        {selectedWB && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-[#FFFCF8] shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E3D6C5] bg-[#FFFCF8] px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-[#3B2D20]">
                    Update Weighbridge Configuration
                  </h2>
                  <p className="mt-1 text-sm text-[#786B5E]">
                    Weighbridge ID: {selectedWB.WBID}
                  </p>
                </div>
                <button
                  onClick={closeUpdateForm}
                  className="rounded-lg px-3 py-1 text-2xl text-[#786B5E] hover:bg-[#EEE5D8]"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                <div>
                  {leftFields.map(renderTextField)}
                </div>

                <div>
                  {rightFields.map(renderTextField)}

                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium text-[#3B2D20]">
                      Weighbridge ID
                    </label>
                    <input
                      value={selectedWB.WBID}
                      disabled
                      className="w-full rounded-lg border border-[#E3D6C5] bg-[#EEE5D8] px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-5 border-t border-[#E3D6C5] px-6 py-5">
                <div>
                  <p className="mb-2 text-sm font-semibold text-[#3B2D20]">
                    Weighbridge Type
                  </p>
                  {[
                    { value: "1", label: "Uni-directional" },
                    { value: "2", label: "Bi-directional" },
                    { value: "3", label: "Bi-directional Type 2" },
                  ].map((option) => (
                    <label key={option.value} className="mr-5 inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="WBTYPE"
                        checked={editForm.WBTYPE === option.value}
                        onChange={() => updateField("WBTYPE", option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-[#3B2D20]">
                    Enable / Disable Weighbridge
                  </p>
                  {[
                    { value: "True", label: "Enabled" },
                    { value: "False", label: "Disabled" },
                  ].map((option) => (
                    <label key={option.value} className="mr-5 inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="WBSTATUS"
                        checked={editForm.WBSTATUS === option.value}
                        onChange={() => updateField("WBSTATUS", option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-[#3B2D20]">
                    Run Mode
                  </p>
                  {["LOCAL", "SERVER"].map((mode) => (
                    <label key={mode} className="mr-5 inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="WBRUNMODE"
                        checked={editForm.WBRUNMODE === mode}
                        onChange={() => updateField("WBRUNMODE", mode)}
                      />
                      {mode}
                    </label>
                  ))}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#3B2D20]">
                    Indicator Type
                  </label>
                  <select
                    value={editForm.INDICATORTYPE}
                    onChange={(e) => updateField("INDICATORTYPE", e.target.value)}
                    className="w-full max-w-sm rounded-lg border border-[#E3D6C5] bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select Indicator Type</option>
                    <option value="Normal">Normal</option>
                    <option value="BEFloat">BEFloat</option>
                    <option value="Minebea">Minebea</option>
                  </select>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-[#3B2D20]">
                    WB Process Type
                  </p>
                  {[
                    { value: "1", label: "Truck WB" },
                    { value: "2", label: "Bulk WB" },
                    { value: "3", label: "Mines WB" },
                  ].map((option) => (
                    <label key={option.value} className="mr-5 inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="WBPROCESSTYPE"
                        checked={editForm.WBPROCESSTYPE === option.value}
                        onChange={() => updateField("WBPROCESSTYPE", option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-[#E3D6C5] px-6 py-4">
                <button
                  onClick={closeUpdateForm}
                  className="rounded-lg border border-[#E3D6C5] px-5 py-2 text-sm font-semibold text-[#6F5038] hover:bg-[#EEE5D8]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={updateConfiguration}
                  disabled={saving}
                  className="rounded-lg bg-[#6F5038] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5A402D] disabled:cursor-not-allowed disabled:opacity-50">
                  {saving ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}