import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import MedicalFeatures from "./components/MedicalFeatures";
import TrustedDoctors from "./components/TrustedDoctors";
import Footer from "./components/Footer";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import RegistrationSuccess from "./Pages/RegistrationSuccess";
import EmailVerificationSuccess from "./Pages/EmailVerificationSuccess";
import DoctorDashboard from "./Pages/DoctorDashboard";
import PatientDashboard from "./Pages/PatientDashboard";
import SuperAdminDashboard from "./Pages/SuperAdminDashboard";
import Profile from "./Pages/Profile";
import DoctorMessages from "./Pages/DoctorMessages";
import PatientMessages from "./Pages/PatientMessages";
import MessagingPage from "./Pages/MessagingPage";
import HelpChatWidget from "./components/HelpChatWidget";
import { ToastProvider } from "./components/Toast";
import DoctorProfile from "./Pages/DoctorProfile";
import { checkSessionOnStartup } from "./utils/auth";
import ForgetPassword from "./Pages/ForgetPassword";
import ResetPassword from "./Pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";

function getRoleFromStorageOrToken(): string {
  const stored = (localStorage.getItem('role') || '').toLowerCase();
  if (stored) return stored;
  const token = localStorage.getItem('access_token');
  if (!token) return '';
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload));
    return (json?.role || '').toLowerCase();
  } catch {
    return '';
  }
}

function PatientMessagesRoute() {
  const role = getRoleFromStorageOrToken();
  if (role === 'doctor') return <Navigate to="/doctor/messages" replace />;
  return <PatientMessages />;
}

function DoctorMessagesRoute() {
  const role = getRoleFromStorageOrToken();
  if (role !== 'doctor') return <Navigate to="/patient/messages" replace />;
  return <DoctorMessages />;
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check session validity on app startup
    const checkSession = async () => {
      try {
        await checkSessionOnStartup();
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ToastProvider>
      <div className="min-h-screen bg-background w-full">
        <Routes>
          {/* Main Homepage */}
          <Route path="/" element={
            <>
              <Navbar />
              <Hero />
              <MedicalFeatures />
              <Services />
              <TrustedDoctors />
              <Footer />
            </>
          } />

          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/registration-success" element={<RegistrationSuccess />} />
          <Route path="/verify-email/:token" element={<EmailVerificationSuccess />} />
          <Route path="/forget-password" element={<ForgetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Dashboard Routes */}
          <Route path="/doctor-dashboard" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/messages" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorMessagesRoute /></ProtectedRoute>} />
          <Route path="/patient-dashboard" element={<ProtectedRoute allowedRoles={["user", "doctor"]}><PatientDashboard /></ProtectedRoute>} />
          <Route path="/patient/messages" element={<ProtectedRoute allowedRoles={["user", "doctor"]}><PatientMessagesRoute /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
          <Route path="/doctors/:id" element={<DoctorProfile />} />
          <Route path="/super-admin-dashboard" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminDashboard /></ProtectedRoute>} />

          {/* Profile Route */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
        <HelpChatWidget />
      </div>
      </ToastProvider>
    </Router>
  );
}

export default App;