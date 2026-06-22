import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || "";
      if (url.includes("/admin/login") || url.includes("/admin/doctor-login")) {
        return Promise.reject(error);
      }
      localStorage.clear();
      window.location.href = "/admin-login";
    }
    return Promise.reject(error);
  }
);

// Admin API methods
export const adminLogin = (data) => api.post("/admin/login", data);
export const doctorLogin = (data) => api.post("/admin/doctor-login", data);

export const getAdminUsers = (params) => api.get("/admin/users", { params });
export const createUser = (data) => api.post("/admin/users", data);
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

export const getAdminPolicies = (params) => api.get("/admin/policies", { params });
export const updatePolicyStatus = (id, data) => api.patch(`/admin/policies/${id}`, data);

export const getAdminAnalytics = () => api.get("/admin/analytics");
export const getAdminAudit = (params) => api.get("/admin/audit", { params });
export const getAdminEvents = (params) => api.get("/admin/events", { params });

export const getAdminSettings = () => api.get("/admin/settings");
export const updateAdminSettings = (data) => api.patch("/admin/settings", data);

export const adminForgotPassword = (data) => api.post("/admin/forgot-password", data);
export const adminResetPassword = (data) => api.post("/admin/reset-password", data);

// Doctor API methods
export const doctorRegister = (data) => api.post("/doctor/register", data);
export const getDoctorProfile = () => api.get("/doctor/profile");
export const updateDoctorProfile = (data) => api.put("/doctor/profile", data);
export const getDoctorRequests = (params) => api.get("/doctor/requests", { params });
export const getDoctorPatients = (params) => api.get("/doctor/patients", { params });
export const getDoctorStats = () => api.get("/doctor/stats");
export const getDoctorNotifications = () => api.get("/doctor/notifications");

// Patient API methods
export const patientRegister = (data) => api.post("/patient/register", data);
export const patientLogin = (data) => api.post("/patient/login", data);
export const getPatientProfile = () => api.get("/patient/profile");
export const updatePatientProfile = (data) => api.put("/patient/profile", data);
export const getPatientRequests = (params) => api.get("/patient/requests", { params });
export const getPatientStats = () => api.get("/patient/stats");
export const getPatientNotifications = () => api.get("/patient/notifications");

// Provider API methods
export const providerUnifiedRegister = (data) => api.post("/provider/register", data);
export const providerUnifiedLogin = (data) => api.post("/provider/login", data);
export const getProviderProfile = () => api.get("/provider/profile");
export const updateProviderProfile = (data) => api.put("/provider/profile", data);
export const getProviderRequests = (params) => api.get("/provider/requests", { params });
export const getProviderStats = () => api.get("/provider/stats");
export const getProviderNotifications = () => api.get("/provider/notifications");

export default api;
