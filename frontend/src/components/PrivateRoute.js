import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#7c3aed' }}>
            Loading...
        </div>
    );

    return user ? children : <Navigate to="/login" replace />;
}