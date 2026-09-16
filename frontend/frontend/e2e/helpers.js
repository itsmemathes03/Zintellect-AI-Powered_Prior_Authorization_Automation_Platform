export function createToken(role) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ role, exp: 9999999999, sub: "test-user" }));
  return `${header}.${payload}.test-signature`;
}

export async function setupAuth(page, role) {
  const token = createToken(role);
  await page.addInitScript(({ token }) => {
    localStorage.setItem("access_token", token);
    const nameMap = {
      admin: "admin_name",
      doctor: "doctor_name",
      patient: "patient_name",
      provider: "provider_name",
    };
    if (nameMap[role]) {
      localStorage.setItem(nameMap[role], `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`);
    }
  }, { token });
}

export const adminPages = [
  { path: "/admin-dashboard", title: "Dashboard" },
  { path: "/admin-dashboard/users", title: "Users" },
  { path: "/admin-dashboard/policies", title: "Policies" },
  { path: "/admin-dashboard/analytics", title: "Analytics" },
  { path: "/admin-dashboard/audit", title: "Audit" },
  { path: "/admin-dashboard/settings", title: "Settings" },
];

export const doctorPages = [
  { path: "/doctor-dashboard", title: "Dashboard" },
  { path: "/doctor-dashboard/patients", title: "Patients" },
  { path: "/doctor-dashboard/requests", title: "Requests" },
  { path: "/doctor-dashboard/settings", title: "Settings" },
];

export const patientPages = [
  { path: "/patient-dashboard", title: "Dashboard" },
  { path: "/patient-dashboard/requests", title: "Requests" },
  { path: "/patient-dashboard/settings", title: "Settings" },
];

export const providerPages = [
  { path: "/provider-dashboard", title: "Dashboard" },
  { path: "/provider-dashboard/requests", title: "Requests" },
  { path: "/provider-dashboard/review-queue", title: "Review Queue" },
  { path: "/provider-dashboard/policies", title: "Policies" },
  { path: "/provider-dashboard/email-history", title: "Email History" },
  { path: "/provider-dashboard/settings", title: "Settings" },
];

export const roleConfigs = {
  admin: { role: "admin", pages: adminPages, sidebarColor: "blue" },
  doctor: { role: "doctor", pages: doctorPages, sidebarColor: "cyan" },
  patient: { role: "patient", pages: patientPages, sidebarColor: "rose" },
  provider: { role: "provider", pages: providerPages, sidebarColor: "emerald" },
};
