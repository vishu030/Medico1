import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, LogOut, Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  return (
    <header className="header-nav container">
      <div className="nav-bar glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={24} color="var(--accent)" />
          <span className="logo-text" style={{ fontSize: '20px', letterSpacing: '-0.03em' }}>
            medico<em>.</em>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{currentUser.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span className="mono-text" style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                {currentUser.role}
              </span>
              {currentUser.role !== 'admin' && (
                currentUser.isVerified ? (
                  <span className="badge badge-success" style={{ fontSize: '8px', padding: '2px 6px' }}>
                    <ShieldCheck size={10} style={{ marginRight: '2px' }} /> Verified
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '8px', padding: '2px 6px' }}>
                    <ShieldAlert size={10} style={{ marginRight: '2px' }} /> Pending Approval
                  </span>
                )
              )}
            </div>
          </div>

          <button className="btn btn-small" onClick={logout} title="Log Out">
            <LogOut size={14} />
            <span style={{ marginLeft: '4px' }}>Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
