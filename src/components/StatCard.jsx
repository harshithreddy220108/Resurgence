export default function StatCard({ icon, label, value, change, changeType = 'neutral', accent = 'teal', delay = 0 }) {
    return (
        <div
            className={`stat-card ${accent} animate-fadein`}
            style={{ animationDelay: `${delay * 0.05}s`, opacity: 0 }}
        >
            <div className="stat-icon">{icon}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
            {change && (
                <div className={`stat-change ${changeType}`}>{change}</div>
            )}
        </div>
    );
}
