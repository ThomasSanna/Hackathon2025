import React, { useState, useEffect } from "react";

interface FloatingControlsProps {
  children: React.ReactNode;
}

export default function FloatingControls({ children }: FloatingControlsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and not at top
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={`floating-controls ${isVisible ? "visible" : "hidden"}`}
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        display: "flex",
        gap: "1rem",
        zIndex: 1000,
        transition: "transform 0.3s ease, opacity 0.3s ease",
        transform: isVisible ? "translateY(0)" : "translateY(100px)",
        opacity: isVisible ? 1 : 0,
        alignItems: "center",
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}
