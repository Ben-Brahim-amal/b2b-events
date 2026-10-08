import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [activeTab, setActiveTab] = useState('analytics');
    const [message, setMessage] = useState('');
    const [allMeetings, setAllMeetings] = useState([]);
    const [meetingStatusFilter, setMeetingStatusFilter] = useState('accepted');
    const [meetingEventFilter, setMeetingEventFilter] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showAgendaModal, setShowAgendaModal] = useState(false);
    const [selectedEventForAgenda, setSelectedEventForAgenda] = useState(null);
    const [agendaSubjectAdmin, setAgendaSubjectAdmin] = useState('');
    const [agendaMessageAdmin, setAgendaMessageAdmin] = useState('');
    const [agendaResultAdmin, setAgendaResultAdmin] = useState('');
    const [sendingAgendaAdmin, setSendingAgendaAdmin] = useState(false);
    
    useEffect(() => {
        if (user && !user.roles?.includes('ROLE_ADMIN')) {
            navigate('/dashboard');
            return;
        }
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            const [usersRes, eventsRes, meetingsRes] = await Promise.all([
                API.get('/admin/users'),
                API.get('/admin/events'),
                API.get('/meetings/all'),
            ]);
            setUsers(usersRes.data);
            setEvents(eventsRes.data);
            setAllMeetings(meetingsRes.data);
        } catch {}
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Delete this user?')) return;
        try {
            await API.delete(`/admin/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
            setMessage('✅ User deleted.');
        } catch { setMessage('❌ Error deleting user.'); }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Delete this event?')) return;
        try {
            await API.delete(`/admin/events/${id}`);
            setEvents(events.filter(e => e.id !== id));
            setMessage('✅ Event deleted.');
        } catch { setMessage('❌ Error deleting event.'); }
    };

    // ── Analytics data ──
    const totalMeetings = allMeetings.length;
    const acceptedMeetings = allMeetings.filter(m => m.status === 'accepted').length;
    const pendingMeetings = allMeetings.filter(m => m.status === 'pending').length;
    const autoMeetings = allMeetings.filter(m => m.meetingType === 'auto').length;
    const manualMeetings = allMeetings.filter(m => m.meetingType === 'manual').length;
    const publishedEvents = events.filter(e => e.status === 'published').length;
    const totalRegistrations = events.reduce((acc, e) => acc + (e.nbInscrits || 0), 0);

    // Participants par rôle
    const roleCount = {};
    users.forEach(u => {
        const role = u.userRole?.replace('ROLE_', '') || 'Unknown';
        roleCount[role] = (roleCount[role] || 0) + 1;
    });

    // Top events par inscriptions
    const topEvents = [...events]
        .sort((a, b) => (b.nbInscrits || 0) - (a.nbInscrits || 0))
        .slice(0, 5);

    const tabs = [
        { key: 'analytics', label: 'Analytics' },
        { key: 'users', label: `Users (${users.length})` },
        { key: 'events', label: `Events (${events.length})` },
        { key: 'meetings', label: `Schedules` },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'Segoe UI', sans-serif" }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #1a0533 0%, #7c3aed 100%)', borderRadius: '20px', padding: '32px', marginBottom: '32px', color: 'white', position: 'relative' }}>
                    <button onClick={() => navigate(-1)}
                        style={{ position: 'absolute', top: '20px', right: '20px', padding: '8px 16px', background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                        ← Back
                    </button>
                    <h1 style={{ margin: '0 0 4px', fontSize: '2rem', fontWeight: '800' }}>Admin Dashboard</h1>
                    <p style={{ margin: '0 0 24px', opacity: 0.7, fontSize: '14px' }}>Complete management of the B2B Events platform</p>
                    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                        {[
                            { val: users.length, label: 'Users' },
                            { val: events.length, label: 'Events' },
                            { val: publishedEvents, label: 'Published' },
                            { val: totalMeetings, label: 'Meetings' },
                            { val: totalRegistrations, label: 'Registrations' },
                        ].map(({ val, label }) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', fontWeight: '800' }}>{val}</div>
                                <div style={{ opacity: 0.7, fontSize: '13px' }}>{label}</div>
                            </div>
                        ))}
                    </div>
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
                            padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                            background: activeTab === t.key ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'white',
                            color: activeTab === t.key ? 'white' : '#64748b',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab: Analytics ── */}
                {activeTab === 'analytics' && (
                    <div>
                        {/* KPI Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            {[
                                { label: 'Total Users', value: users.length, color: '#7c3aed' },
                                { label: 'Total Events', value: events.length, color: '#059669' },
                                { label: 'Accepted Meetings', value: acceptedMeetings, color: '#1d4ed8'},
                                { label: 'Total Registrations', value: totalRegistrations, color: '#d97706'},
                            ].map(({ label, value, color, bg, icon }) => (
                                <div key={label} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{label}</div>
                                            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1a1a2e' }}>{value}</div>
                                        </div>
                                        <div style={{ background: bg, padding: '12px', borderRadius: '12px', fontSize: '1.5rem' }}>
                                            {icon}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

                            {/* Meetings Stats */}
                            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                <h3 style={{ color: '#1a1a2e', margin: '0 0 20px', fontSize: '1rem', fontWeight: '800' }}>
                                    Meetings Overview
                                </h3>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {[
                                        { label: 'Accepted', value: acceptedMeetings, total: totalMeetings, color: '#059669', bg: '#d1fae5' },
                                        { label: 'Pending', value: pendingMeetings, total: totalMeetings, color: '#d97706', bg: '#fef3c7' },
                                        { label: 'Auto', value: autoMeetings, total: totalMeetings, color: '#7c3aed', bg: '#ede9fe' },
                                        { label: 'Manual', value: manualMeetings, total: totalMeetings, color: '#1d4ed8', bg: '#dbeafe' },
                                    ].map(({ label, value, total, color, bg }) => {
                                        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                                        return (
                                            <div key={label}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{label}</span>
                                                    <span style={{ fontSize: '13px', fontWeight: '700', color }}>
                                                        {value} <span style={{ color: '#94a3b8', fontWeight: '400' }}>({pct}%)</span>
                                                    </span>
                                                </div>
                                                <div style={{ background: '#f1f5f9', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '8px', transition: 'width 0.5s' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Users by Role */}
                            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                <h3 style={{ color: '#1a1a2e', margin: '0 0 20px', fontSize: '1rem', fontWeight: '800' }}>
                                    Users by Role
                                </h3>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {Object.entries(roleCount).map(([role, count]) => {
                                        const pct = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                                        const colorMap = {
                                            'ENTREPRENEUR': { color: '#7c3aed', bg: '#ede9fe' },
                                            'INVESTISSEUR': { color: '#059669', bg: '#d1fae5' },
                                            'ORGANIZER': { color: '#d97706', bg: '#fef3c7' },
                                            'ADMIN': { color: '#ef4444', bg: '#fee2e2' },
                                        };
                                        const { color, bg } = colorMap[role] || { color: '#64748b', bg: '#f1f5f9' };
                                        return (
                                            <div key={role}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{role}</span>
                                                    <span style={{ fontSize: '13px', fontWeight: '700', color }}>
                                                        {count} <span style={{ color: '#94a3b8', fontWeight: '400' }}>({pct}%)</span>
                                                    </span>
                                                </div>
                                                <div style={{ background: '#f1f5f9', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '8px', transition: 'width 0.5s' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Top Events */}
                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
                            <h3 style={{ color: '#1a1a2e', margin: '0 0 20px', fontSize: '1rem', fontWeight: '800' }}>
                                Top Events by Registrations
                            </h3>
                            {topEvents.length === 0 ? (
                                <p style={{ color: '#94a3b8', textAlign: 'center' }}>No events yet.</p>
                            ) : topEvents.map((ev, i) => {
                                const pct = ev.nbParticipants > 0 ? Math.round((ev.nbInscrits / ev.nbParticipants) * 100) : 0;
                                return (
                                    <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '13px', flexShrink: 0 }}>
                                            {i + 1}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>{ev.title}</span>
                                                <span style={{ fontSize: '13px', color: '#64748b' }}>
                                                    {ev.nbInscrits}/{ev.nbParticipants} <span style={{ color: '#7c3aed', fontWeight: '700' }}>({pct}%)</span>
                                                </span>
                                            </div>
                                            <div style={{ background: '#f1f5f9', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: '8px' }} />
                                            </div>
                                        </div>
                                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: ev.status === 'published' ? '#d1fae5' : '#fef3c7', color: ev.status === 'published' ? '#065f46' : '#92400e', flexShrink: 0 }}>
                                            {ev.status === 'published' ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Events Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            {[
                                { label: 'Published Events', value: publishedEvents, color: '#059669'},
                                { label: 'Draft Events', value: events.filter(e => e.status === 'draft').length, color: '#d97706'},
                                { label: 'Closed Events', value: events.filter(e => e.status === 'closed' || new Date(e.date) < new Date()).length, color: '#ef4444' },
                            ].map(({ label, value, icon, color, bg }) => (
                                <div key={label} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ background: bg, padding: '12px', borderRadius: '12px', fontSize: '1.5rem' }}>
                                        {icon}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color }}>{value}</div>
                                        <div style={{ color: '#64748b', fontSize: '13px' }}>{label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab: Users */}
                {activeTab === 'users' && (
                    <div>
                        {/* Search */}
                        <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input type="text" placeholder="Search by name or email..."
                                value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#1a1a2e', background: 'transparent' }} />
                            {userSearch && (
                                <button onClick={() => setUserSearch('')}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}>×</button>
                            )}
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                            {[
                                { label: 'Total', value: users.length, color: '#7c3aed', bg: '#ede9fe' },
                                { label: 'Entrepreneurs', value: users.filter(u => u.userRole === 'ROLE_ENTREPRENEUR').length, color: '#059669', bg: '#d1fae5' },
                                { label: 'Investors', value: users.filter(u => u.userRole === 'ROLE_INVESTISSEUR').length, color: '#1d4ed8', bg: '#dbeafe' },
                                { label: 'Admins', value: users.filter(u => u.roles?.includes('ROLE_ADMIN')).length, color: '#ef4444', bg: '#fee2e2' },
                            ].map(({ label, value, color, bg }) => (
                                <div key={label} style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}` }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color }}>{value}</div>
                                    <div style={{ color: '#64748b', fontSize: '12px' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        {['ID', 'Name', 'Email', 'Role', 'Created At', 'Actions'].map(h => (
                                            <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u, i) => (
                                        <tr key={u.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>#{u.id}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '12px', flexShrink: 0 }}>
                                                        {u.firstName?.[0]}{u.lastName?.[0]}
                                                    </div>
                                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>{u.firstName} {u.lastName}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{u.email}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: u.roles?.includes('ROLE_ADMIN') ? '#ede9fe' : '#f0fdf4', color: u.roles?.includes('ROLE_ADMIN') ? '#7c3aed' : '#065f46' }}>
                                                    {u.roles?.includes('ROLE_ADMIN') ? 'Admin' : u.userRole?.replace('ROLE_', '') || 'User'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{u.createdAt?.substring(0, 10)}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <button onClick={() => handleDeleteUser(u.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                            
                    </div>
                )}


                {/* ── Tab: Events ── */}
                {activeTab === 'events' && (
                    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {['ID', 'Title', 'Organiser', 'Date', 'Attendees', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((ev, i) => (
                                    <tr key={ev.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>#{ev.id}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>{ev.title}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{ev.organizer?.firstName} {ev.organizer?.lastName}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{ev.date}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                                            <span style={{ fontWeight: '700', color: '#7c3aed' }}>{ev.nbInscrits}</span>/{ev.nbParticipants}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: ev.status === 'published' ? '#d1fae5' : '#fef3c7', color: ev.status === 'published' ? '#065f46' : '#92400e' }}>
                                                {ev.status === 'published' ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <button onClick={() => handleDeleteEvent(ev.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Tab: Meetings ── */}
                {activeTab === 'meetings' && (
                    <div>
                        {/* States à ajouter dans le composant */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                            <select value={meetingEventFilter}
                                onChange={e => setMeetingEventFilter(e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '13px', outline: 'none', background: 'white', minWidth: '200px' }}>
                                <option value="">All Events</option>
                                {events.map(ev => (
                                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                                ))}
                            </select>
                        </div>

                        {(() => {
                            const filtered = allMeetings.filter(m => {
                                const matchStatus = m.status === 'pending' || m.status === 'accepted';
                                const matchEvent = meetingEventFilter === '' || String(m.eventId) === String(meetingEventFilter);
                                return matchStatus && matchEvent;
                            });

                            if (filtered.length === 0) {
                                return (
                                    <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                                        <p style={{ margin: 0, fontWeight: '600' }}>No meetings found.</p>
                                    </div>
                                );
                            }

                            const grouped = {};
                            filtered.forEach(m => {
                                const key = m.eventId ? `event_${m.eventId}` : 'no_event';
                                const title = m.eventTitle || 'No Event';
                                const eventId = m.eventId || null;
                                if (!grouped[key]) grouped[key] = { title, eventId, meetings: [] };
                                grouped[key].meetings.push(m);
                            });

                            Object.values(grouped).forEach(g => {
                                g.meetings.sort((a, b) => {
                                    if (a.proposedAt === 'To be assigned') return 1;
                                    if (b.proposedAt === 'To be assigned') return -1;
                                    return new Date(a.proposedAt) - new Date(b.proposedAt);
                                });
                            });

                            return Object.entries(grouped).map(([key, group]) => (
                                <div key={key} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
                                    {/* Header avec bouton Assign & Send */}
                                    <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #1a0533, #7c3aed)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ fontWeight: '800', fontSize: '1rem' }}>{group.title}</span>
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                                    {group.meetings.length} meeting{group.meetings.length > 1 ? 's' : ''}
                                                </span>
                                                <span style={{ background: 'rgba(245,158,11,0.3)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                                    {group.meetings.filter(m => m.status === 'pending').length} pending
                                                </span>
                                                <span style={{ background: 'rgba(16,185,129,0.3)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                                    {group.meetings.filter(m => m.status === 'accepted').length} accepted
                                                </span>
                                            </div>
                                        </div>
                                        {group.eventId && (
                                            <button onClick={() => {
                                                setSelectedEventForAgenda({ id: group.eventId, title: group.title });
                                                setAgendaSubjectAdmin('Your Meeting Agenda - ' + group.title);
                                                setAgendaMessageAdmin('');
                                                setShowAgendaModal(true);
                                                setAgendaResultAdmin('');
                                            }}
                                                style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #059669, #047857)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                                                Assign & Send Agenda
                                            </button>
                                        )}
                                    </div>

                                    {/* Table header */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 80px 80px 80px 100px', padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                                        {['Time', 'Requester', 'Participant', 'Type', 'Room', 'Table', 'Status'].map(h => (
                                            <div key={h} style={{ fontWeight: '700', color: '#374151', fontSize: '12px', textTransform: 'uppercase' }}>{h}</div>
                                        ))}
                                    </div>

                                    {/* Rows */}
                                    {group.meetings.map((m, i) => (
                                        <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 80px 80px 80px 100px', padding: '14px 24px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                            <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>
                                                {m.proposedAt === 'To be assigned'
                                                    ? <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '600' }}>To assign</span>
                                                    : m.proposedAt?.substring(11, 16)
                                                }
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '11px', flexShrink: 0 }}>
                                                    {m.requester?.firstName?.[0]}{m.requester?.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '13px' }}>{m.requester?.firstName} {m.requester?.lastName}</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>{m.requester?.userRole?.replace('ROLE_', '')}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '11px', flexShrink: 0 }}>
                                                    {m.participant?.firstName?.[0]}{m.participant?.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '13px' }}>{m.participant?.firstName} {m.participant?.lastName}</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>{m.participant?.userRole?.replace('ROLE_', '')}</div>
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: m.meetingType === 'auto' ? '#ede9fe' : '#dbeafe', color: m.meetingType === 'auto' ? '#7c3aed' : '#1d4ed8' }}>
                                                    {m.meetingType === 'auto' ? 'Auto' : 'Manual'}
                                                </span>
                                            </div>
                                            <div>
                                                {m.roomNumber ? (
                                                    <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', fontSize: '12px' }}>
                                                        R.{m.roomNumber}
                                                    </span>
                                                ) : <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>}
                                            </div>
                                            <div>
                                                {m.tableNumber ? (
                                                    <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', fontSize: '12px' }}>
                                                        T.{m.tableNumber}
                                                    </span>
                                                ) : <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>}
                                            </div>
                                            <div>
                                                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                                                    background: m.status === 'accepted' ? '#d1fae5' : m.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                                    color: m.status === 'accepted' ? '#065f46' : m.status === 'rejected' ? '#991b1b' : '#92400e'
                                                }}>
                                                    {m.status === 'accepted' ? 'Accepted' : m.status === 'rejected' ? 'Rejected' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Footer stats */}
                                    <div style={{ padding: '12px 24px', background: '#f8fafc', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                                            Auto pending: <strong style={{ color: '#f59e0b' }}>{group.meetings.filter(m => m.meetingType === 'auto' && m.status === 'pending').length}</strong>
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                                            Manual accepted: <strong style={{ color: '#059669' }}>{group.meetings.filter(m => m.meetingType === 'manual' && m.status === 'accepted').length}</strong>
                                        </span>
                                        {group.meetings.some(m => m.roomNumber) && (
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                Rooms used: <strong>{[...new Set(group.meetings.filter(m => m.roomNumber).map(m => m.roomNumber))].sort().join(', ')}</strong>
                                            </span>
                                        )}
                                        {group.meetings.some(m => m.tableNumber) && (
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                Tables used: <strong>{[...new Set(group.meetings.filter(m => m.tableNumber).map(m => m.tableNumber))].sort().join(', ')}</strong>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ));
                        })()}

                        {/* Modal Assign & Send */}
                        {showAgendaModal && selectedEventForAgenda && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
                                onClick={() => setShowAgendaModal(false)}>
                                <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                                    onClick={e => e.stopPropagation()}>
                                    <div style={{ padding: '24px', background: 'linear-gradient(135deg, #1a0533, #7c3aed)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 4px', fontWeight: '800', fontSize: '1.1rem' }}>Assign & Send Agenda</h3>
                                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{selectedEventForAgenda.title}</p>
                                        </div>
                                        <button onClick={() => setShowAgendaModal(false)}
                                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}>×</button>
                                    </div>
                                    <div style={{ padding: '24px' }}>
                                        <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#065f46' }}>
                                                This will assign rooms & tables to all pending auto meetings, then send the agenda by email to all participants of this event.
                                            </p>
                                        </div>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#1a1a2e', fontSize: '13px' }}>Email Subject</label>
                                            <input type="text" value={agendaSubjectAdmin}
                                                onChange={e => setAgendaSubjectAdmin(e.target.value)}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#1a1a2e', fontSize: '13px' }}>Message (optional)</label>
                                            <textarea value={agendaMessageAdmin}
                                                onChange={e => setAgendaMessageAdmin(e.target.value)}
                                                placeholder="Add a personal message..."
                                                rows={3}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                                        </div>

                                        {agendaResultAdmin && (
                                            <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', background: agendaResultAdmin.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: agendaResultAdmin.startsWith('✅') ? '#065f46' : '#991b1b' }}>
                                                {agendaResultAdmin.replace('✅ ', '').replace('❌ ', '')}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => setShowAgendaModal(false)}
                                                style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                                                Cancel
                                            </button>
                                            <button onClick={async () => {
                                                setSendingAgendaAdmin(true);
                                                setAgendaResultAdmin('');
                                                try {
                                                    const res = await API.post(`/meetings/event/${selectedEventForAgenda.id}/assign-and-send`, {
                                                        subject: agendaSubjectAdmin,
                                                        message: agendaMessageAdmin,
                                                    });
                                                    setAgendaResultAdmin('✅ ' + res.data.message);
                                                    loadData();
                                                } catch (err) {
                                                    setAgendaResultAdmin('❌ ' + (err.response?.data?.message || 'Error.'));
                                                }
                                                setSendingAgendaAdmin(false);
                                            }} disabled={sendingAgendaAdmin}
                                                style={{ flex: 2, padding: '12px', background: sendingAgendaAdmin ? '#e5e7eb' : 'linear-gradient(135deg, #059669, #047857)', color: sendingAgendaAdmin ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px', cursor: sendingAgendaAdmin ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '14px' }}>
                                                {sendingAgendaAdmin ? 'Processing...' : 'Assign & Send'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}