import React, { useState, useMemo } from "react";
import { useProgressStore, type BookStats } from "../../stores/progressStore";
import { usePersonnalisationStore } from "../../stores/personnalisationStore";
import { 
  LayoutGrid, 
  List, 
  Clock, 
  Search, 
  Filter, 
  BookOpen, 
  Star, 
  MoreVertical,
  Calendar,
  User,
  ChevronRight,
  TrendingUp,
  FileText
} from "lucide-react";

interface BaseDocument {
  id: string;
  title: string;
  authors: string[];
  date: string;
  summary: string;
  imageUrl?: string;
  rawDate?: string; // for sorting
}

interface EnrichedDocument extends BaseDocument {
  progress?: BookStats;
}

interface LibraryManagerProps {
  documents: BaseDocument[];
}

type ViewMode = "grid" | "list";
type FilterType = "all" | "favorites" | "recent" | "unread";
type SortType = "recent" | "title" | "date" | "progress";

export default function LibraryManager({ documents }: LibraryManagerProps) {
  const theme = usePersonnalisationStore((state) => state.theme);
  const { books, toggleFavorite, getFormattedTime } = useProgressStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("recent");
  const [search, setSearch] = useState("");

  // Enrich documents with progress data
  const enrichedDocs = useMemo(() => {
    return documents.map(doc => ({
      ...doc,
      progress: books[doc.id]
    }));
  }, [documents, books]);

  // Filter and Sort Logic
  const filteredDocs = useMemo(() => {
    let docs = [...enrichedDocs];

    // Search
    if (search) {
      const q = search.toLowerCase();
      docs = docs.filter(
        d => 
          d.title.toLowerCase().includes(q) || 
          d.authors.some(a => a.toLowerCase().includes(q)) ||
          d.id.toLowerCase().includes(q)
      );
    }

    // Filter
    if (filter === "favorites") {
      docs = docs.filter(d => d.progress?.isFavorite);
    } else if (filter === "recent") {
      docs = docs.filter(d => d.progress?.lastRead);
    } else if (filter === "unread") {
      docs = docs.filter(d => !d.progress || d.progress.progress === 0);
    }

    // Sort
    docs.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "date") {
        // Try parsing rawDate (usually YYYY) or fallback
        const dateA = parseInt(a.rawDate || "0") || 0;
        const dateB = parseInt(b.rawDate || "0") || 0;
        return dateB - dateA;
      }
      if (sort === "progress") {
        return (b.progress?.progress || 0) - (a.progress?.progress || 0);
      }
      // default: recent (reading activity)
      return (b.progress?.lastRead || 0) - (a.progress?.lastRead || 0);
    });

    return docs;
  }, [enrichedDocs, search, filter, sort]);

  // Styles
  const primaryColor = "var(--bleu-logo)";
  const userTheme = theme;

  const SidebarItem = ({ id, icon: Icon, label }: { id: FilterType, icon: any, label: string }) => (
    <button
      onClick={() => setFilter(id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "10px 16px",
        borderRadius: "8px",
        border: "none",
        background: filter === id ? `${primaryColor}15` : "transparent",
        color: filter === id ? primaryColor : "var(--text-secondary)",
        cursor: "pointer",
        fontSize: "0.95rem",
        fontWeight: filter === id ? 600 : 400,
        transition: "all 0.2s ease",
        marginBottom: "4px"
      }}
    >
      <Icon size={18} strokeWidth={filter === id ? 2.5 : 2} />
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", maxWidth: "1600px", margin: "0 auto" }}>
      
      {/* Sidebar */}
      <div style={{ 
        width: "260px", 
        padding: "2rem 1.5rem", 
        borderRight: "1px solid var(--border-color)",
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-secondary)"
      }}>
        <div style={{ marginBottom: "2.5rem", paddingLeft: "0.5rem" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            <FileText className="text-blue-600" />
            Library
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <SidebarItem id="all" icon={LayoutGrid} label="Tous les documents" />
          <SidebarItem id="recent" icon={Clock} label="Récemment ouverts" />
          <SidebarItem id="favorites" icon={Star} label="Favoris" />
          <SidebarItem id="unread" icon={BookOpen} label="À lire" />
        </div>

        <div style={{ marginTop: "auto" }}>
          <div style={{ 
            padding: "1rem", 
            background: "linear-gradient(135deg, var(--bleu-logo) 0%, #0000a0 100%)",
            borderRadius: "12px",
            color: "white"
          }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>Lecture en cours</p>
            <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.9 }}>
              {Object.values(books).length} documents commencés
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "2rem 3rem", overflowY: "auto" }}>
        
        {/* Header Toolbar */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0 }}>
              {filter === "all" ? "Tous les documents" : 
               filter === "favorites" ? "Favoris" : 
               filter === "recent" ? "Récents" : "À lire"}
              <span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text-secondary)", marginLeft: "12px", opacity: 0.7 }}>
                ({filteredDocs.length})
              </span>
            </h1>
            
            <div style={{ display: "flex", gap: "8px", background: "var(--bg-secondary)", padding: "4px", borderRadius: "8px" }}>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "none",
                  background: viewMode === "grid" ? "white" : "transparent",
                  boxShadow: viewMode === "grid" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                  color: viewMode === "grid" ? "var(--text-primary)" : "var(--text-secondary)",
                  cursor: "pointer"
                }}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "none",
                  background: viewMode === "list" ? "white" : "transparent",
                  boxShadow: viewMode === "list" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                  color: viewMode === "list" ? "var(--text-primary)" : "var(--text-secondary)",
                  cursor: "pointer"
                }}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input 
                type="text" 
                placeholder="Rechercher un document, un auteur..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 42px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-input, white)",
                  fontSize: "0.95rem",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
              />
            </div>

            <div style={{ position: "relative", minWidth: "180px" }}>
              <select 
                value={sort} 
                onChange={(e) => setSort(e.target.value as SortType)}
                style={{
                  width: "100%",
                  padding: "12px 36px 12px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  appearance: "none",
                  background: "white",
                  fontSize: "0.9rem",
                  cursor: "pointer"
                }}
              >
                <option value="recent">Récemment lu</option>
                <option value="title">Titre (A-Z)</option>
                <option value="date">Date de publication</option>
                <option value="progress">Progression</option>
              </select>
              <TrendingUp size={16} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-secondary)" }} />
            </div>
          </div>
        </div>

        {/* Content Grid/List */}
        {filteredDocs.length > 0 ? (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(280px, 1fr))" : "1fr",
            gap: "1.5rem"
          }}>
            {filteredDocs.map((doc) => (
              <a 
                key={doc.id} 
                href={`/reader/${doc.id}`}
                style={{ 
                  textDecoration: "none",
                  color: "inherit",
                  display: "block"
                }}
              >
                <div style={{
                  background: "var(--bg-card, white)",
                  borderRadius: "16px",
                  border: "1px solid var(--border-color)",
                  overflow: "hidden",
                  transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  height: "100%",
                  display: viewMode === "list" ? "flex" : "block",
                  alignItems: viewMode === "list" ? "center" : "normal",
                  position: "relative"
                }}
                className="hover-card"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px -8px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
                >
                  {/* Progress Bar Top - only visible if started */}
                  {doc.progress && doc.progress.progress > 0 && (
                     <div style={{ 
                       height: "4px", 
                       width: "100%", 
                       background: "#f0f0f0",
                       position: viewMode === "list" ? "absolute" : "relative",
                       bottom: viewMode === "list" ? 0 : "auto",
                     }}>
                        <div style={{ 
                          height: "100%", 
                          width: `${doc.progress.progress}%`, 
                          background: "var(--bleu-logo)",
                          borderRadius: "0 2px 2px 0"
                        }} />
                     </div>
                  )}

                  <div style={{ 
                    padding: viewMode === "list" ? "0" : "0", 
                    height: viewMode === "grid" ? "160px" : "80px",
                    width: viewMode === "list" ? "80px" : "auto",
                    background: doc.imageUrl ? `url(${doc.imageUrl}) center/cover` : "linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    {!doc.imageUrl && (
                      <span style={{ fontSize: "2rem", fontWeight: 700, color: "var(--bleu-logo)", opacity: 0.3 }}>
                         {doc.title.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div style={{ padding: "1.25rem", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, lineHeight: 1.4, color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {doc.title}
                      </h3>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(doc.id);
                        }}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: doc.progress?.isFavorite ? "#fbbf24" : "var(--text-tertiary)" }}
                      >
                        <Star size={18} fill={doc.progress?.isFavorite ? "#fbbf24" : "none"} />
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                       {/* Authors */}
                       {doc.authors && doc.authors.length > 0 && (
                         <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                           <User size={14} />
                           <span>{doc.authors.join(", ")}</span>
                         </div>
                       )}
                       
                       {/* Date */}
                       {doc.date && (
                         <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                           <Calendar size={14} />
                           <span>{doc.date}</span>
                         </div>
                       )}

                       {/* Stats */}
                       {doc.progress && (doc.progress.progress > 0 || doc.progress.timeSpent > 0) && (
                         <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px", fontSize: "0.8rem", fontWeight: 500 }}>
                           {doc.progress.progress > 0 && (
                             <span style={{ color: "var(--bleu-logo)" }}>{Math.round(doc.progress.progress)}% lu</span>
                           )}
                           {doc.progress.timeSpent > 0 && (
                             <span style={{ color: "var(--text-tertiary)" }}>{getFormattedTime(doc.progress.timeSpent)}</span>
                           )}
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
            <p>Aucun document ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}
