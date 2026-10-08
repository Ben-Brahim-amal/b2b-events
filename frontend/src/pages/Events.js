import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const navigate = useNavigate();

    const eventsCache = { data: null, timestamp: null };

    useEffect(() => {
        const now = Date.now();
        // Cache valide pendant 30 secondes
        if (eventsCache.data && now - eventsCache.timestamp < 30000) {
            setEvents(eventsCache.data);
            setLoading(false);
            return;
        }
        API.get('/events')
            .then(res => {
                eventsCache.data = res.data;
                eventsCache.timestamp = Date.now();
                setEvents(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filtered = events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) &&
        (category === '' || e.categories === category)
    );

    const categories = [...new Set(events.map(e => e.categories).filter(Boolean))];

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>
            Loading...
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#1e293b' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1a0533 0%, #7c3aed 100%)', padding: '70px 20px', color: 'white', marginBottom: '40px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>B2B Events</h1>
                    <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>Discover and participate in upcoming business matchmaking events.</p>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 60px' }}>

                {/* Search & Filters */}
                <div style={{ display: 'flex', gap: '15px', padding: '10px', borderRadius: '16px', marginTop: '-70px', marginBottom: '40px' }}>
                    <div style={{ flex: 2 }}>
                        <input
                            type="text"
                            placeholder="Search by title, sector..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: '96%', padding: '14px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }}
                        />
                    </div>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
                    >
                        <option value="">All categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <p style={{ marginBottom: '20px', fontWeight: '600', color: '#64748b' }}>
                    {filtered.length} event{filtered.length > 1 ? 's' : ''} found
                </p>

                {/* Events Grid */}
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        <p>No events found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' }}>
                        {filtered.map(event => (
                            <div
                                key={event.id}
                                onClick={() => navigate(`/events/${event.id}/public`)}
                                style={{
                                    background: 'white', borderRadius: '20px', overflow: 'hidden',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)', cursor: 'pointer',
                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                    border: '1px solid #f1f5f9'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px)';
                                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.04)';
                                }}
                            >
                                {/* Cover image */}
                                <div style={{ height: '150px', position: 'relative', overflow: 'hidden' }}>
                                    {event.eventBanner ? (
                                        <img
                                            src={`http://localhost:8081/uploads/${event.eventBanner}`}
                                            alt={event.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '100%', height: '100%',
                                            background: 'linear-gradient(135deg, #1a0533 0%, #7c3aed 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontSize: '1.5rem', fontWeight: '700', letterSpacing: '2px'
                                        }}>
                                            
                                        </div>
                                    )}
                                    <div style={{
                                        position: 'absolute', top: '8px', right: '12px',
                                        background: event.status === 'published' ? '#d1fae5' : event.status === 'closed' ? '#f1f5f9' : '#fee2e2',
                                        color: event.status === 'published' ? '#065f46' : event.status === 'closed' ? '#64748b' : '#991b1b',
                                        padding: '4px 12px', borderRadius: '30px', fontSize: '11px',
                                        fontWeight: '800', textTransform: 'uppercase'
                                    }}>
                                        {event.status === 'published' ? 'Open' : event.status === 'closed' ? 'Closed' : 'Draft'}
                                    </div>
                                </div>

                                <div style={{ padding: '18px' }}>
                                    <span style={{ color: '#6366f1', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {event.categories || 'Networking'}
                                    </span>

                                    <h3 style={{ margin: '8px 0 12px', fontSize: '1.25rem', color: '#0f172a', lineHeight: '1.4' }}>
                                        {event.title}
                                    </h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                                            Date: {event.date}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                                            Location: {event.city || event.location || 'Online'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                                            Attendees: <strong>{event.nbInscrits || 0}</strong> / {event.nbParticipants || 0}
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                                                {event.organizer?.firstName?.charAt(0)}
                                            </div>
                                            <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                                                {event.organizer?.firstName} {event.organizer?.lastName}
                                            </span>
                                        </div>
                                        <button style={{ color: '#6366f1', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                                            Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}