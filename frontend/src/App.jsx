import { Routes, Route, Navigate } from "react-router-dom"
import Navbar from "./components/Navbar"
import AICopilot from "./components/AICopilot"
import ProtectedRoute from "./components/ProtectedRoute"
import ErrorBoundary from "./components/ErrorBoundary"
import AdminLayout from "./components/AdminLayout"
import DoctorLayout from "./components/DoctorLayout"
import PatientLayout from "./components/PatientLayout"
import ProviderLayout from "./components/ProviderLayout"

import Home from "./pages/Home"
import Dashboard from "./pages/Dashboard"
import AdminLogin from "./pages/AdminLogin"
import AdminDashboard from "./pages/AdminDashboard"
import PatientLogin from "./pages/PatientLogin"
import PatientRegister from "./pages/PatientRegister"
import PatientDashboard from "./pages/PatientDashboard"
import PatientRequests from "./pages/PatientRequests"
import PatientSettings from "./pages/PatientSettings"
import ProviderLogin from "./pages/ProviderLogin"
import ProviderRegister from "./pages/ProviderRegister"
import ProviderDashboard from "./pages/ProviderDashboard"
import ProviderRequests from "./pages/ProviderRequests"
import ProviderEmailHistory from "./pages/ProviderEmailHistory"
import ProviderSettings from "./pages/ProviderSettings"
import DoctorLogin from "./pages/DoctorLogin"
import DoctorRegister from "./pages/DoctorRegister"
import DoctorDashboard from "./pages/DoctorDashboard"
import DoctorPatients from "./pages/DoctorPatients"
import DoctorRequests from "./pages/DoctorRequests"
import DoctorSettings from "./pages/DoctorSettings"
import RequestHistory from "./components/RequestHistory"

import UserManagement from "./pages/UserManagement"
import PolicyManagement from "./pages/PolicyManagement"
import SystemAnalytics from "./pages/SystemAnalytics"
import AdminAudit from "./pages/AdminAudit"
import AdminSettings from "./pages/AdminSettings"

export default function App() {
  return (
    <div>
      <Navbar />
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doctor-dashboard" element={
          <ProtectedRoute requiredRole="doctor"><DoctorLayout /></ProtectedRoute>
        }>
          <Route index element={<DoctorDashboard />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="requests" element={<DoctorRequests />} />
          <Route path="settings" element={<DoctorSettings />} />
        </Route>
        <Route path="/new-request" element={
          <ProtectedRoute requiredRole="doctor"><Dashboard /></ProtectedRoute>
        } />
        <Route path="/patient-dashboard" element={
          <ProtectedRoute requiredRole="patient"><PatientLayout /></ProtectedRoute>
        }>
          <Route index element={<PatientDashboard />} />
          <Route path="requests" element={<PatientRequests />} />
          <Route path="settings" element={<PatientSettings />} />
        </Route>
        <Route path="/provider-dashboard" element={
          <ProtectedRoute requiredRole="provider"><ProviderLayout /></ProtectedRoute>
        }>
          <Route index element={<ProviderDashboard />} />
          <Route path="requests" element={<ProviderRequests />} />
          <Route path="email-history" element={<ProviderEmailHistory />} />
          <Route path="settings" element={<ProviderSettings />} />
        </Route>
        <Route path="/login" element={<Navigate to="/admin-login" replace />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/doctor-register" element={<DoctorRegister />} />
        <Route path="/patient-login" element={<PatientLogin />} />
        <Route path="/patient-register" element={<PatientRegister />} />
        <Route path="/provider-login" element={<ProviderLogin />} />
        <Route path="/provider-register" element={<ProviderRegister />} />
        <Route path="/request-history" element={<RequestHistory />} />

        {/* Admin Layout routes */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="policies" element={<PolicyManagement />} />
          <Route path="analytics" element={<SystemAnalytics />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
      </ErrorBoundary>
      <AICopilot />
    </div>
  )
}
