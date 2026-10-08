import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

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
        return user.email?.[0]?.toUpperCase() || '?';
    };

    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    return (
        <nav style={{
            background: 'white', borderBottom: '1px solid #e5e7eb',
            padding: '0 40px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', height: '64px', position: 'sticky',
            top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#7c3aed' }}>B2B Events</span>
            </Link>

            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                <Link to="/events" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Events</Link>
                <Link to="/participants" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Participants</Link>
                
                {user ? (
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <button onClick={() => setShowDropdown(!showDropdown)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '40px', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <span style={{ color: '#374151', fontSize: '14px', fontWeight: '600', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                Hello {user.email?.split('@')[0]}
                            </span>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: '800', fontSize: '14px',
                                border: '2px solid #ede9fe'
                            }}>
                                {getInitials()}
                            </div>
                        </button>

                        {showDropdown && (
                            <div style={{
                                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                                background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                border: '1px solid #f1f5f9', minWidth: '200px',
                                overflow: 'hidden', zIndex: 200, borderRadius: '12px'
                            }}>
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#faf5ff' }}>
                                    <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>
                                        {user.email}
                                    </div>
                                    <div style={{ color: '#7c3aed', fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>
                                        {isAdmin ? 'Administrator' : 'User'}
                                    </div>
                                </div>

                                {[
                                    { label: 'Account Settings', path: '/profile' },
                                    { label: 'My Registrations', path: '/dashboard' },
                                    ...(isAdmin ? [{ label: 'Admin Dashboard', path: '/admin' }] : []),
                                ].map(item => (
                                    <button key={item.label}
                                        onClick={() => { navigate(item.path); setShowDropdown(false); }}
                                        style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#374151', fontWeight: '500', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                        {item.label}
                                    </button>
                                ))}

                                <div style={{ borderTop: '1px solid #f1f5f9' }}>
                                    <button onClick={() => { logout(); navigate('/'); setShowDropdown(false); }}
                                        style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#ef4444', fontWeight: '600', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                        Logout
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
                            Sign Up
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}