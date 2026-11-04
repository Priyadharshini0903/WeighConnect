
"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

type PagePermission = {
  id: string;
  name: string;
  url: string;
  access: boolean;
};

type RoleOption = {
  value: string;
  label: string;
};

type PermissionResponse = {
  roleName: string;
  defaultPage: string | null;
  pageAccess: string[];
  controlAccess: string[];
};

type ApiResponse = {
  success: boolean;
  roles: RoleOption[];
  pages: {
    id: string;
    name: string;
    url: string;
  }[];
  permission: PermissionResponse | null;
  message?: string;
};

// Maps old PHP URLs to the corresponding migrated Next.js pages.
const legacyPageMapping: Record<string, string[]> = {
  "/plant-live-transactions": [
    "/Pages/GetCurrentTranscation",
    "/Pages/GetMinesTruckMaster",
  ],
  "/weighbridge": [
    "/weighbridge/wb",
  ],
  "/reports": [
    "/Reports/index",
    "/bagcounterReports/index",
  ],
  "/settings/plant-wb-configuration": [
    "/weighbridge/Configuration",
  ],
  "/settings/manage-users": [
    "/Users/manageUsers",
  ],
  "/settings/access-configuration": [
    "/AccessManagement/index",
  ],
};

export default function AccessConfigurationPage() {
  const [selectedRole, setSelectedRole] = useState("");
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [pages, setPages] = useState<PagePermission[]>([]);
  const [controlAccess, setControlAccess] = useState<string[]>([]);
  const [defaultPage, setDefaultPage] = useState("");
  const [message, setMessage] = useState("");

  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  // Load roles and available pages from the API.
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingRoles(true);

        const response = await fetch(
          "/api/settings/access-configuration"
        );

        const data: ApiResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load roles.");
        }

        setRoles(data.roles);

        setPages(
          data.pages.map((page) => ({
            ...page,
            access: false,
          }))
        );
      } catch (error) {
        console.error("Access configuration loading error:", error);
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load access configuration."
        );
      } finally {
        setLoadingRoles(false);
      }
    }

    loadInitialData();
  }, []);

  // Load the selected role's saved permissions from Oracle.
  async function loadRolePermissions(roleName: string) {
    try {
      setLoadingPermissions(true);
      setMessage("");

      // Reset the previous role's selections.
      setPages((previous) =>
        previous.map((page) => ({
          ...page,
          access: false,
        }))
      );

      setControlAccess([]);
      setDefaultPage("");

      const response = await fetch(
        `/api/settings/access-configuration?roleName=${encodeURIComponent(roleName)}`
      );

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load role permissions."
        );
      }

      if (!data.permission) {
        setMessage(
          "No saved permissions found for this role. You can configure them now."
        );
        return;
      }

      const savedPageAccess = data.permission.pageAccess || [];

      setPages((previous) =>
        previous.map((page) => {
          const legacyUrls = legacyPageMapping[page.url] || [];

          const hasAccess =
            savedPageAccess.includes(page.url) ||
            legacyUrls.some((url) => savedPageAccess.includes(url));

          return {
            ...page,
            access: hasAccess,
          };
        })
      );

      setControlAccess(data.permission.controlAccess || []);
      setDefaultPage(data.permission.defaultPage || "");
    } catch (error) {
      console.error("Permission loading error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load permissions."
      );
    } finally {
      setLoadingPermissions(false);
    }
  }

  // Handle role selection.
  function handleRoleChange(roleName: string) {
    setSelectedRole(roleName);
    setMessage("");

    if (roleName) {
      loadRolePermissions(roleName);
    } else {
      setPages((previous) =>
        previous.map((page) => ({
          ...page,
          access: false,
        }))
      );

      setControlAccess([]);
      setDefaultPage("");
    }
  }

  // Toggle individual page access.
  function togglePageAccess(id: string) {
    setPages((previous) =>
      previous.map((page) =>
        page.id === id
          ? { ...page, access: !page.access }
          : page
      )
    );

    setMessage("");
  }

  // Select all pages.
  function selectAll() {
    setPages((previous) =>
      previous.map((page) => ({
        ...page,
        access: true,
      }))
    );

    setMessage("");
  }

  // Deselect all pages.
  function deselectAll() {
    setPages((previous) =>
      previous.map((page) => ({
        ...page,
        access: false,
      }))
    );

    setMessage("");
  }

// Toggle Add, Edit or Delete permission.
function toggleControlAccess(control: string) {
  setControlAccess((previous) =>
    previous.includes(control)
      ? previous.filter((item) => item !== control)
      : [...previous, control]
  );

  setMessage("");
}


  // Save will be connected to the Oracle API in the next step.
 
const handleSave = async () => {
  if (!selectedRole) {
    setMessage("Please select a role.");
    return;
  }

  if (!defaultPage || !pages.some((page) => page.url === defaultPage)) {
    setMessage("Please select a valid default page.");
    return;
  }

  try {
    setMessage("");

    const response = await fetch(
      "/api/settings/access-configuration/save",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleName: selectedRole,
          defaultPage,
          pageAccess: pages
            .filter((page) => page.access)
            .map((page) => page.url),
          controlAccess,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to save permissions.");
    }

    setMessage("Permissions saved successfully!");
  } catch (error) {
    setMessage(
      error instanceof Error ? error.message : "Something went wrong."
    );
  }
};


  const selectedCount = pages.filter(
    (page) => page.access
  ).length;

const selectedDefaultPage = pages.some(
  (page) => page.url === defaultPage
)
  ? defaultPage
  : "";




  return (
    <AppShell>
      <div className="space-y-6">

        {/* Page Heading */}
        <div>
          <h1 className="text-2xl font-bold text-[#3B2D20]">
            Access Configuration
          </h1>

          <p className="mt-1 text-sm text-[#786B5E]">
            Manage page access permissions for application roles.
          </p>
        </div>

        {/* Role Selection */}
        <div className="rounded-xl border border-[#E3D6C5] bg-[#FFFCF8] p-5 shadow-sm">

          <h2 className="mb-4 text-lg font-semibold text-[#3B2D20]">
            Select Role
          </h2>

          <div className="max-w-md">
            <label className="mb-2 block text-sm font-medium text-[#3B2D20]">
              User Role
            </label>

            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={loadingRoles}
              className="w-full rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-4 py-2.5 text-sm outline-none focus:border-[#6F5038] disabled:opacity-50"
            >
              <option value="">
                {loadingRoles ? "Loading roles..." : "Select Role"}
              </option>

              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Page Permissions */}
        <div className="rounded-xl border border-[#E3D6C5] bg-[#FFFCF8] p-5 shadow-sm">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

            <div>
              <h2 className="text-lg font-semibold text-[#3B2D20]">
                Page Access
              </h2>

              <p className="mt-1 text-sm text-[#786B5E]">
                Select the pages that this role can access.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={selectAll}
                disabled={!selectedRole || loadingPermissions}
                className="rounded-lg border border-[#E3D6C5] px-3 py-2 text-sm font-medium text-[#6F5038] hover:bg-[#EEE5D8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Select All
              </button>

              <button
                onClick={deselectAll}
                disabled={!selectedRole || loadingPermissions}
                className="rounded-lg border border-[#E3D6C5] px-3 py-2 text-sm font-medium text-[#6F5038] hover:bg-[#EEE5D8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Deselect All
              </button>
            </div>

          </div>

          {loadingPermissions ? (
            <p className="py-8 text-center text-sm text-[#786B5E]">
              Loading permissions...
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">

                <thead className="bg-[#EEE5D8] text-[#3B2D20]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">S.No.</th>
                    <th className="px-4 py-3 font-semibold">Page Name</th>
                    <th className="px-4 py-3 font-semibold">Page URL</th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Access
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pages.map((page, index) => (
                    <tr
                      key={page.id}
                      className="border-b border-[#E3D6C5]"
                    >
                      <td className="px-4 py-3">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 font-medium text-[#3B2D20]">
                        {page.name}
                      </td>

                      <td className="px-4 py-3 text-[#786B5E]">
                        {page.url}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={page.access}
                          disabled={!selectedRole || loadingPermissions}
                          onChange={() => togglePageAccess(page.id)}
                          className="h-4 w-4 accent-[#6F5038] disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
          {/* Page Controls */}
          <div className="mt-6 grid grid-cols-1 gap-6 border-t border-[#E3D6C5] pt-5 md:grid-cols-2">

            <div>
              <h2 className="mb-3 text-lg font-semibold text-[#3B2D20]">
                Page Controls
              </h2>

              <p className="mb-3 text-sm text-[#786B5E]">
                Select the actions this role is allowed to perform.
              </p>

              <div className="flex flex-wrap gap-5">
                {["Add", "Edit", "Delete"].map((control) => (
                  <label
                    key={control}
                    className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#3B2D20]"
                  >
                    <input
                      type="checkbox"
                      value={control}
                      checked={controlAccess.includes(control)}
                      disabled={!selectedRole || loadingPermissions}
                      onChange={() => toggleControlAccess(control)}
                      className="h-4 w-4 accent-[#6F5038] disabled:cursor-not-allowed"
                    />
                    {control}
                  </label>
                ))}
              </div>
            </div>

            {/* Default Page */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-[#3B2D20]">
                Default Page
              </h2>

              <p className="mb-3 text-sm text-[#786B5E]">
                Select the page to open after login.
              </p>

              <select
                value={selectedDefaultPage}
                onChange={(e) => {
                  setDefaultPage(e.target.value);
                  setMessage("");
                }}
                disabled={!selectedRole || loadingPermissions}
                className="w-full max-w-md rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-4 py-2.5 text-sm outline-none focus:border-[#6F5038] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Default Page</option>

                {pages.map((page) => (
                  <option key={page.id} value={page.url}>
                    {page.name}
                  </option>
                ))}
              </select>

              {defaultPage && !selectedDefaultPage && (
                <p className="mt-2 text-xs text-amber-700">
                  Existing default page ({defaultPage}) belongs to the
                  legacy PHP application and is not yet available in
                  the migrated pages.
                </p>
              )}
            </div>

          </div>
          
          {/* Save Permissions */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">

            <p className="text-sm text-[#786B5E]">
              Selected pages:{" "}
              <span className="font-semibold text-[#3B2D20]">
                {selectedCount}
              </span>
              {" / "}
              {pages.length}
            </p>

            <button
              onClick={handleSave}
              disabled={!selectedRole || loadingPermissions}
              className="rounded-lg bg-[#6F5038] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5A402D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Changes
            </button>

          </div>

          {message && (
            <p className="mt-4 rounded-lg bg-[#EEE5D8] p-3 text-sm text-[#3B2D20]">
              {message}
            </p>
          )}

        </div>

      </div>
    </AppShell>
  );
}
