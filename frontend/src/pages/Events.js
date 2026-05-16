import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        API.get('/events')
            .then(res => { setEvents(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const filtered = events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) &&
        (category === '' || e.categories === category)
    );

    const categories = [...new Set(events.map(e => e.categories).filter(Boolean))];

    if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>Chargement...</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#1e293b' }}>
            {/* Header Section */}
            <div style={{ background: 'linear-gradient(135deg, #1a0533 0%, #7c3aed 100%)', padding: '70px 20px', color: 'white', marginBottom: '40px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>Événements B2B</h1>
                    <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>Découvrez et participez aux futurs matchmaking business.</p>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 60px' }}>
                
                {/* Barre de Recherche et Filtres */}
                <div style={{ 
                    display: 'flex', gap: '15px',  padding: '10px', 
                    borderRadius: '16px',  marginTop: '-70px', marginBottom: '40px' 
                }}>
                    <div style={{ flex: 2, position: 'relative' }}>
                        <input
                            type="text" placeholder="Rechercher par titre, secteur..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            style={{ width: '96%', padding: '14px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', transition: '0.3s' }}
                        />
                    </div>
                    <select 
                        value={category} onChange={(e) => setCategory(e.target.value)}
                        style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
                    >
                        <option value="">Toutes les catégories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <p style={{ marginBottom: '20px', fontWeight: '600', color: '#64748b' }}>
                    {filtered.length} événement(s) trouvé(s)
                </p>

                {/* Grille des Événements */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' }}>
                    {filtered.map(event => (
                        <div 
                            key={event.id} 
                            onClick={() => navigate(`/events/${event.id}/public`)}
                            style={{ 
                                background: 'white', borderRadius: '20px', overflow: 'hidden', 
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)', cursor: 'pointer',
                                transition: 'transform 0.3s ease, boxShadow 0.3s ease',
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
                            {/* Image de couverture */}
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
                                        fontSize: '3rem'
                                    }}>
                                        📅
                                    </div>
                                )}
                                <div style={{
                                    position: 'absolute', top: '8px', right: '12px',
                                    background: event.status === 'published' ? '#d1fae5' : '#fee2e2',
                                    color: event.status === 'published' ? '#065f46' : '#991b1b',
                                    padding: '4px 12px', borderRadius: '30px', fontSize: '11px',
                                    fontWeight: '800', textTransform: 'uppercase'
                                }}>
                                    {event.status === 'published' ? '● Ouvert' : '● Fermé'}
                                </div>

                                <div style={{
                                    position: 'absolute', top: '8px', right: '12px',
                                    background: event.status === 'published' ? '#d1fae5' : event.status === 'closed' ? '#f1f5f9' : '#fee2e2',
                                    color: event.status === 'published' ? '#065f46' : event.status === 'closed' ? '#991b1b' : '#991b1b',
                                    padding: '4px 12px', borderRadius: '30px', fontSize: '11px',
                                    fontWeight: '800', textTransform: 'uppercase'
                                }}>
                                    {event.status === 'published' ? '● Ouvert' : event.status === 'closed' ? '● Fermé' : '● Brouillon'}
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
                                        <span>📅</span> {event.date}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                                        <span>📍</span> {event.location || 'Online Event'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                                        <span>👥</span> <strong>{event.nbInscrits || 0}</strong> / {event.nbParticipants || 0} participants
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '30px', height: '30px', background: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                                            {event.organizer?.firstName?.charAt(0)}
                                        </div>
                                        <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                                            {event.organizer?.firstName} {event.organizer?.lastName}
                                        </span>
                                    </div>
                                    <button style={{ color: '#6366f1', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                                        Détails →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
/*
import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Events() {
const [events, setEvents] = useState([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState('');
const [category, setCategory] = useState('');
const navigate = useNavigate();

useEffect(() => {
API.get('/events').then(res => { setEvents(res.data); setLoading(false); }).catch(() => setLoading(false));
}, []);

const filtered = events.filter(e =>
e.title.toLowerCase().includes(search.toLowerCase()) &&
(category === '' || e.categories === category)
);

const categories = [...new Set(events.map(e => e.categories).filter(Boolean))];

if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>Chargement...</div>;

return (
<div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'Segoe UI', sans-serif" }}>
<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>

<div style={{ marginBottom: '32px' }}>
<h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1a1a2e', margin: 0 }}> Evenements</h1>
<p style={{ color: '#64748b', marginTop: '8px' }}>{filtered.length} evenement(s) disponible(s)</p>
</div>

{/* Filtres *//*}
<div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
<input
type="text" placeholder="Rechercher un evenement..."
value={search} onChange={(e) => setSearch(e.target.value)}
style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none' }}
/>
<select value={category} onChange={(e) => setCategory(e.target.value)}
style={{ padding: '12px 16px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', background: 'white' }}>
<option value="">Toutes categories</option>
{categories.map(c => <option key={c} value={c}>{c}</option>)}
</select>
</div>

{/* Liste *//*}
{filtered.length === 0 ? (
<div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
<div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
<p>Aucun evenement trouve.</p>
</div>
) : (
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
 {filtered.map(event => (
<div key={event.id} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', transition: 'transform 0.2s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                                        {event.categories || 'General'}
                                    </span>
                                    <span style={{ background: event.status === 'published' ? '#d1fae5' : '#fee2e2', color: event.status === 'published' ? '#065f46' : '#991b1b', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                                        {event.status === 'published' ? '✅ Ouvert' : '❌ Ferme'}
                                    </span>
                                </div>

                                <h3 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: '1.1rem', fontWeight: '700' }}>{event.title}</h3>
                                <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px', lineHeight: '1.5' }}>
                                    {event.description?.substring(0, 100)}{event.description?.length > 100 ? '...' : ''}
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                                    <span style={{ color: '#64748b', fontSize: '13px' }}>📅 Du {event.date} au {event.endDate || event.date}</span>
                                    {event.location && <span style={{ color: '#64748b', fontSize: '13px' }}>📍 {event.location}</span>}
                                    <span style={{ color: '#64748b', fontSize: '13px' }}>👥 {event.nbInscrits}/{event.nbParticipants} inscrits</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontSize: '13px' }}>
                                        Par {event.organizer?.firstName} {event.organizer?.lastName}
                                    </span>
                                    <button onClick={() => navigate(`/events/${event.id}/public`)}
                                        style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                        Voir →
                                    </button>
                                </div>
</div>
))}
</div>
)}
</div>
</div>
 );
}*/