import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeManagement from "./pages/EmployeeManagement";
import PayrollGenerator from "./pages/PayrollGenerator";
import Layout from "./components/Layout";
import Leaves from "./pages/Leaves";
import Overtime from "./pages/Overtime";
import History from "./pages/History";
import Timesheet from "./pages/Timesheet";
import CashAdvances from "./pages/CashAdvances";
import HolidayManagement from "./pages/HolidayManagement";
import Profile from "./pages/Profile";

// Dynamic Authentication & Role Guard
function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") || "Employee";

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Authenticated Layout Wrapper */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leaves" element={<Leaves />} />
            <Route path="/overtime" element={<Overtime />} />
            <Route path="/history" element={<History />} />
            <Route path="/timesheet" element={<Timesheet />} />
            <Route path="/cash-advances" element={<CashAdvances />} />
            <Route path="/profile" element={<Profile />} />

            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
              <Route path="/employees" element={<EmployeeManagement />} />
              <Route path="/holidays" element={<HolidayManagement />} />
              <Route path="/payroll" element={<PayrollGenerator />} />
              <Route path="/cash-advances" element={<CashAdvances />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
