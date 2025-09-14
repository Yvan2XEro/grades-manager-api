import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../../store';
import { motion } from 'framer-motion';

const AuthLayout: React.FC = () => {
  const { user } = useStore();

  // Redirect if already authenticated
  if (user) {
    return user.role === 'admin' ? (
      <Navigate to="/admin" replace />
    ) : (
      <Navigate to="/teacher" replace />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white shadow-xl rounded-xl p-8">
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-2xl font-bold text-primary-900">Academic Management System</h1>
            <p className="text-gray-600 mt-2 text-center">
              Streamline your institution's academic processes
            </p>
          </div>
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;