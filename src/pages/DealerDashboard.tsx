import React, { useState, useEffect } from 'react';
import { mockDb, Implant, Booking, ImplantType, Material, TransactionType } from '../utils/mockDb';
import { useAuth } from '../context/AuthContext';
import { audioAlert } from '../utils/audioAlert';
import { Plus, Trash2, Calendar, ShieldAlert, CheckCircle, Truck, PackageCheck, Volume2, VolumeX, AlertTriangle, AlertCircle, FileText } from 'lucide-react';
import { ThemedDatePicker } from '../components/ThemedDatePicker';

export const DealerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [inventory, setInventory] = useState<Implant[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Inventory Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'pedicle_screw' as ImplantType,
    brand: '',
    material: 'Titanium' as Material,
    size: '',
    batchNumber: '',
    expiryDate: '',
    price: '',
    transactionType: 'sale' as TransactionType,
  });
  const [formError, setFormError] = useState('');

  // Emergency Broadcast State
  const [activeBroadcast, setActiveBroadcast] = useState<any | null>(null);
  const [broadcastDistance, setBroadcastDistance] = useState<number>(0);
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const loadData = () => {
    if (!currentUser) return;
    
    // Load inventory
    const allImplants = mockDb.getImplants();
    const dealerInventory = allImplants.filter((imp) => imp.dealerUsername === currentUser.username);
    setInventory(dealerInventory);

    // Load bookings
    const allBookings = mockDb.getBookings();
    const dealerBookings = allBookings.filter((bk) => bk.dealerUsername === currentUser.username || (bk.isEmergency && !bk.dealerUsername));
    setBookings(dealerBookings);
    
    // Check for pending emergency broadcasts targeting this dealer
    const broadcasts = mockDb.getBroadcasts();
    const pendingBroadcast = broadcasts.find(
      (bc) => 
        bc.status === 'pending' && 
        bc.matchedDealers.includes(currentUser.username) &&
        new Date() < new Date(bc.expiresAt)
    );

    if (pendingBroadcast) {
      if (!activeBroadcast || activeBroadcast.id !== pendingBroadcast.id) {
        setActiveBroadcast(pendingBroadcast);
        setClaimError('');
        setClaimSuccess('');
        
        // Calculate distance to doctor's hospital
        const distance = mockDb.findNearbyDealersForImplant(
          pendingBroadcast.implantType,
          pendingBroadcast.doctorLat,
          pendingBroadcast.doctorLng,
          pendingBroadcast.size
        ).find(m => m.dealer.username === currentUser.username)?.distanceKm || 0;
        setBroadcastDistance(distance);

        // Play dual-tone siren
        if (!isAudioMuted) {
          audioAlert.startEmergencySiren();
        }
      }
    } else {
      if (activeBroadcast) {
        setActiveBroadcast(null);
        audioAlert.stopEmergencySiren();
      }
    }
  };

  useEffect(() => {
    loadData();
    
    // Poll for emergency alerts and state updates
    const pollInterval = setInterval(() => {
      mockDb.checkAndExpireBroadcasts();
      loadData();
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      audioAlert.stopEmergencySiren(); // Always clean up audio on unmount
    };
  }, [currentUser, isAudioMuted, activeBroadcast]);

  // Block screen if dealer is not verified yet
  if (currentUser && !currentUser.isVerified) {
    return (
      <div className="container" style={{ marginTop: '60px' }}>
        <div className="glass" style={{ padding: '56px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <ShieldAlert size={64} color="var(--status-warning)" style={{ marginBottom: '24px' }} />
          <h2 className="display-serif" style={{ fontSize: '32px', marginBottom: '16px' }}>
            Verification <em>Pending</em>
          </h2>
          <p style={{ color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '24px' }}>
            We've received your wholesale medical device distribution license credentials (<strong>{currentUser.licenseNumber}</strong>) and document <strong>{currentUser.licenseDocument}</strong>. 
            An administrator is currently auditing your submission for regulatory compliance.
          </p>
          <div className="badge badge-warning" style={{ padding: '8px 16px', borderRadius: '12px' }}>
            Status: Awaiting Admin Verification (24-Hour SLA)
          </div>
        </div>
      </div>
    );
  }

  const handleAddImplant = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const { name, brand, size, batchNumber, expiryDate, price } = formData;
    if (!name.trim() || !brand.trim() || !size.trim() || !batchNumber.trim() || !expiryDate || !price) {
      setFormError('Please fill in all mandatory fields.');
      return;
    }

    // Rules: expiry must be in the future
    const todayStr = new Date('2026-08-23T23:08:00').toISOString().split('T')[0];
    if (expiryDate <= todayStr) {
      setFormError('Regulatory Violation: Expiry date must be in the future.');
      return;
    }

    mockDb.addImplant({
      name,
      type: formData.type,
      brand,
      material: formData.material,
      size,
      batchNumber,
      expiryDate,
      price: parseFloat(price),
      transactionType: formData.transactionType,
      dealerUsername: currentUser!.username,
      isAvailable: true,
    });

    setShowAddModal(false);
    setFormData({
      name: '',
      type: 'pedicle_screw',
      brand: '',
      material: 'Titanium',
      size: '',
      batchNumber: '',
      expiryDate: '',
      price: '',
      transactionType: 'sale',
    });
    loadData();
  };

  const handleDeleteImplant = (id: string) => {
    if (window.confirm('Are you sure you want to delete this implant from your inventory?')) {
      mockDb.deleteImplant(id);
      loadData();
    }
  };

  const handleUpdateStatus = (id: string, status: any) => {
    try {
      mockDb.updateBookingStatus(id, status);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleClaimEmergency = () => {
    if (!activeBroadcast) return;
    setClaimError('');
    
    try {
      // Simulate Database Lock and Order Claim
      mockDb.claimEmergencyBroadcast(activeBroadcast.id, currentUser!.username);
      
      setClaimSuccess('Emergency Request claimed successfully! Prepare dispatch immediately.');
      audioAlert.stopEmergencySiren();
      
      setTimeout(() => {
        setActiveBroadcast(null);
        loadData();
      }, 2000);
    } catch (err: any) {
      setClaimError(err.message || 'Failed to claim. The order may have been locked by another supplier.');
      audioAlert.stopEmergencySiren();
    }
  };

  const toggleMute = () => {
    if (isAudioMuted) {
      if (activeBroadcast) audioAlert.startEmergencySiren();
    } else {
      audioAlert.stopEmergencySiren();
    }
    setIsAudioMuted(!isAudioMuted);
  };

  // Helper to check if implant is expiring in under 30 days (amber warning)
  const isExpiringSoon = (expiryStr: string) => {
    const today = new Date('2026-08-23T23:08:00');
    const expiry = new Date(expiryStr);
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff >= 0 && daysDiff <= 30;
  };

  return (
    <div className="container">
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '36px', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Supplier <em>Inventory</em> Portal
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '15px' }}>
            Manage stock catalog, batch numbers, and verify surgical booking fulfillments.
          </p>
        </div>
        <button className="btn btn-solid" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Implant Stock
        </button>
      </div>

      {/* Stats Summary */}
      <div className="spec-frame">
        <div className="spec-item">
          <div className="spec-label">Total Listings</div>
          <div className="spec-val">
            {inventory.length} <em>Items</em>
          </div>
        </div>
        <div className="spec-item">
          <div className="spec-label">Active Orders</div>
          <div className="spec-val">
            {bookings.filter(b => b.dealerUsername === currentUser!.username && b.status !== 'delivered' && b.status !== 'returned').length} <em>Active</em>
          </div>
        </div>
        <div className="spec-item">
          <div className="spec-label">Expiring Stock (&lt; 30d)</div>
          <div className="spec-val">
            <span style={{ color: inventory.some(i => isExpiringSoon(i.expiryDate)) ? 'var(--status-warning)' : 'inherit' }}>
              {inventory.filter(i => isExpiringSoon(i.expiryDate)).length}
            </span> <em>Flagged</em>
          </div>
        </div>
        <div className="spec-item">
          <div className="spec-label">Completed Deliveries</div>
          <div className="spec-val">
            {bookings.filter(b => b.dealerUsername === currentUser!.username && (b.status === 'delivered' || b.status === 'returned')).length} <em>Filled</em>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        
        {/* Active Bookings & Order Fulfillment */}
        <section className="glass" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Calendar size={20} color="var(--accent)" />
            <h2 style={{ fontSize: '22px' }}>Surgical Booking Requests ({bookings.filter(b => b.dealerUsername === currentUser!.username).length})</h2>
          </div>

          {bookings.filter(b => b.dealerUsername === currentUser!.username).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
              <PackageCheck size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>No active orders or rental bookings placed for your inventory.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="medico-table">
                <thead>
                  <tr>
                    <th>Case Ref ID</th>
                    <th>Implant</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Action Workflow</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.filter(b => b.dealerUsername === currentUser!.username).map((booking) => {
                    const matchedImplant = inventory.find((i) => i.id === booking.implantId);
                    return (
                      <tr key={booking.id} className={booking.disputed ? 'warning-row' : ''}>
                        <td>
                          <div className="mono-data" style={{ fontWeight: 600 }}>{booking.caseReferenceId}</div>
                          {booking.disputed && (
                            <span className="badge badge-error" style={{ fontSize: '8px', padding: '1px 5px', marginTop: '4px' }}>Dispute Filed</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{matchedImplant?.name || 'Implant Spec Request'}</div>
                          <div className="mono-text" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                            Batch: {matchedImplant?.batchNumber || 'N/A'} | Spec: {matchedImplant?.size || 'N/A'}
                          </div>
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
                        </td>
                        <td>
                          {booking.disputed ? (
                            <span style={{ fontSize: '12px', color: 'var(--status-error)', fontWeight: 500 }}>Disputed: Locked by Admin</span>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {booking.status === 'requested' && (
                                <>
                                  <button 
                                    className="btn btn-small btn-solid" 
                                    style={{ backgroundColor: 'var(--status-success)', color: 'white' }}
                                    onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                  >
                                    Confirm
                                  </button>
                                  <button 
                                    className="btn btn-small btn-danger"
                                    onClick={() => {
                                      if (confirm('Reject this surgery booking request?')) {
                                        mockDb.updateBookingStatus(booking.id, 'returned'); // Transition to end state / cancel
                                        loadData();
                                      }
                                    }}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              
                              {booking.status === 'confirmed' && (
                                <button 
                                  className="btn btn-small"
                                  onClick={() => handleUpdateStatus(booking.id, 'dispatched')}
                                  style={{ borderColor: 'var(--status-warning)', color: 'var(--status-warning)' }}
                                >
                                  <Truck size={12} /> Dispatch
                                </button>
                              )}

                              {booking.status === 'dispatched' && (
                                <button 
                                  className="btn btn-small btn-solid"
                                  onClick={() => handleUpdateStatus(booking.id, 'delivered')}
                                  style={{ backgroundColor: 'var(--status-success)', color: 'white' }}
                                >
                                  <PackageCheck size={12} /> Mark Delivered
                                </button>
                              )}

                              {booking.status === 'delivered' && matchedImplant?.transactionType === 'rental' && (
                                <button 
                                  className="btn btn-small"
                                  onClick={() => handleUpdateStatus(booking.id, 'returned')}
                                >
                                  Mark Returned (Rent)
                                </button>
                              )}

                              {(booking.status === 'delivered' || booking.status === 'returned') && (
                                <button 
                                  className="btn btn-small btn-small"
                                  onClick={() => alert(`Auto-Generated Invoice details:\n\nInvoice ID: INV-${booking.id}\nSurgical Case ID: ${booking.caseReferenceId}\nImplant: ${matchedImplant?.name}\nBatch No: ${matchedImplant?.batchNumber}\nPrice: ₹${matchedImplant?.price}\n\nInvoice saved to PDF. (Click print to download)`)}
                                >
                                  <FileText size={12} /> Invoice
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Current Catalog / Inventory Stock */}
        <section className="glass" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '22px', marginBottom: '24px' }}>Active Stock Catalog</h2>
          {inventory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
              <PackageCheck size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>Your inventory catalog is currently empty. Click Add Implant Stock to create one.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="medico-table">
                <thead>
                  <tr>
                    <th>Implant Specs</th>
                    <th>Type</th>
                    <th>Material</th>
                    <th>Batch / Lot No.</th>
                    <th>Expiry Date</th>
                    <th>Pricing</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((implant) => {
                    const expiring = isExpiringSoon(implant.expiryDate);
                    return (
                      <tr key={implant.id} className={expiring ? 'warning-row' : ''}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{implant.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Brand: {implant.brand} | Size: {implant.size}</div>
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                            {implant.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td>{implant.material}</td>
                        <td className="mono-data">{implant.batchNumber}</td>
                        <td className="mono-data">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{implant.expiryDate}</span>
                            {expiring && (
                              <span className="badge badge-warning" style={{ fontSize: '8px', padding: '1px 5px' }} title="Expires within 30 days">
                                Expiring Soon
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>₹{implant.price.toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-dim)' }}>
                            For {implant.transactionType}
                          </div>
                        </td>
                        <td>
                          <button 
                            className="btn btn-small btn-danger"
                            onClick={() => handleDeleteImplant(implant.id)}
                            title="Delete Stock Listing"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h3 className="display-serif" style={{ fontSize: '24px', marginBottom: '24px' }}>Add New Implant Listing</h3>
            
            <form onSubmit={handleAddImplant}>
              <div className="form-group">
                <label className="form-label">Implant Category</label>
                <select 
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ImplantType })}
                >
                  <option value="pedicle_screw">Pedicle Screw</option>
                  <option value="locking_plate">Locking Plate</option>
                  <option value="im_nail">IM Nail (Intramedullary)</option>
                  <option value="cervical_plate">Cervical Plate</option>
                  <option value="joint_replacement">Joint Replacement</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Implant Item Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Pedicle Screw Titanium 6.5mm x 45mm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Brand / Manufacturer</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Stryker or Synthes"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Size Specification</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 6.5mm x 45mm or 8-Hole"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Material composition</label>
                  <select 
                    className="form-select"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value as Material })}
                  >
                    <option value="Titanium">Titanium</option>
                    <option value="Stainless Steel">Stainless Steel</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Transaction Scheme</label>
                  <select 
                    className="form-select"
                    value={formData.transactionType}
                    onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as TransactionType })}
                  >
                    <option value="sale">Direct Purchase (Sale)</option>
                    <option value="rental">Consignment / Rent (Rental)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Batch / Lot Number (Traceability)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. BATCH-2026-X48"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date (Mandatory)</label>
                  <ThemedDatePicker 
                    value={formData.expiryDate}
                    onChange={(val) => setFormData({ ...formData, expiryDate: val })}
                    minDate="2026-08-24"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Price (INR)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 15000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              {formError && (
                <div className="badge badge-error" style={{ display: 'flex', width: '100%', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px' }}>
                  <AlertTriangle size={16} style={{ marginRight: '8px' }} />
                  <span>{formError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-solid">Save Listing</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Broadcast Alert Fullscreen Modal */}
      {activeBroadcast && (
        <div className="emergency-alert-overlay">
          <div className="emergency-alert-panel">
            
            {/* Pulsing Alert Badge */}
            <div className="pulsing-badge" style={{ display: 'inline-flex', marginBottom: '16px' }}>
              <div className="pulsing-dot" />
              <span>TRAUMA EMERGENCY BROADCAST</span>
            </div>

            {/* Mute Audio Controls */}
            <button 
              className="btn btn-small" 
              onClick={toggleMute}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.1)',
                borderColor: 'transparent',
                color: 'white',
              }}
            >
              {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Sonic visualizer spikes */}
            <div className="sound-wave">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <h2 className="display-serif" style={{ fontSize: '32px', color: 'white', margin: '20px 0 10px 0' }}>
              Implant Requested!
            </h2>
            
            <p style={{ color: 'var(--emergency-text-dim)', fontSize: '14px', marginBottom: '24px' }}>
              A surgeon requires immediate orthopedic delivery. You hold matching inventory.
            </p>

            {/* Spec Frame Inverted for Emergency Details */}
            <div className="glass" style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 90, 95, 0.3)', marginBottom: '32px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ color: 'var(--emergency-text-dim)', fontSize: '13px' }}>Required Spec:</span>
                <span style={{ fontWeight: 600, color: 'white' }}>
                  {activeBroadcast.implantType.toUpperCase().replace('_', ' ')} ({activeBroadcast.size})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ color: 'var(--emergency-text-dim)', fontSize: '13px' }}>Requested By:</span>
                <span style={{ fontWeight: 600, color: 'white' }}>{activeBroadcast.doctorUsername}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: 'var(--emergency-text-dim)', fontSize: '13px' }}>Proximity Distance:</span>
                <span style={{ fontWeight: 600, color: '#FF5A5F' }}>{broadcastDistance.toFixed(1)} km away</span>
              </div>
            </div>

            {claimError && (
              <div className="badge badge-error" style={{ display: 'flex', width: '100%', padding: '10px 14px', borderRadius: '10px', marginBottom: '20px' }}>
                <AlertCircle size={16} style={{ marginRight: '8px' }} />
                <span>{claimError}</span>
              </div>
            )}

            {claimSuccess && (
              <div className="badge badge-success" style={{ display: 'flex', width: '100%', padding: '10px 14px', borderRadius: '10px', marginBottom: '20px', color: 'white', backgroundColor: 'var(--status-success)' }}>
                <CheckCircle size={16} style={{ marginRight: '8px' }} />
                <span>{claimSuccess}</span>
              </div>
            )}

            {!claimSuccess && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-solid" 
                  style={{ flex: 1, backgroundColor: '#FF5A5F', color: 'white', fontSize: '16px', padding: '14px 20px', borderRadius: '16px' }}
                  onClick={handleClaimEmergency}
                >
                  CLAIM ORDER NOW
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
