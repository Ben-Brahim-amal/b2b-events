import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';

export default function EventPublic() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // ── TOUS les useState EN HAUT ──
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activePage, setActivePage] = useState(null);
    const [message, setMessage] = useState('');
    const [eventParticipants, setEventParticipants] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [step, setStep] = useState(1);
    const [participationType, setParticipationType] = useState('');
    const [profileForm, setProfileForm] = useState({
        firstName: '', lastName: '', phone: '',
        organisation: '', country: '', bio: ''
    });
    const [registering, setRegistering] = useState(false);
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);
    const [registrationStatus, setRegistrationStatus] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [opportunityForm, setOpportunityForm] = useState({
        type: '', title: '', description: '', photos: []
    });

    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        API.get(`/events/${id}`)
            .then(res => {
                setEvent(res.data);
                if (res.data.schedules) setSchedules(res.data.schedules);
                setActivePage(null);
                setLoading(false);
            }).catch(() => setLoading(false));

        API.get(`/events/${id}/participants`)
            .then(res => setEventParticipants(res.data))
            .catch(() => {});

        const token = localStorage.getItem('token');
        if (token) {
            API.get('/me').then(res => {
                setProfileForm({
                    firstName: res.data.firstName || '',
                    lastName: res.data.lastName || '',
                    phone: res.data.phone || '',
                    organisation: res.data.organisation || '',
                    country: res.data.country || '',
                    bio: res.data.bio || '',
                });
            }).catch(() => {});

            API.get('/events/my/registrations')
                .then(res => {
                    const found = res.data.find(r => r.event?.id === parseInt(id));
                    if (found) {
                        setRegistrationStatus(found.status);
                        if (found.status === 'accepted') setAlreadyRegistered(true);
                    }
                }).catch(() => {});
        }

        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [id]);

    const handleOpenModal = () => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        setStep(1);
        setParticipationType('');
        setShowModal(true);
    };

    const handlePhotoUpload = async (file) => {
        if (!file) return;
        setUploadingPhoto(true);
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:8081/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.filename) {
                setOpportunityForm(prev => ({
                    ...prev,
                    photos: [...prev.photos, data.filename]
                }));
            }
        } catch { setMessage('❌ Erreur upload photo.'); }
        setUploadingPhoto(false);
    };

    const handleConfirmRegistration = async () => {
        setRegistering(true);
        try {
            await API.put('/profile', profileForm);
            await API.post(`/events/${id}/register`, { participationType });
            if (opportunityForm.type && opportunityForm.title.trim()) {
                await API.post('/opportunities', opportunityForm);
            }
            setMessage('✅ Inscription envoyee ! En attente de validation.');
            setRegistrationStatus('pending');
            setShowModal(false);
        } catch (err) {
            setMessage('❌ ' + (err.response?.data?.message || 'Erreur.'));
        }
        setRegistering(false);
    };

    // ── Early returns APRÈS tous les hooks ──
    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748b', fontFamily: 'Segoe UI' }}>
            Chargement...
        </div>
    );

    if (!event) return (
        <div style={{ textAlign: 'center', padding: '80px', color: '#ef4444', fontFamily: 'Segoe UI' }}>
            Evenement non trouve.
        </div>
    );

    // ── Ces variables APRÈS les early returns ──
    const activePages = event.pages?.filter(p => p.isActive) || [];
    const currentPage = activePages.find(p => p.id === activePage);
    const isFull = event.nbInscrits >= event.nbParticipants;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', sans-serif" }}>

            {/* ── Navbar ── */}
            <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#7c3aed' }}> B2B Events</span>
                </Link>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <Link to="/events" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Evenements</Link>
                    <Link to="/participants" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Participants</Link>
                    <Link to="/marketplace" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}> Marketplace</Link>

                    {user ? (
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <button onClick={() => setShowDropdown(!showDropdown)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '40px' }}>
                                <span style={{ color: '#374151', fontSize: '14px', fontWeight: '600', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                   Hello {user.email?.split('@')[0]}
                                </span>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '14px', border: '2px solid #ede9fe' }}>
                                    {user.email?.[0]?.toUpperCase()}
                                </div>
                            </button>
                            {showDropdown && (
                                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #f1f5f9', minWidth: '150px', overflow: 'hidden', zIndex: 200 }}>
                                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', background: '#faf5ff' }}>
                                        <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{user.email}</div>
                                    </div>
                                    {[
                                        { label: 'Account Settings', path: '/profile' },
                                        {  label: 'Mes inscriptions', path: '/dashboard' },
                                    ].map(item => (
                                        <button key={item.label} onClick={() => { navigate(item.path); setShowDropdown(false); }}
                                            style={{ width: '100%', padding: '10px 5px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '12px', color: '#374151', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                            <span>{item.icon}</span> {item.label}
                                        </button>
                                    ))}
                                    <div style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <button onClick={() => { logout(); navigate('/login'); }}
                                            style={{ width: '100%', padding: '10px 15px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '12px', color: '#ef4444', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                             Deconnexion
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                            Login
                        </Link>
                    )}
                </div>
            </nav>

            {/* ── Cover ── */}
            <div style={{ position: 'relative' }}>
                <div style={{
                    width: '100%', height: '400px',
                    background: event.eventBanner
                        ? `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(26,5,51,0.85)), url(http://localhost:8081/uploads/${event.eventBanner}) center/cover no-repeat`
                        : 'linear-gradient(135deg, #1a0533 0%, #3b1fa8 50%, #7c3aed 100%)',
                    position: 'relative'
                }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(26,5,51,0.85))' }} />
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px', color: 'white' }}>
                    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                        <span style={{ background: 'rgba(124,58,237,0.7)', color: '#c4b5fd', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                            {event.categories || 'B2B'}
                        </span>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '12px 0 8px', lineHeight: '1.2' }}>
                            {event.title}
                        </h1>
                        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginBottom: '28px' }}>
                            {[
                                { label: 'Dates', value: `Du ${event.date} au ${event.endDate || event.date}` },
                                { label: 'Horaires', value: `${event.startTime || '--:--'} — ${event.endTime || '--:--'}` },
                                { label: 'Lieu', value: event.city || event.location || 'Non defini' },
                                { label: 'Places', value: `${event.nbInscrits}/${event.nbParticipants || '∞'}` },
                            ].map(({ icon, label, value }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                                    <div>
                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>{label}</div>
                                        <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {message && (
                            <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px', background: message.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: message.startsWith('✅') ? '#065f46' : '#991b1b', display: 'flex', justifyContent: 'space-between' }}>
                                {message.replace('✅ ', '').replace('❌ ', '')}
                                <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit' }}>×</button>
                            </div>
                        )}
                        {event.status === 'closed' ? (
                            <div style={{ padding: '12px 28px', background: 'rgba(177, 17, 17, 0.7)', color: '#cbd5e1', borderRadius: '10px', display: 'inline-block', fontWeight: '700', fontSize: '15px' }}>
                                Inscriptions fermées
                            </div>
                        ) : 
                        alreadyRegistered ? (
                            <div style={{ padding: '12px 28px', background: 'rgba(16,185,129,0.3)', color: '#6ee7b7', borderRadius: '10px', display: 'inline-block', fontWeight: '700', fontSize: '15px' }}>
                                ✅ Vous etes inscrit(e) et accepte(e)
                            </div>
                        ) : registrationStatus === 'pending' ? (
                            //<div style={{ padding: '12px 28px', background: 'rgba(245,158,11,0.3)', color: '#fcd34d', borderRadius: '10px', display: 'inline-block', fontWeight: '700', fontSize: '15px' }}>
                             //    Inscription en attente de validation
                            //</div>
                            <div></div>
                        ) : registrationStatus === 'rejected' ? (
                            <div>
                                <div style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', display: 'inline-block' }}>
                                    ❌ Votre inscription a ete refusee. Vous pouvez reessayer.
                                </div>
                                <br />
                                <button onClick={handleOpenModal} style={{ padding: '14px 36px', background: 'white', color: '#7c3aed', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                                    Se reinscrire
                                </button>
                            </div>
                        ) : isFull ? (
                            <div style={{ padding: '12px 28px', background: 'rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: '10px', display: 'inline-block', fontWeight: '700', fontSize: '15px' }}>
                                 Evenement complet
                            </div>
                        ) : (
                            <button onClick={handleOpenModal} style={{ padding: '14px 36px', background: 'white', color: '#7c3aed', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                                 S'inscrire maintenant
                            </button>
                        )}
                    </div>
                </div>
                
            </div>

            {/* ── Mini navbar ── */}
            <div style={{ background: 'white', borderBottom: '2px solid #f1f5f9', position: 'sticky', top: '60px', zIndex: 99 }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 40px', display: 'flex', overflowX: 'auto' }}>
                    <button onClick={() => setActivePage(null)} style={{ padding: '14px 24px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: activePage === null ? '#7c3aed' : '#64748b', borderBottom: activePage === null ? '2px solid #7c3aed' : '2px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap' }}>
                         Accueil
                    </button>
                    {activePages.map(page => (
                        <button key={page.id} onClick={() => setActivePage(page.id)} style={{ padding: '14px 24px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: activePage === page.id ? '#7c3aed' : '#64748b', borderBottom: activePage === page.id ? '2px solid #7c3aed' : '2px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap' }}>
                            {page.name}
                        </button>
                    ))}
                    {schedules.length > 0 && (
                        <button onClick={() => setActivePage('agenda')} style={{ padding: '14px 24px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: activePage === 'agenda' ? '#7c3aed' : '#64748b', borderBottom: activePage === 'agenda' ? '2px solid #7c3aed' : '2px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap' }}>
                             Agenda
                        </button>
                    )}
                    {/*eventParticipants.length > 0 && (
                        <button onClick={() => setActivePage('participants')} style={{ padding: '14px 24px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: activePage === 'participants' ? '#7c3aed' : '#64748b', borderBottom: activePage === 'participants' ? '2px solid #7c3aed' : '2px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap' }}>
                            Participants
                        </button>
                    )*/}{/* Bouton Participants */}
                    {eventParticipants.length > 0 && (
    <button onClick={() => navigate(`/participants?eventId=${id}`)}
        style={{ padding: '14px 24px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: activePage === 'participants' ? '#7c3aed' : '#64748b', borderBottom: activePage === 'participants' ? '2px solid #7c3aed' : '2px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap' }}>
        Participants
    </button>
)}
                </div>
            </div>

            {/* ── Contenu ── */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px', background: 'white',  boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>                {/* Accueil */}
                {activePage === null && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '12px', alignItems: 'flex-start' }}>                    {/* ── Colonne gauche ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* À propos */}
                        <div style={{ padding: '24px' }}>
                            <h2 style={{ color: '#1a1a2e', marginBottom: '16px', fontSize: '1.3rem', fontWeight: '800' }}>
                                À propos de l'evenement
                            </h2>
                            <p style={{ color: '#64748b', lineHeight: '1.8', margin: 0 }}>{event.description}</p>
                        
                            {event.targets && event.targets.length > 0 && (
                                <div style={{ marginTop:'110px' }}>
                                    <h3 style={{ color: '#1a1a2e', marginBottom: '16px', fontSize: '1.1rem', fontWeight: '800' }}>
                                        Secteurs d'interet
                                    </h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {event.targets.map((target, i) => (
                                            <span key={i} style={{ background: '#f0fdf4', color: '#065f46', border: '1px solid #bbf7d0', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                                                {target}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sponsors */}
                            {event.sponsors && event.sponsors.length > 0 && (
                                <div style={{ marginTop:'110px'}}>
                                    <h3 style={{ color: '#1a1a2e', marginBottom: '20px', fontSize: '1.1rem', fontWeight: '800' }}>
                                        Partenaires & Sponsors
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
                                        {event.sponsors.map((sponsor, i) => (
                                            <div key={i} style={{ padding: '16px', textAlign: 'center', border: '1px' }}>
                                                {sponsor.logo ? (
                                                    <img src={`http://localhost:8081/uploads/${sponsor.logo}`} alt={sponsor.name}
                                                        style={{ width: '60px', height: '60px', objectFit: 'contain', display: 'block', margin: '0 auto 8px' }} />
                                                ) : (
                                                    <div style={{ width: '60px', height: '60px', background: '#ede9fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 8px' }}>
                                                        
                                                    </div>
                                                )}
                                                <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '13px' }}>{sponsor.name}</div>
                                                {sponsor.website && (
                                                    <a href={sponsor.website} target="_blank" rel="noreferrer"
                                                        style={{ color: '#7c3aed', fontSize: '11px', textDecoration: 'none' }}>
                                                        {sponsor.website.replace('https://', '').replace('http://', '').substring(0, 20)}
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        
                        </div>

                        
                    </div>

                    {/* ── Colonne droite ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Organisateurs */}
                        {event.organisers && event.organisers.length > 0 && (
                        <div style={{ padding: '20px' }}>
                                <h3 style={{ color: '#1a1a2e', marginBottom: '16px', fontSize: '1rem', fontWeight: '800' }}>
                                    Organise par
                                </h3>
                                {event.organisers.map((org, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < event.organisers.length - 1 ? '12px' : 0, padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                                        {org.logo ? (
                                            <img src={`http://localhost:8081/uploads/${org.logo}`} alt={org.name}
                                                style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #ede9fe', flexShrink: 0 }} />
                                        ) : (
                                            <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '13px', flexShrink: 0 }}>
                                                {org.name?.[0]}
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{org.name}</div>
                                            {org.email && <div style={{ color: '#64748b', fontSize: '12px' }}>{org.email}</div>}
                                            {org.phone && <div style={{ color: '#64748b', fontSize: '12px' }}>{org.phone}</div>}
                                        </div>
                                    </div>
                                ))}

                                {/* Statistiques */}
                                <h3 style={{ marginTop: '200px', color: '#1a1a2e', marginBottom: '16px', fontSize: '1rem', fontWeight: '800' }}>
                                    Statistiques
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {[
                                        {label: 'Participants', value: event.nbInscrits },
                                        {label: 'Salles', value: event.nbRoom || 0 },
                                        {label: 'Tables', value: event.nbTable || 0 },
                                    ].map(({ icon, label, value }) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>{icon} {label}</span>
                                            <span style={{ fontWeight: '800', color: '#7c3aed', fontSize: '12px' }}>{value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Participants par pays */}
                                {eventParticipants.length > 0 && (
                                    <div style={{marginTop: '200px'}}>
                                        <h3 style={{ color: '#1a1a2e', marginBottom: '16px', fontSize: '1rem', fontWeight: '800' }}>
                                            Participants par pays
                                        </h3>
                                        {(() => {
                                            const byCountry = {};
                                            eventParticipants.forEach(p => {
                                                const country = p.country || 'Tunisie';
                                                byCountry[country] = (byCountry[country] || 0) + 1;
                                            });
                                            return Object.entries(byCountry)
                                                .sort((a, b) => b[1] - a[1])
                                                .slice(0, 6)
                                                .map(([country, count]) => (
                                                    <div key={country} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <span style={{ color: '#64748b', fontSize: '13px' }}> {country}</span>
                                                        <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '2px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '12px' }}>
                                                            {count}
                                                        </span>
                                                    </div>
                                                ));
                                        })()}
                                    </div>
                                )}
                            </div>
                            
                        )}

                        
                    </div>
                </div>
            )}

                {/* Agenda */}
                {activePage === 'agenda' && (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                        <h2 style={{ color: '#1a1a2e', marginBottom: '24px', fontSize: '1.5rem', fontWeight: '800' }}>
                            Programme de l'evenement
                        </h2>
                        {(() => {
                            const grouped = {};
                            schedules.forEach(s => {
                                let dateKey = 'Jour 1';
                                let startHour = s.startTime || '';
                                let endHour = s.endTime || '';
                                if (s.startTime?.includes(' ')) {
                                    const parts = s.startTime.split(' ');
                                    dateKey = parts[0];
                                    startHour = parts[1];
                                } else if (s.startTime?.includes('T')) {
                                    const parts = s.startTime.split('T');
                                    dateKey = parts[0];
                                    startHour = parts[1]?.substring(0, 5);
                                }
                                if (s.endTime?.includes(' ')) endHour = s.endTime.split(' ')[1];
                                else if (s.endTime?.includes('T')) endHour = s.endTime.split('T')[1]?.substring(0, 5);
                                if (!grouped[dateKey]) grouped[dateKey] = [];
                                grouped[dateKey].push({ ...s, startHour, endHour });
                            });

                            return Object.entries(grouped).map(([date, sessions]) => {
                                let formattedDate = date;
                                try {
                                    if (date !== 'Jour 1') {
                                        formattedDate = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                                        formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
                                    }
                                } catch {}
                                return (
                                    <div key={date} style={{ marginBottom: '32px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            <div style={{ height: '2px', flex: 1, background: '#e5e7eb' }} />
                                            <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                                {formattedDate}
                                            </span>
                                            <div style={{ height: '2px', flex: 1, background: '#e5e7eb' }} />
                                        </div>
                                        <div style={{ display: 'grid', gap: '12px' }}>
                                            {sessions.map((s, i) => (
                                                <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', padding: '20px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #7c3aed' }}>
                                                    <div style={{ textAlign: 'center', minWidth: '90px', flexShrink: 0 }}>
                                                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#7c3aed' }}>{s.startHour || '--:--'}</div>
                                                        <div style={{ color: '#94a3b8', fontSize: '12px', margin: '2px 0' }}>--</div>
                                                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#7c3aed' }}>{s.endHour || '--:--'}</div>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '16px', marginBottom: '6px', margin: '20px 18px'}}>{s.title}</div>
                                                        {s.speaker && <div style={{ color: '#7c3aed', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>🎤 {s.speaker}</div>}
                                                        {s.description && <div style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>{s.description}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}

                

                {/* Pages FAQ/Contact/autres */}
                {currentPage && activePage !== 'participants' && activePage !== 'agenda' && (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                        <h2 style={{ color: '#1a1a2e', marginBottom: '24px', fontSize: '1.5rem', fontWeight: '800' }}>
                            {currentPage.name}
                        </h2>

                        {currentPage.name === 'FAQ' && (() => {
                            let faqs = [];
                            try { faqs = JSON.parse(currentPage.content); } catch {}
                            return (
                                <div>
                                    {faqs.length === 0
                                        ? <p style={{ color: '#94a3b8' }}>Aucune question pour le moment.</p>
                                        : faqs.map((faq, i) => <FaqItem key={i} question={faq.q} answer={faq.a} />)
                                    }
                                </div>
                            );
                        })()}

                        {currentPage.name === 'Contact' && (() => {
                            let contactData = {};
                            try { contactData = JSON.parse(currentPage.content); } catch {}
                            return (
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {contactData.email && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
                                            <div>
                                                <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Email</div>
                                                <a href={`mailto:${contactData.email}`} style={{ color: '#1a1a2e', fontWeight: '700', textDecoration: 'none' }}>{contactData.email}</a>
                                            </div>
                                        </div>
                                    )}
                                    {contactData.phone && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
                                            <div>
                                                <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Telephone</div>
                                                <div style={{ color: '#1a1a2e', fontWeight: '500' }}>{contactData.phone}</div>
                                            </div>
                                        </div>
                                    )}
                                    {contactData.address && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
                                            <div>
                                                <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Adresse</div>
                                                <div style={{ color: '#1a1a2e', fontWeight: '500' }}>{contactData.address}</div>
                                            </div>
                                        </div>
                                    )}
                                    {contactData.message && (
                                        <p style={{ color: '#64748b', lineHeight: '1.7', margin: 0 }}>{contactData.message}</p>
                                    )}
                                </div>
                            );
                        })()}

                        {currentPage.name !== 'FAQ' && currentPage.name !== 'Contact' && (
                            <div style={{ color: '#374151', lineHeight: '1.8', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                                {currentPage.content || 'Contenu a venir...'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── MODAL INSCRIPTION ── */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                        <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg, #1a0533, #7c3aed)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: '800' }}>
                                    {step === 1 ? ' Type de participation' : ' Votre profil'}
                                </h3>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    {[1, 2].map(s => (
                                        <div key={s} style={{ width: '32px', height: '4px', borderRadius: '2px', background: s <= step ? 'white' : 'rgba(255,255,255,0.3)' }} />
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }}>×</button>
                        </div>

                        <div style={{ padding: '28px', maxHeight: '70vh', overflowY: 'auto' }}>
                            {/* Étape 1 */}
                            {step === 1 && (
                                <div>
                                    <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px' }}>
                                        Choisissez votre type de participation.
                                    </p>
                                    <div style={{ display: 'grid', gap: '12px', marginBottom: '28px' }}>
                                        {[
                                            { key: 'student', title: 'Etudiant', desc: 'Je suis etudiant et je souhaite decouvrir le monde des affaires.' },
                                            { key: 'business', title: 'Business', desc: 'Je suis professionnel, entrepreneur ou investisseur.' },
                                            { key: 'visitor', title: 'Visiteur', desc: 'Je souhaite assister en tant que visiteur.' },
                                        ].map(type => (
                                            <div key={type.key} onClick={() => setParticipationType(type.key)}
                                                style={{ border: `2px solid ${participationType === type.key ? '#7c3aed' : '#e5e7eb'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', background: participationType === type.key ? '#faf5ff' : 'white', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${participationType === type.key ? '#7c3aed' : '#d1d5db'}`, background: participationType === type.key ? '#7c3aed' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                                                    {participationType === type.key && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px', marginBottom: '4px' }}>{type.icon} {type.title}</div>
                                                    <div style={{ color: '#64748b', fontSize: '13px' }}>{type.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setStep(2)} disabled={!participationType}
                                        style={{ width: '100%', padding: '14px', background: !participationType ? '#e5e7eb' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: !participationType ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                                        Continuer →
                                    </button>
                                </div>
                            )}

                            {/* Étape 2 */}
                            {step === 2 && (
                                <div>
                                    <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px' }}>
                                        Completez votre profil avant de confirmer.
                                    </p>
                                    {[
                                        { key: 'firstName', label: 'Prenom *', type: 'text' },
                                        { key: 'lastName', label: 'Nom *', type: 'text' },
                                        { key: 'phone', label: 'Telephone', type: 'text' },
                                        { key: 'organisation', label: 'Organisation', type: 'text' },
                                        { key: 'country', label: 'Pays', type: 'text' },
                                    ].map(({ key, label, type }) => (
                                        <div key={key} style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontSize: '13px', fontWeight: '600' }}>{label}</label>
                                            <input type={type} value={profileForm[key]}
                                                onChange={e => setProfileForm({ ...profileForm, [key]: e.target.value })}
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                    ))}
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontSize: '13px', fontWeight: '600' }}>Bio (optionnel)</label>
                                        <textarea value={profileForm.bio}
                                            onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                                            placeholder="Decrivez-vous en quelques mots..."
                                            rows={3}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                                    </div>

                                    {/* Section Marketplace */}
                                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #f1f5f9' }}>
                                        <h4 style={{ color: '#1a1a2e', margin: '0 0 8px', fontSize: '15px', fontWeight: '800' }}>
                                             Votre opportunite (optionnel)
                                        </h4>
                                        <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px' }}>
                                            Presentez votre offre aux autres participants.
                                        </p>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '13px', fontWeight: '600' }}>Type d'opportunite</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                {[
                                                    { key: 'product', label: 'Product' },
                                                    { key: 'service', label: 'Service' },
                                                    { key: 'partnership', label: 'partnership' },
                                                ].map(t => (
                                                    <div key={t.key} onClick={() => setOpportunityForm({ ...opportunityForm, type: t.key })}
                                                        style={{ border: `2px solid ${opportunityForm.type === t.key ? '#7c3aed' : '#e5e7eb'}`, borderRadius: '10px', padding: '10px', cursor: 'pointer', background: opportunityForm.type === t.key ? '#faf5ff' : 'white', textAlign: 'center' }}>
                                                        <div style={{ fontSize: '1.3rem' }}>{t.icon}</div>
                                                        <div style={{ fontSize: '12px', fontWeight: '600', color: opportunityForm.type === t.key ? '#7c3aed' : '#64748b' }}>{t.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontSize: '13px', fontWeight: '600' }}>Titre de l'opportunite</label>
                                            <input type="text" value={opportunityForm.title}
                                                onChange={e => setOpportunityForm({ ...opportunityForm, title: e.target.value })}
                                                placeholder="Ex: Je cherche des producteurs d'huile..."
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontSize: '13px', fontWeight: '600' }}>Description</label>
                                            <textarea value={opportunityForm.description}
                                                onChange={e => setOpportunityForm({ ...opportunityForm, description: e.target.value })}
                                                placeholder="Decrivez votre opportunite en detail..."
                                                rows={3}
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '13px', fontWeight: '600' }}>Photos (optionnel)</label>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                {opportunityForm.photos.map((photo, i) => (
                                                    <div key={i} style={{ position: 'relative' }}>
                                                        <img src={`http://localhost:8081/uploads/${photo}`} alt={`photo ${i}`}
                                                            style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                                                        <button onClick={() => setOpportunityForm(prev => ({ ...prev, photos: prev.photos.filter((_, j) => j !== i) }))}
                                                            style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                                {opportunityForm.photos.length < 5 && (
                                                    <div onClick={() => document.getElementById('opportunity-photo').click()}
                                                        style={{ width: '70px', height: '70px', border: '2px dashed #d1d5db', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', fontSize: '1.5rem' }}>
                                                        {uploadingPhoto ? '...' : '+'}
                                                    </div>
                                                )}
                                            </div>
                                            <input id="opportunity-photo" type="file" accept="image/*" style={{ display: 'none' }}
                                                onChange={e => handlePhotoUpload(e.target.files[0])} />
                                            <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Maximum 5 photos.</p>
                                        </div>
                                    </div>

                                    {/* Récap */}
                                    <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px 16px', margin: '20px 0', border: '1px solid #bbf7d0' }}>
                                        <div style={{ color: '#065f46', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}> Recapitulatif</div>
                                        <div style={{ color: '#065f46', fontSize: '13px' }}>
                                            Type : {participationType === 'student' ? '🎓 Etudiant' : participationType === 'business' ? ' Business' : ' Visiteur'}
                                        </div>
                                        <div style={{ color: '#065f46', fontSize: '13px' }}>Evenement : {event.title}</div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                                            ← Retour
                                        </button>
                                        <button onClick={handleConfirmRegistration} disabled={registering || !profileForm.firstName || !profileForm.lastName}
                                            style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                                            {registering ? 'Inscription...' : ' Confirmer l\'inscription'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FaqItem({ question, answer }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
            <button onClick={() => setOpen(!open)} style={{ width: '100%', textAlign: 'left', padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '15px' }}>{question}</span>
                <span style={{ color: '#7c3aed', fontSize: '18px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </button>
            {open && (
                <div style={{ padding: '0 0 16px', color: '#64748b', lineHeight: '1.7', fontSize: '14px' }}>
                    {answer}
                </div>
            )}
        </div>
    );
}