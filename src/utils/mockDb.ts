// Mock Database Service using localStorage

export type Role = 'doctor' | 'dealer' | 'admin';

export interface User {
  username: string;
  role: Role;
  name: string;
  isVerified: boolean;
  licenseNumber?: string; // Wholesale license for dealers, medical registration for doctors
  licenseDocument?: string; // Mock file name or data URL
  address?: string;
  lat?: number;
  lng?: number;
}

export type ImplantType = 'pedicle_screw' | 'locking_plate' | 'im_nail' | 'cervical_plate' | 'joint_replacement';
export type Material = 'Titanium' | 'Stainless Steel';
export type TransactionType = 'sale' | 'rental';

export interface Implant {
  id: string;
  name: string;
  type: ImplantType;
  brand: string;
  material: Material;
  size: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  price: number;
  transactionType: TransactionType;
  dealerUsername: string;
  isAvailable: boolean;
}

export type BookingStatus = 'requested' | 'confirmed' | 'dispatched' | 'delivered' | 'returned';

export interface Booking {
  id: string;
  implantId: string;
  doctorUsername: string;
  dealerUsername: string;
  surgeryDate: string; // YYYY-MM-DD
  caseReferenceId: string; // Anonymized
  status: BookingStatus;
  isEmergency: boolean;
  createdAt: string;
  disputed?: boolean;
  disputeNotes?: string;
}

export interface Feedback {
  id: string;
  bookingId: string;
  rating: number; // 1-5
  comment: string;
  doctorUsername: string;
  dealerUsername: string;
  createdAt: string;
}

export interface EmergencyBroadcast {
  id: string;
  bookingId: string;
  implantType: ImplantType;
  size: string;
  doctorUsername: string;
  doctorLat: number;
  doctorLng: number;
  matchedDealers: string[]; // List of dealerUsernames
  claimedBy?: string; // Dealer who claimed it
  status: 'pending' | 'claimed' | 'expired';
  createdAt: string;
  expiresAt: string; // ISO string (5 minutes after creation)
}

// Haversine Distance Helper (calculates distance in km between two lat/lng coordinates)
export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

// Initial Mock Data
const DEFAULT_USERS: User[] = [
  {
    username: 'dr_ananya',
    role: 'doctor',
    name: 'Dr. Ananya Sharma',
    isVerified: true,
    licenseNumber: 'MCI-2015-87632',
    licenseDocument: 'medical_reg_sharma.pdf',
    address: 'KEM Hospital, Parel, Mumbai',
    lat: 19.0028,
    lng: 72.8421,
  },
  {
    username: 'dr_rahul',
    role: 'doctor',
    name: 'Dr. Rahul Mehta',
    isVerified: false,
    licenseNumber: 'MCI-2019-94821',
    licenseDocument: 'medical_reg_mehta.pdf',
    address: 'Fortis Hospital, Mulund, Mumbai',
    lat: 19.1726,
    lng: 72.9565,
  },
  {
    username: 'devesh_implants',
    role: 'dealer',
    name: 'Devesh Ortho Supplies',
    isVerified: true,
    licenseNumber: 'WDL-MH-82761B',
    licenseDocument: 'wholesale_license_devesh.pdf',
    address: 'Lamington Road, Grant Road, Mumbai',
    lat: 18.9612,
    lng: 72.8164, // ~6km from KEM Hospital
  },
  {
    username: 'apex_ortho',
    role: 'dealer',
    name: 'Apex Orthopedics Ltd',
    isVerified: true,
    licenseNumber: 'WDL-MH-12345C',
    licenseDocument: 'wholesale_license_apex.pdf',
    address: 'Bandra Kurla Complex, Bandra, Mumbai',
    lat: 19.0607,
    lng: 72.8644, // ~7.5km from KEM Hospital
  },
  {
    username: 'karan_supply',
    role: 'dealer',
    name: 'Karan Medical Distributors',
    isVerified: false,
    licenseNumber: 'WDL-MH-94816D',
    licenseDocument: 'wholesale_license_karan.pdf',
    address: 'GB Road, Thane',
    lat: 19.2183,
    lng: 72.9781, // >20km from KEM Hospital (~27km)
  },
  {
    username: 'admin',
    role: 'admin',
    name: 'Platform Admin',
    isVerified: true,
  },
];

// Helper to format date relative to current time for mock data (2026-08-23 is base)
const getRelativeDateString = (daysOffset: number): string => {
  const baseDate = new Date('2026-08-23T23:08:00');
  baseDate.setDate(baseDate.getDate() + daysOffset);
  return baseDate.toISOString().split('T')[0];
};

const DEFAULT_IMPLANTS: Implant[] = [
  {
    id: 'imp-1',
    name: 'Pedicle Screw Titanium 6.5mm x 45mm',
    type: 'pedicle_screw',
    brand: 'Stryker',
    material: 'Titanium',
    size: '6.5mm x 45mm',
    batchNumber: 'ST-2026-X83',
    expiryDate: getRelativeDateString(500), // Far in future
    price: 12000,
    transactionType: 'sale',
    dealerUsername: 'devesh_implants',
    isAvailable: true,
  },
  {
    id: 'imp-2',
    name: 'Locking Distal Femur Plate 8-Hole Left',
    type: 'locking_plate',
    brand: 'Synthes',
    material: 'Stainless Steel',
    size: '8-Hole (Left)',
    batchNumber: 'SY-2026-F98',
    expiryDate: getRelativeDateString(15), // Expiring in 15 days (Amber flag)
    price: 24000,
    transactionType: 'sale',
    dealerUsername: 'devesh_implants',
    isAvailable: true,
  },
  {
    id: 'imp-3',
    name: 'IM Nail Tibial 9mm x 320mm',
    type: 'im_nail',
    brand: 'Stryker',
    material: 'Titanium',
    size: '9mm x 320mm',
    batchNumber: 'ST-2025-N12',
    expiryDate: getRelativeDateString(-10), // Expired 10 days ago (Hidden/Deactivated)
    price: 15000,
    transactionType: 'rental',
    dealerUsername: 'apex_ortho',
    isAvailable: true,
  },
  {
    id: 'imp-4',
    name: 'Cervical Plate Titanium 4-Hole 22mm',
    type: 'cervical_plate',
    brand: 'Medtronic',
    material: 'Titanium',
    size: '4-Hole (22mm)',
    batchNumber: 'MD-2026-C04',
    expiryDate: getRelativeDateString(400),
    price: 8000,
    transactionType: 'rental',
    dealerUsername: 'apex_ortho',
    isAvailable: true,
  },
  {
    id: 'imp-5',
    name: 'Locking Proximal Humeral Plate 4-Hole',
    type: 'locking_plate',
    brand: 'Zimmer Biomet',
    material: 'Titanium',
    size: '4-Hole',
    batchNumber: 'ZB-2026-H09',
    expiryDate: getRelativeDateString(20), // Expiring in 20 days (Amber flag)
    price: 18000,
    transactionType: 'rental',
    dealerUsername: 'devesh_implants',
    isAvailable: true,
  },
  {
    id: 'imp-6',
    name: 'Total Knee Replacement Femoral Component Size 4',
    type: 'joint_replacement',
    brand: 'Zimmer Biomet',
    material: 'Titanium',
    size: 'Size 4',
    batchNumber: 'ZB-2026-K04',
    expiryDate: getRelativeDateString(700),
    price: 45000,
    transactionType: 'sale',
    dealerUsername: 'apex_ortho',
    isAvailable: true,
  },
];

const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: 'bk-1',
    implantId: 'imp-1',
    doctorUsername: 'dr_ananya',
    dealerUsername: 'devesh_implants',
    surgeryDate: getRelativeDateString(3),
    caseReferenceId: 'CASE-2026-9874A',
    status: 'confirmed',
    isEmergency: false,
    createdAt: new Date('2026-08-22T10:00:00').toISOString(),
  },
  {
    id: 'bk-2',
    implantId: 'imp-4',
    doctorUsername: 'dr_ananya',
    dealerUsername: 'apex_ortho',
    surgeryDate: getRelativeDateString(-5),
    caseReferenceId: 'CASE-2026-1104C',
    status: 'delivered',
    isEmergency: false,
    createdAt: new Date('2026-08-15T09:30:00').toISOString(),
  },
];

const DEFAULT_FEEDBACK: Feedback[] = [
  {
    id: 'fb-1',
    bookingId: 'bk-2',
    rating: 5,
    comment: 'Implant delivered in pristine sterile packaging directly to OT on time. Recommended dealer.',
    doctorUsername: 'dr_ananya',
    dealerUsername: 'apex_ortho',
    createdAt: new Date('2026-08-19T14:20:00').toISOString(),
  },
];

// Initialize DB if not present
const getTable = <T>(key: string, defaultData: T[]): T[] => {
  const data = localStorage.getItem(`medico_${key}`);
  if (!data) {
    localStorage.setItem(`medico_${key}`, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
};

const saveTable = <T>(key: string, data: T[]): void => {
  localStorage.setItem(`medico_${key}`, JSON.stringify(data));
};

export const mockDb = {
  // Users
  getUsers: (): User[] => getTable('users', DEFAULT_USERS),
  saveUsers: (users: User[]): void => saveTable('users', users),
  
  // Implants
  getImplants: (): Implant[] => {
    const implants = getTable('implants', DEFAULT_IMPLANTS);
    // Auto-deactivate/check expiry helper:
    // Implants with expiry date <= today are flagged isAvailable = false
    const todayStr = new Date('2026-08-23T23:08:00').toISOString().split('T')[0];
    let changed = false;
    const checked = implants.map((imp) => {
      if (imp.expiryDate <= todayStr && imp.isAvailable) {
        changed = true;
        return { ...imp, isAvailable: false };
      }
      return imp;
    });
    if (changed) {
      saveTable('implants', checked);
      return checked;
    }
    return implants;
  },
  saveImplants: (implants: Implant[]): void => saveTable('implants', implants),
  
  // Bookings
  getBookings: (): Booking[] => getTable('bookings', DEFAULT_BOOKINGS),
  saveBookings: (bookings: Booking[]): void => saveTable('bookings', bookings),
  
  // Feedback
  getFeedback: (): Feedback[] => getTable('feedback', DEFAULT_FEEDBACK),
  saveFeedback: (feedback: Feedback[]): void => saveTable('feedback', feedback),
  
  // Broadcasts
  getBroadcasts: (): EmergencyBroadcast[] => getTable('broadcasts', []),
  saveBroadcasts: (broadcasts: EmergencyBroadcast[]): void => saveTable('broadcasts', broadcasts),

  // Custom DB Methods
  addImplant: (implant: Omit<Implant, 'id'>): Implant => {
    const implants = mockDb.getImplants();
    const newImplant = {
      ...implant,
      id: `imp-${Date.now()}`,
    };
    implants.push(newImplant);
    mockDb.saveImplants(implants);
    return newImplant;
  },

  updateImplant: (id: string, updatedData: Partial<Implant>): Implant => {
    const implants = mockDb.getImplants();
    const idx = implants.findIndex((imp) => imp.id === id);
    if (idx === -1) throw new Error('Implant not found');
    const updated = { ...implants[idx], ...updatedData };
    implants[idx] = updated;
    mockDb.saveImplants(implants);
    return updated;
  },

  deleteImplant: (id: string): void => {
    const implants = mockDb.getImplants();
    const filtered = implants.filter((imp) => imp.id !== id);
    mockDb.saveImplants(filtered);
  },

  createBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status' | 'isEmergency'>, isEmergency = false): Booking => {
    const bookings = mockDb.getBookings();
    const newBooking: Booking = {
      ...booking,
      id: `bk-${Date.now()}`,
      status: 'requested',
      isEmergency,
      createdAt: new Date().toISOString(),
    };
    bookings.push(newBooking);
    mockDb.saveBookings(bookings);
    return newBooking;
  },

  updateBookingStatus: (id: string, status: BookingStatus): Booking => {
    const bookings = mockDb.getBookings();
    const idx = bookings.findIndex((bk) => bk.id === id);
    if (idx === -1) throw new Error('Booking not found');
    
    // Status machine validator (requested -> confirmed -> dispatched -> delivered -> returned)
    const current = bookings[idx].status;
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      requested: ['confirmed'],
      confirmed: ['dispatched'],
      dispatched: ['delivered'],
      delivered: ['returned'],
      returned: [],
    };
    
    const allowed = validTransitions[current];
    if (!allowed.includes(status) && status !== current) {
      throw new Error(`Invalid status transition from ${current} to ${status}`);
    }
    
    bookings[idx].status = status;
    mockDb.saveBookings(bookings);
    return bookings[idx];
  },

  fileDispute: (id: string, notes: string): Booking => {
    const bookings = mockDb.getBookings();
    const idx = bookings.findIndex((bk) => bk.id === id);
    if (idx === -1) throw new Error('Booking not found');
    bookings[idx].disputed = true;
    bookings[idx].disputeNotes = notes;
    mockDb.saveBookings(bookings);
    return bookings[idx];
  },

  resolveDispute: (id: string): Booking => {
    const bookings = mockDb.getBookings();
    const idx = bookings.findIndex((bk) => bk.id === id);
    if (idx === -1) throw new Error('Booking not found');
    bookings[idx].disputed = false;
    mockDb.saveBookings(bookings);
    return bookings[idx];
  },

  addFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt'>): Feedback => {
    const feedbacks = mockDb.getFeedback();
    // Validate booking is delivered/returned
    const bookings = mockDb.getBookings();
    const bk = bookings.find((b) => b.id === feedback.bookingId);
    if (!bk) throw new Error('Booking not found');
    if (bk.status !== 'delivered' && bk.status !== 'returned') {
      throw new Error('Feedback can only be submitted on completed bookings.');
    }
    
    const newFeedback = {
      ...feedback,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    feedbacks.push(newFeedback);
    mockDb.saveFeedback(feedbacks);
    return newFeedback;
  },

  // Geolocation queries: returns nearby dealers (<20km) who list a specific implant type
  findNearbyDealersForImplant: (
    implantType: ImplantType,
    doctorLat: number,
    doctorLng: number,
    size?: string
  ): { dealer: User; distanceKm: number; matchedImplants: Implant[] }[] => {
    const users = mockDb.getUsers();
    const implants = mockDb.getImplants();
    const activeDealers = users.filter((u) => u.role === 'dealer' && u.isVerified && u.lat && u.lng);
    
    const matches: { dealer: User; distanceKm: number; matchedImplants: Implant[] }[] = [];
    
    activeDealers.forEach((dealer) => {
      const distance = getHaversineDistance(doctorLat, doctorLng, dealer.lat!, dealer.lng!);
      // Rules: Broadcast default limit 20km
      if (distance <= 20) {
        const dealerImplants = implants.filter(
          (imp) =>
            imp.dealerUsername === dealer.username &&
            imp.type === implantType &&
            imp.isAvailable &&
            (!size || imp.size.toLowerCase().includes(size.toLowerCase()))
        );
        
        if (dealerImplants.length > 0) {
          matches.push({
            dealer,
            distanceKm: parseFloat(distance.toFixed(2)),
            matchedImplants: dealerImplants,
          });
        }
      }
    });
    
    return matches.sort((a, b) => a.distanceKm - b.distanceKm);
  },

  // Creates an emergency broadcast
  createEmergencyBroadcast: (
    implantType: ImplantType,
    size: string,
    doctorUsername: string,
    doctorLat: number,
    doctorLng: number
  ): EmergencyBroadcast => {
    const matches = mockDb.findNearbyDealersForImplant(implantType, doctorLat, doctorLng, size);
    const dealerUsernames = matches.map((m) => m.dealer.username);
    
    const broadcasts = mockDb.getBroadcasts();
    
    // Create booking first
    // Note: To bypass normal flow, we find the first available matched implant and reserve it temporarily.
    // If multiple dealers have it, the claim locks the exact implant.
    const mockImplant = matches[0]?.matchedImplants[0];
    const implantId = mockImplant ? mockImplant.id : 'imp-emergency-generic';
    
    const bookings = mockDb.getBookings();
    const newBooking: Booking = {
      id: `bk-em-${Date.now()}`,
      implantId,
      doctorUsername,
      dealerUsername: '', // Will be assigned on claim
      surgeryDate: getRelativeDateString(0), // Today
      caseReferenceId: `CASE-EM-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'requested',
      isEmergency: true,
      createdAt: new Date().toISOString(),
    };
    bookings.push(newBooking);
    mockDb.saveBookings(bookings);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes timeout

    const newBroadcast: EmergencyBroadcast = {
      id: `bc-${Date.now()}`,
      bookingId: newBooking.id,
      implantType,
      size,
      doctorUsername,
      doctorLat,
      doctorLng,
      matchedDealers: dealerUsernames,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    broadcasts.push(newBroadcast);
    mockDb.saveBroadcasts(broadcasts);
    return newBroadcast;
  },

  // Claim emergency booking with database simulation transaction lock
  claimEmergencyBroadcast: (broadcastId: string, dealerUsername: string): { booking: Booking; broadcast: EmergencyBroadcast } => {
    const broadcasts = mockDb.getBroadcasts();
    const bookings = mockDb.getBookings();
    
    const bcIdx = broadcasts.findIndex((b) => b.id === broadcastId);
    if (bcIdx === -1) throw new Error('Broadcast not found');
    
    const broadcast = broadcasts[bcIdx];
    if (broadcast.status !== 'pending') {
      throw new Error(`This emergency request has already been ${broadcast.status}`);
    }
    
    const expiresDate = new Date(broadcast.expiresAt);
    if (new Date() > expiresDate) {
      broadcast.status = 'expired';
      mockDb.saveBroadcasts(broadcasts);
      throw new Error('This emergency request has expired (5-minute timeout).');
    }
    
    // Simulate transaction-level locking (select_for_update):
    // Check if the booking already has a dealer username. If so, someone claimed it already!
    const bkIdx = bookings.findIndex((bk) => bk.id === broadcast.bookingId);
    if (bkIdx === -1) throw new Error('Booking not found');
    
    const booking = bookings[bkIdx];
    if (booking.dealerUsername) {
      throw new Error('This emergency request has already been claimed by another dealer.');
    }
    
    // Success claim! Assign dealer
    booking.dealerUsername = dealerUsername;
    booking.status = 'confirmed';
    
    // Update broadcast
    broadcast.claimedBy = dealerUsername;
    broadcast.status = 'claimed';
    
    // Update matching implant to point to the dealer's actual implant if generic was used
    if (booking.implantId === 'imp-emergency-generic') {
      const implants = mockDb.getImplants();
      const match = implants.find((imp) => imp.dealerUsername === dealerUsername && imp.type === broadcast.implantType);
      if (match) {
        booking.implantId = match.id;
      }
    }
    
    // Save tables
    mockDb.saveBookings(bookings);
    mockDb.saveBroadcasts(broadcasts);
    
    return { booking, broadcast };
  },

  // Expire pending broadcasts older than 5 minutes
  checkAndExpireBroadcasts: (): void => {
    const broadcasts = mockDb.getBroadcasts();
    const bookings = mockDb.getBookings();
    let changed = false;
    
    broadcasts.forEach((bc) => {
      if (bc.status === 'pending' && new Date() > new Date(bc.expiresAt)) {
        bc.status = 'expired';
        const bk = bookings.find((b) => b.id === bc.bookingId);
        if (bk && bk.status === 'requested') {
          bk.status = 'returned'; // Simulates failed/cancelled order due to timeout
        }
        changed = true;
      }
    });
    
    if (changed) {
      mockDb.saveBroadcasts(broadcasts);
      mockDb.saveBookings(bookings);
    }
  },
};
