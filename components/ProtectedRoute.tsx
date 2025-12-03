import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
    isAllowed: boolean;
    redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    isAllowed,
    redirectTo = '/'
}) => {
    if (!isAllowed) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
};
