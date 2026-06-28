import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  // If user token is not present in storage, redirect to login
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // If page requires specific role, verify permissions
  if (allowedRoles) {
    const role = authService.getRole();
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
