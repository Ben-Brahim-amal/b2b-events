/*import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav style={{
            background: 'linear-gradient(135deg, #1a0533, #3b1fa8)',
            padding: '16px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>⚡ B2B Events</span>
            </Link>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Link to="/events" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: '500' }}>
                    Evenements
                </Link>
                <Link to="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: '500' }}>
                    Dashboard
                </Link>

                {user ? (
                    <>
                        
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                             {user.email}
                        </span>
                        <button onClick={handleLogout} style={{
                            padding: '8px 20px', background: '#ef4444', color: 'white',
                            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                        }}>
                            Deconnexion
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={{
                            color: 'white', textDecoration: 'none', fontWeight: '600',
                            padding: '8px 20px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px'
                        }}>
                            Connexion
                        </Link>
                        <Link to="/register" style={{
                            color: 'white', textDecoration: 'none', fontWeight: '600',
                            padding: '8px 20px', background: '#7c3aed', borderRadius: '8px'
                        }}>
                            S'inscrire
                        </Link>
                    </>
                )}
                {user?.roles?.includes('ROLE_ADMIN') && (
                    <Link to="/admin" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: '700' }}>
                        Admin
                    </Link>
                )}
            </div>
        </nav>
    );
}*/
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Fermer le dropdown si on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = () => {
        if (!user) return '?';
        const email = user.email || '';
        return email[0]?.toUpperCase() || '?';
    };

    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    return (
        <nav style={{
            background: 'white', borderBottom: '1px solid #e5e7eb',
            padding: '0 40px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', height: '64px', position: 'sticky',
            top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
            {/* Logo */}
            <Link to="/" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#7c3aed' }}> B2B Events</span>
            </Link>

            {/* Links */}
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                <Link to="/events" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Evenements</Link>
                <Link to="/participants" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Participants</Link>
                <Link to="/marketplace" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Marketplace</Link>

                {user ? (
                    /* Avatar + Dropdown */
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <button onClick={() => setShowDropdown(!showDropdown)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '40px', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>

                            {/* Avatar */}
                             <span style={{ color: '#374151', fontSize: '14px', fontWeight: '600', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                               Hello {user.email?.split('@')[0]}
                            </span>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: '800', fontSize: '14px',
                                border: '2px solid #ede9fe', overflow: 'hidden'
                            }}>
                                {getInitials()}
                            </div>

                           </button>

                        {/* Dropdown */}
                        {showDropdown && (
                            <div style={{
                                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                                background: 'white', 
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                border: '1px solid #f1f5f9', minWidth: '150px',
                                overflow: 'hidden', zIndex: 200
                            }}>
                                {/* Info user */}
                                <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', background: '#faf5ff' }}>
                                    <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>
                                        {user.email}
                                    </div>
                                    <div style={{ color: '#7c3aed', fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>
                                        {isAdmin ? ' Administrateur' : ' Utilisateur'}
                                    </div>
                                </div>

                                {/* Menu items */}
                                {[
                                    {  label: 'paramètres du compte', path: '/profile' },
                                    {  label: 'Mes inscriptions', path: '/dashboard' },
                                    ...(isAdmin ? [{ label: 'Dashboard Admin', path: '/admin' }] : []),
                                ].map(item => (
                                    <button key={item.label}
                                        onClick={() => { navigate(item.path); setShowDropdown(false); }}
                                        style={{ width: '100%', padding: '10px 5px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '12px', color: '#374151', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                        <span>{item.icon}</span> {item.label}
                                    </button>
                                ))}

                                {/* Logout */}
                                <div style={{ borderTop: '1px solid #f1f5f9' }}>
                                    <button onClick={() => { logout(); navigate('/login'); setShowDropdown(false); }}
                                        style={{ width: '100%', padding: '10px 15px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '12px', color: '#ef4444', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                         Deconnexion
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link to="/login" style={{ padding: '8px 18px', background: 'none', border: '2px solid #7c3aed', color: '#7c3aed', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                            Login
                        </Link>
                        <Link to="/register" style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                            S'inscrire
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}