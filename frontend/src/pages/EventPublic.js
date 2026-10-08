import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import ReactCountryFlag from 'react-country-flag';
import ChatBot from '../components/ChatBot';

export default function EventPublic({ meetingMethod = 'manual' }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activePage, setActivePage] = useState(null);
    const [message, setMessage] = useState('');
    const [eventParticipants, setEventParticipants] = useState([]);
    const [eventOpportunities, setEventOpportunities] = useState([]);
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

    const [checkinData, setCheckinData] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [checkins, setCheckins] = useState([]);

    const [matches, setMatches] = useState([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [matchmakingDone, setMatchmakingDone] = useState(false);
    const [selectedSectors, setSelectedSectors] = useState([]);
    const [scoreFilter, setScoreFilter] = useState('all');

    // État pour l'onglet FAQ ouvert
    const [faqOpenIndex, setFaqOpenIndex] = useState(null);

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

        API.get(`/opportunities?eventId=${id}`)
            .then(res => setEventOpportunities(res.data))
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

        const jwtToken = localStorage.getItem('token');
        if (jwtToken && user?.roles?.includes('ROLE_ADMIN')) {
            API.get(`/events/${id}/checkin-token`)
                .then(res => setCheckinData(res.data))
                .catch(() => {});
            API.get(`/events/${id}/checkins`)
                .then(res => setCheckins(res.data.checkins || []))
                .catch(() => {});
        }

        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [id, user]);

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
                setOpportunityForm(prev => ({ ...prev, photos: [...prev.photos, data.filename] }));
            }
        } catch { setMessage('❌ Photo upload failed.'); }
        setUploadingPhoto(false);
    };

    const handleConfirmRegistration = async () => {
        setRegistering(true);
        try {
            await API.put('/profile', {
                ...profileForm,
                sectors: selectedSectors
            });
            await API.post(`/events/${id}/register`, { participationType });
            if (opportunityForm.type && opportunityForm.title.trim()) {
                await API.post('/opportunities', { ...opportunityForm, eventId: parseInt(id) });
                API.get(`/opportunities?eventId=${id}`)
                    .then(res => setEventOpportunities(res.data))
                    .catch(() => {});
            }
            setMessage('✅ Registration submitted! Waiting for validation.');
            setRegistrationStatus('pending');
            setShowModal(false);
        } catch (err) {
            setMessage('❌ ' + (err.response?.data?.message || 'An error occurred.'));
        }
        setRegistering(false);
    };

    const loadMatches = async () => {
        if (matches.length > 0 && matchmakingDone) return;
        setLoadingMatches(true);
        try {
            const res = await API.get(`/matchmaking/${id}`);
            setMatches(res.data.matches || []);
            setMatchmakingDone(true);
        } catch {
            setMatches([]);
        }
        setLoadingMatches(false);
    };

    const getCountryCode = (country) => {
        const codes = {
            'Tunisia': 'TN', 'Tunisie': 'TN', 'tunisie': 'TN',
            'France': 'FR', 'france': 'FR',
            'Algeria': 'DZ', 'Algérie': 'DZ',
            'Morocco': 'MA', 'Maroc': 'MA',
            'Turkey': 'TR', 'Türkiye': 'TR', 'turquie': 'TR', 'Turquie': 'TR',
            'Germany': 'DE', 'Italy': 'IT',
            'Spain': 'ES', 'United Kingdom': 'GB',
            'United States': 'US', 'USA': 'US',
            'Canada': 'CA', 'Belgium': 'BE',
            'Switzerland': 'CH', 'Netherlands': 'NL',
            'Saudi Arabia': 'SA', 'UAE': 'AE',
            'Qatar': 'QA', 'Egypt': 'EG',
            'Libya': 'LY', 'Senegal': 'SN',
        };
        return codes[country] || null;
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748b', fontFamily: 'Segoe UI' }}>
            Loading...
        </div>
    );

    if (!event) return (
        <div style={{ textAlign: 'center', padding: '80px', color: '#ef4444', fontFamily: 'Segoe UI' }}>
            Event not found.
        </div>
    );

    const activePages = event.pages?.filter(p => p.isActive) || [];
    const isFull = event.nbInscrits >= event.nbParticipants;

    const formatDate = (dateStr) => {
        try {
            if (dateStr === 'Jour 1') return 'Jour 1';
            const date = new Date(dateStr);
            return date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    // Rendu du contenu des onglets
    const renderTabContent = () => {
        if (activePage === null) {
            return renderHomeContent();
        }

        if (activePage === 'agenda') {
            return renderAgendaContent();
        }

        const page = activePages.find(p => p.id === activePage);
        if (!page) return null;

        if (page.name === 'FAQ') {
            return renderFAQContent(page);
        }

        if (page.name === 'Contact') {
            return renderContactContent(page);
        }

        return renderCustomPageContent(page);
    };

    // Rendu du contenu Home
    const renderHomeContent = () => {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ padding: '24px' }}>
                        <h2 style={{ color: '#1a1a2e', marginBottom: '16px', fontSize: '1.3rem', fontWeight: '800' }}>
                            About this event
                        </h2>
                        <p style={{ color: '#64748b', lineHeight: '1.8', margin: 0 }}>{event.description}</p>

                        {event.targets && event.targets.length > 0 && (
                            <div style={{ marginTop: '110px' }}>
                                <h3 style={{ color: '#1a1a2e', marginBottom: '16px', fontSize: '1.1rem', fontWeight: '800' }}>
                                    Sectors of Interest
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

                        {event.sponsors && event.sponsors.length > 0 && (
                            <div style={{ marginTop: '110px' }}>
                                <h3 style={{ color: '#1a1a2e', marginBottom: '20px', fontSize: '1.1rem', fontWeight: '800' }}>
                                    Partners & Sponsors
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
                                    {event.sponsors.map((sponsor, i) => (
                                        <div key={i} style={{ padding: '16px', textAlign: 'center' }}>
                                            {sponsor.logo ? (
                                                <img src={`http://localhost:8081/uploads/${sponsor.logo}`} alt={sponsor.name}
                                                    style={{ width: '60px', height: '60px', objectFit: 'contain', display: 'block', margin: '0 auto 8px' }} />
                                            ) : (
                                                <div style={{ width: '60px', height: '60px', background: '#ede9fe', borderRadius: '50%', margin: '0 auto 8px' }} />
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {event.organisers && event.organisers.length > 0 && (
                        <div style={{ padding: '20px' }}>
                            <h3 style={{ color: '#1a1a2e', marginBottom: '16px', fontSize: '1rem', fontWeight: '800' }}>
                                Organised by
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

                            <h3 style={{ marginTop: '200px', color: '#1a1a2e', marginBottom: '16px', fontSize: '1rem', fontWeight: '800' }}>
                                Statistics
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    { label: 'Participants', value: event.nbInscrits },
                                    { label: 'Rooms', value: event.nbRoom || 0 },
                                    { label: 'Tables', value: event.nbTable || 0 },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <span style={{ color: '#64748b', fontSize: '13px' }}>{label}</span>
                                        <span style={{ fontWeight: '700', color: '#7c3aed', fontSize: '12px' }}>{value}</span>
                                    </div>
                                ))}
                            </div>

                            {eventParticipants.length > 0 && (
                                <div style={{ marginTop: '200px' }}>
                                    <h3 style={{ color: '#1a1a2e', marginBottom: '16px', fontSize: '1rem', fontWeight: '800' }}>
                                        Participants by Country
                                    </h3>
                                    {(() => {
                                        const byCountry = {};
                                        eventParticipants.forEach(p => {
                                            const country = p.country || 'Tunisia';
                                            byCountry[country] = (byCountry[country] || 0) + 1;
                                        });
                                        return Object.entries(byCountry)
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 6)
                                            .map(([country, count]) => {
                                                const code = getCountryCode(country);
                                                return (
                                                    <div key={country} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <span style={{ color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {code && (
                                                                <ReactCountryFlag
                                                                    countryCode={code}
                                                                    svg
                                                                    style={{ width: '15px', height: '10px', borderRadius: '2px' }}
                                                                />
                                                            )}
                                                            {country}
                                                        </span>
                                                        <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '2px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '12px' }}>
                                                            {count}
                                                        </span>
                                                    </div>
                                                );
                                            });
                                    })()}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Rendu du contenu Agenda amélioré
    const renderAgendaContent = () => {
        if (!schedules || schedules.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: 'white', borderRadius: '16px' }}>
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📅</span>
                    <p style={{ fontWeight: '600', fontSize: '18px', margin: 0 }}>Aucun programme</p>
                    <p style={{ fontSize: '14px', marginTop: '4px' }}>Le planning sera bientôt disponible</p>
                </div>
            );
        }

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

        return (
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                <h2 style={{ color: '#1a1a2e', marginBottom: '24px', fontSize: '1.5rem', fontWeight: '800' }}>
                    Event Schedule
                </h2>

                {Object.entries(grouped).map(([date, sessions], groupIndex) => (
                    <div key={date} style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ height: '2px', flex: 1, background: '#e5e7eb' }} />
                            <span style={{
                                background: 'linear-gradient(135deg, #ede9fe, #faf5ff)',
                                color: '#7c3aed',
                                padding: '8px 20px',
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: '700',
                                whiteSpace: 'nowrap',
                                border: '1px solid #e9d5ff'
                            }}>
                                {formatDate(date)}
                            </span>
                            <div style={{ height: '2px', flex: 1, background: '#e5e7eb' }} />
                        </div>

                        <div style={{ display: 'grid', gap: '12px' }}>
                            {sessions.map((s, i) => {
                                let duration = '';
                                try {
                                    const start = new Date(s.startTime);
                                    const end = new Date(s.endTime);
                                    const diff = Math.round((end - start) / (1000 * 60));
                                    if (diff > 60) {
                                        const hours = Math.floor(diff / 60);
                                        const mins = diff % 60;
                                        duration = `${hours}h${mins > 0 ? mins : ''}`;
                                    } else {
                                        duration = `${diff}min`;
                                    }
                                } catch {}

                                return (
                                    <div key={i} style={{
                                        display: 'flex',
                                        gap: '20px',
                                        alignItems: 'flex-start',
                                        padding: '20px',
                                        background: '#f8fafc',
                                        borderRadius: '12px',
                                        borderLeft: '4px solid #7c3aed',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#faf5ff';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.1)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = '#f8fafc';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}>
                                        <div style={{ textAlign: 'center', minWidth: '90px', flexShrink: 0 }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#7c3aed' }}>{s.startHour || '--:--'}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '12px', margin: '2px 0' }}>—</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#7c3aed' }}>{s.endHour || '--:--'}</div>
                                            {duration && (
                                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', background: '#e5e7eb', padding: '2px 8px', borderRadius: '10px', display: 'inline-block' }}>
                                                    {duration}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '16px', marginBottom: '4px' }}>{s.title}</div>
                                            {s.speaker && (
                                                <div style={{ display: 'inline-block', background: '#ede9fe', color: '#7c3aed', padding: '2px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                                                    🎤 {s.speaker}
                                                </div>
                                            )}
                                            {s.description && (
                                                <div style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', marginTop: '4px' }}>
                                                    {s.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Rendu du contenu FAQ amélioré
    const renderFAQContent = (page) => {
        let faqs = [];
        try { faqs = JSON.parse(page.content); } catch {}

        if (!faqs || faqs.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: 'white', borderRadius: '16px' }}>
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>❓</span>
                    <p style={{ fontWeight: '600', fontSize: '18px', margin: 0 }}>Aucune question pour le moment</p>
                    <p style={{ fontSize: '14px', marginTop: '4px' }}>Les FAQ seront ajoutées prochainement</p>
                </div>
            );
        }

        return (
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                <h2 style={{ color: '#1a1a2e', marginBottom: '24px', fontSize: '1.5rem', fontWeight: '800' }}>
                    Foire Aux Questions
                </h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                    {faqs.map((faq, index) => {
                        const isOpen = faqOpenIndex === index;
                        return (
                            <div key={index} style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                background: 'white',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                                if (!isOpen) {
                                    e.currentTarget.style.borderColor = '#c4b5fd';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.08)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isOpen) {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}>
                                <button
                                    onClick={() => setFaqOpenIndex(isOpen ? null : index)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 20px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        textAlign: 'left'
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            background: isOpen ? '#7c3aed' : '#ede9fe',
                                            color: isOpen ? 'white' : '#7c3aed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            flexShrink: 0
                                        }}>
                                            {index + 1}
                                        </span>
                                        <span style={{
                                            fontWeight: '600',
                                            color: isOpen ? '#7c3aed' : '#1a1a2e',
                                            fontSize: '15px'
                                        }}>
                                            {faq.q}
                                        </span>
                                    </div>
                                    <span style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: isOpen ? '#7c3aed' : '#f1f5f9',
                                        color: isOpen ? 'white' : '#64748b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px',
                                        fontWeight: '700',
                                        transition: 'transform 0.3s',
                                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        flexShrink: 0
                                    }}>
                                        {isOpen ? '−' : '+'}
                                    </span>
                                </button>
                                {isOpen && (
                                    <div style={{
                                        padding: '0 20px 20px 60px',
                                        borderTop: '1px solid #f1f5f9',
                                        color: '#64748b',
                                        lineHeight: '1.7',
                                        fontSize: '14px'
                                    }}>
                                        {faq.a || 'Aucune réponse disponible pour le moment.'}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Rendu du contenu Contact amélioré
    const renderContactContent = (page) => {
        let contactData = {};
        try { contactData = JSON.parse(page.content); } catch {}

        const contacts = [
            { icon: '📧', label: 'Email', value: contactData.email, type: 'email' },
            { icon: '📞', label: 'Téléphone', value: contactData.phone, type: 'phone' },
            { icon: '📍', label: 'Adresse', value: contactData.address, type: 'text' },
        ].filter(c => c.value);

        if (contacts.length === 0 && !contactData.message) {
            return (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: 'white', borderRadius: '16px' }}>
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📬</span>
                    <p style={{ fontWeight: '600', fontSize: '18px', margin: 0 }}>Informations de contact</p>
                    <p style={{ fontSize: '14px', marginTop: '4px' }}>Aucune information disponible</p>
                </div>
            );
        }

        return (
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                <h2 style={{ color: '#1a1a2e', marginBottom: '24px', fontSize: '1.5rem', fontWeight: '800' }}>
                    Contact
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {contacts.map((contact, index) => (
                        <div key={index} style={{
                            padding: '20px',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#c4b5fd';
                            e.currentTarget.style.background = '#faf5ff';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.08)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.boxShadow = 'none';
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{contact.icon}</div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {contact.label}
                            </div>
                            {contact.type === 'email' ? (
                                <a href={`mailto:${contact.value}`} style={{
                                    color: '#1a1a2e',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    textDecoration: 'none',
                                    display: 'block',
                                    wordBreak: 'break-all'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
                                onMouseLeave={e => e.currentTarget.style.color = '#1a1a2e'}>
                                    {contact.value}
                                </a>
                            ) : contact.type === 'phone' ? (
                                <a href={`tel:${contact.value}`} style={{
                                    color: '#1a1a2e',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    textDecoration: 'none',
                                    display: 'block'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
                                onMouseLeave={e => e.currentTarget.style.color = '#1a1a2e'}>
                                    {contact.value}
                                </a>
                            ) : (
                                <div style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '14px' }}>{contact.value}</div>
                            )}
                        </div>
                    ))}
                </div>
                {contactData.message && (
                    <div style={{
                        marginTop: '20px',
                        padding: '16px 20px',
                        background: '#faf5ff',
                        borderRadius: '12px',
                        border: '1px solid #e9d5ff'
                    }}>
                        <p style={{ color: '#5b21b6', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                            <span style={{ fontWeight: '700' }}>📝 Note :</span> {contactData.message}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // Rendu du contenu des pages personnalisées
    const renderCustomPageContent = (page) => {
        return (
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                <h2 style={{ color: '#1a1a2e', marginBottom: '24px', fontSize: '1.5rem', fontWeight: '800' }}>
                    {page.name}
                </h2>
                <div style={{ color: '#374151', lineHeight: '1.8', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                    {page.content || 'Contenu à venir...'}
                </div>
            </div>
        );
    };

    // Construction des onglets
    const buildTabs = () => {
        const tabs = [
            { key: null, label: 'Home' }
        ];

        activePages.forEach(page => {
            tabs.push({ key: page.id, label: page.name });
        });

        if (schedules && schedules.length > 0) {
            tabs.push({ key: 'agenda', label: 'Agenda' });
        }

        if (eventParticipants.length > 0) {
            tabs.push({ key: 'participants', label: 'Participants' });
        }

        if (eventOpportunities.length > 0) {
            tabs.push({ key: 'marketplace', label: 'Marketplace' });
        }

        if (alreadyRegistered && !user?.roles?.includes('ROLE_ADMIN')) {
            tabs.push({ key: 'matchmaking', label: 'Matchmaking' });
        }

        if (user?.roles?.includes('ROLE_ADMIN')) {
            tabs.push({ key: 'qr', label: 'QR Check-in' });
        }

        return tabs;
    };

    const tabs = buildTabs();

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', sans-serif" }}>

            {/* Navbar */}
            <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#7c3aed' }}>B2B Events</span>
                </Link>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <Link to="/events" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Events</Link>
                    <Link to={`/participants?eventId=${id}`} style={{ color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Participants</Link>

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
                                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #f1f5f9', minWidth: '200px', overflow: 'hidden', zIndex: 200, borderRadius: '12px' }}>
                                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', background: '#faf5ff' }}>
                                        <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{user.email}</div>
                                    </div>
                                    {[
                                        { label: 'Account Settings', path: '/profile' },
                                        { label: 'My Registrations', path: '/dashboard' },
                                        ...(user?.roles?.includes('ROLE_ADMIN') ? [{ label: 'Admin Dashboard', path: '/admin' }] : []),
                                    ].map(item => (
                                        <button key={item.label} onClick={() => { navigate(item.path); setShowDropdown(false); }}
                                            style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#374151', fontWeight: '500' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                            {item.label}
                                        </button>
                                    ))}
                                    <div style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <button onClick={() => { logout(); navigate('/login'); }}
                                            style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#ef4444', fontWeight: '600' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                            Logout
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

            {/* Cover */}
            <div style={{ position: 'relative' }}>
                <div style={{
                    width: '100%', height: '400px',
                    background: event.eventBanner
                        ? `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(26,5,51,0.85)), url(http://localhost:8081/uploads/${event.eventBanner}) center/cover no-repeat`
                        : 'linear-gradient(135deg, #1a0533 0%, #3b1fa8 50%, #7c3aed 100%)',
                    position: 'relative'
                }}>
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
                                { label: 'Dates', value: `From ${event.date} to ${event.endDate || event.date}` },
                                { label: 'Hours', value: `${event.startTime || '--:--'} — ${event.endTime || '--:--'}` },
                                { label: 'Location', value: event.city || event.location || 'Not defined' },
                                { label: 'Seats', value: `${event.nbInscrits}/${event.nbParticipants || '∞'}` },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>{label}</div>
                                    <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{value}</div>
                                </div>
                            ))}
                        </div>

                        {message && (
                            <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', background: message.startsWith('✅') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: message.startsWith('✅') ? '#6ee7b7' : '#fca5a5', display: 'flex', justifyContent: 'space-between' }}>
                                {message.replace('✅ ', '').replace('❌ ', '')}
                                <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit' }}>×</button>
                            </div>
                        )}

                        {event.status === 'closed' ? (
                            <div style={{ padding: '12px 28px', background: 'rgba(177,17,17,0.7)', color: '#cbd5e1', borderRadius: '10px', display: 'inline-block', fontWeight: '700', fontSize: '15px' }}>
                                Registrations closed
                            </div>
                        ) : user?.roles?.includes('ROLE_ADMIN') ? (
                            null
                        ) : alreadyRegistered ? (
                            <div style={{ padding: '12px 28px', background: 'rgba(16,185,129,0.3)', color: '#6ee7b7', borderRadius: '10px', display: 'inline-block', fontWeight: '700', fontSize: '15px' }}>
                                You are registered and accepted
                            </div>
                        ) : registrationStatus === 'pending' ? (
                            <div></div>
                        ) : registrationStatus === 'rejected' ? (
                            <div>
                                <div style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', display: 'inline-block' }}>
                                    Your registration was rejected. You can try again.
                                </div>
                                <br />
                                <button onClick={handleOpenModal} style={{ padding: '14px 36px', background: 'white', color: '#7c3aed', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                                    Register again
                                </button>
                            </div>
                        ) : isFull ? (
                            <div style={{ padding: '12px 28px', background: 'rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: '10px', display: 'inline-block', fontWeight: '700', fontSize: '15px' }}>
                                Event is full
                            </div>
                        ) : (
                            <button onClick={handleOpenModal} style={{ padding: '14px 36px', background: 'white', color: '#7c3aed', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                                Register Now
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ====== ONGLETS AMÉLIORÉS (SANS ICÔNES) ====== */}
            <div style={{ background: 'white', borderBottom: '2px solid #f1f5f9', position: 'sticky', top: '60px', zIndex: 99, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '4px' }}>
                    {tabs.map((tab) => {
                        const isActive = activePage === tab.key;

                        const handleTabClick = () => {
                            if (tab.label === 'Participants') {
                                navigate(`/participants?eventId=${id}`);
                                return;
                            }
                            if (tab.label === 'Marketplace') {
                                navigate(`/marketplace?eventId=${id}`);
                                return;
                            }
                            if (tab.label === 'Matchmaking') {
                                setActivePage('matchmaking');
                                loadMatches();
                                return;
                            }
                            if (tab.label === 'QR Check-in') {
                                setShowQR(true);
                                return;
                            }
                            setActivePage(tab.key);
                        };

                        return (
                            <button
                                key={tab.key !== null ? tab.key : 'home'}
                                onClick={handleTabClick}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '14px 20px',
                                    border: 'none',
                                    background: isActive ? '#faf5ff' : 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: isActive ? '#7c3aed' : '#64748b',
                                    marginBottom: '-2px',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease',
                                    borderRadius: '8px 8px 0 0',
                                    position: 'relative'
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = '#f8fafc';
                                        e.currentTarget.style.color = '#1a1a2e';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'none';
                                        e.currentTarget.style.color = '#64748b';
                                    }
                                }}
                            >
                                <span>{tab.label}</span>
                                {tab.label === 'Matchmaking' && matches.length > 0 && (
                                    <span style={{
                                        background: '#7c3aed',
                                        color: 'white',
                                        fontSize: '10px',
                                        fontWeight: '700',
                                        padding: '1px 8px',
                                        borderRadius: '10px',
                                        marginLeft: '2px'
                                    }}>
                                        {matches.length}
                                    </span>
                                )}
                                {tab.label === 'QR Check-in' && checkins.length > 0 && (
                                    <span style={{
                                        background: '#059669',
                                        color: 'white',
                                        fontSize: '10px',
                                        fontWeight: '700',
                                        padding: '1px 8px',
                                        borderRadius: '10px',
                                        marginLeft: '2px'
                                    }}>
                                        {checkins.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ====== CONTENU DES ONGLETS ====== */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' }}>
                {activePage === 'matchmaking' && !user?.roles?.includes('ROLE_ADMIN') && (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ color: '#1a1a2e', margin: '0 0 8px', fontSize: '1.5rem', fontWeight: '800' }}>
                                    Matchmaking IA
                                </h2>
                                <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
                                    Suggestions basées sur votre profil et vos secteurs d'intérêt
                                </p>
                            </div>
                            <button onClick={() => { setMatchmakingDone(false); setMatches([]); loadMatches(); }}
                                disabled={loadingMatches}
                                style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: loadingMatches ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px', opacity: loadingMatches ? 0.7 : 1 }}>
                                {loadingMatches ? 'Analyse...' : 'Rafraîchir'}
                            </button>
                        </div>

                        {matches.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {[
                                    { key: 'all', label: 'Tous' },
                                    { key: '80', label: 'Score > 80%' },
                                ].map(f => (
                                    <button key={f.key} onClick={() => setScoreFilter(f.key)}
                                        style={{
                                            padding: '6px 16px',
                                            borderRadius: '20px',
                                            border: `2px solid ${scoreFilter === f.key ? '#7c3aed' : '#e5e7eb'}`,
                                            background: scoreFilter === f.key ? '#7c3aed' : 'white',
                                            color: scoreFilter === f.key ? 'white' : '#64748b',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}>
                                        {f.label}
                                    </button>
                                ))}
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                                    {matches.filter(m => scoreFilter === 'all' || m.score >= parseInt(scoreFilter)).length} résultat(s)
                                </span>
                            </div>
                        )}

                        {loadingMatches ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                                <p style={{ fontWeight: '600', marginBottom: '8px' }}>Analyse des profils en cours...</p>
                                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Cela peut prendre quelques secondes</p>
                            </div>
                        ) : matches.length === 0 && matchmakingDone ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                                <p style={{ fontWeight: '600' }}>Aucun match trouvé pour le moment.</p>
                                <p style={{ fontSize: '13px' }}>D'autres participants doivent rejoindre cet événement.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {matches
                                    .filter(m => scoreFilter === 'all' || m.score >= parseInt(scoreFilter))
                                    .map((match, i) => {
                                        const synergyConfig = {
                                            'INVESTMENT': { color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', emoji: '💰' },
                                            'PARTNERSHIP': { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', emoji: '🤝' },
                                            'COLLABORATION': { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', emoji: '🤝' },
                                            'MENTORING': { color: '#d97706', bg: '#fffbeb', border: '#fde68a', emoji: '🎓' },
                                            'NETWORKING': { color: '#0891b2', bg: '#f0f9ff', border: '#bae6fd', emoji: '🌐' },
                                        };
                                        const synergy = synergyConfig[match.synergy] || synergyConfig['NETWORKING'];

                                        const userSectors = match.sectors || [];
                                        const eventSectors = event.targets || [];
                                        const commonSectors = userSectors.filter(s => eventSectors.includes(s));

                                        return (
                                            <div key={match.id} style={{
                                                background: 'white',
                                                borderRadius: '16px',
                                                padding: '20px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                                border: i === 0 && scoreFilter === 'all' ? '2px solid #7c3aed' : '1px solid #f1f5f9',
                                                opacity: match.alreadyMet ? 0.75 : 1,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                                            }}>
                                                {i === 0 && scoreFilter === 'all' && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                                        color: 'white',
                                                        padding: '3px 14px',
                                                        borderBottomRightRadius: '10px',
                                                        fontSize: '10px',
                                                        fontWeight: '700'
                                                    }}>
                                                        TOP MATCH
                                                    </div>
                                                )}

                                                {match.alreadyMet && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '10px',
                                                        right: '10px',
                                                        background: '#f1f5f9',
                                                        color: '#64748b',
                                                        padding: '2px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '10px',
                                                        fontWeight: '600'
                                                    }}>
                                                        Déjà rencontré
                                                    </div>
                                                )}

                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '16px',
                                                    marginTop: i === 0 && scoreFilter === 'all' ? '16px' : '0'
                                                }}>
                                                    <div style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontWeight: '800',
                                                        fontSize: '16px',
                                                        flexShrink: 0
                                                    }}>
                                                        {match.firstName?.[0]}{match.lastName?.[0]}
                                                    </div>

                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                            <span style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '15px' }}>
                                                                {match.firstName} {match.lastName}
                                                            </span>
                                                            <span style={{ padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: '#ede9fe', color: '#7c3aed' }}>
                                                                {match.role?.replace('ROLE_', '')}
                                                            </span>
                                                            {match.synergy && (
                                                                <span style={{
                                                                    padding: '2px 10px',
                                                                    borderRadius: '10px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '700',
                                                                    background: synergy.bg,
                                                                    color: synergy.color,
                                                                    border: `1px solid ${synergy.border}`
                                                                }}>
                                                                    {synergy.emoji} {match.synergy}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {match.organisation && (
                                                            <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '2px' }}>
                                                                {match.organisation}
                                                            </div>
                                                        )}
                                                        {match.country && (
                                                            <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '6px' }}>
                                                                {match.country}
                                                            </div>
                                                        )}

                                                        {commonSectors.length > 0 && (
                                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                                                {commonSectors.slice(0, 3).map((s, j) => (
                                                                    <span key={j} style={{
                                                                        background: '#f0fdf4',
                                                                        color: '#065f46',
                                                                        border: '1px solid #bbf7d0',
                                                                        padding: '2px 8px',
                                                                        borderRadius: '10px',
                                                                        fontSize: '10px',
                                                                        fontWeight: '600'
                                                                    }}>
                                                                        #{s}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                                                            {match.reason}
                                                        </div>
                                                    </div>

                                                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                                        <div style={{
                                                            fontSize: '1.5rem',
                                                            fontWeight: '800',
                                                            color: match.score >= 80 ? '#059669' : match.score >= 60 ? '#d97706' : '#64748b'
                                                        }}>
                                                            {match.score}%
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Match</div>
                                                        <div style={{ width: '60px', height: '6px', background: '#f1f5f9', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                                                            <div style={{
                                                                width: `${match.score}%`,
                                                                height: '100%',
                                                                background: match.score >= 80 ? '#059669' : match.score >= 60 ? '#d97706' : '#64748b',
                                                                borderRadius: '3px',
                                                                transition: 'width 0.5s'
                                                            }} />
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => navigate(`/participants/${match.id}?eventId=${id}`)}
                                                        style={{
                                                            padding: '8px 16px',
                                                            background: match.alreadyMet
                                                                ? '#f1f5f9'
                                                                : meetingMethod === 'manual'
                                                                    ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                                                                    : 'linear-gradient(135deg, #059669, #047857)',
                                                            color: match.alreadyMet ? '#64748b' : 'white',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            fontWeight: '600',
                                                            fontSize: '12px',
                                                            flexShrink: 0,
                                                            whiteSpace: 'nowrap',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={e => {
                                                            if (!match.alreadyMet) {
                                                                e.currentTarget.style.transform = 'scale(1.05)';
                                                            }
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }}>
                                                        {match.alreadyMet ? 'Voir →' : 'Rencontrer →'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}

                {activePage !== 'matchmaking' && renderTabContent()}

                {activePage === 'participants' && navigate(`/participants?eventId=${id}`)}
                {activePage === 'marketplace' && navigate(`/marketplace?eventId=${id}`)}
                {activePage === 'qr' && setShowQR(true)}
            </div>

            {/* Registration Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                        <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg, #1a0533, #7c3aed)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: '800' }}>
                                    {step === 1 ? 'Type de participation' : step === 2 ? 'Secteurs d\'intérêt' : 'Opportunité'}
                                </h3>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    {[1, 2, 3].map(s => (
                                        <div key={s} style={{ width: '32px', height: '4px', borderRadius: '2px', background: s <= step ? 'white' : 'rgba(255,255,255,0.3)' }} />
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }}>×</button>
                        </div>
                        <div style={{ padding: '28px', maxHeight: '70vh', overflowY: 'auto' }}>
                            {step === 1 && (
                                <div>
                                    <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px' }}>Choisissez votre type de participation.</p>
                                    <div style={{ display: 'grid', gap: '12px', marginBottom: '28px' }}>
                                        {[
                                            { key: 'student', title: 'Étudiant', desc: 'Je suis étudiant et je souhaite découvrir le monde des affaires.' },
                                            { key: 'business', title: 'Entreprise', desc: 'Je suis professionnel, entrepreneur ou investisseur.' },
                                            { key: 'visitor', title: 'Visiteur', desc: 'Je souhaite assister en tant que visiteur.' },
                                        ].map(type => (
                                            <div key={type.key} onClick={() => setParticipationType(type.key)}
                                                style={{ border: `2px solid ${participationType === type.key ? '#7c3aed' : '#e5e7eb'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', background: participationType === type.key ? '#faf5ff' : 'white', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${participationType === type.key ? '#7c3aed' : '#d1d5db'}`, background: participationType === type.key ? '#7c3aed' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                                                    {participationType === type.key && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px', marginBottom: '4px' }}>{type.title}</div>
                                                    <div style={{ color: '#64748b', fontSize: '13px' }}>{type.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setStep(2)} disabled={!participationType}
                                        style={{ width: '100%', padding: '14px', background: !participationType ? '#e5e7eb' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: !participationType ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                                        Continuer
                                    </button>
                                </div>
                            )}
                            {step === 3 && (
                                <div>
                                    <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px' }}>Complétez votre profil avant de confirmer.</p>
                                    {[
                                        { key: 'firstName', label: 'Prénom *', type: 'text' },
                                        { key: 'lastName', label: 'Nom *', type: 'text' },
                                        { key: 'phone', label: 'Téléphone', type: 'text' },
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
                                            placeholder="Décrivez-vous en quelques mots..."
                                            rows={3}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                                    </div>
                                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #f1f5f9' }}>
                                        <h4 style={{ color: '#1a1a2e', margin: '0 0 8px', fontSize: '15px', fontWeight: '800' }}>Votre opportunité (optionnel)</h4>
                                        <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px' }}>Présentez votre offre aux autres participants.</p>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '13px', fontWeight: '600' }}>Type d'opportunité</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                {[
                                                    { key: 'product', label: 'Produit' },
                                                    { key: 'service', label: 'Service' },
                                                    { key: 'partnership', label: 'Partenariat' },
                                                ].map(t => (
                                                    <div key={t.key} onClick={() => setOpportunityForm({ ...opportunityForm, type: t.key })}
                                                        style={{ border: `2px solid ${opportunityForm.type === t.key ? '#7c3aed' : '#e5e7eb'}`, borderRadius: '10px', padding: '10px', cursor: 'pointer', background: opportunityForm.type === t.key ? '#faf5ff' : 'white', textAlign: 'center' }}>
                                                        <div style={{ fontSize: '12px', fontWeight: '600', color: opportunityForm.type === t.key ? '#7c3aed' : '#64748b' }}>{t.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontSize: '13px', fontWeight: '600' }}>Titre de l'opportunité</label>
                                            <input type="text" value={opportunityForm.title}
                                                onChange={e => setOpportunityForm({ ...opportunityForm, title: e.target.value })}
                                                placeholder="Ex: À la recherche de producteurs d'huile d'olive..."
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontSize: '13px', fontWeight: '600' }}>Description</label>
                                            <textarea value={opportunityForm.description}
                                                onChange={e => setOpportunityForm({ ...opportunityForm, description: e.target.value })}
                                                placeholder="Décrivez votre opportunité en détail..."
                                                rows={3}
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '13px', fontWeight: '600' }}>Photos (optionnel)</label>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                {opportunityForm.photos.map((photo, i) => (
                                                    <div key={i} style={{ position: 'relative' }}>
                                                        <img src={`http://localhost:8081/uploads/${photo}`} alt={`photo ${i + 1}`}
                                                            style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                                                        <button onClick={() => setOpportunityForm(prev => ({ ...prev, photos: prev.photos.filter((_, j) => j !== i) }))}
                                                            style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '12px' }}>
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
                                    <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px 16px', margin: '20px 0', border: '1px solid #bbf7d0' }}>
                                        <div style={{ color: '#065f46', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Récapitulatif</div>
                                        <div style={{ color: '#065f46', fontSize: '13px' }}>
                                            Type: {participationType === 'student' ? 'Étudiant' : participationType === 'business' ? 'Entreprise' : 'Visiteur'}
                                        </div>
                                        <div style={{ color: '#065f46', fontSize: '13px' }}>Événement: {event.title}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => setStep(2)}
                                            style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                                            Retour
                                        </button>
                                        <button onClick={handleConfirmRegistration} disabled={registering}
                                            style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                                            {registering ? 'Inscription...' : 'Confirmer l\'inscription'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {step === 2 && (
                                <div>
                                    <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px' }}>
                                        Sélectionnez vos secteurs d'intérêt pour cet événement.
                                    </p>

                                    {event.targets && event.targets.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                                            {event.targets.map((sector, i) => {
                                                const isSelected = selectedSectors.includes(sector);
                                                return (
                                                    <div key={i}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedSectors(prev => prev.filter(s => s !== sector));
                                                            } else {
                                                                setSelectedSectors(prev => [...prev, sector]);
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '8px 16px',
                                                            borderRadius: '20px',
                                                            border: `2px solid ${isSelected ? '#7c3aed' : '#e5e7eb'}`,
                                                            background: isSelected ? '#faf5ff' : 'white',
                                                            color: isSelected ? '#7c3aed' : '#64748b',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            transition: 'all 0.2s'
                                                        }}>
                                                        {isSelected ? '✓ ' : ''}{sector}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>
                                            Aucun secteur défini pour cet événement.
                                        </p>
                                    )}

                                    <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px 16px', margin: '0 0 20px', border: '1px solid #bbf7d0' }}>
                                        <div style={{ color: '#065f46', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Récapitulatif</div>
                                        <div style={{ color: '#065f46', fontSize: '13px' }}>
                                            Type: {participationType === 'student' ? 'Étudiant' : participationType === 'business' ? 'Entreprise' : 'Visiteur'}
                                        </div>
                                        <div style={{ color: '#065f46', fontSize: '13px' }}>Événement: {event.title}</div>
                                        {selectedSectors.length > 0 && (
                                            <div style={{ color: '#065f46', fontSize: '13px' }}>
                                                Secteurs: {selectedSectors.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => setStep(1)}
                                            style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                                            Retour
                                        </button>
                                        <button onClick={() => setStep(3)}
                                            disabled={!profileForm.firstName || !profileForm.lastName}
                                            style={{ flex: 2, padding: '12px', background: !profileForm.firstName || !profileForm.lastName ? '#e5e7eb' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: !profileForm.firstName || !profileForm.lastName ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                                            Continuer
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQR && checkinData && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
                    onClick={() => setShowQR(false)}>
                    <div style={{ background: 'white', borderRadius: '24px', padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                        onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: '#1a1a2e', marginBottom: '4px', fontSize: '1.2rem', fontWeight: '800' }}>
                            QR Code Check-in
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>
                            {checkinData.eventTitle}
                        </p>
                        <div style={{ display: 'inline-block', padding: '16px', background: 'white', borderRadius: '16px', border: '2px solid #e5e7eb', marginBottom: '20px' }}>
                            <QRCodeSVG value={checkinData.checkinUrl.replace('localhost', '192.168.1.10')} size={200} level="H" includeMargin={false} />
                        </div>
                        <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px' }}>
                            Les participants scannent ce QR Code pour s'enregistrer
                        </p>
                        <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
                            <div style={{ color: '#059669', fontWeight: '800', fontSize: '1.5rem' }}>{checkins.length}</div>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>participants enregistrés</div>
                        </div>
                        {checkins.length > 0 && (
                            <div style={{ maxHeight: '150px', overflowY: 'auto', textAlign: 'left', marginBottom: '16px' }}>
                                {checkins.map((c, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: '#f8fafc', borderRadius: '8px', marginBottom: '6px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '11px', flexShrink: 0 }}>
                                            {c.user.firstName?.[0]}{c.user.lastName?.[0]}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '13px' }}>{c.user.firstName} {c.user.lastName}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '11px' }}>{c.checkedInAt}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setShowQR(false)}
                            style={{ width: '100%', padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                            Fermer
                        </button>
                    </div>
                </div>
            )}
            <ChatBot meetingMethod={meetingMethod} eventId={parseInt(id)} />

        </div>
    );
}