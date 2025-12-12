import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ImageDetailsData {
  src: string;
  alt: string;
  description?: string;
}

export default function ImageDetails() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ImageDetailsData | null>(null);

  useEffect(() => {
    const handleOpen = (event: CustomEvent<ImageDetailsData>) => {
      setData(event.detail);
      setIsOpen(true);
    };

    window.addEventListener('open-image-details' as any, handleOpen);
    return () => window.removeEventListener('open-image-details' as any, handleOpen);
  }, []);

  if (!isOpen || !data) return null;

  return createPortal(
    <div className="image-details-overlay" onClick={() => setIsOpen(false)}>
      <div className="image-details-modal" onClick={e => e.stopPropagation()}>
        <button className="image-details-close" onClick={() => setIsOpen(false)}>✕</button>
        <div className="image-details-content">
          <div className="image-container">
            <img src={data.src} alt={data.alt} />
          </div>
          <div className="image-info">
            <h3>Description de l'image</h3>
            <div className="image-description">
              {data.description ? (
                data.description.split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))
              ) : (
                <p>{data.alt || "Aucune description disponible."}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .image-details-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 1rem;
          backdrop-filter: blur(5px);
        }
        .image-details-modal {
          background: white;
          border-radius: 12px;
          max-width: 1000px;
          width: 100%;
          height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .image-details-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: background 0.2s;
        }
        .image-details-close:hover {
          background: rgba(0, 0, 0, 0.8);
        }
        .image-details-content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .image-container {
          background: #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          flex: 1;
          min-height: 0; /* Important for flexbox scrolling */
        }
        .image-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .image-info {
          padding: 1.5rem;
          background: white;
          border-top: 1px solid #e5e7eb;
          max-height: 40%;
          overflow-y: auto;
        }
        .image-info h3 {
          margin-top: 0;
          color: #111827;
          font-size: 1.25rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        .image-description p {
          color: #374151;
          line-height: 1.6;
          font-size: 1rem;
          margin-bottom: 0.75rem;
        }
        
        @media (min-width: 768px) {
           .image-details-content {
              flex-direction: row;
           }
           .image-container {
              flex: 2;
              height: 100%;
           }
           .image-info {
              flex: 1;
              max-width: 400px;
              border-top: none;
              border-left: 1px solid #e5e7eb;
              height: 100%;
              max-height: none;
           }
        }
      `}</style>
    </div>,
    document.body
  );
}
