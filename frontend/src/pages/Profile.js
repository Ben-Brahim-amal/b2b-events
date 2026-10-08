import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('personal');
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const [form, setForm] = useState({
        firstName: '', lastName: '', username: '', email: '',
        phone: '', linkedin: '', country: '', bio: '',
        avatar: '',
        currentPassword: '', newPassword: '', confirmPassword: '',
        companyName: '', companyDescription: '', companyAddress: '',
        organisationType: '',
        sector: '',
        companySize: '',
        companyWebsite: '',
        businessObjectives: [],
    });

    useEffect(() => {
        API.get('/me').then(res => {
            setForm(prev => ({
                ...prev,
                firstName: res.data.firstName || '',
                lastName: res.data.lastName || '',
                email: res.data.email || '',
                phone: res.data.phone || '',
                linkedin: res.data.linkedin || '',
                country: res.data.country || '',
                bio: res.data.bio || '',
                avatar: res.data.avatar || '',
                companyName: res.data.companyName || '',
                companyDescription: res.data.companyDescription || '',
                companyAddress: res.data.companyAddress || '',
                organisationType: res.data.organisationType || '',
                sector: res.data.sector || '',
                companySize: res.data.companySize || '',
                companyWebsite: res.data.companyWebsite || '',
                businessObjectives: res.data.businessObjectives || [],
            }));
            if (res.data.avatar) setAvatarPreview(`http://localhost:8081/uploads/${res.data.avatar}`);
        }).catch(() => {});
    }, []);

    const handleAvatarUpload = async (file) => {
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
                setForm(prev => ({ ...prev, avatar: data.filename }));
                setAvatarPreview(`http://localhost:8081/uploads/${data.filename}`);
            }
        } catch { setMessage('❌ Image upload error.'); }
    };

    const handleSavePersonal = async () => {
        setSaving(true);
        try {
            await API.put('/profile', {
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                linkedin: form.linkedin,
                country: form.country,
                bio: form.bio,
                avatar: form.avatar,
                companyName: form.companyName,
                companyDescription: form.companyDescription,
                companyAddress: form.companyAddress,
                organisationType: form.organisationType,
                sector: form.sector,
                companySize: form.companySize,
                companyWebsite: form.companyWebsite,
                businessObjectives: form.businessObjectives,
            });
            setMessage('✅ Profile updated successfully!');
        } catch (err) {
            setMessage('❌ ' + (err.response?.data?.message || 'Error.'));
        }
        setSaving(false);
    };

    const handleChangePassword = async () => {
        if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
            setMessage('❌ Please fill in all password fields.'); return;
        }
        if (form.newPassword !== form.confirmPassword) {
            setMessage('❌ Passwords do not match.'); return;
        }
        if (form.newPassword.length < 6) {
            setMessage('❌ Password must be at least 6 characters.'); return;
        }
        setSaving(true);
        try {
            await API.put('/profile/password', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            setMessage('✅ Password changed successfully!');
            setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        } catch (err) {
            setMessage('❌ ' + (err.response?.data?.message || 'Incorrect current password.'));
        }
        setSaving(false);
    };

    const getInitials = () => `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase();

    const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };
    const labelStyle = { display: 'block', marginBottom: '6px', color: '#374151', fontSize: '13px', fontWeight: '600' };

    const sections = [
        { key: 'personal', label: 'Personal Information' },
        { key: 'security', label: 'Security' },
        { key: 'company', label: 'Company Information' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'Segoe UI', sans-serif" }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1a1a2e', margin: 0 }}>
                            My Profile
                        </h1>
                        <p style={{ color: '#64748b', marginTop: '6px', marginBottom: 0 }}>
                            Manage your personal information and account settings
                        </p>
                    </div>
                    <button onClick={() => navigate(-1)}
                        style={{ padding: '10px 20px', background: 'none', color: '#64748b', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                        ← Back
                    </button>
                </div>

                {message && (
                    <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px', background: message.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: message.startsWith('✅') ? '#065f46' : '#991b1b', display: 'flex', justifyContent: 'space-between' }}>
                        {message.replace('✅ ', '').replace('❌ ', '')}
                        <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit' }}>×</button>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'flex-start' }}>

                    {/* Sidebar */}
                    <div>
                        {/* Avatar */}
                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
                            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto', border: '4px solid #ede9fe' }}>
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="avatar"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.5rem' }}>
                                            {getInitials()}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => document.getElementById('avatar-upload').click()}
                                    style={{ position: 'absolute', bottom: '0', right: '0', background: '#7c3aed', color: 'white', border: '2px solid white', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                                    +
                                </button>
                                <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }}
                                    onChange={e => handleAvatarUpload(e.target.files[0])} />
                            </div>
                            <div style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>
                                {form.firstName} {form.lastName}
                            </div>
                            <div style={{ color: '#7c3aed', fontSize: '13px', fontWeight: '600', marginTop: '4px' }}>
                                {user?.email}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div style={{ background: 'white', borderRadius: '16px', padding: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                            {sections.map(s => (
                                <button key={s.key} onClick={() => { setActiveSection(s.key); setMessage(''); }}
                                    style={{ width: '100%', padding: '12px 14px', marginBottom: '4px', border: 'none', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', fontWeight: '600', fontSize: '14px', background: activeSection === s.key ? '#ede9fe' : 'transparent', color: activeSection === s.key ? '#7c3aed' : '#64748b' }}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

                        {/* Personal Information */}
                        {activeSection === 'personal' && (
                            <div>
                                <h2 style={{ color: '#1a1a2e', margin: '0 0 24px', fontSize: '1.2rem', fontWeight: '800' }}>
                                    Personal Information
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>First Name *</label>
                                        <input type="text" value={form.firstName}
                                            onChange={e => setForm({ ...form, firstName: e.target.value })}
                                            style={inputStyle}
                                            onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                            onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Last Name *</label>
                                        <input type="text" value={form.lastName}
                                            onChange={e => setForm({ ...form, lastName: e.target.value })}
                                            style={inputStyle}
                                            onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                            onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Email</label>
                                    <input type="email" value={form.email} disabled
                                        style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }} />
                                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0' }}>Email cannot be changed.</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>Phone</label>
                                        <input type="text" value={form.phone}
                                            onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^0-9+\-\s()]/g, '') })}
                                            placeholder="+216 XX XXX XXX"
                                            style={inputStyle}
                                            onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                            onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Country</label>
                                        <input type="text" value={form.country}
                                            onChange={e => setForm({ ...form, country: e.target.value })}
                                            placeholder="Tunisia"
                                            style={inputStyle}
                                            onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                            onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>LinkedIn</label>
                                    <input type="url" value={form.linkedin}
                                        onChange={e => setForm({ ...form, linkedin: e.target.value })}
                                        placeholder="https://linkedin.com/in/..."
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={labelStyle}>Biography</label>
                                    <textarea value={form.bio}
                                        onChange={e => setForm({ ...form, bio: e.target.value })}
                                        placeholder="Tell us about yourself, your background, your goals..."
                                        rows={4}
                                        style={{ ...inputStyle, resize: 'vertical' }}
                                        onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>

                                <button onClick={handleSavePersonal} disabled={saving}
                                    style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}

                        {/* Security */}
                        {activeSection === 'security' && (
                            <div>
                                <h2 style={{ color: '#1a1a2e', margin: '0 0 24px', fontSize: '1.2rem', fontWeight: '800' }}>
                                    Change Password
                                </h2>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Current Password *</label>
                                    <input type="password" value={form.currentPassword}
                                        onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                                        placeholder="••••••••"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>New Password *</label>
                                    <input type="password" value={form.newPassword}
                                        onChange={e => setForm({ ...form, newPassword: e.target.value })}
                                        placeholder="Minimum 6 characters"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    {form.newPassword && form.newPassword.length < 6 && (
                                        <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>Minimum 6 characters</p>
                                    )}
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={labelStyle}>Confirm New Password *</label>
                                    <input type="password" value={form.confirmPassword}
                                        onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                        style={{ ...inputStyle, borderColor: form.confirmPassword && form.newPassword !== form.confirmPassword ? '#ef4444' : '#e5e7eb' }}
                                        onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                        onBlur={e => e.target.style.borderColor = form.confirmPassword && form.newPassword !== form.confirmPassword ? '#ef4444' : '#e5e7eb'} />
                                    {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                                        <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>Passwords do not match</p>
                                    )}
                                </div>
                                <button onClick={handleChangePassword} disabled={saving}
                                    style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                                    {saving ? 'Saving...' : 'Change Password'}
                                </button>
                            </div>
                        )}

                        {/* Company Information */}
                        {activeSection === 'company' && (
                            <div>
                                <h2 style={{ color: '#1a1a2e', margin: '0 0 8px', fontSize: '1.2rem', fontWeight: '800' }}>
                                    Company Information
                                </h2>
                                <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>
                                    This information is used for matchmaking and networking.
                                </p>

                                {/* Company Name + Type */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>Company Name</label>
                                        <input type="text" value={form.companyName}
                                            onChange={e => setForm({ ...form, companyName: e.target.value })}
                                            placeholder="My Company LLC"
                                            style={inputStyle}
                                            onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                            onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Organisation Type</label>
                                        <select value={form.organisationType || ''}
                                            onChange={e => setForm({ ...form, organisationType: e.target.value })}
                                            style={{ ...inputStyle, background: 'white' }}>
                                            <option value="">Select type...</option>
                                            <option value="Company">Company</option>
                                            <option value="Start-up">Start-up / Scale-up</option>
                                            <option value="Association">Association / Agency</option>
                                            <option value="University">University</option>
                                            <option value="R&D">R&D Institution</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Sector + Employees */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>Sector / Industry</label>
                                        <select value={form.sector || ''}
                                            onChange={e => setForm({ ...form, sector: e.target.value })}
                                            style={{ ...inputStyle, background: 'white' }}>
                                            <option value="">Select sector...</option>
                                            <option value="Agriculture">Agriculture & Food</option>
                                            <option value="Automotive">Automotive</option>
                                            <option value="Construction">Construction</option>
                                            <option value="Energy">Energy & Environment</option>
                                            <option value="Finance">Finance & Banking</option>
                                            <option value="Healthcare">Healthcare</option>
                                            <option value="IT">Information Technology</option>
                                            <option value="Manufacturing">Manufacturing</option>
                                            <option value="Marketing">Marketing & Communication</option>
                                            <option value="Real Estate">Real Estate</option>
                                            <option value="Retail">Retail & E-commerce</option>
                                            <option value="Tourism">Tourism & Hospitality</option>
                                            <option value="Transport">Transport & Logistics</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Number of Employees</label>
                                        <select value={form.companySize || ''}
                                            onChange={e => setForm({ ...form, companySize: e.target.value })}
                                            style={{ ...inputStyle, background: 'white' }}>
                                            <option value="">Select size...</option>
                                            <option value="1-10">1 – 10</option>
                                            <option value="11-50">11 – 50</option>
                                            <option value="51-200">51 – 200</option>
                                            <option value="201-500">201 – 500</option>
                                            <option value="500+">500+</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Website */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Company Website</label>
                                    <input type="url" value={form.companyWebsite || ''}
                                        onChange={e => setForm({ ...form, companyWebsite: e.target.value })}
                                        placeholder="https://mycompany.com"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>

                                {/* Company Description */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Company Description</label>
                                    <textarea value={form.companyDescription}
                                        onChange={e => setForm({ ...form, companyDescription: e.target.value })}
                                        placeholder="Describe your business, sector, products or services..."
                                        rows={3}
                                        style={{ ...inputStyle, resize: 'vertical' }}
                                        onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>

                                {/* Company Address */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Company Address</label>
                                    <input type="text" value={form.companyAddress}
                                        onChange={e => setForm({ ...form, companyAddress: e.target.value })}
                                        placeholder="123 Republic Street, Tunis"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>

                                {/* Business Objectives */}
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={labelStyle}>Business Objectives</label>
                                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 8px' }}>
                                        What are you looking for at this event? (used for AI Matchmaking)
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {[
                                            'Find investors',
                                            'Find partners',
                                            'Find clients',
                                            'Find suppliers',
                                            'Explore new markets',
                                            'Share expertise',
                                            'Find distributors',
                                            'Other'
                                        ].map(obj => {
                                            const selected = (form.businessObjectives || []).includes(obj);
                                            return (
                                                <button key={obj}
                                                    onClick={() => {
                                                        const current = form.businessObjectives || [];
                                                        const updated = selected
                                                            ? current.filter(o => o !== obj)
                                                            : [...current, obj];
                                                        setForm({ ...form, businessObjectives: updated });
                                                    }}
                                                    style={{
                                                        padding: '10px 14px',
                                                        border: `2px solid ${selected ? '#7c3aed' : '#e5e7eb'}`,
                                                        borderRadius: '10px',
                                                        background: selected ? '#ede9fe' : 'white',
                                                        color: selected ? '#7c3aed' : '#64748b',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        fontSize: '13px',
                                                        textAlign: 'left'
                                                    }}>
                                                    {selected ? '✓ ' : ''}{obj}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <button onClick={handleSavePersonal} disabled={saving}
                                    style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}