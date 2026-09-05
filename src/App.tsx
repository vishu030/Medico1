import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { RoleSelector } from './components/RoleSelector';
import { VisitPage } from './pages/VisitPage';
import { LoginRegister } from './pages/LoginRegister';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { DealerDashboard } from './pages/DealerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeView, setActiveView] = useState<'visit' | 'portal'>('visit');

  const renderContent = () => {
    if (activeView === 'visit') {
      return <VisitPage onGoToPortal={() => setActiveView('portal')} />;
    }

    if (!currentUser) {
      return <LoginRegister />;
    }

    switch (currentUser.role) {
      case 'doctor':
        return <DoctorDashboard />;
      case 'dealer':
        return <DealerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <LoginRegister />;
    }
  };

  return (
    <>
      {/* Ambient glassmorphism blobs */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Floating navigation header */}
      <Navbar activeView={activeView} onSelectView={setActiveView} />

      {/* Primary Viewport */}
      <main style={{ minHeight: '70vh' }}>
        {renderContent()}
      </main>

      {/* Interactive Switchboard helper for testing */}
      <RoleSelector onRoleSwitched={() => setActiveView('portal')} />

      {/* Standardized academic footer */}
      <footer className="container" style={{ marginTop: '80px' }}>
        <div className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', fontSize: '12.5px', color: 'var(--text-dim)' }}>
          <span>Medico Orthopedics Platform © 2026 · BSc IT Evaluation Demo</span>
          <span className="mono-text" style={{ fontSize: '10px' }}>SYS-REF-2026-MEDICO1</span>
        </div>
      </footer>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
