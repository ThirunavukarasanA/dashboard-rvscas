export type DatabaseRole = "super_admin" | "manager" | "viewer";

export type DatabaseRegistryEntry = {
  dbName: string;
  label: string;
  collections: string[];
  roles?: DatabaseRole[];
};

export type DashboardAccessUser = {
  role: DatabaseRole;
  allowedDatabases?: string[] | null;
};

export const DB_REGISTRY = [
  {
    dbName: "admin",
    label: "Admin",
    collections: [],
    roles: ["super_admin"],
  },
  {
    dbName: "brochure-leads",
    label: "Brochure Leads",
    collections: [
      "2024_landing_page_leads",
      "2024_overall_landing_page_leads",
      "2025_landing_page_leads",
      "2025_overall_landing_page_leads",
      "2026-ugpg-landing-page-enquiries",
      "admissionforms",
      "athe-contact-forms",
      "athes",
      "avcc-gender-harassment-cells",
      "avccantiraggingcells",
      "avccgrievancecells",
      "ayurvedahsptl_2024",
      "ayurvedahsptls",
      "businesswebinars",
      "callbackforms",
      "careerform_2024",
      "careerforms",
      "cii_netc_contacts",
      "cii_netc_registers",
      "cii_reserve_your_spots",
      "cii_write_to_us",
      "ciiforms",
      "commercewebinars",
      "financewebinars",
      "imsrbrouchureforms",
      "imsrcontactforms",
      "imsrforms",
      "imsrnewsletters",
      "management_development_programs",
      "mba-2026-reserve-seat",
      "mba-ask-2026",
      "mba-brochure-2026",
      "mba-speak-2026",
      "mcom_webinars",
      "mdpcoimbatores",
      "new-athe-forms",
      "pgsets",
      "pharmacyseminars",
      "pipp_contact_forms",
      "pipp_enquiry_forms",
      "pipp_ias_enquiry_forms",
      "rvscasinquiries",
      "rvsconscontactforms",
      "rvscptadmissions",
      "rvscptalumnis",
      "rvscptbrochures",
      "rvscptclinicbookings",
      "rvscptcourses",
      "rvscptenquires",
      "rvsschool_careers",
      "rvsschool_leads",
      "rvssulurenquires",
      "study-abroads",
      "studyatuks",
      "transformtechcontacts",
      "webinar-athes",
    ],
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
    collections: ["enrollments"],
  },
  {
    dbName: "local",
    label: "Local",
    collections: ["oplog.rs"],
    roles: ["super_admin"],
  },
  {
    dbName: "mba",
    label: "MBA",
    collections: ["blog_meta_contents", "faculties", "news_event_metas", "users"],
  },
  {
    dbName: "mba-2026-landnig-page",
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
    collections: [
      "admissions",
      "admissionyears",
      "contents",
      "departments",
      "enquires_forms",
      "institutions",
      "medicalcamps",
      "menus",
      "placements",
      "programmes",
      "roles",
      "states",
      "users",
      "yuva-brochure-lead-2023",
    ],
  },
  {
    dbName: "pipp-org",
    label: "PIPP Org",
    collections: ["enquiries"],
  },
  {
    dbName: "rvs-school",
    label: "RVS School",
    collections: ["contact_submissions"],
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

export function getRegistryForUser(user: DashboardAccessUser) {
  const allowedDatabases =
    user.allowedDatabases === null || user.allowedDatabases === undefined
      ? null
      : new Set(user.allowedDatabases);

  return getRegistryForRole(user.role).filter((entry) => {
    if (user.role === "super_admin" || !allowedDatabases) {
      return true;
    }

    return allowedDatabases.has(entry.dbName);
  });
}

export function getAssignableDatabasesForRole(role: DatabaseRole) {
  return DB_REGISTRY.filter((entry) => {
    const roles = entry.roles as readonly DatabaseRole[] | undefined;

    if (!roles) {
      return true;
    }

    return role === "super_admin" && roles.includes("super_admin");
  });
}

export function findDatabase(dbName: string) {
  return DB_REGISTRY.find((entry) => entry.dbName === dbName);
}

export function assertAllowedDatabase(
  dbName: string,
  role: DatabaseRole,
  allowedDatabases?: string[] | null,
) {
  const entry = findDatabase(dbName);

  const roles = entry?.roles as readonly DatabaseRole[] | undefined;
  const allowlist =
    allowedDatabases === null || allowedDatabases === undefined
      ? null
      : new Set(allowedDatabases);

  if (
    !entry ||
    (roles && !roles.includes(role)) ||
    (role !== "super_admin" && allowlist && !allowlist.has(dbName))
  ) {
    throw new Error("Database is not allowed");
  }

  return entry;
}

export function assertAllowedCollection(
  dbName: string,
  collectionName: string,
  role: DatabaseRole,
  allowedDatabases?: string[] | null,
) {
  const entry = assertAllowedDatabase(dbName, role, allowedDatabases);

  if (!entry.collections.includes(collectionName)) {
    throw new Error("Collection is not allowed");
  }

  return { database: entry, collectionName };
}
