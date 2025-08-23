import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LandingPage from './pages/LandingPage';
import ResourceListingPage from './pages/ResourceListingPage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import BookingPage from './pages/BookingPage';
import AuthPage from './pages/AuthPage';
import UserProfilePage from './pages/UserProfilePage';
import ChatPage from './pages/ChatPage';
import NotificationPage from './pages/NotificationPage';
import WechatCallbackPage from './pages/WechatCallbackPage';
import GitHubCallbackPage from './pages/GitHubCallbackPage';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './hooks/useAuth';
import { ChatProvider } from './hooks/useChat';
import { NotificationProvider } from './contexts/NotificationContext';
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>
            <Router>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/resources" element={<ResourceListingPage />} />
                  <Route path="/resources/:id" element={<ResourceDetailPage />} />
                  <Route path="/booking/:id" element={<BookingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/auth/wechat/callback" element={<WechatCallbackPage />} />
                  <Route path="/auth/github/callback" element={<GitHubCallbackPage />} />
                  <Route path="/profile" element={<UserProfilePage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/notifications" element={<NotificationPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
            <Toaster position="bottom-center" />
            </Router>
          </ChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;