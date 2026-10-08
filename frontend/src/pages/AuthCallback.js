import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
    const { login } = useAuth();
    const [status, setStatus] = useState('Connecting...');

    useEffect(() => {
        const hash = window.location.hash;
        const search = window.location.search;

        let token = null;
        if (hash.includes('token=')) {
            token = hash.split('token=')[1];
        } else {
            const params = new URLSearchParams(search);
            token = params.get('token');
        }

        if (token) {
            setStatus('Token found! Logging in...');
            localStorage.setItem('token', token);
            login(token);
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 300);
        } else {
            setStatus('Connection error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        }
    }, [login]);

    return (
        <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Segoe UI', color: '#64748b' }}>
            {status}
        </div>
    );
}