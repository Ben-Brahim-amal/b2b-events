import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function CreateEvent() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('event');
    const [message, setMessage] = useState('');
    const [tabErrors, setTabErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        categories: 'B2B',
        eventType: 'Online',
        startDateTime: '',
        endDateTime: '',
        nbParticipants: '',
        nbRoom: '',
        nbTable: '',
        sessionDuration: '',
        city: '',
        address: '',
        eventBanner: null,
        targets: [],
        sponsors: [],
        status: 'published',
    });

    const [eventId, setEventId] = useState(null);
    const [planingSessions, setPlaningSessions] = useState([]);
    const [newSession, setNewSession] = useState({
            title: '',
            startTime: '',
            endTime: '',
            speaker: '',
            description: '',
    });
    const [savingSession, setSavingSession] = useState(false);

    const [organisers, setOrganisers] = useState([{ name: '', logo: '', email: '', phone: '' }]);
    const [pages, setPages] = useState([
        { name: 'FAQ', content: '', isActive: true, position: 0, faqs: [
            { q: "Comment faire l'enregistrement ?", a: '' },
            { q: 'Comment nous contacter ?', a: '' },
            { q: 'Quels sont les criteres de participation ?', a: '' },
        ]},
        { name: 'Contact', content: '', isActive: true, position: 1, faqs: [] },
    ]);

    const [newTarget, setNewTarget] = useState('');
    const [newSponsor, setNewSponsor] = useState({ name: '', website: '', logo: '', logoUrl: '' });    const [coverPreview, setCoverPreview] = useState(null);
    const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }));

    const addOrganiser = () => setOrganisers([...organisers, { name: '', logo: '', email: '', phone: '' }]);
    const updateOrganiser = (i, key, value) => {
        const updated = [...organisers];
        updated[i][key] = value;
        setOrganisers(updated);
    };
    const removeOrganiser = (i) => setOrganisers(organisers.filter((_, j) => j !== i));

    const addPage = () => setPages([...pages, { name: '', content: '', isActive: true, position: pages.length, faqs: [] }]);
    const updatePage = (i, key, value) => {
        const updated = [...pages];
        updated[i][key] = value;
        setPages(updated);
    };
    const removePage = (i) => setPages(pages.filter((_, j) => j !== i));

    const handleCoverUpload = async (file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8081/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.filename) {
                handleChange('eventBanner', data.filename);
                setCoverPreview(data.url);
            }
        } catch {
            setMessage('❌ Erreur upload image.');
        }
    };

    // ── VALIDATION PAR ONGLET ──
    const validateTab = (tab) => {
        const errors = {};

        if (tab === 'event') {
            if (!form.title.trim()) errors.title = "Le nom de l'evenement est obligatoire.";
            if (!form.description.trim()) errors.description = "La description est obligatoire.";
            if (!form.startDateTime) errors.startDateTime = "La date de debut est obligatoire.";
            if (!form.endDateTime) errors.endDateTime = "La date de fin est obligatoire.";
            if (form.startDateTime && form.endDateTime) {
                if (new Date(form.endDateTime) <= new Date(form.startDateTime)) {
                    errors.endDateTime = "La date de fin doit etre apres la date de debut.";
                }
                if (new Date(form.startDateTime) < new Date()) {
                    errors.startDateTime = "La date de debut doit etre dans le futur.";
                }
            }
            if (!form.city.trim()) errors.city = "La ville est obligatoire.";
            if (!form.address.trim()) errors.address = "L'adresse est obligatoire.";
            if (!organisers[0].name.trim()) errors.organiserName = "Le nom de l'organisateur est obligatoire.";
        }

        if (tab === 'planning') {
            if (planingSessions.length === 0) {
                errors.planning = "Ajoutez au moins une session au planning.";
            }
        }     

        if (tab === 'sponsors') {
            if (planingSessions.length === 0) {
                errors.planning = "Ajoutez au moins une session au planning.";
            }
        }

        if (tab === 'pages') {
            const faqPage = pages.find(p => p.name === 'FAQ');
            const contactPage = pages.find(p => p.name === 'Contact');

            if (!faqPage || !faqPage.isActive) {
                errors.pages = "La page FAQ doit etre active.";
            }
            if (!contactPage || !contactPage.isActive) {
                errors.pages = "La page Contact doit etre active.";
            }
            if (contactPage && !contactPage.contactEmail?.trim()) {
                errors.contactEmail = "L'email de contact est obligatoire dans la page Contact.";
            }
        }
        return errors;
    };

    const tabs = [
        { key: 'event', label: 'Event' },
        { key: 'planning', label: 'Planing' },
        { key: 'target', label: 'Target' },
        { key: 'sponsors', label: 'Sponsors' },
        { key: 'pages', label: 'Pages' },
    ];

    const tabOrder = ['event', 'planning', 'target', 'sponsors', 'pages'];

    const handleContinue = async () => {
    const errors = validateTab(activeTab);
        if (Object.keys(errors).length > 0) {
            setTabErrors(errors); 
            return;
        }
        setTabErrors({});

        //pour créer l'événement quand on quitte l'onglet Event
        if (activeTab === 'event' && !eventId) {
            setLoading(true);
            try {
                const payload = {
                    title: form.title,
                    description: form.description,
                    date: form.startDateTime ? form.startDateTime.split('T')[0] : null,
                    startTime: form.startDateTime ? form.startDateTime.replace('T', ' ') + ':00' : null,
                    endTime: form.endDateTime ? form.endDateTime.replace('T', ' ') + ':00' : null,
                    city: form.city,
                    address: form.address,
                    nbParticipants: parseInt(form.nbParticipants) || 1,
                    nbRoom: form.nbRoom ? parseInt(form.nbRoom) : null,
                    nbTable: form.nbTable ? parseInt(form.nbTable) : null,
                    sessionDuration: form.sessionDuration ? parseInt(form.sessionDuration) : null,
                    categories: form.categories,
                    eventType: form.eventType,
                    eventBanner: form.eventBanner, // ← important
                    status: 'draft',
                };

                const res = await API.post('/events', payload);
                const newEventId = res.data.event.id;
                setEventId(newEventId);

                // Ajouter les organisateurs
                for (const org of organisers.filter(o => o.name.trim() !== '')) {
                    await API.post(`/events/${newEventId}/organisers`, org);
                }

                setMessage(' Evenement sauvegarde ! Continuez avec le planning.');
                setTimeout(() => setMessage(''), 3000);

            } catch (err) {
                setMessage(' Erreur lors de la creation. Verifiez les champs.');
                setLoading(false);
                return;
            }
            setLoading(false);
        }

        const currentIndex = tabOrder.indexOf(activeTab);
        if (currentIndex < tabOrder.length - 1) {
            setActiveTab(tabOrder[currentIndex + 1]);
        }
    };

    const handleTabClick = (tabKey) => {
        const currentIndex = tabOrder.indexOf(activeTab);
        const targetIndex = tabOrder.indexOf(tabKey);

        // Permettre de revenir en arrière librement
        if (targetIndex < currentIndex) {
            setActiveTab(tabKey);
            setTabErrors({});
            return;
        }

        // Pour avancer, valider les onglets intermédiaires
        for (let i = currentIndex; i < targetIndex; i++) {
            const errors = validateTab(tabOrder[i]);
            if (Object.keys(errors).length > 0) {
                setTabErrors(errors);
                setActiveTab(tabOrder[i]);
                return;
            }
        }
        setTabErrors({});
        setActiveTab(tabKey);
    };

    /*const handleSubmit = async () => {
        // Valider tous les onglets avant de soumettre
        for (const tab of tabOrder) {
            const errors = validateTab(tab);
            if (Object.keys(errors).length > 0) {
                setTabErrors(errors);
                setActiveTab(tab);
                setMessage('❌ Veuillez corriger les erreurs avant de soumettre.');
                return;
            }
        }

        setLoading(true);
        setMessage('');
        try {
            const payload = {
                title: form.title,
                description: form.description,
                date: form.startDateTime ? form.startDateTime.split('T')[0] : null,
                startTime: form.startDateTime ? form.startDateTime.replace('T', ' ') + ':00' : null,
                endTime: form.endDateTime ? form.endDateTime.replace('T', ' ') + ':00' : null,
                city: form.city,
                address: form.address,
                nbParticipants: parseInt(form.nbParticipants) || 1,
                nbRoom: form.nbRoom ? parseInt(form.nbRoom) : null,
                nbTable: form.nbTable ? parseInt(form.nbTable) : null,
                sessionDuration: form.sessionDuration ? parseInt(form.sessionDuration) : null,
                categories: form.categories,
                eventType: form.eventType,
                eventBanner: form.eventBanner,
                targets: form.targets,
                sponsors: form.sponsors,
                status: 'published',
            };

            const res = await API.post('/events', payload);
            const eventId = res.data.event.id;

            for (const org of organisers.filter(o => o.name.trim() !== '')) {
                await API.post(`/events/${eventId}/organisers`, org);
            }

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                if (page.name.trim() !== '') {
                    const content = page.name === 'FAQ'
                        ? JSON.stringify(page.faqs || [])
                        : page.content;
                    await API.post(`/events/${eventId}/pages`, {
                        name: page.name,
                        content,
                        isActive: page.isActive,
                        position: i,
                    });
                }
            }

            setMessage('✅ Evenement cree avec succes !');
            setTimeout(() => navigate(`/events/${eventId}/public`), 1000);
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) {
                setMessage('❌ ' + Object.values(errors).join(' | '));
            } else {
                setMessage('❌ ' + (err.response?.data?.message || 'Erreur lors de la creation.'));
            }
        }
        setLoading(false);
    };*/

    const handleSubmit = async () => {
    setLoading(true);
    setMessage('');
        try {
            // Mettre à jour l'événement avec les données finales
            await API.put(`/events/${eventId}`, {
                targets: form.targets,
                sponsors: form.sponsors,
                eventBanner: form.eventBanner, 
                status: 'published',
            });

            // Ajouter les pages
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                if (page.name.trim() !== '') {
                    let content = page.content || '';
                    if (page.name === 'FAQ') {
                        content = JSON.stringify((page.faqs || []).map(f => ({ q: f.q, a: f.a })));
                    } else if (page.name === 'Contact') {
                        content = JSON.stringify({
                            email: page.contactEmail || '',
                            phone: page.contactPhone || '',
                            address: page.contactAddress || '',
                            message: page.content || '',
                        });
                    }
                    await API.post(`/events/${eventId}/pages`, {
                        name: page.name,
                        content,
                        isActive: page.isActive,
                        position: i,
                    });
                }
            }

            setMessage(' Evenement publie avec succes !');
            setTimeout(() => navigate(`/events/${eventId}/public`), 1000);
        } catch (err) {
            setMessage(' ' + (err.response?.data?.message || 'Erreur.'));
        }
        setLoading(false);
    };

    const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' };
    const errorStyle = { color: '#ef4444', fontSize: '12px', marginTop: '4px' };

    const inputWithError = (key) => ({
        ...inputStyle,
        borderColor: tabErrors[key] ? '#ef4444' : '#d1d5db',
    });

    const labelStyle = { display: 'block', marginBottom: '6px', color: '#374151', fontSize: '13px', fontWeight: '600' };

    const applyFormat = (pageIndex, tag) => {
        const textarea = document.getElementById(pageIndex === -1 ? 'main-desc' : `page-desc-${pageIndex}`);
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.substring(start, end);
        let formatted = selected;
        if (tag === 'b') formatted = `**${selected}**`;
        if (tag === 'i') formatted = `*${selected}*`;
        if (tag === 'u') formatted = `__${selected}__`;
        if (tag === 'list') formatted = `\n- ${selected}`;
        const newValue = textarea.value.substring(0, start) + formatted + textarea.value.substring(end);
        if (pageIndex === -1) handleChange('description', newValue);
        else updatePage(pageIndex, 'content', newValue);
    };

    const FormatToolbar = ({ pageIndex }) => (
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb', padding: '6px 10px', display: 'flex', gap: '6px' }}>
            {[
                { label: 'B', tag: 'b', style: { fontWeight: 'bold' } },
                { label: 'I', tag: 'i', style: { fontStyle: 'italic' } },
                { label: 'U', tag: 'u', style: { textDecoration: 'underline' } },
                { label: '≡', tag: 'list', style: {} },
            ].map(({ label, tag, style }) => (
                <button key={tag} type="button"
                    onMouseDown={e => { e.preventDefault(); applyFormat(pageIndex, tag); }}
                    style={{ padding: '4px 10px', background: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', ...style }}>
                    {label}
                </button>
            ))}
        </div>
    );

    const isLastTab = activeTab === 'pages';

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', sans-serif" }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>

                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1a1a2e', margin: '0 0 32px' }}>
                    Create an Event
                </h1>

            {message && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px', background: message.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: message.startsWith('✅') ? '#065f46' : '#991b1b', display: 'flex', justifyContent: 'space-between' }}>
                    {message.replace('✅ ', '').replace('❌ ', '')}
                    <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit' }}>×</button>
                </div>
            )}

                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

                    {/* Tabs */}
                    <div style={{ borderBottom: '2px solid #f1f5f9', display: 'flex', padding: '0 32px' }}>
                        {tabs.map((t, index) => {
                            const currentIndex = tabOrder.indexOf(activeTab);
                            const isCompleted = index < currentIndex;
                            const isActive = activeTab === t.key;
                            return (
                                <button key={t.key} onClick={() => handleTabClick(t.key)} style={{
                                    padding: '16px 20px', border: 'none', background: 'none', cursor: 'pointer',
                                    fontSize: '14px', fontWeight: '600',
                                    color: isActive ? '#7c3aed' : isCompleted ? '#059669' : '#64748b',
                                    borderBottom: isActive ? '2px solid #7c3aed' : isCompleted ? '2px solid #059669' : '2px solid transparent',
                                    marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '6px'
                                }}>
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ padding: '32px' }}>

                        {/* ── TAB EVENT ── */}
                        {activeTab === 'event' && (
                            <div>
                                {/* Event name */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={labelStyle}>Event name *</label>
                                    <input type="text" value={form.title}
                                        onChange={e => { handleChange('title', e.target.value); setTabErrors(p => ({ ...p, title: '' })); }}
                                        style={inputWithError('title')} placeholder="Nom de l'evenement" />
                                    {tabErrors.title && <p style={errorStyle}> {tabErrors.title}</p>}
                                </div>

                                {/* Description */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={labelStyle}>Description *</label>
                                    <div style={{ border: `1px solid ${tabErrors.description ? '#ef4444' : '#d1d5db'}`, borderRadius: '8px', overflow: 'hidden' }}>
                                        <FormatToolbar pageIndex={-1} />
                                        <textarea id="main-desc" value={form.description}
                                            onChange={e => { handleChange('description', e.target.value); setTabErrors(p => ({ ...p, description: '' })); }}
                                            rows={5} placeholder="Description de l'evenement..."
                                            style={{ width: '100%', padding: '12px', border: 'none', outline: 'none', resize: 'vertical', fontSize: '14px', boxSizing: 'border-box' }} />
                                    </div>
                                    {tabErrors.description && <p style={errorStyle}> {tabErrors.description}</p>}
                                </div>

                                {/* Dates */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={labelStyle}>Event start date *</label>
                                        <input type="datetime-local" value={form.startDateTime}
                                            onChange={e => { handleChange('startDateTime', e.target.value); setTabErrors(p => ({ ...p, startDateTime: '' })); }}
                                            style={inputWithError('startDateTime')} />
                                        {tabErrors.startDateTime && <p style={errorStyle}> {tabErrors.startDateTime}</p>}
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Event end date *</label>
                                        <input type="datetime-local" value={form.endDateTime}
                                            onChange={e => { handleChange('endDateTime', e.target.value); setTabErrors(p => ({ ...p, endDateTime: '' })); }}
                                            style={inputWithError('endDateTime')} />
                                        {tabErrors.endDateTime && <p style={errorStyle}> {tabErrors.endDateTime}</p>}
                                    </div>
                                </div>

                                {/* Capacity, Nb room, Nb table, Session */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                    {[
                                        { label: 'Capacity', key: 'nbParticipants', placeholder: '100' },
                                        { label: 'Nb room', key: 'nbRoom', placeholder: '5' },
                                        { label: 'Nb table', key: 'nbTable', placeholder: '10' },
                                        { label: 'Duree session (min)', key: 'sessionDuration', placeholder: '30' },
                                    ].map(({ label, key, placeholder }) => (
                                        <div key={key}>
                                            <label style={labelStyle}>{label}</label>
                                            <input type="number" value={form[key]}
                                                onChange={e => handleChange(key, e.target.value)}
                                                style={inputStyle} placeholder={placeholder} />
                                        </div>
                                    ))}
                                </div>

                                {/* City, Address */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={labelStyle}>City *</label>
                                        <input type="text" value={form.city}
                                            onChange={e => { handleChange('city', e.target.value); setTabErrors(p => ({ ...p, city: '' })); }}
                                            style={inputWithError('city')} placeholder="Tunis" />
                                        {tabErrors.city && <p style={errorStyle}> {tabErrors.city}</p>}
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Address *</label>
                                        <input type="text" value={form.address}
                                            onChange={e => { handleChange('address', e.target.value); setTabErrors(p => ({ ...p, address: '' })); }}
                                            style={inputWithError('address')} placeholder="Rue de la Republique" />
                                        {tabErrors.address && <p style={errorStyle}> {tabErrors.address}</p>}
                                    </div>
                                </div>

                                {/* Cover */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={labelStyle}>Cover de l'evenement</label>
                                    <div style={{ border: '2px dashed #d1d5db', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#fafafa' }}
                                        onClick={() => document.getElementById('cover-input').click()}>
                                        {coverPreview ? (
                                            <div style={{ position: 'relative' }}>
                                                <img src={`http://localhost:8081${coverPreview}`} alt="cover"
                                                    style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                                                <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '12px' }}>
                                                    Changer
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🖼</div>
                                                <div style={{ fontSize: '14px' }}>Cliquez pour choisir un fichier image</div>
                                            </div>
                                        )}
                                        <input id="cover-input" type="file" accept="image/*" style={{ display: 'none' }}
                                            onChange={e => handleCoverUpload(e.target.files[0])} />
                                    </div>
                                </div>

                                {/* Organised by */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <label style={{ ...labelStyle, margin: 0 }}>Organised by</label>
                                        <button onClick={addOrganiser} style={{ padding: '6px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '18px' }}>+</button>
                                    </div>
                                    {tabErrors.organiserName && (
                                        <div style={{ padding: '10px 14px', background: '#fee2e2', borderRadius: '8px', marginBottom: '12px' }}>
                                            <p style={{ ...errorStyle, margin: 0 }}> {tabErrors.organiserName}</p>
                                        </div>
                                    )}
                                    {organisers.map((org, i) => (
                                        <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '12px', border: `1px solid ${i === 0 && tabErrors.organiserName ? '#ef4444' : '#e5e7eb'}` }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                                                <div>
                                                    <label style={labelStyle}>Nom *</label>
                                                    <input type="text" value={org.name}
                                                        onChange={e => { updateOrganiser(i, 'name', e.target.value); if (i === 0) setTabErrors(p => ({ ...p, organiserName: '' })); }}
                                                        style={{ ...inputStyle, borderColor: i === 0 && tabErrors.organiserName ? '#ef4444' : '#d1d5db' }}
                                                        placeholder="Nom organisateur" />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Logo</label>
                                                    <input type="file" accept="image/*"
                                                        style={{ width: '100%', padding: '8px', border: '2px dashed #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
                                                </div>
                                                {i > 0 && (
                                                    <button onClick={() => removeOrganiser(i)} style={{ padding: '10px 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>✕</button>
                                                )}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                                                <div>
                                                    <label style={labelStyle}>Email</label>
                                                    <input type="email" value={org.email}
                                                        onChange={e => updateOrganiser(i, 'email', e.target.value)}
                                                        style={inputStyle} placeholder="email@exemple.com" />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Telephone</label>
                                                    <input type="text" value={org.phone}
                                                        onChange={e => updateOrganiser(i, 'phone', e.target.value.replace(/[^0-9+\-\s()]/g, ''))}
                                                        style={inputStyle} placeholder="+216 XX XXX XXX" maxLength={20} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Statut */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={labelStyle}>Statut</label>
                                    <select value={form.status} onChange={e => handleChange('status', e.target.value)} style={inputStyle}>
                                        <option value="published">Publie</option>
                                        <option value="draft">Brouillon</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* ── TAB PLANNING ── */}
                        {activeTab === 'planning' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                {tabErrors.planning && (
                                    <div style={{ padding: '12px 16px', background: '#fee2e2', borderRadius: '10px', marginBottom: '20px', color: '#991b1b', fontSize: '14px', fontWeight: '600' }}>
                                        {tabErrors.planning}
                                    </div>
                                )}                       
                                <h3 style={{ color: '#1a1a2e', margin: 0, fontSize: '1rem', fontWeight: '800' }}>
                                    Planning de l'evenement
                                </h3>
                                {eventId && (
                                    <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                                         Evenement #{eventId} cree
                                    </span>
                                )}
                            </div>

                            {/* Formulaire ajout session */}
                            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Titre de la session *</label>
                                    <input type="text" value={newSession.title}
                                        onChange={e => setNewSession({ ...newSession, title: e.target.value })}
                                        placeholder="Ex: Conference inaugurale, Atelier networking..."
                                        style={inputStyle} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    {/* Heure de debut */}
                                    <div>
                                        <label style={labelStyle}>Heure de debut *</label>
                                        <input
                                            type="datetime-local"
                                            value={newSession.startTime}
                                            min={form.startDateTime || ''}
                                            max={form.endDateTime || ''}
                                            onChange={e => {
                                                const val = e.target.value;
                                                // Vérifier que la date est dans la plage de l'événement
                                                if (form.startDateTime && val < form.startDateTime) {
                                                    setMessage(' L\'heure de debut ne peut pas etre avant le debut de l\'evenement.');
                                                    return;
                                                }
                                                if (form.endDateTime && val > form.endDateTime) {
                                                    setMessage(' L\'heure de debut ne peut pas depasser la fin de l\'evenement.');
                                                    return;
                                                }
                                                setMessage('');
                                                setNewSession({ ...newSession, startTime: val });
                                            }}
                                            style={inputStyle}
                                        />
                                        {form.startDateTime && (
                                            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                                                Entre {form.startDateTime.replace('T', ' ')} et {form.endDateTime.replace('T', ' ')}
                                            </p>
                                        )}
                                    </div>

                                    {/* Heure de fin */}
                                    <div>
                                        <label style={labelStyle}>Heure de fin *</label>
                                        <input
                                            type="datetime-local"
                                            value={newSession.endTime}
                                            min={newSession.startTime || form.startDateTime || ''}
                                            max={form.endDateTime || ''}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (newSession.startTime && val <= newSession.startTime) {
                                                    setMessage(' L\'heure de fin doit etre apres l\'heure de debut.');
                                                    return;
                                                }
                                                if (form.endDateTime && val > form.endDateTime) {
                                                    setMessage(' L\'heure de fin ne peut pas depasser la fin de l\'evenement.');
                                                    return;
                                                }
                                                setMessage('');
                                                setNewSession({ ...newSession, endTime: val });
                                            }}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Description</label>
                                    <textarea value={newSession.description}
                                        onChange={e => setNewSession({ ...newSession, description: e.target.value })}
                                        placeholder="Description de la session..."
                                        rows={2}
                                        style={{ ...inputStyle, resize: 'vertical' }} />
                                </div>

                                <button onClick={async () => {
                                    if (!newSession.title.trim() || !newSession.startTime || !newSession.endTime) {
                                        setMessage(' Titre, heure debut et heure fin sont obligatoires.');
                                        return;
                                    }
                                    setSavingSession(true);
                                    try {
                                        const res = await API.post(`/events/${eventId}/schedules`, {
                                            title: newSession.title,
                                            startTime: newSession.startTime.replace('T', ' ') + ':00',
                                            endTime: newSession.endTime.replace('T', ' ') + ':00',
                                            speaker: newSession.speaker,
                                            description: newSession.description,
                                            position: planingSessions.length,
                                        });
                                        setPlaningSessions([...planingSessions, res.data.schedule]);
                                        setNewSession({ title: '', startTime: '', endTime: '', speaker: '', description: '' });
                                        setMessage(' Session ajoutee !');
                                        setTimeout(() => setMessage(''), 2000);
                                    } catch {
                                        setMessage(' Erreur ajout session.');
                                    }
                                    setSavingSession(false);
                                }}
                                    disabled={savingSession || !eventId}
                                    style={{ padding: '10px 24px', background: eventId ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '#e5e7eb', color: eventId ? 'white' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: eventId ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '14px' }}>
                                    {savingSession ? 'Ajout...' : '➕ Ajouter la session'}
                                </button>

                                {!eventId && (
                                    <p style={{ color: '#f59e0b', fontSize: '13px', marginTop: '8px' }}>
                                         L'evenement doit etre cree avant d'ajouter des sessions.
                                    </p>
                                )}
                            </div>

                            {/* Liste des sessions ajoutées */}
                            {planingSessions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}></div>
                                    <p style={{ margin: 0 }}>Aucune session ajoutee. Utilisez le formulaire ci-dessus.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {planingSessions.map((session, i) => (
                                        <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                                <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' }}>{session.title}</div>
                                                    <div style={{ color: '#64748b', fontSize: '13px' }}>
                                                        ⏰ {session.startTime} — {session.endTime}
                                                    </div>
                                                    {session.description && (
                                                        <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                                                            {session.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button onClick={async () => {
                                                await API.delete(`/events/${eventId}/schedules/${session.id}`);
                                                setPlaningSessions(planingSessions.filter((_, j) => j !== i));
                                            }} style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', flexShrink: 0 }}>
                                                Supprimer
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                        {/* ── TAB TARGET ── */}
                        {activeTab === 'target' && (
                            <div>
                                <h3 style={{ color: '#1a1a2e', marginBottom: '16px' }}>Cibles de l'Evenement</h3>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                                    <input type="text" value={newTarget}
                                        onChange={e => setNewTarget(e.target.value)}
                                        placeholder="Ex: Entrepreneurs, Investisseurs..."
                                        style={{ ...inputStyle, flex: 1 }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && newTarget.trim()) {
                                                handleChange('targets', [...form.targets, newTarget.trim()]);
                                                setNewTarget('');
                                            }
                                        }} />
                                    <button onClick={() => {
                                        if (newTarget.trim()) {
                                            handleChange('targets', [...form.targets, newTarget.trim()]);
                                            setNewTarget('');
                                        }
                                    }} style={{ padding: '10px 24px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                        Ajouter
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {form.targets.map((t, i) => (
                                        <span key={i} style={{ background: '#f0fdf4', color: '#065f46', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {t}
                                            <button onClick={() => handleChange('targets', form.targets.filter((_, j) => j !== i))}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontSize: '16px', padding: 0 }}>×</button>
                                        </span>
                                    ))}
                                </div>
                                {form.targets.length === 0 && <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '16px' }}>Aucune cible ajoutee.</p>}
                            </div>
                        )}
                        {/* ── TAB SPONSORS ── */}
                        {activeTab === 'sponsors' && (
                            <div>
                                {tabErrors.planning && (
                                    <div style={{ padding: '12px 16px', background: '#fee2e2', borderRadius: '10px', marginBottom: '20px', color: '#991b1b', fontSize: '14px', fontWeight: '600' }}>
                                        {tabErrors.planning}
                                    </div>
                                )}
                                <h3 style={{ color: '#1a1a2e', marginBottom: '16px' }}>Sponsors</h3>
                                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Nom du sponsor *</label>
                                            <input type="text" value={newSponsor.name}
                                                onChange={e => setNewSponsor({ ...newSponsor, name: e.target.value })}
                                                placeholder="TechCorp" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Site web</label>
                                            <input type="text" value={newSponsor.website || ''}
                                                onChange={e => setNewSponsor({ ...newSponsor, website: e.target.value })}
                                                placeholder="https://..." style={inputStyle} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={labelStyle}>Logo du sponsor</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <input type="file" accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
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
                                                            setNewSponsor(prev => ({
                                                                ...prev,
                                                                logo: data.filename,
                                                                logoUrl: `http://localhost:8081/uploads/${data.filename}`
                                                            }));
                                                        }
                                                    } catch { setMessage(' Erreur upload logo.'); }
                                                }}
                                                style={{ flex: 1, padding: '8px', border: '2px dashed #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
                                            {newSponsor.logoUrl && (
                                                <img src={newSponsor.logoUrl} alt="logo preview"
                                                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                                            )}
                                            
                                        </div>
                                    </div>
                                    <button onClick={() => {
                                        if (newSponsor.name.trim()) {
                                            handleChange('sponsors', [...form.sponsors, { ...newSponsor }]);
                                            setNewSponsor({ name: '', website: '', logo: '', logoUrl: '' });
                                        }
                                    }} style={{ padding: '10px 24px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                        + Ajouter
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {form.sponsors.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '10px', padding: '14px 18px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {s.logoUrl ? (
                                                    <img src={s.logoUrl} alt="logo"
                                                        style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                                                ) : (
                                                    <div style={{ width: '44px', height: '44px', background: '#ede9fe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🏢</div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: '700', color: '#1a1a2e' }}>{s.name}</div>
                                                    {s.website && <div style={{ color: '#7c3aed', fontSize: '13px' }}>{s.website}</div>}
                                                </div>
                                            </div>
                                            <button onClick={() => handleChange('sponsors', form.sponsors.filter((_, j) => j !== i))}
                                                style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                                Supprimer
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {form.sponsors.length === 0 && <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '16px' }}>Aucun sponsor ajoute.</p>}
                            </div>
                        )}

                        {/* ── TAB PAGES ── */}
                        {activeTab === 'pages' && (
                            <div>
                                {(tabErrors.pages || tabErrors.contactEmail) && (
                                    <div style={{ padding: '12px 16px', background: '#fee2e2', borderRadius: '10px', marginBottom: '20px', color: '#991b1b', fontSize: '14px', fontWeight: '600' }}>
                                        {tabErrors.pages || tabErrors.contactEmail}
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ color: '#1a1a2e', margin: 0 }}>Pages de l'evenement</h3>
                                    <button onClick={addPage} style={{ padding: '8px 20px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                        + Ajouter une page
                                    </button>
                                </div>

                                {pages.map((page, i) => (
                                    <div key={i} style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
                                        {/* Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={page.isActive}
                                                    onChange={e => updatePage(i, 'isActive', e.target.checked)}
                                                    style={{ width: '16px', height: '16px', accentColor: '#7c3aed', cursor: 'pointer' }} />
                                                <span style={{ fontSize: '13px', color: page.isActive ? '#7c3aed' : '#94a3b8', fontWeight: '600' }}>
                                                    {page.isActive ? ' Active' : '⬜ Inactive'}
                                                </span>
                                            </label>
                                            {i > 1 && (
                                                <button onClick={() => removePage(i)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                                    Supprimer
                                                </button>
                                            )}
                                        </div>

                                        {/* Nom */}
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={labelStyle}>Nom de la page</label>
                                            <input type="text" value={page.name}
                                                onChange={e => updatePage(i, 'name', e.target.value)}
                                                style={inputStyle} placeholder="Ex: FAQ, Contact..." />
                                        </div>

                                        {/* ── PAGE FAQ ── */}
                                        {page.name === 'FAQ' && (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                    <label style={labelStyle}>Questions / Reponses</label>
                                                    <button onClick={() => {
                                                        const updated = [...pages];
                                                        updated[i].faqs = [...(updated[i].faqs || []), { q: '', a: '', editing: true }];
                                                        setPages(updated);
                                                    }} style={{ padding: '4px 14px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '18px' }}>+</button>
                                                </div>
                                                {(page.faqs || []).map((faq, fi) => (
                                                    <div key={fi} style={{ background: 'white', borderRadius: '10px', border: `1px solid ${faq.editing ? '#7c3aed' : '#e5e7eb'}`, marginBottom: '12px', overflow: 'hidden' }}>
                                                        {faq.editing ? (
                                                            /* Mode édition */
                                                            <div>
                                                                <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                    <span style={{ color: '#7c3aed', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>Q{fi + 1}</span>
                                                                    <input type="text" value={faq.q}
                                                                        onChange={e => {
                                                                            const updated = [...pages];
                                                                            updated[i].faqs[fi].q = e.target.value;
                                                                            setPages(updated);
                                                                        }}
                                                                        placeholder="Votre question..."
                                                                        style={{ ...inputStyle, border: 'none', padding: '0', fontWeight: '600', flex: 1 }}
                                                                        autoFocus />
                                                                </div>
                                                                <div style={{ padding: '4px 14px' }}>
                                                                    <textarea value={faq.a}
                                                                        onChange={e => {
                                                                            const updated = [...pages];
                                                                            updated[i].faqs[fi].a = e.target.value;
                                                                            setPages(updated);
                                                                        }}
                                                                        placeholder="Votre reponse..."
                                                                        rows={3}
                                                                        style={{ width: '100%', padding: '10px 0', border: 'none', outline: 'none', resize: 'vertical', fontSize: '14px', color: '#64748b', boxSizing: 'border-box' }} />
                                                                </div>
                                                                <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                                    {fi >= 3 && (
                                                                        <button onClick={() => {
                                                                            const updated = [...pages];
                                                                            updated[i].faqs = updated[i].faqs.filter((_, j) => j !== fi);
                                                                            setPages(updated);
                                                                        }} style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                                                            Supprimer
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => {
                                                                        const updated = [...pages];
                                                                        updated[i].faqs[fi].editing = false;
                                                                        setPages(updated);
                                                                    }} style={{ padding: '6px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                                                         Valider
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* Mode affichage */
                                                            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px', marginBottom: '4px' }}>
                                                                        Q{fi + 1}: {faq.q || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Question vide</span>}
                                                                    </div>
                                                                    <div style={{ color: '#64748b', fontSize: '13px' }}>
                                                                        {faq.a || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Reponse vide</span>}
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => {
                                                                    const updated = [...pages];
                                                                    updated[i].faqs[fi].editing = true;
                                                                    setPages(updated);
                                                                }} style={{ padding: '6px 14px', background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', marginLeft: '12px', flexShrink: 0 }}>
                                                                    Modifier
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* ── PAGE CONTACT ── */}
                                        {page.name === 'Contact' && (
                                            <div>
                                                <div style={{ marginBottom: '16px' }}>
                                                    <label style={labelStyle}> Email de contact *</label>
                                                    <input type="email"
                                                        value={page.contactEmail || ''}
                                                        onChange={e => updatePage(i, 'contactEmail', e.target.value)}
                                                        placeholder="contact@example.com"
                                                        style={inputStyle} />
                                                </div>
                                                <div style={{ marginBottom: '16px' }}>
                                                    <label style={labelStyle}> Telephone</label>
                                                    <input type="text"
                                                        value={page.contactPhone || ''}
                                                        onChange={e => updatePage(i, 'contactPhone', e.target.value.replace(/[^0-9+\-\s()]/g, ''))}
                                                        placeholder="+216 XX XXX XXX"
                                                        style={inputStyle} />
                                                </div>
                                                <div style={{ marginBottom: '16px' }}>
                                                    <label style={labelStyle}> Adresse</label>
                                                    <input type="text"
                                                        value={page.contactAddress || ''}
                                                        onChange={e => updatePage(i, 'contactAddress', e.target.value)}
                                                        placeholder="Rue de la Republique, Tunis"
                                                        style={inputStyle} />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}> Message supplementaire</label>
                                                    <textarea
                                                        value={page.content || ''}
                                                        onChange={e => updatePage(i, 'content', e.target.value)}
                                                        placeholder="Autres informations de contact..."
                                                        rows={3}
                                                        style={{ ...inputStyle, resize: 'vertical' }} />
                                                </div>
                                            </div>
                                        )}

                                        {/* ── AUTRES PAGES ── */}
                                        {page.name !== 'FAQ' && page.name !== 'Contact' && (
                                            <div>
                                                <label style={labelStyle}>Contenu</label>
                                                <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
                                                    <FormatToolbar pageIndex={i} />
                                                    <textarea id={`page-desc-${i}`} value={page.content}
                                                        onChange={e => updatePage(i, 'content', e.target.value)}
                                                        rows={4} placeholder="Contenu de la page..."
                                                        style={{ width: '100%', padding: '12px', border: 'none', outline: 'none', resize: 'vertical', fontSize: '14px', boxSizing: 'border-box' }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* ── BOUTONS ── */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                            <button onClick={() => navigate('/dashboard')} style={{ padding: '12px 28px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                                Annuler
                            </button>

                            {/* Bouton retour si pas premier onglet */}
                            {activeTab !== 'event' && (
                                <button onClick={() => {
                                    const currentIndex = tabOrder.indexOf(activeTab);
                                    setActiveTab(tabOrder[currentIndex - 1]);
                                    setTabErrors({});
                                }} style={{ padding: '12px 24px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                                    ← Retour
                                </button>
                            )}

                            {/* Continue ou Créer */}
                            {isLastTab ? (
                                <button onClick={handleSubmit} disabled={loading}
                                    style={{ padding: '12px 32px', background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: loading ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '15px' }}>
                                    {loading ? ' Creation...' : " Creer l'evenement"}
                                </button>
                            ) : (
                                <button onClick={handleContinue} disabled={loading}
                                    style={{ padding: '12px 32px', background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: loading ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '15px' }}>
                                    {loading ? ' Sauvegarde...' : 'Continuer →'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}