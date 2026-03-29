import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { LocationProvider } from './context/LocationContext';

import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Journey from './pages/Journey';
import JourneyDetail from './pages/JourneyDetail';
import SOSPage from './pages/SOSPage';
import Profile from './pages/Profile';
import Contacts from './pages/Contacts';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <LocationProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/journey" element={<Journey />} />
                  <Route path="/journey/:id" element={<JourneyDetail />} />
                  <Route path="/sos" element={<SOSPage />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/contacts" element={<Contacts />} />
                </Route>
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </LocationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
