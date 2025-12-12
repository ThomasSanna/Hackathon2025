import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, ChevronDown, ChevronRight, Calendar, Users, Building, FileText, List } from 'lucide-react';

interface InfoPanelProps {
  frontmatter: {
    document_title?: string;
    document_type?: string;
    date?: string;
    authors?: string[];
    organizations?: string[];
    summary?: string;
    key_points?: string[];
    [key: string]: any;
  };
}

export default function InfoPanel({ frontmatter }: InfoPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    authors: true,
    key_points: false
  });

  useEffect(() => {
    // Listen to toggle button from Navbar
    const toggleBtn = document.getElementById('info-toggle');
    const handleToggle = () => setIsOpen(prev => !prev);
    
    if (toggleBtn) {
      toggleBtn.addEventListener('click', handleToggle);
    }

    return () => {
      if (toggleBtn) {
        toggleBtn.removeEventListener('click', handleToggle);
      }
    };
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Styles
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
    zIndex: 150,
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? 'auto' : 'none',
    transition: 'opacity 0.3s ease',
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    background: 'var(--bg-color)',
    boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
    zIndex: 200,
    transition: 'transform 0.3s ease-in-out, width 0.3s ease-in-out',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid rgba(0,0,0,0.1)',
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    width: isExpanded ? '600px' : '350px',
    maxWidth: '100vw',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid rgba(0,0,0,0.1)',
  };

  const btnStyle: React.CSSProperties = {
    padding: '0.5rem',
    borderRadius: '50%',
    color: 'var(--text-secondary)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  };

  const sectionBtnStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem',
    background: 'rgba(0,0,0,0.02)',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.2s',
    color: 'var(--text-secondary)',
  };

  return (
    <>
      <div style={overlayStyle} onClick={() => setIsOpen(false)} />

      <aside style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-color)', margin: 0 }}>
            Informations
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              style={btnStyle}
              title={isExpanded ? "Réduire" : "Agrandir"}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              style={btnStyle}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Title */}
          {frontmatter.document_title && (
            <div>
              <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                Titre
              </h3>
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500, margin: 0 }}>
                {frontmatter.document_title}
              </p>
            </div>
          )}

          {/* Type & Date */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             {frontmatter.document_type && (
                <div style={{ background: 'rgba(0,0,0,0.05)', padding: '0.25rem 0.625rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                   {frontmatter.document_type}
                </div>
             )}
             {frontmatter.date && (
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                 <Calendar size={14} />
                 <span>{formatDate(frontmatter.date)}</span>
               </div>
             )}
          </div>
          
          <hr style={{ border: 0, height: '1px', background: 'rgba(0,0,0,0.05)', margin: 0 }} />

          {/* Collapsible Sections Helper */}
          {[
            { id: 'authors', icon: Users, label: 'Auteurs', data: frontmatter.authors, isList: true },
            { id: 'organizations', icon: Building, label: 'Organisations', data: frontmatter.organizations, isList: true },
            { id: 'summary', icon: FileText, label: 'Résumé', data: frontmatter.summary, isList: false },
            { id: 'key_points', icon: List, label: 'Points Clés', data: frontmatter.key_points, isList: true, isKeyPoints: true }
          ].map(section => {
             const hasData = Array.isArray(section.data) ? section.data.length > 0 : !!section.data;
             if (!hasData) return null;

             const isSectionExpanded = expandedSections[section.id];
             
             return (
              <div key={section.id} style={{ border: '1px solid rgba(0,0,0,0.05)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                 <button 
                   onClick={() => toggleSection(section.id)}
                   style={sectionBtnStyle}
                   onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                   onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                 >
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                      <section.icon size={16} />
                      <span>{section.label}</span>
                   </div>
                   {isSectionExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                 </button>
                 
                 {isSectionExpanded && (
                   <div style={{ padding: '0.75rem', background: 'transparent' }}>
                     {section.isList ? (
                       <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                         {(section.data as string[]).map((item, i) => (
                           <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-primary)', display: section.isKeyPoints ? 'flex' : 'block', gap: '0.5rem' }}>
                             {section.isKeyPoints && <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>•</span>}
                             <span>{item}</span>
                           </li>
                         ))}
                       </ul>
                     ) : (
                       <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6 }}>
                         {section.data as string}
                       </p>
                     )}
                   </div>
                 )}
              </div>
             );
          })}

        </div>
      </aside>
    </>
  );
}
