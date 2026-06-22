import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import Contacts from './pages/Contacts';
import RoomDetail from './pages/RoomDetail';
import Profile from './pages/Profile';

// Route Guard for Protected Pages
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole?: 'customer' | 'admin';
}

function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans">
        <div>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/about" element={<About />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/rooms/:id" element={<RoomDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer Protected Route */}
            <Route 
              path="/my-bookings" 
              element={
                <ProtectedRoute allowedRole="customer">
                  <MyBookings />
                </ProtectedRoute>
              } 
            />

            {/* Profile Protected Route */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Admin Protected Route */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-100 bg-slate-50 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-6">
            <p>© {new Date().getFullYear()} SpaceBook Coworking. Crafted with precision for Academic Research.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
