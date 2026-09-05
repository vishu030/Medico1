import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Zap, PackageCheck, CheckCircle2, Stethoscope, Briefcase, ShieldAlert, ArrowRight, Play, RefreshCw } from 'lucide-react';
import { audioAlert } from '../utils/audioAlert';

interface VisitPageProps {
  onGoToPortal: () => void;
}

export const VisitPage: React.FC<VisitPageProps> = ({ onGoToPortal }) => {
  // Interactive Simulator State
  const [simState, setSimState] = useState<'idle' | 'broadcasting' | 'claimed' | 'dispatched'>('idle');
  const [countdown, setCountdown] = useState(300); // 5 mins in seconds
  const [activeTab, setActiveTab] = useState<'doctor' | 'dealer' | 'admin'>('doctor');

  useEffect(() => {
    let timer: any;
    if (simState === 'broadcasting') {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setSimState('idle');
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [simState]);

  const startSim = () => {
    audioAlert.playSonarPing();
    setSimState('broadcasting');
    setCountdown(300);

    // Auto-claim after 3 seconds for interactive demo feel
    setTimeout(() => {
      setSimState('claimed');
      audioAlert.playSonarPing();
      setTimeout(() => {
        setSimState('dispatched');
      }, 2500);
    }, 3500);
  };

  const resetSim = () => {
    setSimState('idle');
    setCountdown(300);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      
      {/* Hero Section */}
      <section className="glass" style={{ padding: '60px 48px', borderRadius: '28px', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '820px' }}>
          
          <div className="badge badge-accent" style={{ marginBottom: '20px', padding: '6px 14px', borderRadius: '20px' }}>
            <Activity size={14} style={{ marginRight: '4px' }} /> Next-Gen Orthopedic Sourcing Network
          </div>

          <h1 style={{ fontSize: '48px', lineHeight: '1.15', letterSpacing: '-0.03em', marginBottom: '20px' }}>
            Emergency Orthopedic <em>Implant</em> Sourcing & Surgical Marketplace
          </h1>

          <p style={{ fontSize: '18px', color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '36px' }}>
            Medico bridges the gap between surgeons and certified orthopedic distributors in real-time. 
            Powered by <strong>20km geofenced GPS proximity matching</strong>, <strong>5-minute emergency broadcast SLAs</strong>, 
            and <strong>100% Medical Council credential verification</strong>.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-solid" style={{ padding: '14px 28px', fontSize: '16px' }} onClick={onGoToPortal}>
              <span>Launch Demo Portal / Log In</span>
              <ArrowRight size={18} />
            </button>
            <a href="#how-it-works" className="btn" style={{ padding: '14px 28px', fontSize: '16px' }}>
              Explore Platform Features
            </a>
          </div>
        </div>
      </section>

      {/* Metrics Spec Frame */}
      <div className="spec-frame" style={{ marginBottom: '60px' }}>
        <div className="spec-item">
          <div className="spec-label">Emergency SLA</div>
          <div className="spec-val">&lt; 5 <em>Mins</em></div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>Auto-dispatch Broadcast SLA</div>
        </div>
        <div className="spec-item">
          <div className="spec-label">Geofence Radius</div>
          <div className="spec-val">20 <em>km</em></div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>Haversine Hospital Proximity</div>
        </div>
        <div className="spec-item">
          <div className="spec-label">Regulatory Audit</div>
          <div className="spec-val">100% <em>Verified</em></div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>MCI & Wholesale License Queue</div>
        </div>
        <div className="spec-item">
          <div className="spec-label">Safety Standards</div>
          <div className="spec-val">ISO <em>13485</em></div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>Batch & Expiry Traceability</div>
        </div>
      </div>

      {/* What is Medico Section */}
      <section style={{ marginBottom: '60px' }}>
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px' }}>
          <h2 style={{ fontSize: '36px', marginBottom: '12px' }}>
            What is <em>Medico</em>?
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '16px', lineHeight: '1.6' }}>
            Traditional orthopedic implant ordering relies on manual phone calls, paperwork, and delays during emergency intra-operative shortages. 
            Medico digitizes the entire supply chain into an emergency-ready, compliance-first marketplace.
          </p>
        </div>

        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          
          <div className="medico-card glass glass-interactive">
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(125, 64, 71, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Zap size={24} color="var(--accent)" />
            </div>
            <h3 className="card-title" style={{ fontSize: '22px' }}>Intra-Op Sourcing</h3>
            <p className="card-desc">
              When an unexpected implant size or component requirement arises mid-surgery, surgeons trigger a 20km radius broadcast to nearby suppliers for instant fulfillment.
            </p>
            <ul className="card-list">
              <li><span>Siren Notification</span><span>Instant Dual-Tone</span></li>
              <li><span>Order Lock</span><span>1-Click Claim</span></li>
            </ul>
          </div>

          <div className="medico-card glass glass-interactive">
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(45, 106, 79, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <ShieldCheck size={24} color="var(--status-success)" />
            </div>
            <h3 className="card-title" style={{ fontSize: '22px' }}>Verified Credentials</h3>
            <p className="card-desc">
              Strict platform security prevents unverified trading. Surgeons submit Medical Council numbers, and distributors submit Wholesale Device Licenses (WDL) for admin audit.
            </p>
            <ul className="card-list">
              <li><span>Surgeon Verification</span><span>State Medical Council</span></li>
              <li><span>Distributor Audit</span><span>FDA / CDSCO WDL</span></li>
            </ul>
          </div>

          <div className="medico-card glass glass-interactive">
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(217, 119, 6, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <PackageCheck size={24} color="var(--status-warning)" />
            </div>
            <h3 className="card-title" style={{ fontSize: '22px' }}>Sterile Batch Traceability</h3>
            <p className="card-desc">
              Every implant batch is tracked by expiration date. Items expiring within 30 days are flagged with amber alerts, and expired lots are automatically deactivated.
            </p>
            <ul className="card-list">
              <li><span>Batch Expiry Check</span><span>Automated Guard</span></li>
              <li><span>Case Anonymization</span><span>CASE-2026 Reference</span></li>
            </ul>
          </div>

        </div>
      </section>

      {/* Interactive Emergency Broadcast Simulator */}
      <section id="how-it-works" className="emergency-banner" style={{ marginBottom: '60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
          <div>
            <div className="pulsing-badge" style={{ marginBottom: '16px' }}>
              <div className="pulsing-dot" />
              <span>Interactive Live Demo Simulator</span>
            </div>
            <h2 className="display-serif" style={{ fontSize: '32px', color: 'white', marginBottom: '8px' }}>
              Experience the <em>5-Minute Emergency Broadcast</em>
            </h2>
            <p style={{ color: 'var(--emergency-text-dim)', fontSize: '15px', maxWidth: '600px' }}>
              Test how Medico notifies nearby warehouses during emergency surgery implant shortages.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {simState === 'idle' ? (
              <button className="btn btn-solid" style={{ backgroundColor: '#FF5A5F', padding: '12px 24px' }} onClick={startSim}>
                <Play size={16} /> Simulate Emergency Broadcast
              </button>
            ) : (
              <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }} onClick={resetSim}>
                <RefreshCw size={16} /> Reset Simulation
              </button>
            )}
          </div>
        </div>

        {/* Simulator Content Display */}
        <div className="glass" style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '32px', borderRadius: '24px' }}>
          {simState === 'idle' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <Zap size={48} color="#FF5A5F" style={{ opacity: 0.6, marginBottom: '16px' }} />
              <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '8px' }}>Simulator Ready</h3>
              <p style={{ color: 'var(--emergency-text-dim)', fontSize: '14px' }}>
                Click "Simulate Emergency Broadcast" to initiate a mock intra-operative implant request for <strong>Pedicle Screw Titanium 6.5mm</strong>.
              </p>
            </div>
          )}

          {simState === 'broadcasting' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <span style={{ color: '#FF5A5F', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>
                    📡 Transmitting Signal...
                  </span>
                  <h3 style={{ color: 'white', fontSize: '24px', marginTop: '4px' }}>Broadcasting to 2 Warehouses within 20km</h3>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#FF5A5F', fontFamily: 'IBM Plex Mono' }}>
                  {formatTime(countdown)}
                </div>
              </div>

              <div className="timeline">
                <div className="timeline-item timeline-active">
                  <div className="timeline-marker"></div>
                  <span className="timeline-time">10:40:02 AM</span>
                  <div className="timeline-title" style={{ color: 'white' }}>Doctor @dr_ananya triggered broadcast</div>
                  <div className="timeline-desc" style={{ color: 'var(--emergency-text-dim)' }}>Implant: Pedicle Screw 6.5mm x 45mm | OT 3 KEM Hospital</div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker" style={{ backgroundColor: 'gray' }}></div>
                  <span className="timeline-time">Awaiting Dealer Claim...</span>
                  <div className="timeline-title" style={{ color: 'rgba(255,255,255,0.5)' }}>Geofenced alert ringing at Devesh Ortho & Apex Ortho</div>
                </div>
              </div>
            </div>
          )}

          {simState === 'claimed' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--status-success)' }}>
                <CheckCircle2 size={28} />
                <h3 style={{ color: 'white', fontSize: '24px' }}>Broadcast Claimed by Devesh Ortho Supplies!</h3>
              </div>
              <p style={{ color: 'var(--emergency-text-dim)', fontSize: '14px', marginBottom: '20px' }}>
                Distance: 5.8 km | Driver dispatched via Express Medical Courier.
              </p>
              <div className="badge badge-success" style={{ padding: '8px 16px', borderRadius: '12px' }}>
                Claim Locked · Order Status: Confirmed & Preparing Dispatch
              </div>
            </div>
          )}

          {simState === 'dispatched' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#4ADE80' }}>
                <PackageCheck size={28} />
                <h3 style={{ color: 'white', fontSize: '24px' }}>En Route to OT 3 (KEM Hospital)</h3>
              </div>
              <p style={{ color: 'var(--emergency-text-dim)', fontSize: '14px', marginBottom: '20px' }}>
                Estimated OT Arrival: 14 mins | Sterile Batch No: ST-2026-X83
              </p>
              <button className="btn btn-solid" style={{ backgroundColor: '#2D6A4F', color: 'white' }} onClick={resetSim}>
                Simulation Complete — Try Again
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Role Breakdown Tabs */}
      <section className="glass" style={{ padding: '40px', borderRadius: '24px', marginBottom: '60px' }}>
        <h2 style={{ fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>
          Designed for <em>Every Stakeholder</em>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '15px', marginBottom: '32px' }}>
          Explore how Medico serves surgeons, implant distributors, and platform administrators.
        </p>

        <div className="tabs" style={{ justifyContent: 'center', marginBottom: '32px' }}>
          <button 
            className={`tab-btn ${activeTab === 'doctor' ? 'active' : ''}`}
            onClick={() => setActiveTab('doctor')}
          >
            <Stethoscope size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Surgeons & Doctors
          </button>
          <button 
            className={`tab-btn ${activeTab === 'dealer' ? 'active' : ''}`}
            onClick={() => setActiveTab('dealer')}
          >
            <Briefcase size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Implant Dealers
          </button>
          <button 
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <ShieldAlert size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Administrators & Regulators
          </button>
        </div>

        {activeTab === 'doctor' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>Doctor / Surgeon Portal</h3>
              <p style={{ color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '20px' }}>
                Surgeons can browse verified implants, filter by material and precise millimeter sizing, check proximity distance to hospital OT, and book implants for scheduled or emergency cases.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <CheckCircle2 size={16} color="var(--status-success)" /> Search titanium & stainless steel plates, screws, nails
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <CheckCircle2 size={16} color="var(--status-success)" /> Proximity radius filter (5km - 50km)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <CheckCircle2 size={16} color="var(--status-success)" /> Anonymized patient reference IDs (`CASE-2026-X94`)
                </li>
              </ul>
            </div>
            <div className="glass" style={{ padding: '24px', background: 'rgba(255,255,255,0.4)' }}>
              <span className="mono-text" style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Demo Credential</span>
              <h4 style={{ fontSize: '18px' }}>Dr. Ananya Sharma (Doctor)</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>MCI License: MCI-2015-87632 | Location: KEM Hospital, Mumbai</p>
              <button className="btn btn-small btn-solid" style={{ marginTop: '16px' }} onClick={onGoToPortal}>Log In As Doctor</button>
            </div>
          </div>
        )}

        {activeTab === 'dealer' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>Implant Dealer & Distributor Portal</h3>
              <p style={{ color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '20px' }}>
                Distributors upload wholesale inventory, track expiring batches, receive real-time emergency broadcast sirens, and lock order claims instantly.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <CheckCircle2 size={16} color="var(--status-success)" /> Dynamic batch number & expiry date validation
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <CheckCircle2 size={16} color="var(--status-success)" /> Dual-tone emergency siren audio alerts
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <CheckCircle2 size={16} color="var(--status-success)" /> Select-for-update transaction locking
                </li>
              </ul>
            </div>
            <div className="glass" style={{ padding: '24px', background: 'rgba(255,255,255,0.4)' }}>
              <span className="mono-text" style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Demo Credential</span>
              <h4 style={{ fontSize: '18px' }}>Devesh Ortho Supplies (Dealer)</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>WDL License: WDL-MH-82761B | Warehouse: Grant Road, Mumbai</p>
              <button className="btn btn-small btn-solid" style={{ marginTop: '16px' }} onClick={onGoToPortal}>Log In As Dealer</button>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>Platform Control & Governance</h3>
              <p style={{ color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '20px' }}>
                Platform admins audit registration certificates, approve/reject doctor and dealer credentials, resolve transaction disputes, and oversee global order streams.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <CheckCircle2 size={16} color="var(--status-success)" /> Credential verification queue & approval flow
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <CheckCircle2 size={16} color="var(--status-success)" /> Order delivery dispute resolution engine
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <CheckCircle2 size={16} color="var(--status-success)" /> Global transaction & emergency broadcast audit log
                </li>
              </ul>
            </div>
            <div className="glass" style={{ padding: '24px', background: 'rgba(255,255,255,0.4)' }}>
              <span className="mono-text" style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Demo Credential</span>
              <h4 style={{ fontSize: '18px' }}>Platform Administrator</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>System Control Panel | Regulatory Governance</p>
              <button className="btn btn-small btn-solid" style={{ marginTop: '16px' }} onClick={onGoToPortal}>Log In As Admin</button>
            </div>
          </div>
        )}
      </section>

      {/* Call to Action Footer Banner */}
      <section className="glass" style={{ padding: '48px', textAlign: 'center', borderRadius: '24px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '12px' }}>
          Ready to Explore <em>Medico</em>?
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '15px', marginBottom: '28px', maxWidth: '560px', margin: '0 auto 28px' }}>
          Access the live portal demo with pre-loaded verified accounts, active surgical inventories, and test broadcast alerts.
        </p>
        <button className="btn btn-solid" style={{ padding: '14px 32px', fontSize: '16px' }} onClick={onGoToPortal}>
          <span>Enter Medico Marketplace Portal</span>
          <ArrowRight size={18} />
        </button>
      </section>

    </div>
  );
};
