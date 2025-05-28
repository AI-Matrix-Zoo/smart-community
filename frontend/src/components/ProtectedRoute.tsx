import { useContext } from 'react';
// Import React's specific named exports for type clarity
import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { LoadingSpinner } from './UIElements';

interface ProtectedRouteProps {
  // Explicitly type children as ReactElement, as it receives a single JSX element like <HomePage />
  children: ReactElement;
  requiredRoles?: UserRole[];
}

// The 'element' prop of react-router-dom's Route component expects React.ReactNode.
const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps): JSX.Element => {
  const auth = useContext(AuthContext);
  const location = useLocation();

  if (auth?.isLoadingAuth) {
    // This JSX <div> is a ReactElement, which is a valid ReactNode.
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!auth?.currentUser) {
    // The <Navigate /> component returns a ReactElement, which is a valid ReactNode.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(auth.currentUser.role)) {
    // The <Navigate /> component also returns a ReactElement.
    return <Navigate to="/" state={{ unauthorized: true, from: location }} replace />;
  }

  // The 'children' prop is a ReactElement, which is a valid ReactNode.
  return children;
};

export default ProtectedRoute;
