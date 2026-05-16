import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ParticipantProfile() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Récupérer l'eventId depuis l'URL si présent
    // Ex: /participants/3?eventId=5
    const searchParams = new URLSearchParams(location.search);
    const eventId = searchParams.get('eventId');
    const [eventInfo, setEventInfo] = useState(null);

    const [participant, setParticipant] = useState(null);
    const [busySlots, setBusySlots] = useState([]);
    const [myBusySlots, setMyBusySlots] = useState([]);
    const [meetingMethod, setMeetingMethod] = useState('manual');
    const [showBooking, setShowBooking] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [duration, setDuration] = useState(30);
    const [meetingMessage, setMeetingMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        API.get('/participants')
            .then(res => {
                const found = res.data.find(p => p.id === parseInt(id));
                setParticipant(found);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        API.get(`/meetings/busy/${id}`)
            .then(res => setBusySlots(res.data))
            .catch(() => {});

        API.get('/meeting-config')
            .then(res => setMeetingMethod(res.data.method || 'manual'))
            .catch(() => {});

        API.get('/me').then(res => {
            if (res.data.id) {
                API.get(`/meetings/busy/${res.data.id}`)
                    .then(r => setMyBusySlots(r.data))
                    .catch(() => {});
            }
        }).catch(() => {});

/*API.get('/me').then(res => {
    if (res.data.id) {
        API.get(`/meetings/busy/${res.data.id}`)
            .then(r => setMyBusySlots(r.data))
            .catch(() => {});
    }
}).catch(() => {});*/

        // Charger les infos de l'événement si eventId présent
        if (eventId) {
            API.get(`/events/${eventId}`)
                .then(res => setEventInfo(res.data))
                .catch(() => {});
        }
    }, [id, user, eventId]);

    // Générer les créneaux selon les dates de l'événement
    const getAvailableDates = () => {
        if (!eventInfo) return null;
        return {
            min: eventInfo.date,
            max: eventInfo.endDate || eventInfo.date,
        };
    };

    const isSlotBusy = (date, time) => {
    if (!date || !time) return false;
    const proposed = new Date(`${date}T${time}`);
    //Combine les deux listes
    const allSlots = [...busySlots, ...myBusySlots];
        return allSlots.some(slot => {
            if (!slot.proposedAt || slot.proposedAt === 'A assigner') return false;
            const slotDateTime = slot.proposedAt.includes('T')
                ? slot.proposedAt
                : slot.proposedAt.replace(' ', 'T');
            const start = new Date(slotDateTime);
            const end = new Date(start.getTime() + slot.duration * 60000);
            const proposedEnd = new Date(proposed.getTime() + duration * 60000);
            return proposed < end && proposedEnd > start;
        });
    };

    const isMySlotBusy = (date, time) => {
        if (!date || !time) return false;
        const proposed = new Date(`${date}T${time}`);
        return myBusySlots.some(slot => {
            if (!slot.proposedAt || slot.proposedAt === 'A assigner') return false;
            const start = new Date(slot.proposedAt.replace(' ', 'T'));
            const end = new Date(start.getTime() + slot.duration * 60000);
            const proposedEnd = new Date(proposed.getTime() + duration * 60000);
            return proposed < end && proposedEnd > start;
        });
    };

    const handleBookMeeting = async () => {
        if (!selectedDate || !selectedTime) {
            setMessage('❌ Choisissez une date et une heure.');
            return;
        }
        if (isSlotBusy(selectedDate, selectedTime)) {
            setMessage('❌ Ce creneau est deja reserve.');
            return;
        }
        setSending(true);
        try {
            await API.post('/meetings', {
                participantId: parseInt(id),
                proposedAt: `${selectedDate} ${selectedTime}:00`,
                duration,
                message: meetingMessage,
                eventId: eventId ? parseInt(eventId) : null,
            });
            setMessage('✅ Demande de meeting envoyee !');
            setShowBooking(false);
        } catch (err) {
            setMessage('❌ ' + (err.response?.data?.message || 'Erreur.'));
        }
        setSending(false);
    };

    const handleAutoMeeting = async () => {
        setSending(true);
        try {
            await API.post('/meetings/request', {
                participantId: parseInt(id),
                duration,
                message: meetingMessage,
                eventId: eventId ? parseInt(eventId) : null,
            });
            setMessage('✅ Demande envoyee ! L\'admin vous assignera un creneau.');
            setShowBooking(false);
        } catch (err) {
            setMessage('❌ ' + (err.response?.data?.message || 'Erreur.'));
        }
        setSending(false);
    };

    // Générer les créneaux selon les heures de l'événement
    const timeSlots = () => {
        const slots = [];
        
        // Heure de début et fin selon l'événement ou 9h-18h par défaut
        let startHour = 9;
        let endHour = 18;
        
        if (eventInfo) {
            // Extraire l'heure de début de l'événement
            if (eventInfo.startTime) {
                const parts = eventInfo.startTime.split(':');
                startHour = parseInt(parts[0]);
            }
            // Extraire l'heure de fin de l'événement
            if (eventInfo.endTime) {
                const parts = eventInfo.endTime.split(':');
                endHour = parseInt(parts[0]);
            }
        }

        for (let h = startHour; h < endHour; h++) {
            for (let m = 0; m < 60; m += 30) {
                // Ne pas dépasser l'heure de fin
                if (h === endHour - 1 && m > 0) break;
                slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            }
        }
        return slots;
    };

    const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase();
    const getRoleBadge = (role) => ({
        'ROLE_ENTREPRENEUR': { bg: '#ede9fe', color: '#7c3aed', label: ' Entrepreneur' },
        'ROLE_INVESTISSEUR': { bg: '#d1fae5', color: '#065f46', label: ' Investisseur' },
        'ROLE_ORGANIZER': { bg: '#fef3c7', color: '#92400e', label: 'Organisateur' },
        'ROLE_ADMIN': { bg: '#fee2e2', color: '#991b1b', label: ' Admin' },
    }[role] || { bg: '#f1f5f9', color: '#64748b', label: role });

    if (loading) return <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Segoe UI', color: '#64748b' }}>Chargement...</div>;
    if (!participant) return <div style={{ textAlign: 'center', padding: '80px', color: '#ef4444', fontFamily: 'Segoe UI' }}>Participant non trouve.</div>;

    const badge = getRoleBadge(participant.userRole);
    const isOwnProfile = user && participant.id === parseInt(user.id);
    const eventDates = getAvailableDates();

    return (
        <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'Segoe UI', sans-serif" }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>

                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontWeight: '600', marginBottom: '24px', fontSize: '14px', padding: 0 }}>
                    ← Retour
                </button>

                {message && (
                    <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px', background: message.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: message.startsWith('✅') ? '#065f46' : '#991b1b', display: 'flex', justifyContent: 'space-between' }}>
                        {message.replace('✅ ', '').replace('❌ ', '')}
                        <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit' }}>×</button>
                    </div>
                )}

                {/* Info événement si vient d'un événement */}
                {eventInfo && (
                    <div style={{ background: '#ede9fe', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div>
                            <div style={{ fontWeight: '700', color: '#7c3aed', fontSize: '14px' }}>{eventInfo.title}</div>
                            <div style={{ color: '#6d28d9', fontSize: '13px' }}>Du {eventInfo.date} au {eventInfo.endDate || eventInfo.date}</div>
                        </div>
                    </div>
                )}

                {/* Profil Card */}
                <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #1a0533, #7c3aed)', padding: '40px', textAlign: 'center', color: 'white' }}>
                        <div style={{ width: '90px', height: '90px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '800', margin: '0 auto 16px', color: 'white' }}>
                            {getInitials(participant.firstName, participant.lastName)}
                        </div>
                        <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: '800' }}>{participant.fullName}</h1>
                        <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                            {badge.label}
                        </span>
                    </div>

                    <div style={{ padding: '32px' }}>
                        {participant.bio && (
                            <div style={{ marginBottom: '28px' }}>
                                <h3 style={{ color: '#1a1a2e', marginBottom: '10px', fontSize: '15px', fontWeight: '700' }}>À propos</h3>
                                <p style={{ color: '#64748b', lineHeight: '1.7', margin: 0, fontSize: '14px' }}>{participant.bio}</p>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                            {[
                                { label: 'Email', value: participant.email },
                                { label: 'Role', value: participant.company },
                                { label: 'Pays', value: participant.country },
                            ].map(({ icon, label, value }) => value && (
                                <div key={label} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
                                    <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>{icon} {label}</div>
                                    <div style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '14px', wordBreak: 'break-all' }}>{value}</div>
                                </div>
                            ))}
                        </div>

                        {!isOwnProfile && user && (
                            <button onClick={() => setShowBooking(!showBooking)} style={{ width: '100%', padding: '14px', background: showBooking ? '#f1f5f9' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: showBooking ? '#64748b' : 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                                {showBooking ? '✕ Annuler' : meetingMethod === 'auto' ? ' Demander un Meeting' : ' Book a Meeting'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Formulaire Meeting Manuel */}
                {showBooking && meetingMethod === 'manual' && (
                    <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                        <h2 style={{ color: '#1a1a2e', marginBottom: '6px', fontSize: '1.3rem', fontWeight: '800' }}>
                             Planifier un meeting avec {participant.firstName}
                        </h2>

                        {/* Info dates événement */}
                        {eventDates && (
                            <div style={{ background: '#ede9fe', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#6d28d9' }}>
                                 Le meeting doit être planifié pendant l'événement : du <strong>{eventDates.min}</strong> au <strong>{eventDates.max}</strong>
                            </div>
                        )}

                        {/* Date */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>Date *</label>
                            <input type="date" value={selectedDate}
                                min={eventDates?.min || new Date().toISOString().split('T')[0]}
                                max={eventDates?.max || ''}
                                onChange={e => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                        </div>

                        {/* Créneaux */}
                        {selectedDate && (
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>
                                    Heure * {eventInfo && <span style={{ color: '#7c3aed', fontSize: '12px' }}>({eventInfo.startTime || '09:00'} — {eventInfo.endTime || '18:00'})</span>}
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                    {timeSlots().map(time => {
                                        const busy = isSlotBusy(selectedDate, time);
                                        const myBusy = isMySlotBusy(selectedDate, time);
                                        const selected = selectedTime === time;
                                        return (
                                            <button key={time} onClick={() => !busy && setSelectedTime(time)} disabled={busy}
                                                title={busy ? (myBusy ? 'Vous etes deja occupe' : `${participant.firstName} est occupe(e)`) : ''}
                                                style={{ padding: '10px 4px', borderRadius: '8px', border: `2px solid ${busy ? '#e5e7eb' : selected ? '#7c3aed' : '#e5e7eb'}`, background: busy ? (myBusy ? '#faf5e9' : '#f9eeee') : selected ? '#7c3aed' : 'white', color: busy ? '#94a3b8' : selected ? 'white' : '#374151', cursor: busy ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600', textDecoration: busy ? 'line-through' : 'none' }}>
                                                {time}
                                                {busy && <div style={{ fontSize: '8px', color: myBusy ? '#92400e' : '#991b1b' }}>{myBusy ? 'Vous' : participant.firstName}</div>}
                                            </button>
                                        );
                                    })}
                                </div>
                                {/* Légende */}
                                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '12px', color: '#64748b' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f9eeee', display: 'inline-block' }} />
                                        {participant.firstName} occupé
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#faf5e9', display: 'inline-block' }} />
                                        Vous occupé
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Durée */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>Duree</label>
                            <select value={duration} onChange={e => setDuration(parseInt(e.target.value))}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', background: 'white' }}>
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>1 heure</option>
                            </select>
                        </div>

                        {/* Message */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>Message (optionnel)</label>
                            <textarea value={meetingMessage} onChange={e => setMeetingMessage(e.target.value)}
                                placeholder="Objet du meeting..." rows={3}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                        </div>

                        {selectedDate && selectedTime && (
                            <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
                                <div style={{ color: '#065f46', fontSize: '14px', fontWeight: '600' }}>
                                     Le {selectedDate} à {selectedTime} — {duration} min avec {participant.firstName}
                                </div>
                            </div>
                        )}

                        <button onClick={handleBookMeeting} disabled={sending || !selectedDate || !selectedTime}
                            style={{ width: '100%', padding: '14px', background: (!selectedDate || !selectedTime) ? '#e5e7eb' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: (!selectedDate || !selectedTime) ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                            {sending ? 'Envoi...' : 'Envoyer la demande'}
                        </button>
                    </div>
                )}

                {/* Formulaire Meeting Auto */}
                {showBooking && meetingMethod === 'auto' && (
                    <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                        <h2 style={{ color: '#1a1a2e', marginBottom: '6px', fontSize: '1.3rem', fontWeight: '800' }}> Demande de Meeting Automatique</h2>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>L'admin assignera le meilleur creneau disponible.</p>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>Duree</label>
                            <select value={duration} onChange={e => setDuration(parseInt(e.target.value))}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', background: 'white' }}>
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>1 heure</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>Message (optionnel)</label>
                            <textarea value={meetingMessage} onChange={e => setMeetingMessage(e.target.value)}
                                placeholder="Objet du meeting..." rows={3}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                        </div>

                        <button onClick={handleAutoMeeting} disabled={sending}
                            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                            {sending ? 'Envoi...' : ' Envoyer la demande'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}