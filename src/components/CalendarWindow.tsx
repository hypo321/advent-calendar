import React, { useState, useEffect } from 'react';
import { CalendarWindow as CalendarWindowType } from '../types';
import { BACKGROUND_IMAGE_URL } from '../constants';
import { canOpenDoor, getOpeningDateMessage } from '../utils';
import { DayContent } from './DayContent';

interface Props {
  window: CalendarWindowType;
  onWindowClick: (day: number) => void;
  onWindowClose: (day: number) => void;
  day: string | null; // Add day prop to check if zoomed in
}

export const CalendarWindow: React.FC<Props> = ({
  window,
  onWindowClick,
  onWindowClose,
  day,
}) => {
  const [showMessage, setShowMessage] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const backgroundStyle = {
    backgroundImage: `url("${BACKGROUND_IMAGE_URL}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transform: `translate(${-window.x}px, ${-window.y}px)`,
    width: '100vw',
    height: '100vh',
    position: 'absolute' as const,
    top: '0',
    left: '0',
    transformOrigin: '0 0',
  };

  const handleBackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Door back clicked for window:', window.day);
    onWindowClose(window.day);
  };

  useEffect(() => {
    if (!day) {
      // Reset state when zooming out
      setIsShaking(false);
      // Start fade out when zooming out
      if (showMessage) {
        setIsFadingOut(true);
        const timer = setTimeout(() => {
          setShowMessage(false);
          setIsFadingOut(false);
        }, 300); // Match the fadeOut animation duration
        return () => clearTimeout(timer);
      }
    }
  }, [day, showMessage]);

  // Handle content visibility with door animation timing
  useEffect(() => {
    if (window.isOpen) {
      setShowContent(true);
    } else {
      // Wait for door closing animation to complete
      const timer = setTimeout(() => {
        setShowContent(false);
      }, 300); // Match the door closing animation duration
      return () => clearTimeout(timer);
    }
  }, [window.isOpen]);

  return (
    <div 
      className="calendar-window absolute pointer-events-auto" 
      style={{ 
        perspective: '1000px',
        left: `${window.x}px`,
        top: `${window.y}px`,
        width: window.width,
        height: window.height,
        willChange: 'transform',
      }}
    >
      <div 
        className={`door ${window.isOpen ? 'open' : ''} ${!canOpenDoor(window.day) ? 'locked' : ''} ${isShaking ? 'shake' : ''}`}
        style={{ 
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        <div
          className="door-front"
          onClick={(e) => {
            e.stopPropagation();
            const isZoomedIn = !!day; 
            if (isZoomedIn && !canOpenDoor(window.day)) {
              setIsFadingOut(false);
              setIsShaking(true);
              setShowMessage(true);
              setTimeout(() => setIsShaking(false), 820); // Animation duration + small buffer
              return;
            }
            onWindowClick(window.day);
          }}
        >
          <div className="door-front-image" style={backgroundStyle} />
          <div className="door-number">{window.day}</div>
          {showMessage && !canOpenDoor(window.day) && (
            <div className={`date-message ${isFadingOut ? 'fade-out' : ''}`}>
              {getOpeningDateMessage(window.day)}
            </div>
          )}
        </div>
        <div
          className="door-back"
          onClick={handleBackClick}
          style={{
            position: 'absolute',
            inset: '0',
            cursor: 'pointer',
            transform: 'rotateY(180deg)',
            backgroundColor: window.isOpen ? 'rgba(255, 0, 0, 0.3)' : undefined, // Debug color
            zIndex: 10,
            backfaceVisibility: 'hidden',
          }}
        />
      </div>
      <div 
        className="content-behind"
      >
        {/* Always show thumbnail when door is open */}
        {showContent && (
          <img
            src={window.imageUrl}
            alt={`Day ${window.day} content`}
          />
        )}
        {/* Show high quality content only when zoomed in and door is open */}
        <DayContent 
          day={window.day} 
          isVisible={showContent && !!day}
        />
      </div>
    </div>
  );
};
