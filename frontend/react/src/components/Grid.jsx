import React from 'react';
import './Grid.css';

const destinations = [
    {
        id: 1,
        title: 'Iceland',
        image: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=2659&auto=format&fit=crop',
        subtitle: 'Northern Lights'
    },
    {
        id: 2,
        title: 'Kyoto',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2670&auto=format&fit=crop',
        subtitle: 'Ancient Temples'
    },
    {
        id: 3,
        title: 'Swiss Alps',
        image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2670&auto=format&fit=crop',
        subtitle: 'Mountain Peaks'
    },
    {
        id: 4,
        title: 'Bali',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2676&auto=format&fit=crop',
        subtitle: 'Tropical Paradise'
    }
];

export default function Grid() {
    return (
        <section className="grid-section">
            <div className="container">
                <div className="grid-header">
                    <h2>Popular Destinations</h2>
                    <p>Explore our most visited locations.</p>
                </div>

                <div className="destination-grid">
                    {destinations.map((dest) => (
                        <div key={dest.id} className="card">
                            <div className="card-image-wrapper">
                                <img src={dest.image} alt={dest.title} loading="lazy" />
                                <div className="card-overlay">
                                    <span>Explore</span>
                                </div>
                            </div>
                            <div className="card-content">
                                <h3>{dest.title}</h3>
                                <p>{dest.subtitle}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
