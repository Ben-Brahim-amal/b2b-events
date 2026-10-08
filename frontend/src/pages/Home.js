import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Home() {
    const { user } = useAuth();
    const [liveEvents, setLiveEvents] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        API.get('/events')
            .then(res => setLiveEvents(res.data.slice(0, 3)))
            .catch(() => {});

        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 60% 50%, #3b1fa8 0%, #1a0533 40%, #0a0a1a 100%)', fontFamily: "'Segoe UI', sans-serif" }}>

            {/* Navbar */}
            <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: isMobile ? '0 16px' : '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#7c3aed' }}>B2B Events</span>
                </Link>
                <div style={{ display: 'flex', gap: isMobile ? '12px' : '32px', alignItems: 'center' }}>
                    {!isMobile && (
                        <>
                            <Link to="/" style={{ color: '#7c3aed', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>Home</Link>
                            <Link to="/events" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Events</Link>
                        </>
                    )}
                    {user ? (
                        <Link to="/dashboard" style={{ padding: isMobile ? '8px 14px' : '9px 20px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                            Dashboard
                        </Link>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {!isMobile && (
                                <Link to="/register" style={{ padding: '9px 20px', border: '2px solid #7c3aed', color: '#7c3aed', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                                    Sign Up
                                </Link>
                            )}
                            <Link to="/login" style={{ padding: isMobile ? '8px 14px' : '9px 20px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                                Login
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero */}
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isMobile ? '40px 20px' : '80px 60px',
                maxWidth: '1200px',
                margin: '0 auto',
                gap: isMobile ? '40px' : '0'
            }}>
                {/* Left — Text */}
                <div style={{ flex: 1, maxWidth: isMobile ? '100%' : '550px', textAlign: isMobile ? 'center' : 'left' }}>
                    <span style={{ background: 'rgba(124,58,237,0.3)', color: '#c4b5fd', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                        B2B Events Platform
                    </span>
                    <h1 style={{ fontSize: isMobile ? '2rem' : '3.2rem', fontWeight: '800', color: 'white', margin: '24px 0 16px', lineHeight: '1.15' }}>
                        Connect with the <span style={{ color: '#a78bfa' }}>best business players</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? '0.95rem' : '1.05rem', lineHeight: '1.7', marginBottom: '40px' }}>
                        A modern platform for entrepreneurs and investors. Attend events, network, and grow your international business connections.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: isMobile ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
                        {user ? (
                            <Link to="/dashboard" style={{ padding: '14px 32px', background: '#7c3aed', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', boxShadow: '0 4px 20px rgba(124,58,237,0.5)' }}>
                                My Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" style={{ padding: '14px 32px', background: '#7c3aed', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', boxShadow: '0 4px 20px rgba(124,58,237,0.5)' }}>
                                    Get Started
                                </Link>
                                <Link to="/login" style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.08)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', border: '1px solid rgba(255,255,255,0.15)' }}>
                                    Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Right — Live Events Card */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', paddingLeft: isMobile ? '0' : '40px', width: isMobile ? '100%' : 'auto' }}>
                    <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', padding: '28px', width: isMobile ? '100%' : '320px', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <span style={{ color: 'white', fontWeight: '700' }}>Live Events</span>
                            <span style={{ background: 'rgba(124,58,237,0.4)', color: '#c4b5fd', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>Live</span>
                        </div>

                        {liveEvents.length > 0 ? liveEvents.map(ev => (
                            <Link key={ev.id} to={`/events/${ev.id}/public`}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', marginBottom: '10px', textDecoration: 'none' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
                                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: '500', flex: 1, marginRight: '8px' }}>
                                    {ev.title.length > 22 ? ev.title.substring(0, 22) + '...' : ev.title}
                                </span>
                                <span style={{ background: ev.status === 'published' ? 'rgba(16,185,129,0.3)' : 'rgba(185,16,16,0.3)', color: ev.status === 'published' ? '#6ee7b7' : '#fc4d4d', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>
                                    {ev.status === 'published' ? 'Open' : 'Closed'}
                                </span>
                            </Link>
                        )) : (
                            ['B2B event', 'Business Summit', 'Tech Event'].map((ev, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', marginBottom: '10px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>{ev}</span>
                                </div>
                            ))
                        )}

                        <Link to="/events" style={{ display: 'block', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', padding: '12px', borderRadius: '10px', textAlign: 'center', fontWeight: '600', fontSize: '14px', textDecoration: 'none', marginTop: '10px' }}>
                            View all events
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}