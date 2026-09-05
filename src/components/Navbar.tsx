import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, LogOut, Activity, Search, Package, Zap, AlertTriangle, Layers, Users, Scale, Globe, LogIn } from 'lucide-react';
import { mockDb } from '../utils/mockDb';

interface NavbarProps {
  activeView: 'visit' | 'portal';
  onSelectView: (view: 'visit' | 'portal') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, onSelectView }) => {
  const { currentUser, logout } = useAuth();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeNav, setActiveNav] = useState<string>('default');
  
  // Badge counts
  const [counts, setCounts] = useState({
    doctorBookings: 0,
    hasEmergencyDoctor: false,
    dealerOrders: 0,
    hasEmergencyDealer: false,
    dealerInventory: 0,
    unverifiedUsers: 0,
    disputes: 0,
  });

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
  }, [currentUser, lastScrollY]);

  // Update counts periodically
  useEffect(() => {
    if (!currentUser) return;

    const updateCounts = () => {
      const bookings = mockDb.getBookings();
      const broadcasts = mockDb.getBroadcasts();
      const users = mockDb.getUsers();
      const implants = mockDb.getImplants();

      if (currentUser.role === 'doctor') {
        const docBookings = bookings.filter(b => b.doctorUsername === currentUser.username);
        const activeBc = broadcasts.some(
          bc => bc.doctorUsername === currentUser.username && bc.status === 'pending' && new Date() < new Date(bc.expiresAt)
        );
        setCounts(prev => ({ ...prev, doctorBookings: docBookings.length, hasEmergencyDoctor: activeBc }));
      } else if (currentUser.role === 'dealer') {
        const dealerInventoryCount = implants.filter(i => i.dealerUsername === currentUser.username).length;
        const activeOrders = bookings.filter(
          b => (b.dealerUsername === currentUser.username || (b.isEmergency && !b.dealerUsername)) && b.status !== 'delivered' && b.status !== 'returned'
        ).length;
        const pendingBc = broadcasts.some(
          bc => bc.status === 'pending' && bc.matchedDealers.includes(currentUser.username) && new Date() < new Date(bc.expiresAt)
        );
        setCounts(prev => ({
          ...prev,
          dealerInventory: dealerInventoryCount,
          dealerOrders: activeOrders,
          hasEmergencyDealer: pendingBc,
        }));
      } else if (currentUser.role === 'admin') {
        const unverified = users.filter(u => !u.isVerified && u.role !== 'admin').length;
        const activeDisputes = bookings.filter(b => b.disputed).length;
        setCounts(prev => ({
          ...prev,
          unverifiedUsers: unverified,
          disputes: activeDisputes,
        }));
      }
    };

    updateCounts();
    const interval = setInterval(updateCounts, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  if (!currentUser) return null;

  const navigateTo = (navTarget: string) => {
    setActiveNav(navTarget);
    // Dispatch custom navigation event
    window.dispatchEvent(new CustomEvent('medico_navigate', { detail: { target: navTarget } }));
    
    // Smooth scroll to element if ID exists
    const el = document.getElementById(navTarget);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderRoleNavLinks = () => {
    switch (currentUser.role) {
      case 'doctor':
        return (
          <div className="nav-links">
            <button
              className={`nav-link ${activeNav === 'search' || activeNav === 'default' ? 'active' : ''}`}
              onClick={() => navigateTo('search')}
              title="Search and source implants"
            >
              <Search size={15} />
              <span>Catalog & Search</span>
            </button>
            <button
              className={`nav-link ${activeNav === 'tracking' ? 'active' : ''}`}
              onClick={() => navigateTo('tracking')}
              title="Track your surgical orders"
            >
              <Package size={15} />
              <span>My Orders</span>
              {counts.doctorBookings > 0 && (
                <span className="nav-badge">{counts.doctorBookings}</span>
              )}
            </button>
            {counts.hasEmergencyDoctor && (
              <button
                className="nav-link nav-link-emergency"
                onClick={() => navigateTo('search')}
                title="Active Emergency SOS Transmitting"
              >
                <Zap size={15} className="pulse-icon" />
                <span>Live Emergency SOS</span>
              </button>
            )}
          </div>
        );
      case 'dealer':
        return (
          <div className="nav-links">
            <button
              className={`nav-link ${activeNav === 'inventory' || activeNav === 'default' ? 'active' : ''}`}
              onClick={() => navigateTo('inventory')}
              title="Manage stock catalog"
            >
              <Layers size={15} />
              <span>Inventory</span>
              {counts.dealerInventory > 0 && (
                <span className="nav-badge">{counts.dealerInventory}</span>
              )}
            </button>
            <button
              className={`nav-link ${activeNav === 'orders' ? 'active' : ''}`}
              onClick={() => navigateTo('orders')}
              title="Manage surgical orders"
            >
              <Package size={15} />
              <span>Surgical Orders</span>
              {counts.dealerOrders > 0 && (
                <span className="nav-badge nav-badge-accent">{counts.dealerOrders}</span>
              )}
            </button>
            {counts.hasEmergencyDealer && (
              <button
                className="nav-link nav-link-emergency"
                onClick={() => navigateTo('sos-monitor')}
                title="Active Emergency Signal Incoming"
              >
                <AlertTriangle size={15} className="pulse-icon" />
                <span>SOS Signal</span>
              </button>
            )}
          </div>
        );
      case 'admin':
        return (
          <div className="nav-links">
            <button
              className={`nav-link ${activeNav === 'verifications' || activeNav === 'default' ? 'active' : ''}`}
              onClick={() => navigateTo('verifications')}
              title="User credential verification queue"
            >
              <Users size={15} />
              <span>Verifications</span>
              {counts.unverifiedUsers > 0 && (
                <span className="nav-badge nav-badge-warning">{counts.unverifiedUsers}</span>
              )}
            </button>
            <button
              className={`nav-link ${activeNav === 'analytics' ? 'active' : ''}`}
              onClick={() => navigateTo('analytics')}
              title="Platform overview metrics"
            >
              <Layers size={15} />
              <span>Metrics</span>
            </button>
            <button
              className={`nav-link ${activeNav === 'disputes' ? 'active' : ''}`}
              onClick={() => navigateTo('disputes')}
              title="Dispute resolution desk"
            >
              <Scale size={15} />
              <span>Disputes</span>
              {counts.disputes > 0 && (
                <span className="nav-badge nav-badge-error">{counts.disputes}</span>
              )}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <header className={`header-nav container ${!visible ? 'nav-hidden' : ''}`}>
      <div className="nav-bar glass">
        {/* Brand / Logo */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => navigateTo('default')}
          title="About Medico"
        >
          <Activity size={24} color="var(--accent)" />
          <span className="logo-text" style={{ fontSize: '20px', letterSpacing: '-0.03em' }}>
            medico<em>.</em>
          </span>
        </div>

          {/* Navigation Links Menu */}
          {renderRoleNavLinks()}
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

