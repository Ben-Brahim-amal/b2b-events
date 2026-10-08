import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function Register() {
    const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', userRole: 'ROLE_ENTREPRENEUR' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await API.post('/register', form);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration error.');
        }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f2f5, #e8e0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif", padding:'50px 0' }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '40px', width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#7c3aed', marginBottom: '8px' }}>B2B Events</div>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '18px' }}>Create an account</p>

                </div>

                {error && (
                    <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        {[
                            { label: 'First Name', key: 'firstName', placeholder: 'John' },
                            { label: 'Last Name', key: 'lastName', placeholder: 'Doe' },
                        ].map(({ label, key, placeholder }) => (
                            <div key={key}>
                                <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>{label}</label>
                                <input type="text" placeholder={placeholder} value={form[key]}
                                    onChange={(e) => setForm({ ...form, [key]: e.target.value })} required
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                            </div>
                        ))}
                    </div>

                    {[
                        { label: 'Email', key: 'email', type: 'email', placeholder: 'your@email.com' },
                        { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
                    ].map(({ label, key, type, placeholder }) => (
                        <div key={key} style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>{label}</label>
                            <input type={type} placeholder={placeholder} value={form[key]}
                                onChange={(e) => setForm({ ...form, [key]: e.target.value })} required
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                        </div>
                    ))}

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>I am a</label>
                        <select value={form.userRole} onChange={(e) => setForm({ ...form, userRole: e.target.value })}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', background: 'white' }}>
                            <option value="ROLE_ENTREPRENEUR">Entrepreneur</option>
                            <option value="ROLE_INVESTISSEUR">Investor</option>
                        </select>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        width: '100%', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                        color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px'
                    }}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '14px' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#7c3aed', fontWeight: '600', textDecoration: 'none' }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
}