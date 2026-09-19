import { useState, useEffect, useCallback, useRef } from 'react';
import './TouristAttractionCarousel.css';

const attractions = [
  {
    id: 'santorini',
    name: 'Santorini',
    country: 'Greece',
    description: 'Stunning views, charming villages,\nunforgettable moments.',
    dayImage: '/images/attractions/santorini-day.jpg',
    nightImage: '/images/attractions/santorini-night.jpg'
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    description: 'Experience iconic landmarks, beautiful streets,\nand unforgettable evenings.',
    dayImage: '/images/attractions/paris-day.jpg',
    nightImage: '/images/attractions/paris-night.jpg'
  },
  {
    id: 'venice',
    name: 'Venice',
    country: 'Italy',
    description: 'Navigate the historic Grand Canal in a gondola,\nsurrounded by vibrant architecture.',
    dayImage: '/images/attractions/venice-day.jpg',
    nightImage: '/images/attractions/venice-night.jpg'
  },
  {
    id: 'swiss-alps',
    name: 'Swiss Alps',
    country: 'Switzerland',
    description: 'Breathe in the crisp mountain air\nin picturesque snowy villages.',
    dayImage: '/images/attractions/swiss-alps-day.jpg',
    nightImage: '/images/attractions/swiss-alps-night.jpg'
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    description: 'Wander through serene temples, ancient shrines,\nand vibrant traditional streets.',
    dayImage: '/images/attractions/kyoto-day.jpg',
    nightImage: '/images/attractions/kyoto-night.jpg'
  }
];

export default function TouristAttractionCarousel({ theme = 'light' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % attractions.length);
    }, 6000); // 6 seconds per slide
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % attractions.length);
    startTimer();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? attractions.length - 1 : prev - 1));
    startTimer();
  };

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
    startTimer();
  };

  return (
    <div className="tourist-carousel">
      {/* Background slide images */}
      <div className="tourist-carousel__slides">
        {attractions.map((attr, index) => {
          const isActive = index === currentIndex;
          const imageSrc = theme === 'dark' ? attr.nightImage : attr.dayImage;
          
          return (
            <div 
              key={attr.id} 
              className={`tourist-carousel__slide ${isActive ? 'active' : ''}`}
              aria-hidden={!isActive}
            >
              <img 
                src={imageSrc} 
                alt={`${attr.name}, ${attr.country}`} 
                className="tourist-carousel__image" 
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}
      </div>

      {/* Local contrast gradient mask in bottom left */}
      <div className="tourist-carousel__contrast-mask" aria-hidden="true"></div>

      {/* Transparent Frosted Glass Card enclosing destination details & small pictures preview */}
      <div className="tourist-carousel__bottom-block">
        <div className="tourist-carousel__glass-card">
          {/* Active destination details */}
          <div className="tourist-carousel__location-info">
            <div className="tourist-carousel__place-header">
              <svg className="tourist-carousel__pin-icon" width="22" height="22" viewBox="0 0 24 24" fill="#38bdf8" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span className="tourist-carousel__place-title">
                <span className="place-name">{attractions[currentIndex].name}</span>, <span className="place-country">{attractions[currentIndex].country}</span>
              </span>
            </div>
            <p className="tourist-carousel__description">
              {attractions[currentIndex].description}
            </p>
          </div>

          {/* Thumbnails row with flanking arrows */}
          <div className="tourist-carousel__controls-row">
            <button 
              type="button"
              className="tourist-carousel__nav-arrow" 
              onClick={handlePrev} 
              aria-label="Previous destination"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <div className="tourist-carousel__thumbnails-strip">
              {attractions.map((attr, index) => {
                const isActive = index === currentIndex;
                const thumbSrc = theme === 'dark' ? attr.nightImage : attr.dayImage;
                return (
                  <button
                    type="button"
                    key={`thumb-${attr.id}`}
                    className={`tourist-carousel__thumbnail ${isActive ? 'active' : ''}`}
                    onClick={() => handleThumbnailClick(index)}
                    aria-label={`View ${attr.name}`}
                    aria-current={isActive ? 'true' : 'false'}
                  >
                    <img src={thumbSrc} alt="" className="tourist-carousel__thumb-img" />
                  </button>
                );
              })}
            </div>

            <button 
              type="button"
              className="tourist-carousel__nav-arrow" 
              onClick={handleNext} 
              aria-label="Next destination"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          {/* Indicators underneath thumbnails */}
          <div className="tourist-carousel__indicators-row">
            {attractions.map((_, index) => (
              <button
                type="button"
                key={`dot-${index}`}
                className={`tourist-carousel__indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(index)}
                aria-label={`Slide ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : 'false'}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
