"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { DatabaseRegistryEntry, DatabaseRole } from "@/config/db-registry";

type SettingsUser = {
  name: string;
  email: string;
  role: DatabaseRole;
  allowedDatabases: string[];
  isActive: boolean;
};

const roles: DatabaseRole[] = ["viewer", "manager", "super_admin"];

function availableDatabases(databases: DatabaseRegistryEntry[]) {
  return databases.map((database) => database.dbName);
}

function DatabaseChecklist({
  options,
  selected,
  disabled,
  onToggle,
}: {
  options: string[];
  selected: string[];
  disabled?: boolean;
  onToggle: (dbName: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {options.map((dbName) => (
        <label
          key={dbName}
          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
            disabled
              ? "border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-600"
              : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200"
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(dbName)}
            disabled={disabled}
            onChange={() => onToggle(dbName)}
            className="h-4 w-4 accent-emerald-500"
          />
          <span className="truncate">{dbName}</span>
        </label>
      ))}
    </div>
  );
}

export function UserManagement({ databases }: { databases: DatabaseRegistryEntry[] }) {
  const options = useMemo(() => availableDatabases(databases), [databases]);
  const [users, setUsers] = useState<SettingsUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<Record<string, SettingsUser & { password?: string }>>({});
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer" as DatabaseRole,
    allowedDatabases: [] as string[],
  });

  async function loadUsers() {
    setLoading(true);
    const response = await fetch("/api/settings/users");
    const data = (await response.json()) as { users?: SettingsUser[]; error?: string };
    setLoading(false);

    if (!response.ok || !data.users) {
      setMessage(data.error ?? "Unable to load users");
      return;
    }

    setUsers(data.users);
    setDrafts(
      Object.fromEntries(
        data.users.map((user) => [
          user.email,
          {
            ...user,
            allowedDatabases: user.allowedDatabases ?? [],
            password: "",
          },
        ]),
      ),
    );
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  function toggleDatabase(list: string[], dbName: string) {
    return list.includes(dbName)
      ? list.filter((item) => item !== dbName)
      : [...list, dbName];
  }

  async function createUser() {
    setMessage("");
    const response = await fetch("/api/settings/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(data.error ?? "Unable to create user");
      return;
    }

    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "viewer",
      allowedDatabases: [],
    });
    setMessage("User created successfully.");
    await loadUsers();
  }

  async function saveUser(email: string) {
    setMessage("");
    const draft = drafts[email];
    const response = await fetch("/api/settings/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(data.error ?? "Unable to update user");
      return;
    }

    setMessage(`Updated ${email}`);
    await loadUsers();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Create user</h2>
          <p className="mt-1 text-sm text-slate-500">
            The built-in super admin still uses the credentials from `.env.local`.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</span>
            <Input value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
            <Input
              type="email"
              value={newUser.email}
              onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
            <Input
              type="password"
              value={newUser.password}
              onChange={(event) => setNewUser({ ...newUser, password: event.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</span>
            <select
              value={newUser.role}
              onChange={(event) =>
                setNewUser({
                  ...newUser,
                  role: event.target.value as DatabaseRole,
                  allowedDatabases:
                    event.target.value === "super_admin" ? [] : newUser.allowedDatabases,
                })
              }
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Database access</p>
          <DatabaseChecklist
            options={options}
            selected={newUser.allowedDatabases}
            disabled={newUser.role === "super_admin"}
            onToggle={(dbName) =>
              setNewUser({
                ...newUser,
                allowedDatabases: toggleDatabase(newUser.allowedDatabases, dbName),
              })
            }
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button type="button" onClick={createUser}>
            Create user
          </Button>
          {message ? <p className="text-sm text-slate-500">{message}</p> : null}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Manage users</h2>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading users...</p>
        ) : (
          <div className="space-y-5">
            {users.map((user) => {
              const draft = drafts[user.email];

              if (!draft) {
                return null;
              }

              return (
                <div
                  key={user.email}
                  className="rounded-md border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</span>
                      <Input
                        value={draft.name}
                        onChange={(event) =>
                          setDrafts({
                            ...drafts,
                            [user.email]: { ...draft, name: event.target.value },
                          })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
                      <Input value={draft.email} disabled />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</span>
                      <select
                        value={draft.role}
                        onChange={(event) =>
                          setDrafts({
                            ...drafts,
                            [user.email]: {
                              ...draft,
                              role: event.target.value as DatabaseRole,
                              allowedDatabases:
                                event.target.value === "super_admin" ? [] : draft.allowedDatabases,
                            },
                          })
                        }
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Reset password</span>
                      <Input
                        type="password"
                        value={draft.password ?? ""}
                        onChange={(event) =>
                          setDrafts({
                            ...drafts,
                            [user.email]: { ...draft, password: event.target.value },
                          })
                        }
                      />
                    </label>
                  </div>

                  <label className="mt-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(event) =>
                        setDrafts({
                          ...drafts,
                          [user.email]: { ...draft, isActive: event.target.checked },
                        })
                      }
                      className="h-4 w-4 accent-emerald-500"
                    />
                    Active login
                  </label>

                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Database access</p>
                    <DatabaseChecklist
                      options={options}
                      selected={draft.allowedDatabases}
                      disabled={draft.role === "super_admin"}
                      onToggle={(dbName) =>
                        setDrafts({
                          ...drafts,
                          [user.email]: {
                            ...draft,
                            allowedDatabases: toggleDatabase(draft.allowedDatabases, dbName),
                          },
                        })
                      }
                    />
                  </div>

                  <div className="mt-4">
                    <Button type="button" onClick={() => saveUser(user.email)}>
                      Save changes
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
