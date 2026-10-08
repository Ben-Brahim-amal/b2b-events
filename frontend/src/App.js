import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, matchPath } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Footer from './components/Footer';
import AuthCallback from './pages/AuthCallback';
import ChatBot from './components/ChatBot';
import API from './api/axios';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Events = lazy(() => import('./pages/Events'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const EventPublic = lazy(() => import('./pages/EventPublic'));
const Participants = lazy(() => import('./pages/Participants'));
const ParticipantProfile = lazy(() => import('./pages/ParticipantProfile'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Profile = lazy(() => import('./pages/Profile'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const CheckIn = lazy(() => import('./pages/CheckIn'));
const EditEvent = lazy(() => import('./pages/EditEvent'));

const Loading = () => (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Segoe UI', color: '#64748b' }}>
        Loading...
    </div>
);

function AppContent() {
    const location = useLocation();
    const { user } = useAuth();
    const isPublicPage = matchPath("/events/:id/public", location.pathname);
    const isHomePage = matchPath("/", location.pathname);

    // ← meetingMethod chargé UNE SEULE FOIS ici
    const [meetingMethod, setMeetingMethod] = useState('manual');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            API.get('/meeting-config')
                .then(res => setMeetingMethod(res.data.method || 'manual'))
                .catch(() => {});
        }
    }, [user]); // ← recharge seulement quand user change

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {!isPublicPage && !isHomePage && <Navbar />}
            <div style={{ flex: 1 }}>
                <Suspense fallback={<Loading />}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/events/create" element={<PrivateRoute><CreateEvent /></PrivateRoute>} />
                        <Route path="/events/:id/public" element={
                            <EventPublic meetingMethod={meetingMethod} />
                        } />
                        <Route path="/participants" element={<Participants />} />
                        <Route path="/participants/:id" element={<ParticipantProfile />} />
                        <Route path="/marketplace" element={<Marketplace />} />
                        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                        <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/checkin" element={<CheckIn />} />
                        <Route path="/events/:id/edit" element={<PrivateRoute><EditEvent /></PrivateRoute>} />
                    </Routes>
                </Suspense>
            </div>
            <ChatBot meetingMethod={meetingMethod} />
            {!isPublicPage && !isHomePage && <Footer />}
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </AuthProvider>
    );
}