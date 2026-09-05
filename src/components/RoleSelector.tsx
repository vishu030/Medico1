import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Stethoscope, Briefcase } from 'lucide-react';

interface RoleSelectorProps {
  onRoleSwitched?: () => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ onRoleSwitched }) => {
  const { currentUser, switchRole } = useAuth();

  if (!currentUser) return null;

  const handleSwap = (role: 'doctor' | 'dealer' | 'admin') => {
    switchRole(role);
    if (onRoleSwitched) {
      onRoleSwitched();
    }
  };

  return (
    <div 
      className="glass" 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        padding: '12px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid var(--accent)',
      }}
    >
      <span className="mono-text" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', fontWeight: 700, alignSelf: 'center', marginBottom: '2px' }}>
        ⚙️ DEMO SWITCHBOARD
      </span>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          className={`btn btn-small ${currentUser.role === 'doctor' ? 'btn-solid' : ''}`}
          onClick={() => handleSwap('doctor')}
          title="Switch to Dr. Ananya (Doctor)"
        >
          <Stethoscope size={12} />
          <span>Doctor</span>
        </button>

        <button 
          className={`btn btn-small ${currentUser.role === 'dealer' ? 'btn-solid' : ''}`}
          onClick={() => handleSwap('dealer')}
          title="Switch to Devesh Supplies (Dealer)"
        >
          <Briefcase size={12} />
          <span>Dealer</span>
        </button>

        <button 
          className={`btn btn-small ${currentUser.role === 'admin' ? 'btn-solid' : ''}`}
          onClick={() => handleSwap('admin')}
          title="Switch to Admin"
        >
          <Shield size={12} />
          <span>Admin</span>
        </button>
      </div>
      
      <span style={{ fontSize: '10px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '2px' }}>
        Quick-swap to default verified profiles
      </span>
    </div>
  );
};
