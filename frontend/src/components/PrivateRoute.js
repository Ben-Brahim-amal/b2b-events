import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#7c3aed' }}>
            Chargement...
        </div>
    );

    return user ? children : <Navigate to="/login" replace />;
}/*
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
    const { user } = useAuth();
    const token = localStorage.getItem('token');
    if (!token || !user) return <Navigate to="/login" replace />;
    return children;
}*/