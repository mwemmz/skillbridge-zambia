import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import CustomerDashboard from "./pages/CustomerDashboard.jsx";
import WorkerDashboard from "./pages/WorkerDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import WorkerProfile from "./pages/WorkerProfile.jsx";

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-brand-700">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={homeFor(user.role)} replace />;
  }
  return children;
}

function homeFor(role) {
  if (role === "worker") return "/worker";
  if (role === "admin") return "/admin";
  return "/customer";
}

function Shell({ children }) {
  return (
    <div className="flex h-full min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Routes>
      <Route path="/" element={<Shell><Landing /></Shell>} />
      <Route path="/login" element={<Shell><Login /></Shell>} />
      <Route path="/register" element={<Shell><Register /></Shell>} />
      <Route
        path="/customer"
        element={
          <Protected role="customer">
            <Shell>
              <CustomerDashboard />
            </Shell>
          </Protected>
        }
      />
      <Route
        path="/worker"
        element={
          <Protected role="worker">
            <Shell>
              <WorkerDashboard />
            </Shell>
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <Shell>
              <AdminDashboard />
            </Shell>
          </Protected>
        }
      />
      <Route
        path="/workers/:id"
        element={
          <Protected>
            <Shell>
              <WorkerProfile />
            </Shell>
          </Protected>
        }
      />
      <Route
        path="*"
        element={
          <Navigate to={user ? homeFor(user.role) : "/"} replace />
        }
      />
    </Routes>
  );
}
