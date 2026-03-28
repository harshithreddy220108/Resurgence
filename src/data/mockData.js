// ============================================================
// Mock Data for Q-Trade Demo
// ============================================================

export const mockUser = {
    id: 'u001',
    name: 'Alex Johnson',
    email: 'alex.johnson@qtrade.com',
    role: 'both',
    location: { lat: 37.774929, lng: -122.419418 },
    avatarInitials: 'AJ',
};

export const mockWallet = {
    energyCredits: 248.5,
    kwhAvailable: 18.4,
    kwhConsumed: 142.3,
    totalEarned: 1204.80,
    totalSpent: 398.20,
};

export const solarForecastData = [
    { time: '06:00', kwh: 0.2 },
    { time: '07:00', kwh: 0.8 },
    { time: '08:00', kwh: 1.9 },
    { time: '09:00', kwh: 3.1 },
    { time: '10:00', kwh: 4.2 },
    { time: '11:00', kwh: 5.0 },
    { time: '12:00', kwh: 5.4 },
    { time: '13:00', kwh: 5.2 },
    { time: '14:00', kwh: 4.8 },
    { time: '15:00', kwh: 3.9 },
    { time: '16:00', kwh: 2.7 },
    { time: '17:00', kwh: 1.4 },
    { time: '18:00', kwh: 0.4 },
    { time: '19:00', kwh: 0.0 },
];

export const mockTransactions = [
    {
        id: 'tx001',
        date: '2026-03-05',
        time: '14:32',
        type: 'sell',
        counterparty: 'Maria Chen',
        kwh: 4.5,
        pricePerKwh: 0.12,
        total: 0.54,
        status: 'matched',
        distance: '0.3 mi',
    },
    {
        id: 'tx002',
        date: '2026-03-05',
        time: '11:18',
        type: 'buy',
        counterparty: 'David Kim',
        kwh: 2.2,
        pricePerKwh: 0.10,
        total: 0.22,
        status: 'matched',
        distance: '0.1 mi',
    },
    {
        id: 'tx003',
        date: '2026-03-04',
        time: '16:45',
        type: 'sell',
        counterparty: 'Sarah Lee',
        kwh: 6.0,
        pricePerKwh: 0.11,
        total: 0.66,
        status: 'matched',
        distance: '0.5 mi',
    },
    {
        id: 'tx004',
        date: '2026-03-04',
        time: '09:20',
        type: 'buy',
        counterparty: 'James Park',
        kwh: 1.8,
        pricePerKwh: 0.09,
        total: 0.16,
        status: 'matched',
        distance: '0.2 mi',
    },
    {
        id: 'tx005',
        date: '2026-03-03',
        time: '13:55',
        type: 'sell',
        counterparty: 'Pending',
        kwh: 3.3,
        pricePerKwh: 0.12,
        total: 0.40,
        status: 'pending',
        distance: '—',
    },
];

export const mockListings = [
    { id: 'L001', user: 'Alex Johnson', type: 'sell', kwh: 4.5, price: 0.12, status: 'pending', location: '37.775°N', time: '14:00' },
    { id: 'L002', user: 'Maria Chen', type: 'buy', kwh: 3.0, price: 0.13, status: 'pending', location: '37.776°N', time: '13:30' },
    { id: 'L003', user: 'David Kim', type: 'sell', kwh: 7.2, price: 0.10, status: 'matched', location: '37.774°N', time: '11:00' },
    { id: 'L004', user: 'Sarah Lee', type: 'buy', kwh: 2.1, price: 0.11, status: 'matched', location: '37.773°N', time: '10:45' },
    { id: 'L005', user: 'James Park', type: 'sell', kwh: 5.5, price: 0.09, status: 'pending', location: '37.777°N', time: '09:15' },
    { id: 'L006', user: 'Emily Wong', type: 'buy', kwh: 4.0, price: 0.12, status: 'pending', location: '37.772°N', time: '08:30' },
];

export const mockMatchResults = [
    { id: 'M001', seller: 'David Kim', buyer: 'Sarah Lee', kwh: 2.1, price: 0.105, distance: '0.1 mi', savings: '$0.04', co2: '0.94 kg' },
    { id: 'M002', seller: 'Alex Johnson', buyer: 'Maria Chen', kwh: 3.0, price: 0.12, distance: '0.3 mi', savings: '$0.09', co2: '1.35 kg' },
    { id: 'M003', seller: 'James Park', buyer: 'Emily Wong', kwh: 4.0, price: 0.105, distance: '0.5 mi', savings: '$0.06', co2: '1.80 kg' },
];

export const mockUsers = [
    { id: 'u001', name: 'Alex Johnson', role: 'both', kwh: 18.4, credits: 248.5, trades: 12, joined: '2026-01-10', status: 'active' },
    { id: 'u002', name: 'Maria Chen', role: 'buyer', kwh: 0, credits: 320.0, trades: 8, joined: '2026-01-15', status: 'active' },
    { id: 'u003', name: 'David Kim', role: 'seller', kwh: 24.1, credits: 180.5, trades: 15, joined: '2026-01-20', status: 'active' },
    { id: 'u004', name: 'Sarah Lee', role: 'buyer', kwh: 0, credits: 95.0, trades: 5, joined: '2026-02-01', status: 'active' },
    { id: 'u005', name: 'James Park', role: 'seller', kwh: 11.8, credits: 410.0, trades: 20, joined: '2026-02-05', status: 'active' },
    { id: 'u006', name: 'Emily Wong', role: 'both', kwh: 9.3, credits: 155.0, trades: 9, joined: '2026-02-14', status: 'inactive' },
];

export const communityEnergyData = [
    { day: 'Mon', generated: 42, consumed: 31, traded: 18 },
    { day: 'Tue', generated: 38, consumed: 35, traded: 14 },
    { day: 'Wed', generated: 55, consumed: 40, traded: 22 },
    { day: 'Thu', generated: 47, consumed: 38, traded: 19 },
    { day: 'Fri', generated: 60, consumed: 42, traded: 28 },
    { day: 'Sat', generated: 72, consumed: 35, traded: 34 },
    { day: 'Sun', generated: 68, consumed: 30, traded: 31 },
];
