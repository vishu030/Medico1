import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, LogOut, Activity, Globe, LogIn } from 'lucide-react';

interface NavbarProps {
  activeView: 'visit' | 'portal';
  onSelectView: (view: 'visit' | 'portal') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, onSelectView }) => {
  const { currentUser, logout } = useAuth();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header className={`header-nav container ${!visible ? 'nav-hidden' : ''}`}>
      <div className="nav-bar glass">
        
        {/* Brand Logo */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => onSelectView('visit')}
          title="About Medico"
        >
          <Activity size={26} color="var(--accent)" />
          <span className="logo-text" style={{ fontSize: '22px', letterSpacing: '-0.03em' }}>
            medico<em>.</em>
          </span>
        </div>

        {/* Center View Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn btn-small ${activeView === 'visit' ? 'btn-solid' : ''}`}
            onClick={() => onSelectView('visit')}
          >
            <Globe size={13} />
            <span>About Medico</span>
          </button>

          <button 
            className={`btn btn-small ${activeView === 'portal' ? 'btn-solid' : ''}`}
            onClick={() => onSelectView('portal')}
          >
            <LogIn size={13} />
            <span>{currentUser ? 'Dashboard Portal' : 'Log In / Portal'}</span>
          </button>
        </div>

        {/* User Session Profile / Auth Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {currentUser ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{currentUser.name}</span>
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
                <span style={{ marginLeft: '2px' }}>Log Out</span>
              </button>
            </>
          ) : (
            <button className="btn btn-small btn-solid" onClick={() => onSelectView('portal')}>
              <LogIn size={13} />
              <span>Login / Register</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
