// ── Q-Trade Auth Utility (localStorage-based, Phase 1 frontend-only) ─────────
//    Phase 2 will replace this with real JWT + FastAPI backend.
// ─────────────────────────────────────────────────────────────────────────────

const USERS_KEY = 'qtrade_users';
const SESSION_KEY = 'qtrade_session';

// Minimal obfuscation (NOT real security — swapped in Phase 2 for bcrypt/JWT)
const encode = (str) => btoa(encodeURIComponent(str));
const matches = (plain, encoded) => encode(plain) === encoded;

// ── Social provider mock data ────────────────────────────────────────────────
const SOCIAL_USERS = {
    google: { name: 'Demo Google User', email: 'demo.google@gmail.com', avatar: 'https://lh3.googleusercontent.com/a/default-user' },
    github: { name: 'Demo GitHub User', email: 'demo.github@github.com', avatar: '' },
    apple: { name: 'Demo Apple User', email: 'demo.apple@icloud.com', avatar: '' },
};

/** Social OAuth mock — Phase 2 will replace with real provider redirect */
export function socialLogin(provider) {
    const meta = SOCIAL_USERS[provider];
    if (!meta) return { ok: false, error: 'Unknown provider.' };
    const users = getUsers();
    let user = users.find(u => u.email === meta.email);
    if (!user) {
        const result = register({ name: meta.name, email: meta.email, password: `${provider}_oauth_${Date.now()}`, phone: '', countryCode: '+1', role: 'user' });
        if (!result.ok) return result;
        user = result.user;
    }
    const session = { userId: user.id, role: user.role, loginAt: Date.now(), provider };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, user };
}


// ── User store helpers ───────────────────────────────────────────────────────
function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
}
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Register a new user. Returns { ok, error } */
export function register({ name, email, password, phone, countryCode, role = 'user' }) {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { ok: false, error: 'An account with this email already exists.' };
    }
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password: encode(password),
        phone,
        countryCode,
        role,                // 'user' | 'admin'
        bio: '',
        joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        createdAt: Date.now(),
        // Solar / prefs stored separately via profile page
    };
    users.push(newUser);
    saveUsers(users);
    return { ok: true, user: newUser };
}

/** Login. Returns { ok, user, error } */
export function login(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { ok: false, error: 'No account found with this email.' };
    if (!matches(password, user.password)) return { ok: false, error: 'Incorrect password.' };
    const session = { userId: user.id, role: user.role, loginAt: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, user };
}

/** Get current logged-in user (or null) */
export function getCurrentUser() {
    try {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (!session) return null;
        const users = getUsers();
        return users.find(u => u.id === session.userId) || null;
    } catch { return null; }
}

/** Logout */
export function logout() {
    localStorage.removeItem(SESSION_KEY);
}

/** Update user fields. Requires currentPassword if changing email or password. */
export function updateUser(userId, updates, currentPassword = null) {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return { ok: false, error: 'User not found.' };

    const user = users[idx];

    // If changing sensitive fields, verify current password first
    if ((updates.email && updates.email !== user.email) ||
        (updates.password)) {
        if (!currentPassword) return { ok: false, error: 'Current password required to change email or password.' };
        if (!matches(currentPassword, user.password)) return { ok: false, error: 'Current password is incorrect.' };
    }

    // If new email given, check no duplicate
    if (updates.email && updates.email !== user.email) {
        const duplicate = users.find((u, i) => i !== idx && u.email.toLowerCase() === updates.email.toLowerCase());
        if (duplicate) return { ok: false, error: 'That email is already used by another account.' };
    }

    const encoded = updates.password ? encode(updates.password) : user.password;
    users[idx] = { ...user, ...updates, password: encoded };
    saveUsers(users);
    return { ok: true, user: users[idx] };
}

/** Seed a demo user if no users exist yet */
export function seedDemoUser() {
    const users = getUsers();
    if (users.length === 0) {
        register({
            name: 'Alex Johnson',
            email: 'alex@neighborhood.com',
            password: 'demo1234',
            phone: '555 234-5678',
            countryCode: '+1',
            role: 'user',
        });
        register({
            name: 'Admin User',
            email: 'admin@neighborhood.com',
            password: 'admin1234',
            phone: '555 000-0001',
            countryCode: '+1',
            role: 'admin',
        });
    }
}
