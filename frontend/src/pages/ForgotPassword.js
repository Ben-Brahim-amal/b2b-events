import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post('/forgot-password', { email });
            setSent(true);
            setMessage('✅ If this email exists, a reset link has been sent. Check your inbox.');
        } catch {
            setMessage('❌ An error occurred. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f2f5, #e8e0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif" }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '48px 40px', width: '100%', maxWidth: '440px', boxShadow: '0 8px 32px rgba(124,58,237,0.12)' }}>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#7c3aed', margin: '0 0 8px' }}>B2B Events</h1>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1a1a2e', margin: '0 0 8px' }}>Forgot Password?</h2>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
                        Enter your email and we'll send you a reset link.
                    </p>
                </div>

                {message && (
                    <div style={{ padding: '12px 16px', borderRadius: '10px', background: message.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: message.startsWith('✅') ? '#065f46' : '#991b1b', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                        {message.replace('✅ ', '').replace('❌ ', '')}
                    </div>
                )}

                {!sent ? (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>
                                Email
                            </label>
                            <input type="email" value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                        </div>

                        <button type="submit" disabled={loading}
                            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '15px', opacity: loading ? 0.8 : 1 }}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                            Check your inbox and click the reset link we sent you.
                        </p>
                        <button onClick={() => { setSent(false); setEmail(''); setMessage(''); }}
                            style={{ padding: '10px 24px', background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                            Send again
                        </button>
                    </div>
                )}

                <p style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '14px' }}>
                    <Link to="/login" style={{ color: '#7c3aed', fontWeight: '700', textDecoration: 'none' }}>
                        ← Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
}