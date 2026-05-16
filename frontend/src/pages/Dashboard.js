import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    const [myEvents, setMyEvents] = useState([]);
    const [myRegistrations, setMyRegistrations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [meetings, setMeetings] = useState({ sent: [], received: [] });
    const [allMeetings, setAllMeetings] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [activeTab, setActiveTab] = useState('registrations');
    const [message, setMessage] = useState('');
    const [meetingMethod, setMeetingMethod] = useState('manual');
    const [savingMethod, setSavingMethod] = useState(false);
    const [selectedUserAgenda, setSelectedUserAgenda] = useState(null);
    const [agendaData, setAgendaData] = useState([]);
    const [showAgenda, setShowAgenda] = useState(false);
    const [autoStartDate, setAutoStartDate] = useState(
        new Date(Date.now() + 86400000).toISOString().split('T')[0]
    );

    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    useEffect(() => {
        const loadData = async () => {
            try {
                const promises = [
                    API.get('/events/my/registrations'),
                    API.get('/notifications'),
                    API.get('/notifications/unread-count'),
                    API.get('/meetings'),
                ];

                if (isAdmin) {
                    promises.push(
                        API.get('/events/my/organized'),
                        API.get('/registrations'),
                        API.get('/meeting-config'),
                        API.get('/meetings/all')
                    );
                }

                const results = await Promise.allSettled(promises);

                if (results[0].status === 'fulfilled') setMyRegistrations(results[0].value.data);
                if (results[1].status === 'fulfilled') setNotifications(results[1].value.data);
                if (results[2].status === 'fulfilled') setUnreadCount(results[2].value.data.count);
                if (results[3].status === 'fulfilled') setMeetings(results[3].value.data);

                if (isAdmin) {
                    if (results[4].status === 'fulfilled') setMyEvents(results[4].value.data);
                    if (results[5].status === 'fulfilled') setRegistrations(results[5].value.data);
                    if (results[6].status === 'fulfilled') setMeetingMethod(results[6].value.data.method || 'manual');
                    if (results[7].status === 'fulfilled') setAllMeetings(results[7].value.data);
                    setActiveTab('events');
                }
            } catch (err) {
                console.error('Erreur chargement:', err);
            }
        };
        loadData();
    }, [isAdmin]);

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Supprimer cet evenement ?')) return;
        try {
            await API.delete(`/events/${id}`);
            setMyEvents(myEvents.filter(e => e.id !== id));
            setMessage(' Evenement supprime.');
        } catch { setMessage(' Erreur.'); }
    };

    const handleReadAll = async () => {
        await API.put('/notifications/read-all');
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    const handleSaveMethod = async (method) => {
        setSavingMethod(true);
        try {
            await API.put('/meeting-config', { method });
            setMeetingMethod(method);
            setMessage(` Methode "${method === 'manual' ? 'Manuelle' : 'Automatique'}" activee !`);
        } catch { setMessage(' Erreur sauvegarde.'); }
        setSavingMethod(false);
    };

    const handleAutoAssign = async () => {
        try {
            const res = await API.post('/meetings/auto/assign', { startDate: autoStartDate });
            setMessage(` ${res.data.message}`);
            API.get('/meetings/all').then(r => setAllMeetings(r.data)).catch(() => {});
        } catch (err) {
            setMessage(' ' + (err.response?.data?.message || 'Erreur.'));
        }
    };

    const buildAgendaData = () => {
        const source = allMeetings;
        const usersMap = {};
        source.forEach(m => {
            if (!m.requester || !m.participant) return;
            [m.requester, m.participant].forEach(u => {
                if (!usersMap[u.id]) {
                    usersMap[u.id] = { user: u, meetingCount: 0, meetings: [] };
                }
            });
            usersMap[m.requester.id].meetingCount++;
            usersMap[m.requester.id].meetings.push(m);
            usersMap[m.participant.id].meetingCount++;
            usersMap[m.participant.id].meetings.push(m);
        });
        return Object.values(usersMap);
    };

    const openAgenda = (userData) => {
        setSelectedUserAgenda(userData);
        setAgendaData(userData.meetings);
        setShowAgenda(true);
    };

    const tabs = isAdmin ? [
        { key: 'events', label: ` Evenements (${myEvents.length})` },
        { key: 'inscriptions', label: ` Inscriptions (${registrations.filter(r => r.status === 'pending').length} en attente)` },
        { key: 'meetings', label: ` Meetings` },
        { key: 'notifications', label: `Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
    ] : [
        { key: 'registrations', label: ` Mes inscriptions (${myRegistrations.length})` },
        { key: 'meetings', label: ` Meetings` },
        { key: 'notifications', label: `Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
    ];

    const inputStyle = { padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', background: 'white' };

    return (
        <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'Segoe UI', sans-serif" }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{marginLeft:'79.4%' }}>
                    
                    {isAdmin && (
                        <Link to="/events/create" style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '700' }}>
                            ➕ Creer un evenement
                        </Link>
                    )}</div>
                </div>

                {message && (
                    <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px', background: message.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: message.startsWith('✅') ? '#065f46' : '#991b1b', display: 'flex', justifyContent: 'space-between' }}>
                        {message.replace('✅ ', '').replace('❌ ', '')}
                        <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit' }}>×</button>
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                            background: activeTab === t.key ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'white',
                            color: activeTab === t.key ? 'white' : '#64748b',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── TAB: Evenements admin ── */}
                {activeTab === 'events' && isAdmin && (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {myEvents.length === 0 ? (
                            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                <p>Aucun evenement cree.</p>
                                <Link to="/events/create" style={{ color: '#7c3aed', fontWeight: '600' }}>Creer un evenement</Link>
                            </div>
                        ) : myEvents.map(ev => (
                            <div key={ev.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 6px', color: '#1a1a2e', fontSize: '1rem', fontWeight: '700' }}>{ev.title}</h3>
                                    <div style={{ color: '#64748b', fontSize: '13px' }}> {ev.date} | 📍 {ev.city || ev.location} | 👥 {ev.nbInscrits}/{ev.nbParticipants}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <Link to={`/events/${ev.id}/public`} style={{ padding: '8px 16px', background: '#ede9fe', color: '#7c3aed', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
                                        Voir
                                    </Link>
                                    <button onClick={() => handleDeleteEvent(ev.id)} style={{ padding: '8px 16px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── TAB: Inscriptions admin ── */}
                {activeTab === 'inscriptions' && isAdmin && (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {registrations.length === 0 ? (
                            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                <p>Aucune inscription.</p>
                            </div>
                        ) : registrations.map(r => (
                            <div key={r.id} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' }}>
                                            {r.user?.firstName} {r.user?.lastName}
                                            <span style={{ color: '#7c3aed', fontSize: '12px', marginLeft: '8px', background: '#ede9fe', padding: '2px 8px', borderRadius: '10px' }}>
                                                {r.user?.userRole?.replace('ROLE_', '')}
                                            </span>
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '13px' }}> {r.event?.title} | {r.registeredAt?.substring(0, 10)}</div>
                                    </div>
                                    {r.status === 'pending' ? (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={async () => {
                                                await API.put(`/registrations/${r.id}/accept`);
                                                setRegistrations(prev => prev.map(x => x.id === r.id ? { ...x, status: 'accepted' } : x));
                                                setMessage(' Inscription acceptee.');
                                            }} style={{ padding: '8px 16px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                                 Accepter
                                            </button>
                                            <button onClick={async () => {
                                                await API.put(`/registrations/${r.id}/reject`);
                                                setRegistrations(prev => prev.map(x => x.id === r.id ? { ...x, status: 'rejected' } : x));
                                                setMessage(' Inscription refusee.');
                                            }} style={{ padding: '8px 16px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                                 Refuser
                                            </button>
                                        </div>
                                    ) : (
                                        <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: r.status === 'accepted' ? '#d1fae5' : '#fee2e2', color: r.status === 'accepted' ? '#065f46' : '#991b1b' }}>
                                            {r.status === 'accepted' ? ' Accepte' : ' Refuse'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── TAB: Mes inscriptions utilisateur ── */}
                {activeTab === 'registrations' && (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {myRegistrations.length === 0 ? (
                            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                <p>Pas encore inscrit a des evenements.</p>
                                <Link to="/events" style={{ color: '#7c3aed', fontWeight: '600' }}>Voir les evenements</Link>
                            </div>
                        ) : myRegistrations.map(r => (
                            <div key={r.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 6px', color: '#1a1a2e', fontSize: '1rem', fontWeight: '700' }}>{r.event?.title}</h3>
                                    <div style={{ color: '#64748b', fontSize: '13px' }}> {r.event?.date} | Inscrit le {r.registeredAt?.substring(0, 10)}</div>
                                </div>
                                <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: r.status === 'accepted' ? '#d1fae5' : r.status === 'rejected' ? '#fee2e2' : '#fef3c7', color: r.status === 'accepted' ? '#065f46' : r.status === 'rejected' ? '#991b1b' : '#92400e' }}>
                                    {r.status === 'accepted' ? ' Accepte' : r.status === 'rejected' ? ' Refuse' : ' En attente'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── TAB: MEETINGS ── */}
                {activeTab === 'meetings' && (
                    <div>
                        {/* Config méthode — ADMIN SEULEMENT */}
                        {isAdmin && (
                            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                <h3 style={{ color: '#1a1a2e', margin: '0 0 8px', fontSize: '1rem', fontWeight: '800' }}>
                                    Configuration de la methode de meeting
                                </h3>
                                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px' }}>
                                    Choisissez quelle methode sera affichee aux participants.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                    {[
                                        { key: 'manual', title: 'Methode Manuelle', desc: 'Le participant choisit lui-meme la date et l\'heure.' },
                                        { key: 'auto', title: 'Methode Automatique', desc: 'Le participant envoie une demande simple. L\'admin assigne automatiquement.' },
                                    ].map(m => (
                                        <div key={m.key} onClick={() => setMeetingMethod(m.key)}
                                            style={{ border: `2px solid ${meetingMethod === m.key ? '#7c3aed' : '#e5e7eb'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', background: meetingMethod === m.key ? '#faf5ff' : 'white' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${meetingMethod === m.key ? '#7c3aed' : '#d1d5db'}`, background: meetingMethod === m.key ? '#7c3aed' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {meetingMethod === m.key && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                                                </div>
                                                <span style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{m.icon} {m.title}</span>
                                            </div>
                                            <p style={{ color: '#64748b', fontSize: '13px', margin: 0, paddingLeft: '30px' }}>{m.desc}</p>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <button onClick={() => handleSaveMethod(meetingMethod)} disabled={savingMethod}
                                        style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                                        {savingMethod ? 'Sauvegarde...' : ' Sauvegarder'}
                                    </button>
                                    <span style={{ color: '#64748b', fontSize: '13px' }}>
                                        Actif : <strong style={{ color: '#7c3aed' }}>{meetingMethod === 'manual' ? 'Manuelle' : 'Automatique'}</strong>
                                    </span>
                                </div>
                                {meetingMethod === 'auto' && (
                                    <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                                        <p style={{ color: '#374151', fontWeight: '600', margin: '0 0 12px', fontSize: '14px' }}>
                                             Lancer l'algorithme d'assignation
                                        </p>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <input type="date" value={autoStartDate} onChange={e => setAutoStartDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                            <button onClick={handleAutoAssign} style={{ padding: '10px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' }}>
                                                ▶ Assigner
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tableau Participant Agendas — ADMIN SEULEMENT */}
                        {isAdmin && (
                            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '24px' }}>
                                <div style={{ padding: '20px 24px', borderBottom: '2px solid #f1f5f9' }}>
                                    <h3 style={{ color: '#1a1a2e', margin: 0, fontSize: '1rem', fontWeight: '800' }}> Participant Agendas</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                                    {['Participant', 'Evenement', 'Meetings', 'Action'].map(h => (
                                        <div key={h} style={{ fontWeight: '700', color: '#374151', fontSize: '13px', textTransform: 'uppercase' }}>{h}</div>
                                    ))}
                                </div>
                                {buildAgendaData().length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        <p style={{ margin: 0 }}>Aucun meeting pour le moment.</p>
                                    </div>
                                ) : buildAgendaData().map((item, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '14px 24px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                                                {item.user.firstName?.[0]}{item.user.lastName?.[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '14px' }}>{item.user.firstName} {item.user.lastName}</div>
                                                <div style={{ color: '#94a3b8', fontSize: '12px' }}>{item.user.userRole?.replace('ROLE_', '')}</div>
                                            </div>
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '13px' }}>
                                            {myEvents.length > 0 ? myEvents[0]?.title : 'B2B Events'}
                                        </div>
                                        <div>
                                            <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '4px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '13px' }}>
                                                {item.meetingCount} meeting{item.meetingCount > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div>
                                            <button onClick={() => openAgenda(item)}
                                                style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
                                                👁 View Agenda
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Modal Agenda */}
                        {showAgenda && selectedUserAgenda && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                                <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                                    <div style={{ padding: '24px', background: 'linear-gradient(135deg, #1a0533, #7c3aed)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: '800' }}>
                                                 Agenda de {selectedUserAgenda.user.firstName} {selectedUserAgenda.user.lastName}
                                            </h3>
                                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                                {selectedUserAgenda.meetingCount} meeting(s)
                                            </p>
                                        </div>
                                        <button onClick={() => setShowAgenda(false)}
                                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }}>
                                            ×
                                        </button>
                                    </div>
                                    <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(80vh - 100px)' }}>
                                        {agendaData.length === 0 ? (
                                            <p style={{ color: '#94a3b8', textAlign: 'center' }}>Aucun meeting.</p>
                                        ) : agendaData.map((m, i) => (
                                            <div key={i} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '12px', borderLeft: `4px solid ${m.status === 'accepted' ? '#059669' : m.status === 'rejected' ? '#ef4444' : '#f59e0b'}` }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px', marginBottom: '4px' }}>
                                                            {m.requester?.firstName} {m.requester?.lastName} → {m.participant?.firstName} {m.participant?.lastName}
                                                        </div>
                                                        <div style={{ color: '#64748b', fontSize: '13px' }}>
                                                             {m.proposedAt === 'A assigner' ? 'Creneau a assigner' : m.proposedAt}
                                                        </div>
                                                        <div style={{ color: '#64748b', fontSize: '13px' }}>
                                                            ⏱ {m.duration} min | {m.meetingType === 'auto' ? ' Auto' : ' Manuel'}
                                                        </div>
                                                        {m.message && <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>💬 {m.message}</div>}
                                                    </div>
                                                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: m.status === 'accepted' ? '#d1fae5' : m.status === 'rejected' ? '#fee2e2' : '#fef3c7', color: m.status === 'accepted' ? '#065f46' : m.status === 'rejected' ? '#991b1b' : '#92400e', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                                        {m.status === 'accepted' ? ' Accepte' : m.status === 'rejected' ? ' Refuse' : ' En attente'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Demandes reçues et envoyées — TOUT LE MONDE */}
                        {!isAdmin && (
                        <div>
                            <h3 style={{ color: '#1a1a2e', marginBottom: '16px', fontSize: '1rem', fontWeight: '800' }}>
                                📨 Demandes reçues
                            </h3>
                            {(!meetings.received || meetings.received.length === 0) ? (
                                <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', color: '#94a3b8', marginBottom: '24px' }}>
                                    Aucune demande recue.
                                </div>
                            ) : meetings.received.map(m => (
                                <div key={m.id} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' }}>
                                                {m.requester?.firstName} {m.requester?.lastName} veut un meeting
                                                <span style={{ marginLeft: '8px', fontSize: '11px', color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: '10px' }}>
                                                    {m.meetingType === 'auto' ? ' Auto' : ' Manuel'}
                                                </span>
                                            </div>
                                            <div style={{ color: '#64748b', fontSize: '13px' }}>
                                                 {m.proposedAt === 'A assigner' ? 'Creneau a assigner' : m.proposedAt} — {m.duration} min
                                            </div>
                                            {m.message && <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>💬 {m.message}</div>}
                                        </div>
                                        {m.status === 'pending' && m.meetingType === 'manual' ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={async () => {
                                                    await API.put(`/meetings/${m.id}/accept`);
                                                    setMeetings(prev => ({ ...prev, received: prev.received.map(x => x.id === m.id ? { ...x, status: 'accepted' } : x) }));
                                                }} style={{ padding: '8px 16px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                                     Accepter
                                                </button>
                                                <button onClick={async () => {
                                                    await API.put(`/meetings/${m.id}/reject`);
                                                    setMeetings(prev => ({ ...prev, received: prev.received.map(x => x.id === m.id ? { ...x, status: 'rejected' } : x) }));
                                                }} style={{ padding: '8px 16px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                                     Refuser
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: m.status === 'accepted' ? '#d1fae5' : m.status === 'rejected' ? '#fee2e2' : '#fef3c7', color: m.status === 'accepted' ? '#065f46' : m.status === 'rejected' ? '#991b1b' : '#92400e' }}>
                                                {m.status === 'accepted' ? ' Accepte' : m.status === 'rejected' ? ' Refuse' : ' En attente'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <h3 style={{ color: '#1a1a2e', margin: '24px 0 16px', fontSize: '1rem', fontWeight: '800' }}>
                                📤 Demandes envoyees
                            </h3>
                            {(!meetings.sent || meetings.sent.length === 0) ? (
                                <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                                    Aucune demande envoyee.
                                </div>
                            ) : meetings.sent.map(m => (
                                <div key={m.id} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' }}>
                                            Meeting avec {m.participant?.firstName} {m.participant?.lastName}
                                            <span style={{ marginLeft: '8px', fontSize: '11px', color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: '10px' }}>
                                                {m.meetingType === 'auto' ? ' Auto' : ' Manuel'}
                                            </span>
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '13px' }}>
                                             {m.proposedAt === 'A assigner' ? 'Creneau a assigner' : m.proposedAt} — {m.duration} min
                                        </div>
                                    </div>
                                    <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: m.status === 'accepted' ? '#d1fae5' : m.status === 'rejected' ? '#fee2e2' : '#fef3c7', color: m.status === 'accepted' ? '#065f46' : m.status === 'rejected' ? '#991b1b' : '#92400e' }}>
                                        {m.status === 'accepted' ? ' Accepte' : m.status === 'rejected' ? ' Refuse' : ' En attente'}
                                    </span>
                                </div>
                            ))}
                        </div>
                            )}
                    </div>
                )}

                {/* ── TAB: Notifications ── */}
                {activeTab === 'notifications' && (
                    <div>
                        {notifications.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                                <button onClick={handleReadAll} style={{ padding: '8px 16px', background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                    Tout marquer comme lu
                                </button>
                            </div>
                        )}
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {notifications.length === 0 ? (
                                <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    <p>Aucune notification.</p>
                                </div>
                            ) : notifications.map(n => (
                                <div key={n.id} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${n.isRead ? '#e5e7eb' : '#7c3aed'}`, opacity: n.isRead ? 0.7 : 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px', marginBottom: '4px' }}>{n.title}</div>
                                            <div style={{ color: '#64748b', fontSize: '13px' }}>{n.message}</div>
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: '12px', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                                            {n.createdAt?.substring(0, 10)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}