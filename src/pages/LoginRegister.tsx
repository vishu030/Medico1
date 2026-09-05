import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, ShieldAlert, LogIn, UserPlus } from 'lucide-react';
import { Role, mockDb, User } from '../utils/mockDb';

export const LoginRegister: React.FC = () => {
  const { login, register } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  
  // Real-time Users State for Demo Access Badges
  const [users, setUsers] = useState<User[]>(() => mockDb.getUsers());

  useEffect(() => {
    const loadUsers = () => {
      setUsers(mockDb.getUsers());
    };
    loadUsers();
    const interval = setInterval(loadUsers, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Login State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginError, setLoginError] = useState('');

  // Signup State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('doctor');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [address, setAddress] = useState('');
  const lat = '19.0028'; // Default Mumbai
  const lng = '72.8421';
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername.trim()) {
      setLoginError('Please enter a username');
      return;
    }
    const success = await login(loginUsername);
    if (!success) {
      setLoginError('Username not found. Try one of the demo credentials below.');
    }
  };

  const handleQuickLogin = async (uname: string) => {
    setLoginError('');
    await login(uname);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess(false);

    if (!username.trim() || !fullName.trim() || !address.trim() || !lat || !lng) {
      setSignupError('Please fill out all fields');
      return;
    }

    if (role !== 'admin' && !licenseNumber.trim()) {
      setSignupError(`Please enter your ${role === 'doctor' ? 'Medical Registration Number' : 'Wholesale Device License Number'}`);
      return;
    }

    if (role !== 'admin' && !licenseFile) {
      setSignupError(`Please upload your ${role === 'doctor' ? 'Medical Registration Certificate' : 'Wholesale Device License Certificate'}`);
      return;
    }

    try {
      await register({
        username,
        role,
        name: fullName,
        licenseNumber: role === 'admin' ? undefined : licenseNumber,
        licenseDocument: licenseFile ? licenseFile.name : undefined,
        address,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      });
      setSignupSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSignupError(err.message);
      } else {
        setSignupError('Registration failed. Username may already exist.');
      }
    }
  };

  return (
    <div className="container" style={{ minHeight: '85vh', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '40px' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '520px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.08)' }}>
        
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Activity size={32} color="var(--accent)" />
            <span className="logo-text" style={{ fontSize: '32px', letterSpacing: '-0.04em' }}>
              medico<em>.</em>
            </span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>
            Orthopedic Implant Sourcing & Emergency Marketplace
          </p>
        </div>

        {/* Tab Headers */}
        <div className="tabs" style={{ justifyContent: 'center' }}>
          <button 
            className={`tab-btn ${isLoginTab ? 'active' : ''}`} 
            onClick={() => { setIsLoginTab(true); setLoginError(''); }}
            style={{ fontSize: '16px' }}
          >
            <LogIn size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Log In
          </button>
          <button 
            className={`tab-btn ${!isLoginTab ? 'active' : ''}`} 
            onClick={() => { setIsLoginTab(false); setSignupError(''); }}
            style={{ fontSize: '16px' }}
          >
            <UserPlus size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Sign Up
          </button>
        </div>

        {/* Login Form */}
        {isLoginTab ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter doctor, dealer, or admin username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              />
            </div>

            {loginError && (
              <div className="badge badge-error" style={{ display: 'flex', width: '100%', padding: '10px 14px', marginBottom: '20px', borderRadius: '10px' }}>
                <ShieldAlert size={16} style={{ marginRight: '8px' }} />
                <span>{loginError}</span>
              </div>
            )}

            <button type="submit" className="btn btn-solid" style={{ width: '100%', padding: '12px', fontSize: '15px' }}>
              Log In
            </button>

            {/* Quick Demo Login Grid */}
            <div style={{ marginTop: '32px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
              <span className="mono-text" style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, marginBottom: '12px', textAlign: 'center' }}>
                ⚡ QUICK PORTAL DEMO ACCESS
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(() => {
                  const demoAccounts = [
                    { username: 'dr_ananya', title: '👨‍⚕️ Dr. Ananya Sharma (Doctor)', defaultRole: 'doctor' },
                    { username: 'devesh_implants', title: '🏢 Devesh Ortho Supplies (Dealer)', defaultRole: 'dealer' },
                    { username: 'dr_rahul', title: '👨‍⚕️ Dr. Rahul Mehta (Doctor)', defaultRole: 'doctor' },
                    { username: 'admin', title: '🛡️ Platform Administrator', defaultRole: 'admin' },
                  ];

                  return demoAccounts.map((demo) => {
                    const foundUser = users.find((u) => u.username === demo.username);
                    const isVerified = foundUser ? foundUser.isVerified : demo.username !== 'dr_rahul';
                    const isAdmin = demo.defaultRole === 'admin' || foundUser?.role === 'admin';

                    return (
                      <button 
                        key={demo.username}
                        type="button" 
                        className="btn btn-small"
                        onClick={() => handleQuickLogin(demo.username)}
                        style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px' }}
                      >
                        <span style={{ fontWeight: 600 }}>{demo.title}</span>
                        {isAdmin ? (
                          <span className="badge badge-accent" style={{ fontSize: '9px' }}>Admin</span>
                        ) : isVerified ? (
                          <span className="badge badge-success" style={{ fontSize: '9px' }}>Verified</span>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: '9px' }}>Unverified</span>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSignupSubmit}>
            {signupSuccess ? (
              <div className="badge badge-success" style={{ display: 'flex', width: '100%', padding: '14px', borderRadius: '12px', marginBottom: '20px', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={28} />
                <span style={{ fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>Registration Successful!</span>
                <span style={{ fontSize: '12px', textAlign: 'center', opacity: 0.9 }}>
                  Your account requires administrator verification before you can list inventory or book implants.
                </span>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Role Selection</label>
                  <select 
                    className="form-select" 
                    value={role} 
                    onChange={(e) => {
                      setRole(e.target.value as Role);
                      setSignupError('');
                    }}
                  >
                    <option value="doctor">Medical Practitioner (Doctor / Surgeon)</option>
                    <option value="dealer">Implant Supplier / Distributor (Dealer)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. dr_sharma or apex_supplies"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name / Business Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Dr. Vijay Joshi or Joshi Ortho Care"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {role === 'doctor' ? 'Medical Council Registration Number' : 'Wholesale Device License Number'}
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder={role === 'doctor' ? 'MCI-XXXX-XXXX' : 'WDL-MH-XXXXX'}
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {role === 'doctor' ? 'Upload Registration Certificate (PDF/Image)' : 'Upload Wholesale License (PDF/Image)'}
                  </label>
                  <input 
                    type="file" 
                    className="form-input" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setLicenseFile(e.target.files[0]);
                      }
                    }}
                  />
                  {licenseFile && (
                    <span className="mono-text" style={{ fontSize: '11px', color: 'var(--accent)', display: 'block', marginTop: '6px' }}>
                      Selected: {licenseFile.name} ({(licenseFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Address (Hospital / Warehouse Warehouse)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Hinduja Hospital, Mahim, Mumbai"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {signupError && (
                  <div className="badge badge-error" style={{ display: 'flex', width: '100%', padding: '10px 14px', marginBottom: '20px', borderRadius: '10px' }}>
                    <ShieldAlert size={16} style={{ marginRight: '8px' }} />
                    <span>{signupError}</span>
                  </div>
                )}

                <button type="submit" className="btn btn-solid" style={{ width: '100%', padding: '12px', fontSize: '15px' }}>
                  Submit For Admin Approval
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
