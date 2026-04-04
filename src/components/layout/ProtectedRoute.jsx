import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ hasPermission, permission, children }) => {
 if (!hasPermission(permission)) {
 return <Navigate to="/transactions" replace />;
 }
 return children;
};

export default ProtectedRoute;
