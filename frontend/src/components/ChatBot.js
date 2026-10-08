import { useState, useRef, useEffect } from 'react';

export default function ChatBot({ meetingMethod = 'manual', eventId = null }) {
    const initialMessage = {
        role: 'assistant',
        content: 'Hello! 👋 I"m your B2B Events assistant. How can I help you ?'
    };

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([initialMessage]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // ← Vérifie si le token est valide
    const getValidToken = () => {
        const t = localStorage.getItem('token');
        if (!t) return null;
        try {
            const payload = JSON.parse(atob(t.split('.')[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                localStorage.removeItem('token');
                return null;
            }
            return t;
        } catch {
            return null;
        }
    };

    // ← Reset conversation quand login/logout
    useEffect(() => {
        setMessages([initialMessage]);
        setInput('');
    }, [getValidToken()]); // ← recharge quand token change

    const token = getValidToken();
    let isAdmin = false;
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            isAdmin = payload.roles?.includes('ROLE_ADMIN');
        } catch {}
    }
    if (isAdmin) return null;

    const resetConversation = () => {
        setMessages([initialMessage]);
        setInput('');
    };

    const sendMessage = async () => {
    if (!input.trim() || loading) return;

        const detectLanguage = (text) => {
        const frWords = [
            'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
            'le', 'la', 'les', 'de', 'du', 'un', 'une', 'est', 'sont',
            'avoir', 'être', 'comment', 'combien', 'quand', 'pourquoi',
            'bonjour', 'salut', 'merci', 'oui', 'non', 'que', 'qui',
            'quoi', 'où', 'jai', 'cest', 'quel', 'quelle', 'puis',
            'peux', 'peut', 'voulez', 'veux', 'faire', 'mon', 'ma',
            'mes', 'votre', 'avec', 'pour', 'dans', 'sur', 'par'
        ];
        const arWords = [
            'كيف', 'ما', 'من', 'في', 'على', 'هل', 'لا', 'نعم',
            'مرحبا', 'شكرا', 'اريد', 'أريد', 'هذا', 'هذه'
        ];
        const enWords = [
            'i', 'you', 'he', 'she', 'we', 'they', 'the', 'a', 'an',
            'is', 'are', 'have', 'how', 'what', 'when', 'where', 'why',
            'can', 'could', 'would', 'should', 'my', 'your', 'send',
            'meeting', 'help', 'please', 'thank', 'hello', 'hi'
        ];

        const lowerText = text.toLowerCase();
        const words = lowerText.split(/\s+/);

        const arCount = words.filter(w => arWords.includes(w)).length;
        const frCount = words.filter(w => frWords.includes(w)).length;
        const enCount = words.filter(w => enWords.includes(w)).length;

        if (arCount > 0) return 'Arabic';
        if (frCount > enCount) return 'French';
        if (enCount > 0) return 'English';
        return 'French'; // défaut français
    };

        const detectedLang = detectLanguage(input);
        const userMessage = { role: 'user', content: input };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            const currentToken = getValidToken();
            const headers = { 'Content-Type': 'application/json' };
            if (currentToken) {
                headers['Authorization'] = `Bearer ${currentToken}`;
            }

            const recentMessages = updatedMessages
                .filter(m => m.role === 'user' || m.role === 'assistant')
                .slice(-6);

            const response = await fetch('http://localhost:8081/api/chatbot', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    eventId: eventId,
                    meetingMethod: meetingMethod,
                    language: detectedLang, // ← ajoute la langue détectée
                    messages: recentMessages
                })
            });

            const data = await response.json();
            const assistantMessage = {
                role: 'assistant',
                content: data.message || 'Désolé, je n\'ai pas pu traiter votre demande.'
            };
            setMessages(prev => [...prev, assistantMessage]);

        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Erreur de connexion. Veuillez réessayer.'
            }]);
        }

        setLoading(false);
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const quickQuestions = [
        'How can I send a meeting ?',
        'How can I post an opportunity ?',
        'Forgot your password ?',
    ];

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed', bottom: '6px', right: '20px',
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: 'white', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', zIndex: 9999, transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                {isOpen ? '✕' : '💬'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'fixed', bottom: '50px', right: '20px',
                    width: '300px', height: '400px', background: 'white',
                    borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    display: 'flex', flexDirection: 'column', zIndex: 9998,
                    overflow: 'hidden', fontFamily: "'Segoe UI', sans-serif"
                }}>

                    {/* Header avec bouton Reset */}
                    <div style={{
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, #1a0533, #7c3aed)',
                        color: 'white', display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '16px'
                            }}>
                                💬
                            </div>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '12px' }}>B2B Assistant</div>
                                <div style={{
                                    fontSize: '10px', opacity: 0.7,
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                    <div style={{
                                        width: '4px', height: '4px',
                                        borderRadius: '50%', background: '#4ade80'
                                    }} />
                                    Online • Real-time AI
                                </div>
                            </div>
                        </div>

                        {/* Bouton Reset */}
                        <button
                            onClick={resetConversation}
                            title="Nouvelle conversation"
                            style={{
                                background: 'rgba(255,255,255,0.15)',
                                border: 'none', color: 'white',
                                borderRadius: '8px', padding: '4px 8px',
                                cursor: 'pointer', fontSize: '10px', fontWeight: '600'
                            }}>
                            🔄 Reset
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1, overflowY: 'auto', padding: '12px',
                        display: 'flex', flexDirection: 'column', gap: '10px'
                    }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                            }}>
                                {msg.role === 'assistant' && (
                                    <div style={{
                                        width: '24px', height: '24px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '12px',
                                        flexShrink: 0, marginRight: '6px', alignSelf: 'flex-end'
                                    }}>
                                        💬
                                    </div>
                                )}
                                <div style={{
                                    maxWidth: '75%', padding: '8px 12px',
                                    borderRadius: msg.role === 'user'
                                        ? '18px 18px 4px 18px'
                                        : '18px 18px 18px 4px',
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                                        : '#f8fafc',
                                    color: msg.role === 'user' ? 'white' : '#1a1a2e',
                                    fontSize: '12px', lineHeight: '1.5',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {/* Loading */}
                        {loading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '12px'
                                }}>
                                    💬
                                </div>
                                <div style={{
                                    background: '#f8fafc', padding: '8px 12px',
                                    borderRadius: '18px 18px 18px 4px',
                                    display: 'flex', flexDirection: 'column', gap: '4px'
                                }}>
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                        {[0, 1, 2].map(i => (
                                            <div key={i} style={{
                                                width: '6px', height: '6px', borderRadius: '50%',
                                                background: '#7c3aed',
                                                animation: 'bounce 1s infinite',
                                                animationDelay: `${i * 0.2}s`
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions */}
                    {messages.length === 1 && (
                        <div style={{
                            padding: '0 14px 10px',
                            display: 'flex', flexWrap: 'wrap', gap: '6px'
                        }}>
                            {quickQuestions.map((q, i) => (
                                <button key={i}
                                    onClick={() => setInput(q)}
                                    style={{
                                        padding: '4px 10px',
                                        background: '#ede9fe', color: '#7c3aed',
                                        border: 'none', borderRadius: '20px',
                                        cursor: 'pointer', fontSize: '11px', fontWeight: '600'
                                    }}>
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div style={{
                        padding: '8px 14px', borderTop: '1px solid #f1f5f9',
                        display: 'flex', gap: '8px', alignItems: 'center'
                    }}>
                        <input
                            type="text" value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Votre message..."
                            style={{
                                flex: 1, padding: '8px 12px', borderRadius: '20px',
                                border: '2px solid #e5e7eb', fontSize: '12px',
                                outline: 'none', background: '#f8fafc'
                            }}
                            onFocus={e => e.target.style.borderColor = '#7c3aed'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            style={{
                                width: '34px', height: '34px', borderRadius: '50%',
                                background: !input.trim() || loading
                                    ? '#e5e7eb'
                                    : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                color: !input.trim() || loading ? '#94a3b8' : 'white',
                                border: 'none',
                                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '16px', flexShrink: 0
                            }}>
                            ➤
                        </button>
                    </div>
                </div>
            )}

            {/* CSS Animation */}
            <style>{`
                @keyframes bounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-6px); }
                }
            `}</style>
        </>
    );
}