import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
    const { login } = useAuth();
    const [status, setStatus] = useState('Connexion en cours...');

    useEffect(() => {
        // Lire depuis le fragment (#) ou le query param (?)
        const hash = window.location.hash;
        const search = window.location.search;
        
        console.log('Hash:', hash);
        console.log('Search:', search);
        
        // Essayer d'abord le fragment
        let token = null;
        if (hash.includes('token=')) {
            token = hash.split('token=')[1];
        } else {
            const params = new URLSearchParams(search);
            token = params.get('token');
        }

        console.log('Token:', token ? 'TROUVÉ' : 'NON TROUVÉ');

        if (token) {
            setStatus('Token trouvé ! Connexion...');
            localStorage.setItem('token', token);
            login(token);
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 300);
        } else {
            setStatus('Erreur de connexion');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        }
    }, []);

    return (
        <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Segoe UI', color: '#64748b' }}>
            {status}
        </div>
    );
}