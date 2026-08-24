import React, { useState, useEffect } from 'react';
import { mockDb, Implant, Booking, EmergencyBroadcast, getHaversineDistance } from '../utils/mockDb';
import { useAuth } from '../context/AuthContext';
import { audioAlert } from '../utils/audioAlert';
import { Search, MapPin, ShieldAlert, Star, FileText, AlertTriangle, AlertCircle, Clock, Zap, MessageSquare } from 'lucide-react';
import { ThemedDatePicker } from '../components/ThemedDatePicker';

export const DoctorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Tabs: search, tracking
  const [activeTab, setActiveTab] = useState<'search' | 'tracking'>('search');
  
  // Search & Catalog State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [maxDistance, setMaxDistance] = useState<number>(20); // 20km limit
  const [implants, setImplants] = useState<Implant[]>([]);
  const [dealersList, setDealersList] = useState<any[]>([]);

  // Booking Modal State
  const [selectedImplant, setSelectedImplant] = useState<Implant | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [caseId, setCaseId] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(currentUser?.address || '');
  const [isEmergencyForm, setIsEmergencyForm] = useState(false);
  const [bookError, setBookError] = useState('');

  // Emergency Broadcast Tracker State
  const [pendingBroadcast, setPendingBroadcast] = useState<EmergencyBroadcast | null>(null);
  const [broadcastTimer, setBroadcastTimer] = useState<string>('05:00');
  const [matchingDealersCount, setMatchingDealersCount] = useState(0);

  // Tracking List & Feedback State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showReviewModal, setShowReviewModal] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  
  // Dispute State
  const [showDisputeModal, setShowDisputeModal] = useState<Booking | null>(null);
  const [disputeNotes, setDisputeNotes] = useState('');
  const [disputeError, setDisputeError] = useState('');

  const loadData = () => {
    if (!currentUser) return;

    // Load available implants (hide expired items automatically check inside mockDb.ts)
    const allImplants = mockDb.getImplants().filter(i => i.isAvailable);
    setImplants(allImplants);

    // Load User profiles to match location
    const dbUsers = mockDb.getUsers();
    setDealersList(dbUsers.filter(u => u.role === 'dealer'));

    // Load Doctor's bookings
    const dbBookings = mockDb.getBookings();
    const doctorBookings = dbBookings.filter(b => b.doctorUsername === currentUser.username);
    setBookings(doctorBookings);

    // Check for running emergency broadcasts for this doctor
    const broadcasts = mockDb.getBroadcasts();
    const activeBc = broadcasts.find(
      (bc) => bc.doctorUsername === currentUser.username && bc.status === 'pending'
    );

    if (activeBc) {
      // If it hasn't expired yet
      if (new Date() < new Date(activeBc.expiresAt)) {
        if (!pendingBroadcast) {
          setPendingBroadcast(activeBc);
          audioAlert.playSonarPing(); // Play sonar signal
        }
        setMatchingDealersCount(activeBc.matchedDealers.length);
      } else {
        // Broadcast expired
        mockDb.checkAndExpireBroadcasts();
        setPendingBroadcast(null);
      }
    } else {
      setPendingBroadcast(null);
    }
  };

  useEffect(() => {
    loadData();

    // Poll to keep coordinates, countdowns, and order tracking synced in real-time
    const pollInterval = setInterval(() => {
      mockDb.checkAndExpireBroadcasts();
      loadData();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [currentUser, pendingBroadcast]);

  // Handle countdown clock ticking for emergency broadcast
  useEffect(() => {
    if (!pendingBroadcast) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(pendingBroadcast.expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setPendingBroadcast(null);
        mockDb.checkAndExpireBroadcasts();
        loadData();
        clearInterval(timer);
      } else {
        const min = Math.floor(diff / (1000 * 60));
        const sec = Math.floor((diff % (1000 * 60)) / 1000);
        setBroadcastTimer(`${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingBroadcast]);

  // Block screen if doctor is not verified yet
  if (currentUser && !currentUser.isVerified) {
    return (
      <div className="container" style={{ marginTop: '60px' }}>
        <div className="glass" style={{ padding: '56px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <ShieldAlert size={64} color="var(--status-warning)" style={{ marginBottom: '24px' }} />
          <h2 className="display-serif" style={{ fontSize: '32px', marginBottom: '16px' }}>
            Verification <em>Pending</em>
          </h2>
          <p style={{ color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '24px' }}>
            We've received your medical registration number (<strong>{currentUser.licenseNumber}</strong>) and document <strong>{currentUser.licenseDocument}</strong>. 
            An administrator is currently reviewing your registration against the State Medical Council Registry database.
          </p>
          <div className="badge badge-warning" style={{ padding: '8px 16px', borderRadius: '12px' }}>
            Status: Awaiting Admin Verification (24-Hour SLA)
          </div>
        </div>
      </div>
    );
  }

  // Filter Catalog Listings
  const filteredImplants = implants.filter((implant) => {
    const dealer = dealersList.find(d => d.username === implant.dealerUsername);
    if (!dealer || !dealer.lat || !dealer.lng) return false;

    // Calculate proximity distance
    const dist = getHaversineDistance(currentUser!.lat!, currentUser!.lng!, dealer.lat, dealer.lng);
    
    const matchesSearch = implant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          implant.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          implant.size.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || implant.type === selectedType;
    const matchesMaterial = selectedMaterial === 'all' || implant.material === selectedMaterial;
    const matchesProximity = dist <= maxDistance;

    return matchesSearch && matchesType && matchesMaterial && matchesProximity;
  });

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookError('');

    if (!caseId.trim() || !surgeryDate || !deliveryAddress.trim()) {
      setBookError('Please fill in all details.');
      return;
    }

    if (!caseId.toUpperCase().startsWith('CASE-')) {
      setBookError('Format Violation: Case Reference ID must start with "CASE-" (e.g. CASE-2026-X48).');
      return;
    }

    if (isEmergencyForm) {
      // Create emergency broadcast
      try {
        mockDb.createEmergencyBroadcast(
          selectedImplant!.type,
          selectedImplant!.size,
          currentUser!.username,
          currentUser!.lat!,
          currentUser!.lng!
        );
        setShowBookModal(false);
        setCaseId('');
        setIsEmergencyForm(false);
        loadData();
      } catch (err: any) {
        setBookError(err.message || 'Failed to trigger emergency broadcast.');
      }
    } else {
      // Create standard booking
      try {
        mockDb.createBooking({
          implantId: selectedImplant!.id,
          doctorUsername: currentUser!.username,
          dealerUsername: selectedImplant!.dealerUsername,
          surgeryDate,
          caseReferenceId: caseId.toUpperCase(),
        }, false);
        
        setShowBookModal(false);
        setCaseId('');
        setActiveTab('tracking');
        loadData();
      } catch (err: any) {
        setBookError(err.message || 'Failed to create booking.');
      }
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (!comment.trim()) {
      setReviewError('Please write a review comment.');
      return;
    }

    try {
      mockDb.addFeedback({
        bookingId: showReviewModal!.id,
        rating,
        comment,
        doctorUsername: currentUser!.username,
        dealerUsername: showReviewModal!.dealerUsername,
      });
      setShowReviewModal(null);
      setComment('');
      setRating(5);
      loadData();
    } catch (err: any) {
      setReviewError(err.message);
    }
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDisputeError('');
    if (!disputeNotes.trim()) {
      setDisputeError('Please describe the delivery problem.');
      return;
    }

    try {
      mockDb.fileDispute(showDisputeModal!.id, disputeNotes);
      setShowDisputeModal(null);
      setDisputeNotes('');
      loadData();
    } catch (err: any) {
      setDisputeError(err.message);
    }
  };

  return (
    <div className="container">
      {/* Title / Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '36px', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Doctor <em>Marketplace</em> Dashboard
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '15px' }}>
            Locate orthopedic implants in nearby warehouses, book standard surgeries, or toggle emergency broadcasts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Search & Source Implants
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          📋 Track Bookings ({bookings.length})
        </button>
      </div>

      {/* Emergency Mode Broadcast Dashboard (Overrides normal search view) */}
      {pendingBroadcast && (
        <div className="emergency-banner" style={{ border: '2px solid #FF5A5F' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div className="pulsing-badge" style={{ marginBottom: '16px' }}>
                <div className="pulsing-dot" />
                <span>Urgent Sourcing Active</span>
              </div>
              <h2 className="display-serif" style={{ fontSize: '32px', color: 'white', marginBottom: '8px' }}>
                Emergency Broadcast <em>Transmitting</em>
              </h2>
              <p style={{ color: 'var(--emergency-text-dim)', fontSize: '14px', marginBottom: '16px' }}>
                Broadcasting spec: <strong>{pendingBroadcast.implantType.toUpperCase().replace('_', ' ')} ({pendingBroadcast.size})</strong> to verified suppliers within 20km.
              </p>
              
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div className="glass" style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--emergency-text-dim)' }}>Notified Suppliers</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>{matchingDealersCount} Warehouses</div>
                </div>
                <div className="glass" style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--emergency-text-dim)' }}>Auto-Assignment Rule</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>First claim locks order</div>
                </div>
              </div>
            </div>

            {/* Timer Visual */}
            <div className="glass" style={{ background: 'rgba(0,0,0,0.3)', border: '2px solid #FF5A5F', padding: '24px 32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '160px' }}>
              <Clock size={32} color="#FF5A5F" style={{ marginBottom: '8px' }} />
              <span className="mono-data" style={{ fontSize: '36px', color: 'white', fontWeight: 700, lineHeight: 1 }}>
                {broadcastTimer}
              </span>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--emergency-text-dim)', marginTop: '8px', letterSpacing: '0.05em' }}>
                SLA Timeout
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '32px', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <span style={{ fontSize: '13px', color: 'var(--emergency-text-dim)' }}>
              📟 The system will notify you with audio cues the instant a dealer confirms dispatch. Do not close this browser window.
            </span>
            <button 
              className="btn btn-small"
              onClick={() => {
                if (confirm('Cancel this emergency request broadcast?')) {
                  const broadcasts = mockDb.getBroadcasts();
                  const idx = broadcasts.findIndex(b => b.id === pendingBroadcast.id);
                  if (idx !== -1) {
                    broadcasts[idx].status = 'expired';
                    mockDb.saveBroadcasts(broadcasts);
                    loadData();
                  }
                }
              }}
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)', color: 'white' }}
            >
              Cancel Broadcast
            </button>
          </div>
        </div>
      )}

      {/* Main Views */}
      {activeTab === 'search' ? (
        <div className="search-layout">
          
          {/* Filters Sidebar */}
          <aside className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>Filters</h3>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Search Keywords</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: '36px' }}
                  placeholder="Brand, size, or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <select className="form-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                <option value="all">All Implants</option>
                <option value="pedicle_screw">Pedicle Screw</option>
                <option value="locking_plate">Locking Plate</option>
                <option value="im_nail">IM Nail (Intramedullary)</option>
                <option value="cervical_plate">Cervical Plate</option>
                <option value="joint_replacement">Joint Replacement</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Material</label>
              <select className="form-select" value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)}>
                <option value="all">All Materials</option>
                <option value="Titanium">Titanium</option>
                <option value="Stainless Steel">Stainless Steel</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Proximity Radius: {maxDistance} km</label>
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="5" 
                className="form-input" 
                value={maxDistance} 
                onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                style={{ padding: 0 }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginTop: '6px' }}>
                Restricts to nearby dealer warehouses
              </span>
            </div>
          </aside>

          {/* Catalog Listing */}
          <main>
            {filteredImplants.length === 0 ? (
              <div className="glass" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-dim)' }}>
                <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '12px', display: 'block', margin: '0 auto' }} />
                <p>No available implants matching your filter criteria within {maxDistance}km.</p>
              </div>
            ) : (
              <div className="card-grid" style={{ margin: 0 }}>
                {filteredImplants.map((implant) => {
                  const dealer = dealersList.find(d => d.username === implant.dealerUsername);
                  const dist = getHaversineDistance(currentUser!.lat!, currentUser!.lng!, dealer!.lat!, dealer!.lng!);
                  
                  return (
                    <div key={implant.id} className="medico-card glass glass-interactive">
                      <span className="card-tag">Brand: {implant.brand}</span>
                      <h3 className="card-title" style={{ fontSize: '20px', lineHeight: '1.3', marginBottom: '8px' }}>
                        {implant.name}
                      </h3>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '12.5px', marginBottom: '20px' }}>
                        <MapPin size={13} color="var(--accent)" />
                        <span>{dist.toFixed(1)} km away ({dealer?.name})</span>
                      </div>

                      <ul className="card-list">
                        <li>
                          <span>Material</span>
                          <span>{implant.material}</span>
                        </li>
                        <li>
                          <span>Size / Spec</span>
                          <span className="mono-data">{implant.size}</span>
                        </li>
                        <li>
                          <span>Scheme</span>
                          <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700 }}>
                            {implant.transactionType}
                          </span>
                        </li>
                        <li>
                          <span>Traceable Batch</span>
                          <span className="mono-data">{implant.batchNumber}</span>
                        </li>
                        <li style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                          <span>Sourcing Rate</span>
                          <span style={{ fontSize: '16px', color: 'var(--accent)', fontWeight: 700 }}>
                            ₹{implant.price.toLocaleString('en-IN')}
                          </span>
                        </li>
                      </ul>

                      <button 
                        className="btn btn-solid" 
                        style={{ marginTop: '20px', width: '100%' }}
                        onClick={() => {
                          setSelectedImplant(implant);
                          setShowBookModal(true);
                        }}
                      >
                        Book for Surgery
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

        </div>
      ) : (
        /* Tracking / Booking Dashboard */
        <section className="glass" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '22px', marginBottom: '24px' }}>Placements & Order Tracking</h2>
          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
              <FileText size={48} style={{ opacity: 0.3, marginBottom: '12px', display: 'block', margin: '0 auto' }} />
              <p>You have not placed any surgery bookings yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {bookings.slice().reverse().map((booking) => {
                const implant = mockDb.getImplants().find(i => i.id === booking.implantId);
                const dealer = dealersList.find(d => d.username === booking.dealerUsername);
                
                return (
                  <div key={booking.id} className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', border: booking.disputed ? '1px solid var(--status-error)' : '1px solid var(--glass-border)' }}>
                    
                    {/* Header bar of order */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="mono-data" style={{ fontWeight: 700, fontSize: '15px' }}>{booking.caseReferenceId}</span>
                          {booking.isEmergency ? (
                            <span className="badge badge-error" style={{ fontSize: '9px' }}>Emergency</span>
                          ) : (
                            <span className="badge badge-neutral" style={{ fontSize: '9px' }}>Standard</span>
                          )}
                          {booking.disputed && (
                            <span className="badge badge-error" style={{ fontSize: '9px' }}>Disputed</span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                          Booking ID: <span className="mono-data">{booking.id}</span> | Placed: {new Date(booking.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{implant?.name || 'Implant Spec Booking'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                          Supplier: {dealer?.name || 'Awaiting Claim'} {dealer ? `(Phone: 9876543210)` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    {!booking.dealerUsername && booking.isEmergency ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-error)' }}>
                        <Zap size={16} className="pulsing-dot" />
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>Emergency Request Broadcasting to Suppliers...</span>
                      </div>
                    ) : (
                      <div>
                        <span className="form-label" style={{ marginBottom: '12px' }}>Fulfillment State Timeline</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 10px' }}>
                          
                          {/* Background line */}
                          <div style={{ position: 'absolute', top: '14px', left: '20px', right: '20px', height: '2px', backgroundColor: 'var(--glass-border)', zIndex: 1 }} />
                          
                          {/* Step 1: Requested */}
                          <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>1</div>
                            <span style={{ fontSize: '11px', marginTop: '6px', fontWeight: booking.status === 'requested' ? 700 : 'normal' }}>Requested</span>
                          </div>

                          {/* Step 2: Confirmed */}
                          <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div style={{ 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '50%', 
                              backgroundColor: ['confirmed', 'dispatched', 'delivered', 'returned'].includes(booking.status) ? 'var(--accent)' : 'var(--bg)', 
                              border: '1px solid var(--glass-border)',
                              color: ['confirmed', 'dispatched', 'delivered', 'returned'].includes(booking.status) ? 'white' : 'var(--text-dim)', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 
                            }}>2</div>
                            <span style={{ fontSize: '11px', marginTop: '6px', fontWeight: booking.status === 'confirmed' ? 700 : 'normal' }}>Confirmed</span>
                          </div>

                          {/* Step 3: Dispatched */}
                          <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div style={{ 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '50%', 
                              backgroundColor: ['dispatched', 'delivered', 'returned'].includes(booking.status) ? 'var(--accent)' : 'var(--bg)', 
                              border: '1px solid var(--glass-border)',
                              color: ['dispatched', 'delivered', 'returned'].includes(booking.status) ? 'white' : 'var(--text-dim)', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 
                            }}>3</div>
                            <span style={{ fontSize: '11px', marginTop: '6px', fontWeight: booking.status === 'dispatched' ? 700 : 'normal' }}>Dispatched</span>
                          </div>

                          {/* Step 4: Delivered */}
                          <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div style={{ 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '50%', 
                              backgroundColor: ['delivered', 'returned'].includes(booking.status) ? 'var(--status-success)' : 'var(--bg)', 
                              border: '1px solid var(--glass-border)',
                              color: ['delivered', 'returned'].includes(booking.status) ? 'white' : 'var(--text-dim)', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 
                            }}>4</div>
                            <span style={{ fontSize: '11px', marginTop: '6px', fontWeight: ['delivered', 'returned'].includes(booking.status) ? 700 : 'normal' }}>Delivered</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions and details footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                      <span className="mono-data" style={{ fontSize: '12px' }}>
                        Surgery Scheduled: {booking.surgeryDate}
                      </span>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Dispute file option */}
                        {!booking.disputed && ['confirmed', 'dispatched', 'delivered'].includes(booking.status) && (
                          <button 
                            className="btn btn-small"
                            onClick={() => setShowDisputeModal(booking)}
                            style={{ borderColor: 'var(--status-error)', color: 'var(--status-error)' }}
                          >
                            File Delivery Issue
                          </button>
                        )}
                        
                        {booking.disputed && (
                          <span className="badge badge-error" style={{ fontSize: '11px', padding: '6px 12px' }}>
                            Dispute Under Admin Review
                          </span>
                        )}

                        {/* Invoice & feedback actions (delivered / returned only) */}
                        {['delivered', 'returned'].includes(booking.status) && (
                          <>
                            <button 
                              className="btn btn-small"
                              onClick={() => alert(`Auto-Generated Invoice details:\n\nInvoice ID: INV-${booking.id}\nSurgical Case ID: ${booking.caseReferenceId}\nImplant: ${implant?.name}\nBatch No: ${implant?.batchNumber}\nPrice: ₹${implant?.price}\n\nInvoice saved to PDF. (Click print to download)`)}
                            >
                              <FileText size={12} /> View Invoice
                            </button>
                            <button 
                              className="btn btn-small btn-solid"
                              onClick={() => setShowReviewModal(booking)}
                            >
                              <MessageSquare size={12} /> Review Supplier
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Booking Form Modal */}
      {showBookModal && selectedImplant && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h3 className="display-serif" style={{ fontSize: '24px', marginBottom: '8px' }}>Surgery Booking Form</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '24px' }}>
              Reserve <strong>{selectedImplant.name}</strong> (Batch: {selectedImplant.batchNumber})
            </p>

            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label className="form-label">Surgical Case Reference ID (Mandatory)</label>
                <input 
                  type="text" 
                  className="form-input mono-data" 
                  placeholder="e.g. CASE-2026-X8342"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: 'var(--status-error)', display: 'block', marginTop: '6px' }}>
                  ⚠️ PRIVACY WARNING: Never enter patient names, MRNs, or identity details. Use anonymized IDs only.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Surgery Date</label>
                <ThemedDatePicker 
                  value={surgeryDate}
                  onChange={setSurgeryDate}
                  minDate="2026-08-24"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hospital OT Delivery Address</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>

              {/* Emergency Mode Sourcing Switch */}
              <div className="glass" style={{ padding: '16px', borderRadius: '12px', border: isEmergencyForm ? '2px solid #FF5A5F' : '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: isEmergencyForm ? 'rgba(255, 90, 95, 0.05)' : 'transparent' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={16} color={isEmergencyForm ? '#FF5A5F' : 'var(--text)'} />
                    <span style={{ fontWeight: 600, fontSize: '14px', color: isEmergencyForm ? '#FF5A5F' : 'var(--text)' }}>
                      Enable Emergency Broadcast
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
                    Broadcast to all suppliers within 20km for immediate response
                  </span>
                </div>
                <input 
                  type="checkbox" 
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  checked={isEmergencyForm}
                  onChange={(e) => setIsEmergencyForm(e.target.checked)}
                />
              </div>

              {bookError && (
                <div className="badge badge-error" style={{ display: 'flex', width: '100%', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px' }}>
                  <AlertTriangle size={16} style={{ marginRight: '8px' }} />
                  <span>{bookError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn" onClick={() => setShowBookModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-solid" style={{ backgroundColor: isEmergencyForm ? '#FF5A5F' : 'var(--accent)' }}>
                  {isEmergencyForm ? 'Broadcast Emergency' : 'Confirm Standard Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Write Feedback Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h3 className="display-serif" style={{ fontSize: '24px', marginBottom: '8px' }}>Rate & Review Supplier</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '24px' }}>
              For Surgical Case: <strong>{showReviewModal.caseReferenceId}</strong>
            </p>

            <form onSubmit={handleFeedbackSubmit}>
              <div className="form-group">
                <label className="form-label">Quality & Delivery Rating</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Star 
                        size={28} 
                        fill={star <= rating ? 'var(--accent)' : 'none'} 
                        color="var(--accent)"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Review Comments</label>
                <textarea 
                  className="form-textarea" 
                  rows={4}
                  placeholder="e.g. Sterile packaging was intact, delivery arrived 20 minutes before scheduled surgery."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {reviewError && (
                <div className="badge badge-error" style={{ display: 'flex', width: '100%', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px' }}>
                  <AlertCircle size={16} style={{ marginRight: '8px' }} />
                  <span>{reviewError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn" onClick={() => setShowReviewModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-solid">Save Review</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Dispute Modal */}
      {showDisputeModal && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ borderColor: 'var(--status-error)' }}>
            <h3 className="display-serif" style={{ fontSize: '24px', color: 'var(--status-error)', marginBottom: '8px' }}>
              File Surgical Delivery Dispute
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '24px' }}>
              This will lock further progress on Case <strong>{showDisputeModal.caseReferenceId}</strong> and alert the admin.
            </p>

            <form onSubmit={handleDisputeSubmit}>
              <div className="form-group">
                <label className="form-label">Dispute Details (What went wrong?)</label>
                <textarea 
                  className="form-textarea" 
                  rows={4}
                  placeholder="e.g. Incorrect screw lengths delivered; Sterile packaging seal was broken; Supplier failed to arrive on time."
                  value={disputeNotes}
                  onChange={(e) => setDisputeNotes(e.target.value)}
                />
              </div>

              {disputeError && (
                <div className="badge badge-error" style={{ display: 'flex', width: '100%', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px' }}>
                  <AlertCircle size={16} style={{ marginRight: '8px' }} />
                  <span>{disputeError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn" onClick={() => setShowDisputeModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-danger">File Dispute</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
