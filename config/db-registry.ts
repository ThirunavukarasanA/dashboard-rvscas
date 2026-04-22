export type DatabaseRole = "super_admin" | "manager" | "viewer";

export type DatabaseRegistryEntry = {
  dbName: string;
  label: string;
  collections: string[];
  roles?: DatabaseRole[];
};

export const DB_REGISTRY = [
  {
    dbName: "admin",
    label: "Admin",
    collections: ["users", "roles"],
    roles: ["super_admin"],
  },
  {
    dbName: "brochure-leads",
    label: "Brochure Leads",
    collections: [],
  },
  {
    dbName: "config",
    label: "Config",
    collections: [],
    roles: ["super_admin"],
  },
  {
    dbName: "ias-pipp-org",
    label: "IAS PIPP Org",
    collections: [],
  },
  {
    dbName: "local",
    label: "Local",
    collections: [],
    roles: ["super_admin"],
  },
  {
    dbName: "mba",
    label: "MBA",
    collections: ["students", "applications"],
  },
  {
    dbName: "mba-2026-landing-page",
    label: "MBA 2026 Landing Page",
    collections: [
      "mba-2026-reserve-seat",
      "mba-ask-2026",
      "mba-brochure-2026",
      "mba-speak-2026",
    ],
  },
  {
    dbName: "online-admission",
    label: "Online Admission",
    collections: [],
  },
  {
    dbName: "pipp-org",
    label: "PIPP Org",
    collections: [],
  },
  {
    dbName: "rvs-school",
    label: "RVS School",
    collections: [],
  },
  {
    dbName: "transformtech-ai",
    label: "TransformTech AI",
    collections: ["atheenquiries", "financeenquiries", "transformtechpilots"],
  },
  {
    dbName: "transformtech-in",
    label: "TransformTech IN",
    collections: ["contacts"],
  },
  {
    dbName: "transformtech-in-contact",
    label: "TransformTech IN Contact",
    collections: ["contacts"],
  },
] satisfies DatabaseRegistryEntry[];

export function getRegistryForRole(role: DatabaseRole) {
  return DB_REGISTRY.filter((entry) => {
    const roles = entry.roles as readonly DatabaseRole[] | undefined;

    return !roles || roles.includes(role);
  });
}

export function findDatabase(dbName: string) {
  return DB_REGISTRY.find((entry) => entry.dbName === dbName);
}

export function assertAllowedDatabase(dbName: string, role: DatabaseRole) {
  const entry = findDatabase(dbName);

  const roles = entry?.roles as readonly DatabaseRole[] | undefined;

  if (!entry || (roles && !roles.includes(role))) {
    throw new Error("Database is not allowed");
  }

  return entry;
}

export function assertAllowedCollection(
  dbName: string,
  collectionName: string,
  role: DatabaseRole,
) {
  const entry = assertAllowedDatabase(dbName, role);

  if (!entry.collections.includes(collectionName)) {
    throw new Error("Collection is not allowed");
  }

  return { database: entry, collectionName };
}
