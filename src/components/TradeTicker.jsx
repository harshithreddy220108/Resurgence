import { useEffect, useRef } from 'react';
import './TradeTicker.css';

const tickerItems = [
    { seller: 'David Kim', buyer: 'Sarah Lee', kwh: 2.1, price: 0.105, distance: '0.1 mi', time: '14:32' },
    { seller: 'Alex Johnson', buyer: 'Maria Chen', kwh: 3.0, price: 0.12, distance: '0.3 mi', time: '14:18' },
    { seller: 'James Park', buyer: 'Emily Wong', kwh: 4.0, price: 0.105, distance: '0.5 mi', time: '13:55' },
    { seller: 'David Kim', buyer: 'Maria Chen', kwh: 1.8, price: 0.10, distance: '0.2 mi', time: '13:30' },
    { seller: 'James Park', buyer: 'Sarah Lee', kwh: 2.5, price: 0.11, distance: '0.4 mi', time: '12:47' },
    { seller: 'Emily Wong', buyer: 'Alex Johnson', kwh: 1.2, price: 0.09, distance: '0.6 mi', time: '12:10' },
    { seller: 'Alex Johnson', buyer: 'Sarah Lee', kwh: 5.0, price: 0.12, distance: '0.3 mi', time: '11:58' },
    { seller: 'David Kim', buyer: 'Emily Wong', kwh: 3.3, price: 0.108, distance: '0.4 mi', time: '11:22' },
];

function TickerItem({ item }) {
    return (
        <span className="ticker-item">
            <span className="ticker-dot">⚡</span>
            <span className="ticker-seller">{item.seller}</span>
            <span className="ticker-arrow">→</span>
            <span className="ticker-buyer">{item.buyer}</span>
            <span className="ticker-sep">·</span>
            <span className="ticker-kwh">{item.kwh} kWh</span>
            <span className="ticker-sep">·</span>
            <span className="ticker-price">${item.price}/kWh</span>
            <span className="ticker-sep">·</span>
            <span className="ticker-dist">📍 {item.distance}</span>
            <span className="ticker-sep">·</span>
            <span className="ticker-time">{item.time}</span>
            <span className="ticker-divider" />
        </span>
    );
}

export default function TradeTicker() {
    // Duplicate items for seamless infinite scroll
    const items = [...tickerItems, ...tickerItems];

    return (
        <div className="trade-ticker">
            <div className="ticker-label">
                <span className="ticker-live-dot" />
                LIVE TRADES
            </div>
            <div className="ticker-track-wrap">
                <div className="ticker-track">
                    {items.map((item, i) => (
                        <TickerItem key={i} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
}
