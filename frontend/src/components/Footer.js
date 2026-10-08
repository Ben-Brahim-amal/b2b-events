import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer style={{
            background: 'linear-gradient(135deg, #1a0533 0%, #7c3aed 100%)',
            color: 'white', padding: '48px 40px 24px', marginTop: 'auto',
            position: 'relative', overflow: 'hidden'
        }}>
            <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '200px', height: '200px', background: 'rgba(124,58,237,0.3)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-40px', right: '10%', width: '160px', height: '160px', background: 'rgba(79,70,229,0.25)', borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none' }} />

            <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '40px' }}>

                    {/* Logo + description */}
                    <div>
                        <div style={{ marginBottom: '16px' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c4b5fd' }}>B2B Events</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '1.7', margin: '0 0 20px' }}>
                            The reference platform for B2B networking between entrepreneurs and investors.
                        </p>
                    </div>

                    <div></div>
                    {/* Navigation */}
                    <div>
                        <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '16px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.6 }}>
                            Navigation
                        </h4>
                        {[
                            { label: 'Home', path: '/' },
                            { label: 'Events', path: '/events' },
                            { label: 'Participants', path: '/participants' },
                        ].map(item => (
                            <Link key={item.label} to={item.path}
                                style={{ display: 'block', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', marginBottom: '10px', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.target.style.color = '#c4b5fd'}
                                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}>
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Account */}
                    <div>
                        <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '16px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.6 }}>
                            My Account
                        </h4>
                        {[
                            { label: 'My Profile', path: '/profile' },
                            { label: 'Dashboard', path: '/dashboard' },
                            { label: 'My Registrations', path: '/dashboard' },
                        ].map(item => (
                            <Link key={item.label} to={item.path}
                                style={{ display: 'block', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', marginBottom: '10px', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.target.style.color = '#c4b5fd'}
                                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}>
                                {item.label}
                            </Link>
                        ))}
                    </div>

                </div>
            </div>
        </footer>
    );
}