/*import { BrowserRouter, Routes, Route, useLocation, matchPath } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateEvent from './pages/CreateEvent';
import EventPublic from './pages/EventPublic';
import Participants from './pages/Participants';
import ParticipantProfile from './pages/ParticipantProfile';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';


function AppContent() {
    const location = useLocation();
    const isPublicPage = matchPath("/events/:id/public", location.pathname);
    const isHomePage = matchPath("/", location.pathname);

    return (
        <>
            {!isPublicPage && !isHomePage && <Navbar />}

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />

                <Route
                    path="/admin"
                    element={
                        <PrivateRoute>
                            <AdminDashboard />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/events/create"
                    element={
                        <PrivateRoute>
                            <CreateEvent />
                        </PrivateRoute>
                    }
                />

                <Route path="/marketplace" element={<Marketplace />} />

                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

                {/* Page publique sans navbar //}
                <Route path="/events/:id/public" element={<EventPublic />} />
                    
                <Route path="/participants" element={<Participants />} />
                
                <Route path="/participants/:id" element={<ParticipantProfile />} />
                
            </Routes>
        </>
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
}*/
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, matchPath } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Footer from './components/Footer';
import AuthCallback from './pages/AuthCallback';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const EventPublic = lazy(() => import('./pages/EventPublic'));
const Participants = lazy(() => import('./pages/Participants'));
const ParticipantProfile = lazy(() => import('./pages/ParticipantProfile'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Profile = lazy(() => import('./pages/Profile'));

const Loading = () => (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Segoe UI', color: '#7c3aed' }}>
        Chargement...
    </div>
);

function AppContent() {
    const location = useLocation();
    const isPublicPage = matchPath("/events/:id/public", location.pathname);
    const isHomePage = matchPath("/", location.pathname);

    return (
        <>
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
                            <Route path="/events/:id" element={<EventDetail />} />
                            <Route path="/events/:id/public" element={<EventPublic />} />
                            <Route path="/participants" element={<Participants />} />
                            <Route path="/participants/:id" element={<ParticipantProfile />} />
                            <Route path="/marketplace" element={<Marketplace />} />
                            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                            <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
                            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                            <Route path="/auth/callback" element={<AuthCallback />} />
                        </Routes>
                    </Suspense>
                </div>
                {!isPublicPage && !isHomePage && <Footer />}
            </div>
        </>
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