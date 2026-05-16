import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer style={{ background: 'linear-gradient(135deg, #1a0533 0%, #7c3aed 100%)', padding: '48px 40px 24px', marginTop: 'auto' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '40px' }}>

                    {/* Logo + description */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c4b5fd' }}> B2B Events</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '1.7', margin: '0 0 20px' }}>
                            La plateforme de référence pour les rencontres B2B entre entrepreneurs et investisseurs.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {['LinkedIn', 'Twitter', 'Facebook'].map(s => (
                                <div key={s} style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                    {s[0]}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '16px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Navigation
                        </h4>
                        {[
                            { label: 'Accueil', path: '/' },
                            { label: 'Événements', path: '/events' },
                            { label: 'Participants', path: '/participants' },
                            { label: 'Marketplace', path: '/marketplace' },
                        ].map(item => (
                            <Link key={item.label} to={item.path}
                                style={{ display: 'block', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', marginBottom: '10px', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.target.style.color = '#c4b5fd'}
                                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}>
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Compte */}
                    <div>
                        <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '16px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Mon Compte
                        </h4>
                        {[
                            { label: 'Mon profil', path: '/profile' },
                            { label: 'Dashboard', path: '/dashboard' },
                            { label: 'Mes inscriptions', path: '/dashboard' },
                            { label: 'Mes meetings', path: '/dashboard' },
                        ].map(item => (
                            <Link key={item.label} to={item.path}
                                style={{ display: 'block', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', marginBottom: '10px', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.target.style.color = '#c4b5fd'}
                                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}>
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '16px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Contact
                        </h4>
                        {[
                            {  text: 'contact@b2bevents.com' },
                            { text: '+216 XX XXX XXX' },
                            {  text: 'Tunis, Tunisie' },
                        ].map(({ icon, text }) => (
                            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <span style={{ fontSize: '14px' }}>{icon}</span>
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                        © 2026 B2B Events. Tous droits réservés.
                    </span>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        {['Politique de confidentialité', 'CGU', 'Cookies'].map(item => (
                            <span key={item} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}