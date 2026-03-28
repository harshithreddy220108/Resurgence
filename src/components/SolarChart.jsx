import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-accent)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.8rem',
                boxShadow: 'var(--shadow-teal)',
            }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                <div style={{ color: 'var(--teal-400)', fontWeight: 700 }}>
                    {payload[0].value} kWh
                </div>
            </div>
        );
    }
    return null;
};

export default function SolarChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--teal-500)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--teal-500)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="time"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                    type="monotone"
                    dataKey="kwh"
                    stroke="var(--teal-400)"
                    strokeWidth={2.5}
                    fill="url(#solarGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: 'var(--teal-400)', strokeWidth: 0 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
