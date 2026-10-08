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

    // Assign & Send par event
    const [showAgendaModal, setShowAgendaModal] = useState(false);
    const [selectedEventForAgenda, setSelectedEventForAgenda] = useState(null);
    const [agendaSubject, setAgendaSubject] = useState('');
    const [agendaMessage, setAgendaMessage] = useState('');
    const [sendingAgenda, setSendingAgenda] = useState(false);
    const [agendaResult, setAgendaResult] = useState('');
    const [selectedParticipants, setSelectedParticipants] = useState([]); // ← NOUVEAU

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
                console.error('Loading error:', err);
            }
        };
        loadData();
    }, [isAdmin]);

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Delete this event?')) return;
        try {
            await API.delete(`/events/${id}`);
            setMyEvents(myEvents.filter(e => e.id !== id));
            setMessage('✅ Event deleted.');
        } catch { setMessage('❌ Error.'); }
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
            setMessage(`✅ "${method === 'manual' ? 'Manual' : 'Automatic'}" method activated!`);
        } catch { setMessage('❌ Save error.'); }
        setSavingMethod(false);
    };

    const buildEventGroups = () => {
        const grouped = {};
        allMeetings.forEach(m => {
            if (!m.requester || !m.participant) return;
            const key = m.eventId ? `event_${m.eventId}` : 'no_event';
            const title = m.eventTitle || 'No Event';
            const eventId = m.eventId || null;
            if (!grouped[key]) grouped[key] = { title, eventId, meetings: [], autoPending: 0, manualAccepted: 0 };
            grouped[key].meetings.push(m);
            if (m.meetingType === 'auto' && m.status === 'pending') grouped[key].autoPending++;
            if (m.meetingType === 'manual' && m.status === 'accepted') grouped[key].manualAccepted++;
        });
        return Object.values(grouped);
    };

    const getAllGroupParticipants = (group) => {
        const usersMap = {};
        group.meetings.forEach(m => {
            [m.requester, m.participant].forEach(u => {
                if (!u) return;
                if (!usersMap[u.id]) usersMap[u.id] = { user: u, meetings: [] };
                if (!usersMap[u.id].meetings.find(x => x.id === m.id)) {
                    usersMap[u.id].meetings.push(m);
                }
            });
        });
        return Object.values(usersMap);
    };

    const getGroupParticipants = (group) => {
        const usersMap = {};
        group.meetings.forEach(m => {
            const needsProcessing = 
                (m.meetingType === 'auto' && m.status === 'pending') ||
                (m.meetingType === 'manual' && m.status === 'accepted' && 
                (!m.tableNumber || !m.roomNumber));
            
            if (!needsProcessing) return;
            
            [m.requester, m.participant].forEach(u => {
                if (!u) return;
                if (!usersMap[u.id]) usersMap[u.id] = { user: u, meetings: [] };
                if (!usersMap[u.id].meetings.find(x => x.id === m.id)) {
                    usersMap[u.id].meetings.push(m);
                }
            });
        });
        return Object.values(usersMap);
    };

    const openAgendaForUser = (meetings, user) => {
        setSelectedUserAgenda(user);
        setAgendaData(meetings);
        setShowAgenda(true);
    };

    const handleAssignAndSend = async () => {
        if (!selectedEventForAgenda) return;
        setSendingAgenda(true);
        setAgendaResult('');
        try {
            const res = await API.post(
                `/meetings/event/${selectedEventForAgenda.id}/assign-and-send`, {
                subject: agendaSubject,
                message: agendaMessage,
                participantIds: selectedParticipants,
            });
            setAgendaResult('✅ ' + res.data.message);

            // ← Recharge les meetings en attendant la réponse
            const r = await API.get('/meetings/all');
            setAllMeetings(r.data);

            // ← Ferme le modal + vide tout après 2 secondes
            setTimeout(() => {
                setShowAgendaModal(false);
                setAgendaSubject('');
                setAgendaMessage('');
                setSelectedParticipants([]);
                setAgendaResult('');
            }, 2000);

        } catch (err) {
            setAgendaResult('❌ ' + (err.response?.data?.message || 'Error.'));
        }
        setSendingAgenda(false);
    };

    const tabs = isAdmin ? [
        { key: 'events', label: `Events (${myEvents.length})` },
        { key: 'inscriptions', label: `Registrations (${registrations.filter(r => r.status === 'pending').length})` },
        { key: 'meetings', label: `Meetings` },
        { key: 'notifications', label: `Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
    ] : [
        { key: 'registrations', label: `My Registrations (${myRegistrations.length})` },
        { key: 'meetings', label: `Meetings` },
        { key: 'notifications', label: `Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'Segoe UI', sans-serif" }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                    {isAdmin && (
                        <Link to="/events/create" style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '700' }}>
                            Create an Event
                        </Link>
                    )}
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

                {/* Tab: Admin Events */}
                {activeTab === 'events' && isAdmin && (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {myEvents.length === 0 ? (
                            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                <p>No events created yet.</p>
                                <Link to="/events/create" style={{ color: '#7c3aed', fontWeight: '600' }}>Create an event</Link>
                            </div>
                        ) : myEvents.map(ev => (
                            <div key={ev.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 6px', color: '#1a1a2e', fontSize: '1rem', fontWeight: '700' }}>{ev.title}</h3>
                                    <div style={{ color: '#64748b', fontSize: '13px' }}>
                                        {ev.date} | {ev.city || ev.location} | {ev.nbInscrits}/{ev.nbParticipants} participants
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <Link to={`/events/${ev.id}/public`} style={{ padding: '8px 16px', background: '#ede9fe', color: '#7c3aed', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>View</Link>
                                    <Link to={`/events/${ev.id}/edit`} style={{ padding: '8px 16px', background: '#fef3c7', color: '#d97706', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>Edit</Link>
                                    <button onClick={() => handleDeleteEvent(ev.id)} style={{ padding: '8px 16px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab: Admin Registrations */}
                {activeTab === 'inscriptions' && isAdmin && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            {[
                                { label: 'Pending', value: registrations.filter(r => r.status === 'pending').length, color: '#d97706' },
                                { label: 'Accepted', value: registrations.filter(r => r.status === 'accepted').length, color: '#059669' },
                                { label: 'Rejected', value: registrations.filter(r => r.status === 'rejected').length, color: '#ef4444' },
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: `4px solid ${color}` }}>
                                    <div>
                                        <div style={{ fontSize: '1.6rem', fontWeight: '800', color }}>{value}</div>
                                        <div style={{ color: '#64748b', fontSize: '13px' }}>{label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {registrations.length === 0 ? (
                            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                <p>No registrations yet.</p>
                            </div>
                        ) : (() => {
                            const grouped = {};
                            registrations.forEach(r => {
                                const uid = r.user?.id;
                                if (!uid) return;
                                if (!grouped[uid]) grouped[uid] = { user: r.user, registrations: [] };
                                grouped[uid].registrations.push(r);
                            });
                            return Object.values(grouped).map(group => (
                                <div key={group.user.id} style={{ background: 'white', borderRadius: '14px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                                    <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>
                                            {group.user.firstName?.[0]}{group.user.lastName?.[0]}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{group.user.firstName} {group.user.lastName}</span>
                                                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: '#ede9fe', color: '#7c3aed' }}>{group.user.userRole?.replace('ROLE_', '')}</span>
                                            </div>
                                            <div style={{ color: '#64748b', fontSize: '12px' }}>{group.user.email}</div>
                                        </div>
                                        <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                                            {group.registrations.length} registration{group.registrations.length > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    {group.registrations.map((r, j) => (
                                        <div key={r.id} style={{ padding: '12px 20px 12px 72px', borderBottom: j < group.registrations.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: j % 2 === 0 ? 'white' : '#fafafa' }}>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '13px' }}>{r.event?.title}</div>
                                                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>Registered on {r.registeredAt?.substring(0, 10)}</div>
                                            </div>
                                            {r.status === 'pending' ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={async () => {
                                                        await API.put(`/registrations/${r.id}/accept`);
                                                        setRegistrations(prev => prev.map(x => x.id === r.id ? { ...x, status: 'accepted' } : x));
                                                        setMessage('✅ Registration accepted.');
                                                    }} style={{ padding: '6px 16px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Accept</button>
                                                    <button onClick={async () => {
                                                        await API.put(`/registrations/${r.id}/reject`);
                                                        setRegistrations(prev => prev.map(x => x.id === r.id ? { ...x, status: 'rejected' } : x));
                                                        setMessage('✅ Registration rejected.');
                                                    }} style={{ padding: '6px 16px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Reject</button>
                                                </div>
                                            ) : (
                                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: r.status === 'accepted' ? '#d1fae5' : '#fee2e2', color: r.status === 'accepted' ? '#065f46' : '#991b1b' }}>
                                                    {r.status === 'accepted' ? 'Accepted' : 'Rejected'}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ));
                        })()}
                    </div>
                )}

                {/* Tab: My Registrations (user) */}
                {activeTab === 'registrations' && (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {myRegistrations.length === 0 ? (
                            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                <p>You have not registered for any events yet.</p>
                                <Link to="/events" style={{ color: '#7c3aed', fontWeight: '600' }}>Browse events</Link>
                            </div>
                        ) : myRegistrations.map(r => (
                            <div key={r.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 6px', color: '#1a1a2e', fontSize: '1rem', fontWeight: '700' }}>{r.event?.title}</h3>
                                    <div style={{ color: '#64748b', fontSize: '13px' }}>{r.event?.date} | Registered on {r.registeredAt?.substring(0, 10)}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Link to={`/events/${r.event?.id}/public`} style={{ padding: '6px 14px', background: '#ede9fe', color: '#7c3aed', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>View</Link>
                                    <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: r.status === 'accepted' ? '#d1fae5' : r.status === 'rejected' ? '#fee2e2' : '#fef3c7', color: r.status === 'accepted' ? '#065f46' : r.status === 'rejected' ? '#991b1b' : '#92400e' }}>
                                        {r.status === 'accepted' ? 'Accepted' : r.status === 'rejected' ? 'Rejected' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab: Meetings */}
                {activeTab === 'meetings' && (
                    <div>
                        {/* Meeting method config — ADMIN ONLY */}
                        {isAdmin && (
                            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                <h3 style={{ color: '#1a1a2e', margin: '0 0 8px', fontSize: '1rem', fontWeight: '800' }}>Meeting Method Configuration</h3>
                                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px' }}>Choose which method will be shown to participants.</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                    {[
                                        { key: 'manual', title: 'Manual Method', desc: 'The participant chooses the date and time themselves.' },
                                        { key: 'auto', title: 'Automatic Method', desc: 'The participant sends a simple request. The admin assigns automatically.' },
                                    ].map(m => (
                                        <div key={m.key} onClick={() => setMeetingMethod(m.key)}
                                            style={{ border: `2px solid ${meetingMethod === m.key ? '#7c3aed' : '#e5e7eb'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', background: meetingMethod === m.key ? '#faf5ff' : 'white' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${meetingMethod === m.key ? '#7c3aed' : '#d1d5db'}`, background: meetingMethod === m.key ? '#7c3aed' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {meetingMethod === m.key && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                                                </div>
                                                <span style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{m.title}</span>
                                            </div>
                                            <p style={{ color: '#64748b', fontSize: '13px', margin: 0, paddingLeft: '30px' }}>{m.desc}</p>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <button onClick={() => handleSaveMethod(meetingMethod)} disabled={savingMethod}
                                        style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                                        {savingMethod ? 'Saving...' : 'Save'}
                                    </button>
                                    <span style={{ color: '#64748b', fontSize: '13px' }}>
                                        Active: <strong style={{ color: '#7c3aed' }}>{meetingMethod === 'manual' ? 'Manual' : 'Automatic'}</strong>
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ── Participant Agendas groupés par EVENT ── */}
                        {isAdmin && (
                            <div>
                                <h3 style={{ color: '#1a1a2e', margin: '0 0 16px', fontSize: '1rem', fontWeight: '800' }}>
                                    Meetings by Event
                                </h3>
                                {buildEventGroups().length === 0 ? (
                                    <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        <p style={{ margin: 0 }}>No meetings yet.</p>
                                    </div>
                                ) : buildEventGroups().map((group, gi) => (
                                    <div key={gi} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
                                        {/* Header de l'event */}
                                        <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #1a0533, #7c3aed)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '6px' }}>{group.title}</div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                                        {group.meetings.length} meeting{group.meetings.length > 1 ? 's' : ''}
                                                    </span>
                                                    {group.autoPending > 0 && (
                                                        <span style={{ background: 'rgba(245,158,11,0.4)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                                            {group.autoPending} auto pending
                                                        </span>
                                                    )}
                                                    {group.manualAccepted > 0 && (
                                                        <span style={{ background: 'rgba(16,185,129,0.4)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                                            {group.manualAccepted} manual accepted
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {group.eventId && (
                                                // ← MODIFIÉ : pré-sélectionne tous les participants
                                                <button onClick={() => {
                                                    const participants = getGroupParticipants(group);
                                                    setSelectedParticipants(participants.map(p => p.user.id));
                                                    setSelectedEventForAgenda({ id: group.eventId, title: group.title });
                                                    setAgendaSubject('Your Meeting Agenda - ' + group.title);
                                                    setAgendaMessage('');
                                                    setAgendaResult('');
                                                    setShowAgendaModal(true);
                                                }}
                                                    style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #059669, #047857)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                                    Assign & Send Agenda
                                                </button>
                                            )}
                                        </div>

                                        {/* Liste des participants de cet event */}
                                        {getAllGroupParticipants(group).map((item, i) => (
                                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 120px', padding: '14px 24px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                                                        {item.user.firstName?.[0]}{item.user.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '14px' }}>{item.user.firstName} {item.user.lastName}</div>
                                                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>{item.user.userRole?.replace('ROLE_', '')}</div>
                                                    </div>
                                                </div>
                                                <div style={{ color: '#64748b', fontSize: '13px' }}>{item.user.email}</div>
                                                <div>
                                                    <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '4px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '13px' }}>
                                                        {item.meetings.length} meeting{item.meetings.length > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div>
                                                    <button onClick={() => openAgendaForUser(item.meetings, item.user)}
                                                        style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
                                                        View Agenda
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Footer stats */}
                                        <div style={{ padding: '10px 24px', background: '#f8fafc', display: 'flex', gap: '16px' }}>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                Auto pending: <strong style={{ color: '#f59e0b' }}>{group.autoPending}</strong>
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                Manual accepted: <strong style={{ color: '#059669' }}>{group.manualAccepted}</strong>
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                Total accepted: <strong style={{ color: '#7c3aed' }}>{group.meetings.filter(m => m.status === 'accepted').length}</strong>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Agenda Modal (View) */}
                        {showAgenda && selectedUserAgenda && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                                <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                                    <div style={{ padding: '24px', background: 'linear-gradient(135deg, #1a0533, #7c3aed)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: '800' }}>
                                                Agenda — {selectedUserAgenda.firstName} {selectedUserAgenda.lastName}
                                            </h3>
                                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                                {agendaData.length} meeting(s)
                                            </p>
                                        </div>
                                        <button onClick={() => setShowAgenda(false)}
                                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }}>×</button>
                                    </div>
                                    <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(80vh - 100px)' }}>
                                        {agendaData.map((m, i) => (
                                            <div key={i} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '12px', borderLeft: `4px solid ${m.status === 'accepted' ? '#059669' : m.status === 'rejected' ? '#ef4444' : '#f59e0b'}` }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        {m.eventTitle && (
                                                            <div style={{ color: '#7c3aed', fontSize: '11px', fontWeight: '700', marginBottom: '4px', background: '#ede9fe', display: 'inline-block', padding: '1px 8px', borderRadius: '10px' }}>
                                                                {m.eventTitle}
                                                            </div>
                                                        )}
                                                        <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px', marginBottom: '4px' }}>
                                                            {m.requester?.firstName} {m.requester?.lastName} → {m.participant?.firstName} {m.participant?.lastName}
                                                        </div>
                                                        <div style={{ color: '#64748b', fontSize: '13px' }}>
                                                            {m.proposedAt === 'To be assigned' ? 'Slot to be assigned' : m.proposedAt}
                                                        </div>
                                                        <div style={{ color: '#64748b', fontSize: '13px', display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                            <span>{m.duration} min</span>
                                                            <span>{m.meetingType === 'auto' ? 'Auto' : 'Manual'}</span>
                                                            {m.roomNumber && <span style={{ background: '#d1fae5', color: '#065f46', padding: '1px 8px', borderRadius: '10px', fontSize: '12px' }}>Room {m.roomNumber}</span>}
                                                            {m.tableNumber && <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '1px 8px', borderRadius: '10px', fontSize: '12px' }}>Table {m.tableNumber}</span>}
                                                        </div>
                                                    </div>
                                                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: m.status === 'accepted' ? '#d1fae5' : m.status === 'rejected' ? '#fee2e2' : '#fef3c7', color: m.status === 'accepted' ? '#065f46' : m.status === 'rejected' ? '#991b1b' : '#92400e', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                                        {m.status === 'accepted' ? 'Accepted' : m.status === 'rejected' ? 'Rejected' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Received & Sent — USER ONLY */}
                        {!isAdmin && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                                    {[
                                        { label: 'Received', value: meetings.received?.length || 0, color: '#7c3aed' },
                                        { label: 'Sent', value: meetings.sent?.length || 0, color: '#059669' },
                                        { label: 'Pending', value: [...(meetings.received || []), ...(meetings.sent || [])].filter(m => m.status === 'pending').length, color: '#d97706' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} style={{ background: 'white', borderRadius: '12px', padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: `4px solid ${color}` }}>
                                            <div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: '800', color }}>{value}</div>
                                                <div style={{ color: '#64748b', fontSize: '12px' }}>{label}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ color: '#1a1a2e', marginBottom: '12px', fontSize: '1rem', fontWeight: '800' }}>
                                        <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '4px 12px', borderRadius: '20px', fontSize: '13px' }}>Received</span>
                                    </h3>
                                    {(!meetings.received || meetings.received.length === 0) ? (
                                        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No received requests.</div>
                                    ) : meetings.received.map(m => (
                                        <div key={m.id} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                                                        {m.requester?.firstName?.[0]}{m.requester?.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {m.requester?.firstName} {m.requester?.lastName}
                                                            <span style={{ fontSize: '11px', color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
                                                                {m.meetingType === 'auto' ? 'Auto' : 'Manual'}
                                                            </span>
                                                        </div>
                                                        {m.eventTitle && <div style={{ color: '#7c3aed', fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>{m.eventTitle}</div>}
                                                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px', display: 'flex', gap: '10px' }}>
                                                            <span>{m.proposedAt === 'To be assigned' ? 'To be assigned' : m.proposedAt}</span>
                                                            <span>{m.duration} min</span>
                                                            {m.roomNumber && <span>Room {m.roomNumber}</span>}
                                                            {m.tableNumber && <span>Table {m.tableNumber}</span>}
                                                        </div>
                                                        {m.message && <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>"{m.message}"</div>}
                                                    </div>
                                                </div>
                                                <div style={{ flexShrink: 0 }}>
                                                    {m.status === 'pending' && m.meetingType === 'manual' ? (
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button onClick={async () => {
                                                                await API.put(`/meetings/${m.id}/accept`);
                                                                setMeetings(prev => ({ ...prev, received: prev.received.map(x => x.id === m.id ? { ...x, status: 'accepted' } : x) }));
                                                            }} style={{ padding: '7px 14px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Accept</button>
                                                            <button onClick={async () => {
                                                                await API.put(`/meetings/${m.id}/reject`);
                                                                setMeetings(prev => ({ ...prev, received: prev.received.map(x => x.id === m.id ? { ...x, status: 'rejected' } : x) }));
                                                            }} style={{ padding: '7px 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Reject</button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: m.status === 'accepted' ? '#d1fae5' : m.status === 'rejected' ? '#fee2e2' : '#fef3c7', color: m.status === 'accepted' ? '#065f46' : m.status === 'rejected' ? '#991b1b' : '#92400e' }}>
                                                            {m.status === 'accepted' ? 'Accepted' : m.status === 'rejected' ? 'Rejected' : 'Pending'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <h3 style={{ color: '#1a1a2e', marginBottom: '12px', fontSize: '1rem', fontWeight: '800' }}>
                                        <span style={{ background: '#d1fae5', color: '#059669', padding: '4px 12px', borderRadius: '20px', fontSize: '13px' }}>Sent</span>
                                    </h3>
                                    {(!meetings.sent || meetings.sent.length === 0) ? (
                                        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No sent requests.</div>
                                    ) : meetings.sent.map(m => (
                                        <div key={m.id} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                                                        {m.participant?.firstName?.[0]}{m.participant?.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {m.participant?.firstName} {m.participant?.lastName}
                                                            <span style={{ fontSize: '11px', color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
                                                                {m.meetingType === 'auto' ? 'Auto' : 'Manual'}
                                                            </span>
                                                        </div>
                                                        {m.eventTitle && <div style={{ color: '#7c3aed', fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>{m.eventTitle}</div>}
                                                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px', display: 'flex', gap: '10px' }}>
                                                            <span>{m.proposedAt === 'To be assigned' ? 'To be assigned' : m.proposedAt}</span>
                                                            <span>{m.duration} min</span>
                                                            {m.roomNumber && <span>Room {m.roomNumber}</span>}
                                                            {m.tableNumber && <span>Table {m.tableNumber}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: m.status === 'accepted' ? '#d1fae5' : m.status === 'rejected' ? '#fee2e2' : '#fef3c7', color: m.status === 'accepted' ? '#065f46' : m.status === 'rejected' ? '#991b1b' : '#92400e', flexShrink: 0 }}>
                                                    {m.status === 'accepted' ? 'Accepted' : m.status === 'rejected' ? 'Rejected' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Notifications */}
                {activeTab === 'notifications' && (
                    <div>
                        {notifications.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                                <button onClick={handleReadAll} style={{ padding: '8px 16px', background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                    Mark all as read
                                </button>
                            </div>
                        )}
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {notifications.length === 0 ? (
                                <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    <p>No notifications.</p>
                                </div>
                            ) : notifications.map(n => (
                                <div key={n.id} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${n.isRead ? '#e5e7eb' : '#7c3aed'}`, opacity: n.isRead ? 0.7 : 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px', marginBottom: '4px' }}>{n.title}</div>
                                            <div style={{ color: '#64748b', fontSize: '13px' }}>{n.message}</div>
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: '12px', whiteSpace: 'nowrap', marginLeft: '16px' }}>{n.createdAt?.substring(0, 10)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Assign & Send par Event — AVEC CHECKBOXES */}
            {showAgendaModal && selectedEventForAgenda && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
                    onClick={() => { setShowAgendaModal(false); setSelectedParticipants([]); }}>
                    <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '100vh', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px', background: 'linear-gradient(135deg, #1a0533, #7c3aed)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px', fontWeight: '800', fontSize: '1.1rem' }}>Assign & Send Agenda</h3>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{selectedEventForAgenda.title}</p>
                            </div>
                            <button onClick={() => { setShowAgendaModal(false); setSelectedParticipants([]); }}
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}>×</button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 80px)' }}>

                            {/* Info */}
                            <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
                                <p style={{ margin: 0, fontSize: '13px', color: '#065f46' }}>
                                    Assigns rooms & tables to all pending auto meetings, then sends the agenda by email to selected participants.
                                </p>
                            </div>

                            {/* Liste participants avec checkboxes */}
                            {(() => {
                                const group = buildEventGroups().find(g => g.eventId === selectedEventForAgenda.id);
                                if (!group) return null;
                                const participants = getGroupParticipants(group);
                                return (
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <label style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '13px' }}>
                                                Participants ({selectedParticipants.length}/{participants.length} selected)
                                            </label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => setSelectedParticipants(participants.map(p => p.user.id))}
                                                    style={{ padding: '4px 10px', background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                                    All
                                                </button>
                                                <button onClick={() => setSelectedParticipants([])}
                                                    style={{ padding: '4px 10px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                                    None
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                            {participants.map((item, i) => {
                                                const isSelected = selectedParticipants.includes(item.user.id);
                                                return (
                                                    <div key={i}
                                                        onClick={() => setSelectedParticipants(prev =>
                                                            isSelected
                                                                ? prev.filter(id => id !== item.user.id)
                                                                : [...prev, item.user.id]
                                                        )}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer', borderBottom: i < participants.length - 1 ? '1px solid #f1f5f9' : 'none', background: isSelected ? '#faf5ff' : 'white' }}>
                                                        {/* Checkbox */}
                                                        <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${isSelected ? '#7c3aed' : '#d1d5db'}`, background: isSelected ? '#7c3aed' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            {isSelected && <span style={{ color: 'white', fontSize: '11px', fontWeight: '800' }}>✓</span>}
                                                        </div>
                                                        {/* Avatar */}
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '12px', flexShrink: 0 }}>
                                                            {item.user.firstName?.[0]}{item.user.lastName?.[0]}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '14px' }}>{item.user.firstName} {item.user.lastName}</div>
                                                            <div style={{ color: '#94a3b8', fontSize: '12px' }}>{item.user.email}</div>
                                                        </div>
                                                        <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                                            {item.meetings.length} meeting{item.meetings.length > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Subject */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#1a1a2e', fontSize: '13px' }}>Email Subject</label>
                                <input type="text" value={agendaSubject}
                                    onChange={e => setAgendaSubject(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                            </div>

                            {/* Message */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#1a1a2e', fontSize: '13px' }}>Message (optional)</label>
                                <textarea value={agendaMessage}
                                    onChange={e => setAgendaMessage(e.target.value)}
                                    placeholder="Add a personal message..."
                                    rows={3}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                            </div>

                            {/* Result */}
                            {agendaResult && (
                                <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', background: agendaResult.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: agendaResult.startsWith('✅') ? '#065f46' : '#991b1b' }}>
                                    {agendaResult.replace('✅ ', '').replace('❌ ', '')}
                                </div>
                            )}

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => { setShowAgendaModal(false); setSelectedParticipants([]); }}
                                    style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                                    Cancel
                                </button>
                                <button onClick={handleAssignAndSend}
                                    disabled={sendingAgenda || selectedParticipants.length === 0}
                                    style={{ flex: 2, padding: '12px', background: sendingAgenda || selectedParticipants.length === 0 ? '#e5e7eb' : 'linear-gradient(135deg, #059669, #047857)', color: sendingAgenda || selectedParticipants.length === 0 ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px', cursor: sendingAgenda || selectedParticipants.length === 0 ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '14px' }}>
                                    {sendingAgenda ? 'Processing...' : `Assign & Send (${selectedParticipants.length})`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}