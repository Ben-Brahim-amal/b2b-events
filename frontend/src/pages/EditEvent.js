import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';

export default function EditEvent() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('target');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    const [form, setForm] = useState({
        title: '',
        description: '',
        targets: [],
        sponsors: [],
        status: 'published',
        eventBanner: null,
    });

    const [pages, setPages] = useState([
        { name: 'FAQ', content: '', isActive: true, position: 0, faqs: [] },
        { name: 'Contact', content: '', isActive: true, position: 1, faqs: [], contactEmail: '', contactPhone: '', contactAddress: '' },
    ]);

    const [newTarget, setNewTarget] = useState('');
    const [newSponsor, setNewSponsor] = useState({ name: '', website: '', logo: '', logoUrl: '' });

    // ── Charge les données existantes ──
    useEffect(() => {
        API.get(`/events/${id}`)
            .then(res => {
                const ev = res.data;
                setForm({
                    title: ev.title || '',
                    description: ev.description || '',
                    targets: ev.targets || [],
                    sponsors: ev.sponsors || [],
                    status: ev.status || 'published',
                    eventBanner: ev.eventBanner || null,
                });

                // Charge les pages existantes
                if (ev.pages && ev.pages.length > 0) {
                    const loadedPages = ev.pages.map(p => {
                        if (p.name === 'FAQ') {
                            let faqs = [];
                            try { faqs = JSON.parse(p.content); } catch {}
                            return { ...p, faqs: faqs.map(f => ({ ...f, editing: false })) };
                        }
                        if (p.name === 'Contact') {
                            let contactData = {};
                            try { contactData = JSON.parse(p.content); } catch {}
                            return { ...p, contactEmail: contactData.email || '', contactPhone: contactData.phone || '', contactAddress: contactData.address || '', content: contactData.message || '' };
                        }
                        return p;
                    });
                    setPages(loadedPages);
                }
                setLoadingData(false);
            })
            .catch(() => setLoadingData(false));
    }, [id]);

    const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }));

    const updatePage = (i, key, value) => {
        const updated = [...pages];
        updated[i][key] = value;
        setPages(updated);
    };

    const addPage = () => setPages([...pages, { name: '', content: '', isActive: true, position: pages.length, faqs: [] }]);
    const removePage = (i) => setPages(pages.filter((_, j) => j !== i));

    const tabs = [
        { key: 'target', label: 'Target' },
        { key: 'sponsors', label: 'Sponsors' },
        { key: 'pages', label: 'Pages' },
    ];

    const handleSubmit = async () => {
        setLoading(true);
        setMessage('');
        try {
            // Mise à jour de l'événement
            await API.put(`/events/${id}`, {
                title: form.title,
                targets: form.targets,
                sponsors: form.sponsors,
                status: form.status,
            });

            // Mise à jour des pages
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
                    if (page.id) {
                        await API.put(`/events/${id}/pages/${page.id}`, {
                            name: page.name, content, isActive: page.isActive, position: i,
                        });
                    } else {
                        await API.post(`/events/${id}/pages`, {
                            name: page.name, content, isActive: page.isActive, position: i,
                        });
                    }
                }
            }

            setMessage('✅ Event updated successfully!');
            setTimeout(() => navigate(`/events/${id}/public`), 1000);
        } catch (err) {
            setMessage('❌ ' + (err.response?.data?.message || 'Error.'));
        }
        setLoading(false);
    };

    const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' };
    const labelStyle = { display: 'block', marginBottom: '6px', color: '#374151', fontSize: '13px', fontWeight: '600' };

    if (loadingData) return (
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>Loading...</div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', sans-serif" }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>

                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1a1a2e', margin: '0 0 8px' }}>
                    Edit Event
                </h1>
                <p style={{ color: '#64748b', marginBottom: '32px' }}>{form.title}</p>

                {message && (
                    <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px', background: message.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: message.startsWith('✅') ? '#065f46' : '#991b1b' }}>
                        {message.replace('✅ ', '').replace('❌ ', '')}
                    </div>
                )}

                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

                    {/* Tabs */}
                    <div style={{ borderBottom: '2px solid #f1f5f9', display: 'flex', padding: '0 32px' }}>
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                                padding: '16px 20px', border: 'none', background: 'none', cursor: 'pointer',
                                fontSize: '14px', fontWeight: '600',
                                color: activeTab === t.key ? '#7c3aed' : '#64748b',
                                borderBottom: activeTab === t.key ? '2px solid #7c3aed' : '2px solid transparent',
                                marginBottom: '-2px'
                            }}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: '32px' }}>

                        {/* Tab: Target */}
                        {activeTab === 'target' && (
                            <div>
                                <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                    <label style={labelStyle}>Event Status</label>
                                    <select value={form.status}
                                        onChange={e => handleChange('status', e.target.value)}
                                        style={inputStyle}>
                                        <option value="published">Published </option>
                                        <option value="draft">Draft </option>
                                        <option value="closed">Closed </option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                    <label style={labelStyle}>Event Name</label>
                                    <input type="text" value={form.title}
                                        onChange={e => handleChange('title', e.target.value)}
                                        placeholder="Event name..."
                                        style={inputStyle} />
                                </div>
                                <h3 style={{ color: '#1a1a2e', marginBottom: '16px' }}>Sectors of Interest</h3>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                                    <input type="text" value={newTarget}
                                        onChange={e => setNewTarget(e.target.value)}
                                        placeholder="e.g. Entrepreneurs, Investors, Food..."
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
                                        Add
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
                                {form.targets.length === 0 && <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '16px' }}>No sectors added.</p>}
                            </div>
                        )}

                        {/* Tab: Sponsors */}
                        {activeTab === 'sponsors' && (
                            <div>
                                <h3 style={{ color: '#1a1a2e', marginBottom: '16px' }}>Sponsors</h3>
                                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Sponsor Name *</label>
                                            <input type="text" value={newSponsor.name}
                                                onChange={e => setNewSponsor({ ...newSponsor, name: e.target.value })}
                                                placeholder="TechCorp" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Website</label>
                                            <input type="text" value={newSponsor.website || ''}
                                                onChange={e => setNewSponsor({ ...newSponsor, website: e.target.value })}
                                                placeholder="https://..." style={inputStyle} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={labelStyle}>Sponsor Logo</label>
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
                                                        setNewSponsor(prev => ({ ...prev, logo: data.filename, logoUrl: `http://localhost:8081/uploads/${data.filename}` }));
                                                    }
                                                } catch { setMessage('❌ Logo upload error.'); }
                                            }}
                                            style={{ width: '100%', padding: '8px', border: '2px dashed #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
                                    </div>
                                    <button onClick={() => {
                                        if (newSponsor.name.trim()) {
                                            handleChange('sponsors', [...form.sponsors, { ...newSponsor }]);
                                            setNewSponsor({ name: '', website: '', logo: '', logoUrl: '' });
                                        }
                                    }} style={{ padding: '10px 24px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                        + Add
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {form.sponsors.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '10px', padding: '14px 18px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {(s.logoUrl || s.logo) ? (
                                                    <img src={s.logoUrl || `http://localhost:8081/uploads/${s.logo}`} alt="logo"
                                                        style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                                                ) : (
                                                    <div style={{ width: '44px', height: '44px', background: '#ede9fe', borderRadius: '8px' }} />
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: '700', color: '#1a1a2e' }}>{s.name}</div>
                                                    {s.website && <div style={{ color: '#7c3aed', fontSize: '13px' }}>{s.website}</div>}
                                                </div>
                                            </div>
                                            <button onClick={() => handleChange('sponsors', form.sponsors.filter((_, j) => j !== i))}
                                                style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {form.sponsors.length === 0 && <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '16px' }}>No sponsors added.</p>}
                            </div>
                        )}

                        {/* Tab: Pages */}
                        {activeTab === 'pages' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ color: '#1a1a2e', margin: 0 }}>Event Pages</h3>
                                    <button onClick={addPage} style={{ padding: '8px 20px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                        + Add Page
                                    </button>
                                </div>

                                {pages.map((page, i) => (
                                    <div key={i} style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={page.isActive}
                                                    onChange={e => updatePage(i, 'isActive', e.target.checked)}
                                                    style={{ width: '16px', height: '16px', accentColor: '#7c3aed' }} />
                                                <span style={{ fontSize: '13px', color: page.isActive ? '#7c3aed' : '#94a3b8', fontWeight: '600' }}>
                                                    {page.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </label>
                                            {i > 1 && (
                                                <button onClick={() => removePage(i)}
                                                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                                    Delete
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={labelStyle}>Page Name</label>
                                            <input type="text" value={page.name}
                                                onChange={e => updatePage(i, 'name', e.target.value)}
                                                style={inputStyle} placeholder="e.g. FAQ, Contact..." />
                                        </div>

                                        {page.name === 'FAQ' && (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                    <label style={labelStyle}>Questions / Answers</label>
                                                    <button onClick={() => {
                                                        const updated = [...pages];
                                                        updated[i].faqs = [...(updated[i].faqs || []), { q: '', a: '', editing: true }];
                                                        setPages(updated);
                                                    }} style={{ padding: '4px 14px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '18px' }}>+</button>
                                                </div>
                                                {(page.faqs || []).map((faq, fi) => (
                                                    <div key={fi} style={{ background: 'white', borderRadius: '10px', border: `1px solid ${faq.editing ? '#7c3aed' : '#e5e7eb'}`, marginBottom: '12px', overflow: 'hidden' }}>
                                                        {faq.editing ? (
                                                            <div>
                                                                <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                    <span style={{ color: '#7c3aed', fontWeight: '700', fontSize: '13px' }}>Q{fi + 1}</span>
                                                                    <input type="text" value={faq.q}
                                                                        onChange={e => {
                                                                            const updated = [...pages];
                                                                            updated[i].faqs[fi].q = e.target.value;
                                                                            setPages(updated);
                                                                        }}
                                                                        placeholder="Your question..."
                                                                        style={{ ...inputStyle, border: 'none', padding: '0', fontWeight: '600', flex: 1 }} autoFocus />
                                                                </div>
                                                                <div style={{ padding: '4px 14px' }}>
                                                                    <textarea value={faq.a}
                                                                        onChange={e => {
                                                                            const updated = [...pages];
                                                                            updated[i].faqs[fi].a = e.target.value;
                                                                            setPages(updated);
                                                                        }}
                                                                        placeholder="Your answer..."
                                                                        rows={3}
                                                                        style={{ width: '100%', padding: '10px 0', border: 'none', outline: 'none', resize: 'vertical', fontSize: '14px', color: '#64748b', boxSizing: 'border-box' }} />
                                                                </div>
                                                                <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                                    <button onClick={() => {
                                                                        const updated = [...pages];
                                                                        updated[i].faqs[fi].editing = false;
                                                                        setPages(updated);
                                                                    }} style={{ padding: '6px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px', marginBottom: '4px' }}>Q{fi + 1}: {faq.q}</div>
                                                                    <div style={{ color: '#64748b', fontSize: '13px' }}>{faq.a}</div>
                                                                </div>
                                                                <button onClick={() => {
                                                                    const updated = [...pages];
                                                                    updated[i].faqs[fi].editing = true;
                                                                    setPages(updated);
                                                                }} style={{ padding: '6px 14px', background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', marginLeft: '12px' }}>
                                                                    Edit
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {page.name === 'Contact' && (
                                            <div>
                                                <div style={{ marginBottom: '16px' }}>
                                                    <label style={labelStyle}>Contact Email</label>
                                                    <input type="email" value={page.contactEmail || ''}
                                                        onChange={e => updatePage(i, 'contactEmail', e.target.value)}
                                                        placeholder="contact@example.com" style={inputStyle} />
                                                </div>
                                                <div style={{ marginBottom: '16px' }}>
                                                    <label style={labelStyle}>Phone</label>
                                                    <input type="text" value={page.contactPhone || ''}
                                                        onChange={e => updatePage(i, 'contactPhone', e.target.value)}
                                                        placeholder="+216 XX XXX XXX" style={inputStyle} />
                                                </div>
                                                <div style={{ marginBottom: '16px' }}>
                                                    <label style={labelStyle}>Address</label>
                                                    <input type="text" value={page.contactAddress || ''}
                                                        onChange={e => updatePage(i, 'contactAddress', e.target.value)}
                                                        placeholder="123 Republic Street" style={inputStyle} />
                                                </div>
                                            </div>
                                        )}

                                        {page.name !== 'FAQ' && page.name !== 'Contact' && (
                                            <div>
                                                <label style={labelStyle}>Content</label>
                                                <textarea value={page.content || ''}
                                                    onChange={e => updatePage(i, 'content', e.target.value)}
                                                    rows={4} placeholder="Page content..."
                                                    style={{ ...inputStyle, resize: 'vertical' }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                            <button onClick={() => navigate(`/events/${id}/public`)}
                                style={{ padding: '12px 28px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={loading}
                                style={{ padding: '12px 32px', background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: loading ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '15px' }}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}