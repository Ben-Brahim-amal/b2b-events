import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Home() {
    const { user } = useAuth();
    const [liveEvents, setLiveEvents] = useState([]);

    useEffect(() => {
        API.get('/events')
            .then(res => setLiveEvents(res.data.slice(0, 3)))
            .catch(() => {});
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 60% 50%, #3b1fa8 0%, #1a0533 40%, #0a0a1a 100%)', fontFamily: "'Segoe UI', sans-serif" }}>

            {/* Navbar */}
            <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#7c3aed' }}>⚡ B2B Events</span>
                </Link>
                <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                    <Link to="/" style={{ color: '#7c3aed', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>Home</Link>
                    <Link to="/events" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Evenements</Link>
                    {user ? (
                        <Link to="/dashboard" style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                            Dashboard
                        </Link>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Link to="/register" style={{ padding: '9px 20px', border: '2px solid #7c3aed', color: '#7c3aed', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                                S'inscrire
                            </Link>
                            <Link to="/login" style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                                Se connecter
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '80px 60px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ flex: 1, maxWidth: '550px' }}>
                    <span style={{ background: 'rgba(124,58,237,0.3)', color: '#c4b5fd', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                        ⚡ Plateforme B2B Evenements
                    </span>
                    <h1 style={{ fontSize: '3.2rem', fontWeight: '800', color: 'white', margin: '24px 0 16px', lineHeight: '1.15' }}>
                        Connectez-vous avec les <span style={{ color: '#a78bfa' }}>meilleurs acteurs</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '40px' }}>
                        Une plateforme moderne pour entrepreneurs et investisseurs. Participez a des evenements, echangez, et developpez votre reseau international.
                    </p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        {user ? (
                            <Link to="/dashboard" style={{ padding: '14px 32px', background: '#7c3aed', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', boxShadow: '0 4px 20px rgba(124,58,237,0.5)' }}>
                                Mon Dashboard →
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" style={{ padding: '14px 32px', background: '#7c3aed', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', boxShadow: '0 4px 20px rgba(124,58,237,0.5)' }}>
                                    Commencer →
                                </Link>
                                <Link to="/login" style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.08)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', border: '1px solid rgba(255,255,255,0.15)' }}>
                                    Se connecter
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Card decorative avec vrais événements */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', paddingLeft: '40px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', padding: '28px', width: '320px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <span style={{ color: 'white', fontWeight: '700' }}>📅 Evenements</span>
                            <span style={{ background: 'rgba(124,58,237,0.4)', color: '#c4b5fd', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>Live</span>
                        </div>

                        {liveEvents.length > 0 ? liveEvents.map(ev => (
                            <Link key={ev.id} to={`/events/${ev.id}/public`}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', marginBottom: '10px', textDecoration: 'none', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
                                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: '500', flex: 1, marginRight: '8px' }}>
                                    {ev.title.length > 22 ? ev.title.substring(0, 22) + '...' : ev.title}
                                </span>
                                <span style={{ background: ev.status === 'published' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)', color: ev.status === 'published' ? '#6ee7b7' : '#fcd34d', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>
                                    {ev.status === 'published' ? 'Ouvert' : 'Bientot'}
                                </span>
                            </Link>
                        )) : (
                            ['Business Summit Tunis', 'Networking Paris 2026', 'InvestForum Maroc'].map((ev, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', marginBottom: '10px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>{ev}</span>
                                    <span style={{ color: '#a78bfa', fontSize: '12px', fontWeight: '600' }}>Ouvert</span>
                                </div>
                            ))
                        )}

                        <Link to="/events" style={{ display: 'block', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', padding: '12px', borderRadius: '10px', textAlign: 'center', fontWeight: '600', fontSize: '14px', textDecoration: 'none', marginTop: '10px' }}>
                            Voir tous les evenements →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}