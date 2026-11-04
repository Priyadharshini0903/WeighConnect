"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  password: string;
};

type Role = {
  value: string;
  label: string;
};

const emptyUser: User = {
  id: "",
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  status: "Active",
  password: "",
};

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<User>(emptyUser);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState("");


  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

   const [confirmPassword, setConfirmPassword] = useState("");
   const [isSaving, setIsSaving] = useState(false);

 async function loadUsers() {
  try {
    setLoading(true);
    setLoadError("");

    const response = await fetch("/api/settings/manage-users", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load users.");
    }

    setRoles(data.roles);

    const formattedUsers: User[] = data.users.map((user: any) => {
      const matchingRole = data.roles.find(
        (role: Role) =>
          role.value.toLowerCase() === String(user.roleId).toLowerCase()
      );

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: matchingRole?.value ?? user.roleId,
        status: user.status,
        password: "",
      };
    });

    setUsers(formattedUsers);
  } catch (error) {
    console.error("LOAD USERS ERROR:", error);

    setLoadError(
      error instanceof Error ? error.message : "Unable to load users."
    );
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  loadUsers();
}, []);


  const filteredUsers = users.filter((user) =>
    [
      user.firstName,
      user.lastName,
      user.email,
      user.role,
      user.status,
    ].some((value) =>
      value.toLowerCase().includes(search.toLowerCase())
    )
  );

function openAddForm() {
  setFormData(emptyUser);
  setConfirmPassword("");
  setFormError("");
  setIsEditing(false);
  setShowForm(true);
}

function closeForm() {
  setShowForm(false);
  setFormData(emptyUser);
  setConfirmPassword("");
  setFormError("");
}

  function openEditForm(user: User) {
    setFormData({ ...user, password: "" });
    setFormError("");
    setIsEditing(true);
    setShowForm(true);
  }

 
  function handleInputChange(
    field: keyof User,
    value: string
  ) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSave() {
  if (
    !formData.firstName.trim() ||
    !formData.lastName.trim() ||
    !formData.email.trim() ||
    !formData.role
  ) {
    setFormError(
      "Please fill in First Name, Last Name, Email and Role."
    );
    return;
  }

  const email = formData.email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFormError("Please enter a valid email address.");
    return;
  }

  if (!isEditing) {
    if (!formData.password) {
      setFormError("Please enter a password.");
      return;
    }

    if (formData.password.length < 2) {
      setFormError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== confirmPassword) {
      setFormError("Password and Confirm Password do not match.");
      return;
    }
  }

  const duplicateEmail = users.some(
    (user) =>
      user.email.toLowerCase() === email &&
      user.id !== formData.id
  );

  if (duplicateEmail) {
    setFormError("This email address already exists.");
    return;
  }

  // Add User: save to Oracle through the API
  if (!isEditing) {
    try {
      setIsSaving(true);
      setFormError("");

      const response = await fetch(
        "/api/settings/manage-users/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email,
            password: formData.password,
            role: formData.role,
            status: formData.status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create user.");
      }

      // Reload users from Oracle
      await loadUsers();

      closeForm();

      alert(data.message || "User created successfully.");
    } catch (error) {
      console.error("SAVE USER ERROR:", error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to create user."
      );
    } finally {
      setIsSaving(false);
    }

    return;
  }


// Edit User: update Oracle through the API
try {
  setIsSaving(true);
  setFormError("");

  const response = await fetch(
    "/api/settings/manage-users/update",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        role: formData.role,
        status: formData.status,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Unable to update user.");
  }

  await loadUsers();
  closeForm();

  alert(data.message || "User updated successfully.");
} catch (error) {
  console.error("UPDATE USER ERROR:", error);

  setFormError(
    error instanceof Error
      ? error.message
      : "Unable to update user."
  );
} finally {
  setIsSaving(false);
}

}

const toggleStatus = async (id: string) => {
  const user = users.find((u) => u.id === id);

  if (!user) return;

  const newStatus =
    user.status === "Active" ? "Inactive" : "Active";

  try {
    const response = await fetch(
      "/api/settings/manage-users/toggle-status",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status: newStatus,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to update status.");
    }

    // Update the UI only after Oracle confirms the change
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: newStatus } : u
      )
    );

    alert(result.message);
  } catch (error) {
    console.error("Status update error:", error);
    alert(
      error instanceof Error
        ? error.message
        : "Unable to update user status."
    );
  }
};

  return (
    <AppShell>
      <div className="space-y-6">

        {/* Page Heading */}
        <div>
          <h1 className="text-2xl font-bold text-[#3B2D20]">
            Manage Users
          </h1>

          <p className="mt-1 text-sm text-[#786B5E]">
            View and manage application users.
          </p>
        </div>

        {/* User Table */}
        <div className="rounded-xl border border-[#E3D6C5] bg-[#FFFCF8] p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#3B2D20]">
                User List
              </h2>

              <p className="mt-1 text-sm text-[#786B5E]">
                Manage registered users and their roles.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-4 py-2 text-sm outline-none focus:border-[#6F5038] sm:w-64"/>

              <button
                onClick={openAddForm}
                className="rounded-lg bg-[#6F5038] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5A402D]">
                + Add User
              </button>
            </div>
          </div>


          {loading && (
              <p className="py-6 text-center text-sm text-[#786B5E]">
                Loading users...
              </p>
            )}

            {loadError && (
              <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {loadError}
              </p>
            )}


          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-[#EEE5D8] text-[#3B2D20]">
                <tr>
                  {[
                    "S.No.",
                    "First Name",
                    "Last Name",
                    "Email Address",
                    "Role",
                    "Status",
                    "Actions",
                  ].map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-4 py-3 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className="border-b border-[#E3D6C5]">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">{user.firstName}</td>
                      <td className="px-4 py-3">{user.lastName}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">{user.role}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            user.status === "Active"
                              ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                              : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                          }>
                          {user.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditForm(user)}
                            className="font-medium text-[#6F5038] hover:underline">
                            Edit
                          </button>

                          <button
                            onClick={() => toggleStatus(user.id)}
                            className="font-medium text-red-600 hover:underline">
                            {user.status === "Active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-[#786B5E]">
                      No user records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add / Edit User Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[#FFFCF8] p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#3B2D20]">
                  {isEditing ? "Edit User" : "Add User"}
                </h2>

                <button
                  onClick={closeForm}
                  className="text-xl text-[#786B5E] hover:text-[#3B2D20]">
                  ×
                </button>
              </div>

              {formError && (
                <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3B2D20]">
                    First Name
                  </label>

                  <input
                    type="text"
                      readOnly={isEditing}
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter first name"
                    className="w-full rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-3 py-2 text-sm outline-none focus:border-[#6F5038]"/>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3B2D20]">
                    Last Name
                  </label>

                  <input
                    type="text"
                    readOnly={isEditing}
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Enter last name"
                    className="w-full rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-3 py-2 text-sm outline-none focus:border-[#6F5038]" />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#3B2D20]">
                    Email Address
                  </label>

                  <input
                    type="email"
                    readOnly={isEditing}
                    value={formData.email}
                    onChange={(e) =>
                      handleInputChange("email", e.target.value)
                    }
                    placeholder="Enter email address"
                    className="w-full rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-3 py-2 text-sm outline-none focus:border-[#6F5038]"/>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3B2D20]">
                    Role
                  </label>

                  <select
                    value={formData.role}
                    onChange={(e) =>
                      handleInputChange("role", e.target.value)
                    }
                    className="w-full rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-3 py-2 text-sm outline-none focus:border-[#6F5038]">              
                    <option value="">Select Role</option>

                          {roles.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                  </select>
                </div>

                {!isEditing && (
  <>
    <div>
      <label className="mb-1 block text-sm font-medium text-[#3B2D20]">
        Password
      </label>

      <input
        type="password"
        value={formData.password}
        onChange={(e) =>
          handleInputChange("password", e.target.value)
        }
        placeholder="Enter password"
        className="w-full rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-3 py-2 text-sm outline-none focus:border-[#6F5038]"
      />
    </div>

    <div>
      <label className="mb-1 block text-sm font-medium text-[#3B2D20]">
        Confirm Password
      </label>

      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm password"
        className="w-full rounded-lg border border-[#E3D6C5] bg-[#F6F2EA] px-3 py-2 text-sm outline-none focus:border-[#6F5038]"
      />
    </div>
  </>
)}

              </div>

              <div className="mt-6 flex justify-end gap-3">

                <button
                  onClick={closeForm}
                  className="rounded-lg border border-[#E3D6C5] px-4 py-2 text-sm font-medium text-[#3B2D20] hover:bg-[#EEE5D8]">
                  Cancel
                </button>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-lg bg-[#6F5038] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5A402D] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving
                      ? "Saving..."
                      : isEditing
                        ? "Update"
                        : "Save"}
                  </button>

              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
