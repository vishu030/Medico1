import React, { useState, useEffect } from 'react';
import { mockDb, User, Booking } from '../utils/mockDb';
import { ShieldCheck, ShieldAlert, Check, X, FileText, Activity, Layers, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { refreshUser } = useAuth();
  const [unverifiedUsers, setUnverifiedUsers] = useState<User[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    standardBookings: 0,
    emergencyBookings: 0,
    activeDisputes: 0,
  });

  const loadAdminData = () => {
    // Load unverified accounts
    const users = mockDb.getUsers();
    const unverified = users.filter((u) => !u.isVerified && u.role !== 'admin');
    setUnverifiedUsers(unverified);

    // Load bookings
    const bookings = mockDb.getBookings();
    setAllBookings(bookings);

    // Calculate metrics
    const standard = bookings.filter((b) => !b.isEmergency).length;
    const emergency = bookings.filter((b) => b.isEmergency).length;
    const disputes = bookings.filter((b) => b.disputed).length;

    setStats({
      totalUsers: users.length - 1, // Exclude admin
      standardBookings: standard,
      emergencyBookings: emergency,
      activeDisputes: disputes,
    });
  };

  useEffect(() => {
    loadAdminData();
    
    // Refresh interval for live test feel
    const interval = setInterval(loadAdminData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = (username: string) => {
    const users = mockDb.getUsers();
    const idx = users.findIndex((u) => u.username === username);
    if (idx !== -1) {
      users[idx].isVerified = true;
      mockDb.saveUsers(users);
      refreshUser(); // If current user, update session
      loadAdminData();
    }
  };

  const handleReject = (username: string) => {
    const users = mockDb.getUsers();
    const filtered = users.filter((u) => u.username !== username);
    mockDb.saveUsers(filtered);
    loadAdminData();
  };

  const handleResolveDispute = (bookingId: string) => {
    try {
      mockDb.resolveDispute(bookingId);
      loadAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="container">
      {/* Title */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Platform <em>Control</em> Panel
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '15px' }}>
          Review credentials, manage transaction disputes, and monitor surgical marketplace activity.
        </p>
      </div>

      {/* Analytics Spec Frame */}
      <div className="spec-frame">
        <div className="spec-item">
          <div className="spec-label">Registered Accounts</div>
          <div className="spec-val">
            {stats.totalUsers} <em>Users</em>
          </div>
        </div>
        <div className="spec-item">
          <div className="spec-label">Standard Orders</div>
          <div className="spec-val">
            {stats.standardBookings} <em>Booked</em>
          </div>
        </div>
        <div className="spec-item">
          <div className="spec-label">Emergency Broadcasts</div>
          <div className="spec-val">
            {stats.emergencyBookings} <em>Fired</em>
          </div>
        </div>
        <div className="spec-item">
          <div className="spec-label">Active Disputes</div>
          <div className="spec-val">
            <span style={{ color: stats.activeDisputes > 0 ? 'var(--status-error)' : 'inherit' }}>
              {stats.activeDisputes}
            </span> <em>Issues</em>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', marginBottom: '40px' }}>
        
        {/* Onboarding Verification Queue */}
        <section className="glass" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <ShieldAlert size={20} color="var(--accent)" />
            <h2 style={{ fontSize: '22px' }}>Credential Verification Queue ({unverifiedUsers.length})</h2>
          </div>

          {unverifiedUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
              <ShieldCheck size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>All registration credentials have been verified. Queue is empty.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="medico-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>License / Reg No.</th>
                    <th>Certificate Document</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {unverifiedUsers.map((user) => (
                    <tr key={user.username}>
                      <td>
                        <span className={`badge ${user.role === 'doctor' ? 'badge-accent' : 'badge-neutral'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{user.name}</div>
                        <div className="mono-text" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>@{user.username}</div>
                      </td>
                      <td className="mono-data">{user.licenseNumber}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)' }}>
                          <FileText size={14} />
                          <span style={{ fontSize: '13px', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => alert(`Reviewing document: ${user.licenseDocument}\nVerified via State Medical Registry.`)}>
                            {user.licenseDocument || 'cert.pdf'}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-dim)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.address}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-small btn-solid" 
                            style={{ backgroundColor: 'var(--status-success)', color: 'white' }}
                            onClick={() => handleApprove(user.username)}
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button 
                            className="btn btn-small btn-danger"
                            onClick={() => handleReject(user.username)}
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Disputes Queue */}
        {allBookings.some(b => b.disputed) && (
          <section className="glass" style={{ padding: '32px', border: '1px solid var(--status-error)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <AlertCircle size={20} color="var(--status-error)" />
              <h2 style={{ fontSize: '22px', color: 'var(--status-error)' }}>Active Transaction Disputes</h2>
            </div>
            <div className="table-container">
              <table className="medico-table">
                <thead>
                  <tr>
                    <th>Case Ref ID</th>
                    <th>Doctor</th>
                    <th>Dealer</th>
                    <th>Dispute Reason / Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allBookings.filter(b => b.disputed).map((booking) => (
                    <tr key={booking.id}>
                      <td className="mono-data">{booking.caseReferenceId}</td>
                      <td>@{booking.doctorUsername}</td>
                      <td>@{booking.dealerUsername}</td>
                      <td style={{ color: 'var(--status-error)', fontWeight: 500 }}>
                        {booking.disputeNotes || 'Unspecified delivery dispute'}
                      </td>
                      <td>
                        <button 
                          className="btn btn-small"
                          onClick={() => handleResolveDispute(booking.id)}
                          style={{ borderColor: 'var(--status-success)', color: 'var(--status-success)' }}
                        >
                          <Check size={12} /> Resolve Dispute
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Global Transaction / Order Audit Log */}
        <section className="glass" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Layers size={20} color="var(--accent)" />
            <h2 style={{ fontSize: '22px' }}>Global Transaction Audit Log ({allBookings.length})</h2>
          </div>

          {allBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
              <Activity size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>No bookings or emergency broadcasts recorded in the system yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="medico-table">
                <thead>
                  <tr>
                    <th>Case ID (Anonymized)</th>
                    <th>Implant ID</th>
                    <th>Participants</th>
                    <th>Scheduled Date</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allBookings.map((booking) => (
                    <tr key={booking.id} className={booking.disputed ? 'warning-row' : ''}>
                      <td className="mono-data" style={{ fontWeight: 600 }}>{booking.caseReferenceId}</td>
                      <td className="mono-data" style={{ fontSize: '12px' }}>{booking.implantId}</td>
                      <td>
                        <div style={{ fontSize: '13px' }}>Dr. @{booking.doctorUsername}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Dl. @{booking.dealerUsername || 'UNCLAIMED'}</div>
                      </td>
                      <td className="mono-data">{booking.surgeryDate}</td>
                      <td>
                        {booking.isEmergency ? (
                          <span className="badge badge-error" style={{ fontSize: '9px' }}>Emergency</span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: '9px' }}>Standard</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          booking.status === 'delivered' ? 'badge-success' :
                          booking.status === 'returned' ? 'badge-neutral' :
                          booking.status === 'dispatched' ? 'badge-warning' : 'badge-accent'
                        }`}>
                          {booking.status}
                        </span>
                        {booking.disputed && (
                          <span className="badge badge-error" style={{ marginLeft: '6px' }}>Disputed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
