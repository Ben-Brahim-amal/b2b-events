import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function EventDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [message, setMessage] = useState('');
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);

    useEffect(() => {
        API.get(`/events/${id}`)
            .then(res => {
                setEvent(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        // Vérifier si déjà inscrit
        if (user) {
            API.get('/events/my/registrations')
            .then(res => {
                const found = res.data.find(r => r.event?.id === parseInt(id));
                // ← Vérifier que l'inscription n'est pas rejetée
                if (found && found.status !== 'rejected') {
                    setAlreadyRegistered(true);
                }
            }).catch(() => {});
        }
    }, [id, user]);

    const handleRegister = async () => {
        if (!user) { navigate('/login'); return; }
        setRegistering(true);
        try {
            await API.post(`/events/${id}/register`);
            setMessage('✅ Inscription envoyee ! En attente de validation.');
            setAlreadyRegistered(true);
        } catch (err) {
            setMessage('❌ ' + (err.response?.data?.message || 'Erreur.'));
        }
        setRegistering(false);
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '80px' }}>Chargement...</div>;
    if (!event) return <div style={{ textAlign: 'center', padding: '80px', color: '#ef4444' }}>Evenement non trouve.</div>;

    const isFull = event.nbInscrits >= event.nbParticipants;

    return (
        <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'Segoe UI', sans-serif" }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>

                {/* Cover */}
                <div style={{
                    height: '300px', borderRadius: '20px', overflow: 'hidden',
                    background: event.eventBanner
                        ? `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(26,5,51,0.85)), url(http://localhost:8081/uploads/${event.eventBanner}) center/cover`
                        : 'linear-gradient(135deg, #1a0533, #7c3aed)',
                    display: 'flex', alignItems: 'flex-end', padding: '32px', marginBottom: '24px'
                }}>
                    <div style={{ color: 'white' }}>
                        <span style={{ background: 'rgba(124,58,237,0.7)', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                            {event.categories || 'B2B'}
                        </span>
                        <h1 style={{ margin: '10px 0 8px', fontSize: '2rem', fontWeight: '800' }}>{event.title}</h1>
                        <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                            <span>📅 Du {event.date} au {event.endDate || event.date}</span>
                            <span>📍 {event.city || 'Non defini'}</span>
                            <span>👥 {event.nbInscrits}/{event.nbParticipants}</span>
                        </div>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px', background: message.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: message.startsWith('✅') ? '#065f46' : '#991b1b', display: 'flex', justifyContent: 'space-between' }}>
                        {message.replace('✅ ', '').replace('❌ ', '')}
                        <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit' }}>×</button>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                    {/* Contenu gauche */}
                    <div>
                        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
                            <h2 style={{ color: '#1a1a2e', marginBottom: '16px', fontSize: '1.2rem', fontWeight: '800' }}>
                                À propos de l'evenement
                            </h2>
                            <p style={{ color: '#64748b', lineHeight: '1.8', fontSize: '15px' }}>
                                {event.description || 'Aucune description.'}
                            </p>
                        </div>

                        {/* Organisateurs */}
                        {event.organisers?.length > 0 && (
                            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                <h3 style={{ color: '#1a1a2e', marginBottom: '16px', fontSize: '1rem', fontWeight: '800' }}>Organisateurs</h3>
                                {event.organisers.map((org, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>
                                            {org.name?.[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{org.name}</div>
                                            {org.email && <div style={{ color: '#64748b', fontSize: '13px' }}>{org.email}</div>}
                                            {org.phone && <div style={{ color: '#64748b', fontSize: '13px' }}>{org.phone}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar droite */}
                    <div>
                        {/* Card inscription */}
                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px', position: 'sticky', top: '20px' }}>

                            <h3 style={{ color: '#1a1a2e', margin: '0 0 16px', fontSize: '1rem', fontWeight: '800' }}>
                                Inscription
                            </h3>

                            {/* Infos */}
                            <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                                {[
                                    { icon: '📅', label: 'Debut', value: `${event.date} ${event.startTime || ''}` },
                                    { icon: '🏁', label: 'Fin', value: `${event.endDate || event.date} ${event.endTime || ''}` },
                                    { icon: '📍', label: 'Lieu', value: `${event.city || ''} ${event.address || ''}` },
                                    { icon: '👥', label: 'Places', value: `${event.nbInscrits}/${event.nbParticipants}` },
                                ].map(({ icon, label, value }) => (
                                    <div key={label} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                        <span>{icon}</span>
                                        <div>
                                            <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>{label}</div>
                                            <div style={{ color: '#1a1a2e', fontSize: '13px', fontWeight: '600' }}>{value || 'Non defini'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Barre de progression */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ color: '#64748b', fontSize: '12px' }}>Places disponibles</span>
                                    <span style={{ color: '#7c3aed', fontSize: '12px', fontWeight: '700' }}>
                                        {Math.max(0, event.nbParticipants - event.nbInscrits)} restantes
                                    </span>
                                </div>
                                <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: '10px',
                                        background: isFull ? '#ef4444' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                        width: `${Math.min(100, (event.nbInscrits / event.nbParticipants) * 100)}%`,
                                        transition: 'width 0.3s'
                                    }} />
                                </div>
                            </div>

                            {/* Bouton inscription */}
                            {alreadyRegistered ? (
                                <div style={{ padding: '14px', background: '#d1fae5', borderRadius: '10px', textAlign: 'center', color: '#065f46', fontWeight: '700', fontSize: '14px' }}>
                                    ✅ Vous etes inscrit(e)
                                </div>
                            ) : isFull ? (
                                <div style={{ padding: '14px', background: '#fee2e2', borderRadius: '10px', textAlign: 'center', color: '#991b1b', fontWeight: '700', fontSize: '14px' }}>
                                    ❌ Evenement complet
                                </div>
                            ) : !user ? (
                                <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                                    🔐 Se connecter pour s'inscrire
                                </button>
                            ) : (
                                <button onClick={handleRegister} disabled={registering} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                                    {registering ? 'Inscription...' : "✅ S'inscrire maintenant"}
                                </button>
                            )}

                            {/* Lien vers page publique */}
                            <button onClick={() => navigate(`/events/${id}/public`)} style={{ width: '100%', marginTop: '10px', padding: '10px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                                🌐 Voir la page publique
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}