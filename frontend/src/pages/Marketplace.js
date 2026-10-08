import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Marketplace() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const searchParams = new URLSearchParams(location.search);
    const eventId = searchParams.get('eventId');

    const [opportunities, setOpportunities] = useState([]);
    const [eventInfo, setEventInfo] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeFilters, setActiveFilters] = useState([]);
    const [selectedEventFilter, setSelectedEventFilter] = useState(eventId || '');
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const [editingOpportunity, setEditingOpportunity] = useState(null);
    const [editForm, setEditForm] = useState({ type: '', title: '', description: '' });

    const [showAddModal, setShowAddModal] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);
    const [newOpportunity, setNewOpportunity] = useState({ type: '', title: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [newPhotos, setNewPhotos] = useState([]);

    useEffect(() => {
        if (eventId) {
            API.get(`/opportunities?eventId=${eventId}`)
                .then(res => { setOpportunities(res.data); setLoading(false); })
                .catch(() => setLoading(false));
            API.get(`/events/${eventId}`)
                .then(res => setEventInfo(res.data))
                .catch(() => {});
        } else {
            API.get('/opportunities')
                .then(res => { setOpportunities(res.data); setLoading(false); })
                .catch(() => setLoading(false));
            API.get('/events')
                .then(res => setEvents(res.data))
                .catch(() => {});
        }
        if (eventId) {
            const token = localStorage.getItem('token');
            if (token) {
                API.get('/events/my/registrations')
                    .then(res => {
                        const found = res.data.find(r => 
                            r.event?.id === parseInt(eventId) && r.status === 'accepted'
                        );
                        if (found) setIsAccepted(true);
                    })
                    .catch(() => {});
            }
        }
    }, [eventId]);

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
                setNewPhotos(prev => [...prev, data.filename]);
            }
        } catch {}
        setUploadingPhoto(false);
    }; 

    const toggleFilter = (type) => {
        setActiveFilters(prev =>
            prev.includes(type) ? prev.filter(f => f !== type) : [...prev, type]
        );
    };

    const filtered = opportunities.filter(o => {
        const matchType = activeFilters.length === 0 || activeFilters.includes(o.type);
        const matchSearch = search === '' ||
            o.title?.toLowerCase().includes(search.toLowerCase()) ||
            o.description?.toLowerCase().includes(search.toLowerCase()) ||
            o.user?.fullName?.toLowerCase().includes(search.toLowerCase());
        const matchEvent = selectedEventFilter === '' || String(o.eventId) === String(selectedEventFilter);
        return matchType && matchSearch && matchEvent;
    });

    const countByType = (type) => opportunities.filter(o => o.type === type).length;

    const typeConfig = {
        product: { label: 'PRODUCT', color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe' },
        service: { label: 'SERVICE', color: '#065f46', bg: '#d1fae5', border: '#a7f3d0' },
        partnership: { label: 'PARTNERSHIP', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' },
    };

    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        } catch { return dateStr; }
    };

    const getInitials = (fullName) => {
        if (!fullName) return '??';
        const parts = fullName.trim().split(' ');
        return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
    };

    const getRoleLabel = (role) => ({
        'ROLE_ENTREPRENEUR': 'Entrepreneur',
        'ROLE_INVESTISSEUR': 'Investor',
        'ROLE_ORGANIZER': 'Organiser',
    }[role] || role?.replace('ROLE_', '') || '');

    const openDetail = (o) => {
        setSelectedOpportunity(o);
        setActivePhotoIndex(0);
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748b', fontFamily: 'Segoe UI' }}>
            Loading...
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', sans-serif" }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1a0533 0%, #7c3aed 100%)', color: 'white', padding: '40px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {eventInfo ? (
                        <>
                            <div style={{ marginBottom: '8px' }}>
                                <button onClick={() => navigate(`/events/${eventId}/public`)}
                                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}>
                                    ← {eventInfo.title}
                                </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 8px' }}>Event Marketplace</h1>
                                </div>
                                {/* ← Bouton Add Opportunity */}
                                {isAccepted && (
                                    <button onClick={() => setShowAddModal(true)}
                                        style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap' }}>
                                        + Add Opportunity
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 8px' }}>Marketplace</h1>
                            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '15px' }}>
                                Discover B2B opportunities from participants
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Main */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px', display: 'flex', gap: '28px', alignItems: 'flex-start' }}>

                {/* Sidebar */}
                <div style={{ width: '260px', flexShrink: 0 }}>

                    {/* Stats */}
                    <div style={{ background: 'white', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1a1a2e' }}>{filtered.length}</div>
                        <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                            {filtered.length > 1 ? 'Opportunities found' : 'Opportunity found'}
                        </div>
                    </div>

                    {/* Search */}
                    <div style={{ background: 'white', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Search</label>
                        <input type="text" placeholder="Title, description, name..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => e.target.style.borderColor = '#7c3aed'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                    </div>

                    {/* Type Filters */}
                    <div style={{ background: 'white', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Filters</label>
                        {['product', 'service', 'partnership'].map(type => {
                            const cfg = typeConfig[type];
                            const isActive = activeFilters.includes(type);
                            return (
                                <button key={type} onClick={() => toggleFilter(type)}
                                    style={{ width: '100%', padding: '10px 14px', marginBottom: '8px', border: `2px solid ${isActive ? cfg.color : '#e5e7eb'}`, borderRadius: '10px', background: isActive ? cfg.bg : 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '700', color: isActive ? cfg.color : '#64748b', fontSize: '13px' }}>
                                        {cfg.label}
                                    </span>
                                    <span style={{ background: isActive ? cfg.color : '#e5e7eb', color: isActive ? 'white' : '#64748b', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                                        {countByType(type)}
                                    </span>
                                </button>
                            );
                        })}
                        {activeFilters.length > 0 && (
                            <button onClick={() => setActiveFilters([])}
                                style={{ width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '13px', textDecoration: 'underline' }}>
                                Clear filters
                            </button>
                        )}
                    </div>

                    {/* Event filter — only when not filtered by URL */}
                    {!eventId && events.length > 0 && (
                        <div style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>
                                Event
                            </label>
                            <select value={selectedEventFilter}
                                onChange={e => setSelectedEventFilter(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '13px', outline: 'none', background: 'white', cursor: 'pointer', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}>
                                <option value="">All events</option>
                                {events.map(ev => (
                                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                                ))}
                            </select>
                            {selectedEventFilter && (
                                <button onClick={() => setSelectedEventFilter('')}
                                    style={{ width: '100%', padding: '6px', marginTop: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px', textDecoration: 'underline' }}>
                                    Clear
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Cards */}
                <div style={{ flex: 1 }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 40px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                            <h3 style={{ color: '#1a1a2e', marginBottom: '8px' }}>No opportunities found</h3>
                            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Try different filters or check back later.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {filtered.map(o => {
                                const cfg = typeConfig[o.type] || { label: o.type, color: '#64748b', bg: '#f1f5f9', border: '#e5e7eb' };
                                const isOwner = user && o.user?.id === parseInt(user.id);
                                return (
                                    <div key={o.id} onClick={() => openDetail(o)}
                                        style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', display: 'flex', gap: '20px', alignItems: 'flex-start', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>

                                        {isOwner && (
                                            <button onClick={e => {
                                                e.stopPropagation();
                                                setEditingOpportunity(o);
                                                setEditForm({ type: o.type, title: o.title, description: o.description || '' });
                                            }}
                                                style={{ position: 'absolute', top: '12px', right: '12px', padding: '5px 12px', background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', zIndex: 1 }}>
                                                Edit
                                            </button>
                                        )}

                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' }}>
                                                    {cfg.label}
                                                </span>
                                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>{formatDate(o.createdAt)}</span>
                                            </div>

                                            <h3 style={{ margin: '0 0 10px', color: '#1a1a2e', fontSize: '1.1rem', fontWeight: '700', lineHeight: '1.4', paddingRight: isOwner ? '80px' : '0' }}>
                                                {o.title}
                                            </h3>

                                            {o.description && (
                                                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: '0 0 16px' }}>
                                                    {o.description.length > 150 ? o.description.substring(0, 150) + '...' : o.description}
                                                </p>
                                            )}

                                            <div style={{ height: '1px', background: '#f1f5f9', margin: '16px 0' }} />

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>
                                                    {getInitials(o.user?.fullName)}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{o.user?.fullName}</div>
                                                    <div style={{ color: '#7c3aed', fontSize: '12px', fontWeight: '600' }}>{getRoleLabel(o.user?.userRole)}</div>
                                                </div>
                                                <span style={{ color: '#7c3aed', fontSize: '13px', fontWeight: '600' }}>
                                                    View details →
                                                </span>
                                            </div>
                                        </div>

                                        {o.photos && o.photos.length > 0 && (
                                            <div style={{ width: '130px', flexShrink: 0, position: 'relative' }}>
                                                <img src={`http://localhost:8081/uploads/${o.photos[0]}`} alt={o.title}
                                                    style={{ width: '130px', height: '130px', objectFit: 'cover', borderRadius: '12px', display: 'block' }} />
                                                {o.photos.length > 1 && (
                                                    <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.65)', color: 'white', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                                                        +{o.photos.length - 1}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedOpportunity && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '40px 20px', overflowY: 'auto' }}
                    onClick={() => setSelectedOpportunity(null)}>
                    <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', margin: 'auto' }}
                        onClick={e => e.stopPropagation()}>

                        <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg, #1a0533, #7c3aed)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '20px 20px 0 0' }}>
                            <div>
                                {(() => {
                                    const cfg = typeConfig[selectedOpportunity.type] || { label: selectedOpportunity.type };
                                    return (
                                        <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                                            {cfg.label}
                                        </span>
                                    );
                                })()}
                                <h3 style={{ margin: '8px 0 0', fontSize: '1.2rem', fontWeight: '800' }}>
                                    {selectedOpportunity.title}
                                </h3>
                            </div>
                            <button onClick={() => setSelectedOpportunity(null)}
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', fontWeight: '700', flexShrink: 0 }}>
                                ×
                            </button>
                        </div>

                        <div style={{ padding: '28px' }}>
                            {selectedOpportunity.photos && selectedOpportunity.photos.length > 0 && (
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '10px' }}>
                                        <img src={`http://localhost:8081/uploads/${selectedOpportunity.photos[activePhotoIndex]}`}
                                            alt="photo" style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                    {selectedOpportunity.photos.length > 1 && (
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {selectedOpportunity.photos.map((photo, i) => (
                                                <div key={i} onClick={() => setActivePhotoIndex(i)}
                                                    style={{ width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: `3px solid ${activePhotoIndex === i ? '#7c3aed' : 'transparent'}`, flexShrink: 0 }}>
                                                    <img src={`http://localhost:8081/uploads/${photo}`} alt={`photo ${i + 1}`}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedOpportunity.description && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ color: '#1a1a2e', margin: '0 0 10px', fontSize: '15px', fontWeight: '700' }}>Description</h4>
                                    <p style={{ color: '#64748b', lineHeight: '1.7', margin: 0, fontSize: '14px' }}>
                                        {selectedOpportunity.description}
                                    </p>
                                </div>
                            )}

                            <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
                                Published on {formatDate(selectedOpportunity.createdAt)}
                            </div>

                            <div style={{ height: '1px', background: '#f1f5f9', marginBottom: '20px' }} />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px', flexShrink: 0 }}>
                                    {getInitials(selectedOpportunity.user?.fullName)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>{selectedOpportunity.user?.fullName}</div>
                                    <div style={{ color: '#7c3aed', fontSize: '13px', fontWeight: '600' }}>{getRoleLabel(selectedOpportunity.user?.userRole)}</div>
                                    {selectedOpportunity.user?.bio && (
                                        <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{selectedOpportunity.user.bio}</div>
                                    )}
                                </div>
                                <button onClick={() => { setSelectedOpportunity(null); navigate(`/participants/${selectedOpportunity.user?.id}`); }}
                                    style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                                    Book a Meeting →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingOpportunity && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
                    onClick={() => setEditingOpportunity(null)}>
                    <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg, #1a0533, #7c3aed)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: '800' }}>Edit Opportunity</h3>
                            <button onClick={() => setEditingOpportunity(null)}
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}>×</button>
                        </div>
                        <div style={{ padding: '28px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>Type</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    {[
                                        { key: 'product', label: 'Product' },
                                        { key: 'service', label: 'Service' },
                                        { key: 'partnership', label: 'Partnership' },
                                    ].map(t => (
                                        <div key={t.key} onClick={() => setEditForm({ ...editForm, type: t.key })}
                                            style={{ border: `2px solid ${editForm.type === t.key ? '#7c3aed' : '#e5e7eb'}`, borderRadius: '10px', padding: '10px', cursor: 'pointer', background: editForm.type === t.key ? '#faf5ff' : 'white', textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: editForm.type === t.key ? '#7c3aed' : '#64748b' }}>{t.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>Title *</label>
                                <input type="text" value={editForm.title}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>Description</label>
                                <textarea value={editForm.description}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={4}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setEditingOpportunity(null)}
                                    style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                                    Cancel
                                </button>
                                <button onClick={async () => {
                                    setSaving(true);
                                    try {
                                        await API.put(`/opportunities/${editingOpportunity.id}`, editForm);
                                        setOpportunities(prev => prev.map(o =>
                                            o.id === editingOpportunity.id ? { ...o, ...editForm } : o
                                        ));
                                        setEditingOpportunity(null);
                                    } catch { alert('Error saving changes.'); }
                                    setSaving(false);
                                }} disabled={saving || !editForm.title.trim()}
                                    style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Opportunity Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
                    onClick={() => setShowAddModal(false)}>
                    <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                        onClick={e => e.stopPropagation()}>

                        <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg, #1a0533, #7c3aed)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem' }}>Add Opportunity</h3>
                            <button onClick={() => setShowAddModal(false)}
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}>×</button>
                        </div>

                        <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>

                            {/* Type */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>Type *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    {[
                                        { key: 'product', label: 'Product' },
                                        { key: 'service', label: 'Service' },
                                        { key: 'partnership', label: 'Partnership' },
                                    ].map(t => (
                                        <div key={t.key} onClick={() => setNewOpportunity({ ...newOpportunity, type: t.key })}
                                            style={{ border: `2px solid ${newOpportunity.type === t.key ? '#7c3aed' : '#e5e7eb'}`, borderRadius: '10px', padding: '10px', cursor: 'pointer', background: newOpportunity.type === t.key ? '#faf5ff' : 'white', textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: newOpportunity.type === t.key ? '#7c3aed' : '#64748b' }}>{t.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>Title *</label>
                                <input type="text" value={newOpportunity.title}
                                    onChange={e => setNewOpportunity({ ...newOpportunity, title: e.target.value })}
                                    placeholder="e.g. Looking for investors..."
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                            </div>

                            {/* Description */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>Description</label>
                                <textarea value={newOpportunity.description}
                                    onChange={e => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                                    placeholder="Describe your opportunity..."
                                    rows={3}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                            </div>

                            {/* Photos */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>Photos (optional)</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {newPhotos.map((photo, i) => (
                                        <div key={i} style={{ position: 'relative' }}>
                                            <img src={`http://localhost:8081/uploads/${photo}`} alt={`photo ${i}`}
                                                style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                                            <button onClick={() => setNewPhotos(prev => prev.filter((_, j) => j !== i))}
                                                style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '12px' }}>
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {newPhotos.length < 5 && (
                                        <div onClick={() => document.getElementById('new-opportunity-photo').click()}
                                            style={{ width: '70px', height: '70px', border: '2px dashed #d1d5db', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', fontSize: '1.5rem' }}>
                                            {uploadingPhoto ? '...' : '+'}
                                        </div>
                                    )}
                                </div>
                                <input id="new-opportunity-photo" type="file" accept="image/*" style={{ display: 'none' }}
                                    onChange={e => handlePhotoUpload(e.target.files[0])} />
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setShowAddModal(false)}
                                    style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                                    Cancel
                                </button>
                                <button onClick={async () => {
                                    if (!newOpportunity.type || !newOpportunity.title.trim()) return;
                                    setSaving(true);
                                    try {
                                        const res = await API.post('/opportunities', {
                                            ...newOpportunity,
                                            photos: newPhotos,
                                            eventId: parseInt(eventId)
                                        });
                                        setOpportunities(prev => [res.data.opportunity, ...prev]);
                                        setShowAddModal(false);
                                        setNewOpportunity({ type: '', title: '', description: '' });
                                        setNewPhotos([]);
                                    } catch {}
                                    setSaving(false);
                                }} disabled={saving || !newOpportunity.type || !newOpportunity.title.trim()}
                                    style={{ flex: 2, padding: '12px', background: !newOpportunity.type || !newOpportunity.title.trim() ? '#e5e7eb' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: !newOpportunity.type || !newOpportunity.title.trim() ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                                    {saving ? 'Saving...' : 'Publish Opportunity'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}