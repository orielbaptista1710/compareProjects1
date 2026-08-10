// src/pages/PropertyPage/PropertyPageComponents/StickyTabBar.jsx
import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const StickyTabBar = React.memo(({ activeTab, onTabClick, tabs }) => {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const btn = bar.querySelector('.pp-tab-btn--active');
    if (btn) {
      bar.scrollTo({
        left: btn.offsetLeft - bar.clientWidth / 2 + btn.offsetWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [activeTab]);

  const scroll = (dir) =>
    barRef.current?.scrollBy({ left: dir * 160, behavior: 'smooth' });

  return (
    <div className="pp-tab-wrapper">
      <button className="pp-tab-chevron" onClick={() => scroll(-1)} aria-label="Scroll tabs left">
        <ChevronLeft size={14} />
      </button>
      <nav className="pp-tab-bar" ref={barRef}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`pp-tab-btn${activeTab === t.id ? ' pp-tab-btn--active' : ''}`}
            onClick={() => onTabClick(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <button className="pp-tab-chevron" onClick={() => scroll(1)} aria-label="Scroll tabs right">
        <ChevronRight size={14} />
      </button>
    </div>
  );
});

StickyTabBar.displayName = 'StickyTabBar';

export default StickyTabBar;