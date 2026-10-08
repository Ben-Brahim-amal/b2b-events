import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function CheckIn() {
    const location = useLocation();
    const { user } = useAuth();
    const token = new URLSearchParams(location.search).get('token');

    const [status, setStatus] = useState('loading'); // loading, success, error, already
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setResult({ message: 'Invalid QR Code.' });
            return;
        }
        if (!user) {
            setStatus('login');
            return;
        }
        doCheckIn();
    }, [token, user]);

    const doCheckIn = async () => {
        try {
            const res = await API.post('/checkin', { token });
            if (res.data.success) {
                setStatus('success');
            } else {
                setStatus('already');
            }
            setResult(res.data);
        } catch (err) {
            setStatus('error');
            setResult({ message: err.response?.data?.message || 'Error.' });
        }
    };

    if (status === 'loading') return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', fontFamily: 'Segoe UI' }}>
            <div style={{ textAlign: 'center', color: '#64748b' }}>
                <p>Checking in...</p>
            </div>
        </div>
    );

    if (status === 'login') return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', fontFamily: 'Segoe UI', padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Login Required</h2>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                    You need to be logged in to check in to this event.
                </p>
                <Link to={`/login?redirect=/checkin?token=${token}`}
                    style={{ display: 'block', padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '700' }}>
                    Login to Check In
                </Link>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', fontFamily: 'Segoe UI', padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '40px', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>

                {status === 'success' && (
                    <>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2.5rem' }}>
                            ✅
                        </div>
                        <h2 style={{ color: '#065f46', marginBottom: '8px', fontSize: '1.4rem', fontWeight: '800' }}>
                            Check-in Successful!
                        </h2>
                        <p style={{ color: '#059669', fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>
                            Welcome, {result?.user?.firstName} {result?.user?.lastName}!
                        </p>
                        <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                            <div style={{ color: '#065f46', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
                                 {result?.eventTitle}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>
                                 Checked in at {result?.checkedInAt}
                            </div>
                        </div>
                        <Link to="/dashboard" style={{ display: 'block', padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '700' }}>
                            Go to Dashboard
                        </Link>
                    </>
                )}

                {status === 'already' && (
                    <>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2.5rem' }}>
                            ⚠️
                        </div>
                        <h2 style={{ color: '#92400e', marginBottom: '8px', fontSize: '1.4rem', fontWeight: '800' }}>
                            Already Checked In
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
                            {result?.message}
                        </p>
                        <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                            <div style={{ color: '#92400e', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
                             {result?.eventTitle}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>
                                {result?.checkedInAt}
                            </div>
                        </div>
                        <Link to="/dashboard" style={{ display: 'block', padding: '12px', background: '#f1f5f9', color: '#64748b', borderRadius: '10px', textDecoration: 'none', fontWeight: '700' }}>
                            Go to Dashboard
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2.5rem' }}>
                            ❌
                        </div>
                        <h2 style={{ color: '#991b1b', marginBottom: '8px', fontSize: '1.4rem', fontWeight: '800' }}>
                            Check-in Failed
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                            {result?.message}
                        </p>
                        <Link to="/events" style={{ display: 'block', padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '700' }}>
                            Browse Events
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}