import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';

export default function Participants() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const eventId = searchParams.get('eventId');

    const [participants, setParticipants] = useState([]);
    const [eventInfo, setEventInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeRoles, setActiveRoles] = useState([]);
    const [activeCountries, setActiveCountries] = useState([]);
    const [selectedParticipant, setSelectedParticipant] = useState(null);

    useEffect(() => {
        if (eventId) {
            // ← Charger seulement les participants de cet événement
            API.get(`/events/${eventId}/participants`)
                .then(res => { setParticipants(res.data); setLoading(false); })
                .catch(() => setLoading(false));

            // Charger les infos de l'événement
            API.get(`/events/${eventId}`)
                .then(res => setEventInfo(res.data))
                .catch(() => {});
        } else {
            // ← Charger tous les participants
            API.get('/participants')
                .then(res => { setParticipants(res.data); setLoading(false); })
                .catch(() => setLoading(false));
        }
    }, [eventId]);

    // ... reste du code identique

    const toggleRole = (role) => setActiveRoles(prev =>
        prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );

    const toggleCountry = (country) => setActiveCountries(prev =>
        prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );

    const filtered = participants.filter(p => {
        const matchRole = activeRoles.length === 0 || activeRoles.includes(p.userRole);
        const matchCountry = activeCountries.length === 0 || activeCountries.includes(p.country);
        const matchSearch = search === '' ||
            p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            p.email?.toLowerCase().includes(search.toLowerCase()) ||
            p.bio?.toLowerCase().includes(search.toLowerCase()) ||
            p.company?.toLowerCase().includes(search.toLowerCase());
        return matchRole && matchCountry && matchSearch;
    });

    const roles = [...new Set(participants.map(p => p.userRole).filter(Boolean))];
    const countries = [...new Set(participants.map(p => p.country).filter(Boolean))];
    const countByRole = (role) => participants.filter(p => p.userRole === role).length;
    const countByCountry = (c) => participants.filter(p => p.country === c).length;

    const roleConfig = {
    };

    const getInitials = (fullName) => {
        if (!fullName) return '??';
        const parts = fullName.trim().split(' ');
        return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
    };

   
    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748b', fontFamily: 'Segoe UI' }}>
            Chargement...
        </div>
    );

return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', sans-serif" }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1a0533 0%, #7c3aed 100%)', color: 'white', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {eventInfo ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <button onClick={() => navigate(`/events/${eventId}/public`)}
                                style={{ background: 'rgba(44, 20, 105, 0)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}>
                                ← {eventInfo.title}
                            </button>
                        </div>
                        
                        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 8px' }}>
                             Participants de l'événement
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '15px' }}>
                            {eventInfo.title} — {eventInfo.date}
                        </p>
                    </>
                ) : (
                    <>
                        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 8px' }}>👥 Participants</h1>
                        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '15px' }}>
                            Decouvrez et connectez-vous avec les participants B2B
                        </p>
                    </>
                )}
            </div>
        </div>
        {/* ... reste du code ... */}

            {/* Main */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px', display: 'flex', gap: '28px', alignItems: 'flex-start' }}>

                {/* Sidebar */}
                <div style={{ width: '260px', flexShrink: 0 }}>

                    {/* Stats */}
                    <div style={{ background: 'white', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1a1a2e' }}>{filtered.length}</div>
                        <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                            Participant{filtered.length > 1 ? 's' : ''} trouve{filtered.length > 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Search */}
                    <div style={{ background: 'white', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <div style={{ position: 'relative' }}>
                            <input type="text" placeholder="Nom, email, bio..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                        </div>
                    </div>

                    {/* Filtre par rôle */}
                    <div style={{ background: 'white', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>
                            Rôle
                        </label>
                        {roles.map(role => {
                            const cfg = roleConfig[role] || { label: role, color: '#64748b', bg: '#f1f5f9', border: '#e5e7eb' };
                            const isActive = activeRoles.includes(role);
                            return (
                                <button key={role} onClick={() => toggleRole(role)}
                                    style={{ width: '100%', padding: '10px 14px', marginBottom: '8px', border: `2px solid ${isActive ? cfg.color : '#e5e7eb'}`, borderRadius: '10px', background: isActive ? cfg.bg : 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '700', color: isActive ? cfg.color : '#64748b', fontSize: '13px' }}>
                                        {cfg.label}
                                    </span>
                                    <span style={{ background: isActive ? cfg.color : '#e5e7eb', color: isActive ? 'white' : '#64748b', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                                        {countByRole(role)}
                                    </span>
                                </button>
                            );
                        })}
                        {activeRoles.length > 0 && (
                            <button onClick={() => setActiveRoles([])}
                                style={{ width: '100%', padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px', textDecoration: 'underline' }}>
                                Effacer
                            </button>
                        )}
                    </div>

                    {/* Filtre par pays */}
                    {countries.length > 0 && (
                        <div style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>
                                 Pays
                            </label>
                            {countries.slice(0, 8).map(country => {
                                const isActive = activeCountries.includes(country);
                                return (
                                    <button key={country} onClick={() => toggleCountry(country)}
                                        style={{ width: '100%', padding: '8px 14px', marginBottom: '6px', border: `2px solid ${isActive ? '#7c3aed' : '#e5e7eb'}`, borderRadius: '8px', background: isActive ? '#ede9fe' : 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '600', color: isActive ? '#7c3aed' : '#64748b', fontSize: '13px' }}>
                                            {country}
                                        </span>
                                        <span style={{ background: isActive ? '#7c3aed' : '#e5e7eb', color: isActive ? 'white' : '#64748b', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                                            {countByCountry(country)}
                                        </span>
                                    </button>
                                );
                            })}
                            {activeCountries.length > 0 && (
                                <button onClick={() => setActiveCountries([])}
                                    style={{ width: '100%', padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px', textDecoration: 'underline' }}>
                                    Effacer
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Cards */}
                <div style={{ flex: 1 }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 40px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                            <h3 style={{ color: '#1a1a2e' }}>Aucun participant trouve</h3>
                            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Essayez d'autres filtres.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {filtered.map(p => {
                                const cfg = roleConfig[p.userRole] || { label: p.userRole, color: '#64748b', bg: '#f1f5f9', border: '#e5e7eb' };
                                return (
                                    <div key={p.id} onClick={() => setSelectedParticipant(p)}
                                        style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', display: 'flex', gap: '20px', alignItems: 'flex-start', cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>

                                        {/* Avatar */}
                                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',  fontWeight: '800', fontSize: '18px', flexShrink: 0, border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                                            {getInitials(p.fullName)}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                                <h3 style={{ margin: 0, color: '#1a1a2e', fontSize: '1rem', fontWeight: '800' }}>{p.fullName}</h3>
                                                <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                                    {cfg.label}
                                                </span>
                                            </div>

                                            {p.company && (
                                                <div style={{ color: '#7c3aed', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                                                    {p.company}
                                                </div>
                                            )}

                                            {p.bio && (
                                                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', margin: '0 0 10px' }}>
                                                    {p.bio.length > 120 ? p.bio.substring(0, 120) + '...' : p.bio}
                                                </p>
                                            )}

                                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                                {p.country && (
                                                    <span style={{ color: '#94a3b8', fontSize: '12px' }}> {p.country}</span>
                                                )}
                                                {p.email && (
                                                    <span style={{ color: '#94a3b8', fontSize: '12px' }}> {p.email}</span>
                                                )}
                                            </div>
                                        </div>

                                        <button onClick={e => { 
                                            e.stopPropagation(); 
                                            navigate(`/participants/${p.id}${eventId ? `?eventId=${eventId}` : ''}`); 
                                        }}
                                            style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', flexShrink: 0 }}>
                                            Voir profil →
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal aperçu rapide */}
            {selectedParticipant && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
                    onClick={() => setSelectedParticipant(null)}>
                    <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                        onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div style={{ background: 'linear-gradient(135deg, #1a0533, #7c3aed)', padding: '32px', textAlign: 'center', color: 'white' }}>
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%',  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.5rem', margin: '0 auto 12px', border: '3px solid rgba(255,255,255,0.3)' }}>
                                {getInitials(selectedParticipant.fullName)}
                            </div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: '800' }}>{selectedParticipant.fullName}</h3>
                            <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                                {roleConfig[selectedParticipant.userRole]?.label || selectedParticipant.userRole}
                            </span>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '24px' }}>
                            {selectedParticipant.bio && (
                                <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '14px', margin: '0 0 20px' }}>
                                    {selectedParticipant.bio}
                                </p>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                {[
                                    {  label: 'Email', value: selectedParticipant.email },
                                    {  label: 'Pays', value: selectedParticipant.country },
                                    {  label: 'Entreprise', value: selectedParticipant.company },
                                ].filter(item => item.value).map(({ icon, label, value }) => (
                                    <div key={label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px' }}>
                                        <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>{icon} {label}</div>
                                        <div style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '13px', wordBreak: 'break-all' }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setSelectedParticipant(null)}
                                    style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                                    Fermer
                                </button>
                               <button onClick={() => { 
                                if (selectedParticipant) {
                                    navigate(`/participants/${selectedParticipant.id}${eventId ? `?eventId=${eventId}` : ''}`); 
                                    setSelectedParticipant(null); 
                                }
                                }}
                                    style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                                    Voir profil complet →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}