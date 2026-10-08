import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import API from '../api/axios';

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = new URLSearchParams(location.search).get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [tokenValid, setTokenValid] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            return;
        }
        API.get(`/reset-password/verify?token=${token}`)
            .then(res => {
                setTokenValid(true);
                setUserInfo(res.data);
            })
            .catch(() => setTokenValid(false));
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            setMessage('❌ Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setMessage('❌ Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            await API.post('/reset-password', { token, password });
            setSuccess(true);
            setMessage('✅ Password changed successfully!');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setMessage('❌ ' + (err.response?.data?.message || 'Error.'));
        }
        setLoading(false);
    };

    const EyeIcon = () => (
        <span style={{ fontSize: '18px' }}>👁</span>
    );

    const EyeOffIcon = () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
            <ellipse cx="12" cy="12" rx="10" ry="6"/>
            <circle cx="12" cy="12" r="3" fill="#94a3b8" stroke="none"/>
            <line x1="3" y1="3" x2="21" y2="21"/>
        </svg>
    );

    if (tokenValid === null) return (
        <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Segoe UI', color: '#64748b' }}>
            Verifying link...
        </div>
    );

    if (tokenValid === false) return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f2f5, #e8e0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif" }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '48px 40px', width: '100%', maxWidth: '440px', boxShadow: '0 8px 32px rgba(124,58,237,0.12)', textAlign: 'center' }}>
                <h2 style={{ color: '#ff0000', marginBottom: '8px' }}>Invalid Link</h2>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                    This reset link is invalid or has expired.
                </p>
                <Link to="/forgot-password" style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '700' }}>
                    Request New Link
                </Link>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f2f5, #e8e0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif" }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '48px 40px', width: '100%', maxWidth: '440px', boxShadow: '0 8px 32px rgba(124,58,237,0.12)' }}>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#7c3aed', margin: '0 0 8px' }}>B2B Events</h1>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1a1a2e', margin: '0 0 8px' }}>Reset Password</h2>
                    {userInfo && (
                        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
                            Hello {userInfo.firstName} — choose a new password.
                        </p>
                    )}
                </div>

                {message && (
                    <div style={{ padding: '12px 16px', borderRadius: '10px', background: message.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: message.startsWith('✅') ? '#065f46' : '#991b1b', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                        {message.replace('✅ ', '').replace('❌ ', '')}
                    </div>
                )}

                {success ? (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>
                            Redirecting to login in 3 seconds...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* New Password */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>
                                New Password *
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? 'text' : 'password'} value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    required
                                    style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                    {showPassword ? '👁️‍🗨️' : '👁'}
                                </button>
                            </div>
                            {password && password.length < 6 && (
                                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>Minimum 6 characters</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div style={{ marginBottom: '28px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>
                                Confirm Password *
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input type={showConfirm ? 'text' : 'password'} value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: '10px', border: `2px solid ${confirm && password !== confirm ? '#ef4444' : '#e5e7eb'}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                    onBlur={e => e.target.style.borderColor = confirm && password !== confirm ? '#ef4444' : '#e5e7eb'} />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                    {showPassword ? '👁️‍🗨️' : '👁'}        
                                </button>
                            </div>
                            {confirm && password !== confirm && (
                                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>Passwords do not match</p>
                            )}
                        </div>

                        <button type="submit" disabled={loading}
                            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '15px', opacity: loading ? 0.8 : 1 }}>
                            {loading ? 'Saving...' : 'Change Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}