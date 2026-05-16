import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [activeTab, setActiveTab] = useState('users');
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Vérifier que c'est bien un admin
        if (user && !user.roles?.includes('ROLE_ADMIN')) {
            navigate('/dashboard');
            return;
        }
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            const [usersRes, eventsRes] = await Promise.all([
                API.get('/admin/users'),
                API.get('/admin/events'),
            ]);
            setUsers(usersRes.data);
            setEvents(eventsRes.data);
        } catch {}
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Supprimer cet utilisateur ?')) return;
        try {
            await API.delete(`/admin/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
            setMessage(' Utilisateur supprimé.');
        } catch {
            setMessage(' Erreur lors de la suppression.');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Supprimer cet événement ?')) return;
        try {
            await API.delete(`/admin/events/${id}`);
            setEvents(events.filter(e => e.id !== id));
            setMessage(' Événement supprimé.');
        } catch {
            setMessage(' Erreur lors de la suppression.');
        }
    };

    const handleChangeRole = async (id) => {
        try {
            await API.put(`/admin/users/${id}/role`);
            setMessage(' Rôle mis à jour.');
            loadData();
        } catch {
            setMessage('❌ Erreur.');
        }
    };

    const tabs = [
        { key: 'users', label: ` Utilisateurs (${users.length})` },
        { key: 'events', label: ` Événements (${events.length})` },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'Segoe UI', sans-serif" }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #1a0533, #3b1fa8)', borderRadius: '20px', padding: '32px', marginBottom: '32px', color: 'white' }}>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}> Dashboard Administrateur</h1>
                    <p style={{ margin: '8px 0 0', opacity: 0.7 }}>Gestion complète de la plateforme B2B Events</p>
                    <div style={{ display: 'flex', gap: '32px', marginTop: '24px' }}>
                        {[
                            ['', users.length, 'Utilisateurs'],
                            ['', events.length, 'Événements'],
                            ['', events.filter(e => e.status === 'published').length, 'Publiés'],
                        ].map(([icon, val, label]) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem' }}>{icon}</div>
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
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
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

                {/* Tab: Utilisateurs */}
                {activeTab === 'users' && (
                    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {['ID', 'Nom', 'Email', 'Rôle', 'Date création', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u, i) => (
                                    <tr key={u.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>#{u.id}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>{u.firstName} {u.lastName}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{u.email}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: u.roles?.includes('ROLE_ADMIN') ? '#ede9fe' : '#f0fdf4', color: u.roles?.includes('ROLE_ADMIN') ? '#7c3aed' : '#065f46' }}>
                                                {u.roles?.includes('ROLE_ADMIN') ? ' Admin' : u.userRole || 'User'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{u.createdAt?.substring(0, 10)}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleChangeRole(u.id)} style={{ padding: '6px 12px', background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                                    Rôle
                                                </button>
                                                <button onClick={() => handleDeleteUser(u.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                                    Supprimer
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tab: Événements */}
                {activeTab === 'events' && (
                    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {['ID', 'Titre', 'Organisateur', 'Date', 'Inscrits', 'Statut', 'Actions'].map(h => (
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
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{ev.nbInscrits}/{ev.nbParticipants}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: ev.status === 'published' ? '#d1fae5' : '#fef3c7', color: ev.status === 'published' ? '#065f46' : '#92400e' }}>
                                                {ev.status === 'published' ? ' Publié' : ' Brouillon'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <button onClick={() => handleDeleteEvent(ev.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                                Supprimer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}