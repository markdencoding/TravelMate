import { useState, useEffect, useCallback, useRef } from 'react';
import './TouristAttractionCarousel.css';

const attractions = [
  {
    id: 'boracay',
    name: 'Boracay',
    country: 'Aklan, Philippines',
    description: 'Powder-soft white sand beaches, crystalline waters,\nand vibrant world-renowned tropical sunsets.',
    dayImage: '/images/attractions/boracay-day.jpg',
    nightImage: '/images/attractions/boracay-night.jpg'
  },
  {
    id: 'santorini',
    name: 'Santorini',
    country: 'Greece',
    description: 'Stunning cliffside vistas, azure waters,\nand world-famous whitewashed architecture.',
    dayImage: '/images/attractions/santorini-day.jpg',
    nightImage: '/images/attractions/santorini-night.jpg'
  },
  {
    id: 'el-nido',
    name: 'El Nido',
    country: 'Palawan, Philippines',
    description: 'Towering limestone karst cliffs, hidden lagoons,\nand untouched biodiversity in Bacuit Bay.',
    dayImage: '/images/attractions/el-nido-day.jpg',
    nightImage: '/images/attractions/el-nido-night.jpg'
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    description: 'Wander through serene bamboo groves, sacred shrines,\nand timeless lantern-lit stone alleys.',
    dayImage: '/images/attractions/kyoto-day.jpg',
    nightImage: '/images/attractions/kyoto-night.jpg'
  },
  {
    id: 'coron',
    name: 'Coron',
    country: 'Palawan, Philippines',
    description: 'Emerald alpine lakes, vibrant coral reefs,\nand historic shipwreck dive adventures.',
    dayImage: '/images/attractions/coron-day.jpg',
    nightImage: '/images/attractions/coron-night.jpg'
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    description: 'Experience iconic landmarks, romantic boulevards,\nand unforgettable evenings along the Seine.',
    dayImage: '/images/attractions/paris-day.jpg',
    nightImage: '/images/attractions/paris-night.jpg'
  },
  {
    id: 'chocolate-hills',
    name: 'Chocolate Hills',
    country: 'Bohol, Philippines',
    description: 'Over a thousand symmetrical conical hills\nblanketing lush countryside like natural monuments.',
    dayImage: '/images/attractions/chocolate-hills-day.jpg',
    nightImage: '/images/attractions/chocolate-hills-night.jpg'
  },
  {
    id: 'swiss-alps',
    name: 'Swiss Alps',
    country: 'Switzerland',
    description: 'Breathe in the crisp mountain air\namongst majestic snow-capped peaks and alpine valleys.',
    dayImage: '/images/attractions/swiss-alps-day.jpg',
    nightImage: '/images/attractions/swiss-alps-night.jpg'
  },
  {
    id: 'banaue',
    name: 'Banaue Rice Terraces',
    country: 'Ifugao, Philippines',
    description: 'Two-millennia-old hand-carved agricultural marvels\nflowing gracefully across the Cordillera mountains.',
    dayImage: '/images/attractions/banaue-day.jpg',
    nightImage: '/images/attractions/banaue-night.jpg'
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    description: 'Discover futuristic cityscapes, vibrant night districts,\nand rich traditional heritage side-by-side.',
    dayImage: '/images/attractions/tokyo-day.jpg',
    nightImage: '/images/attractions/tokyo-night.jpg'
  },
  {
    id: 'siargao',
    name: 'Siargao',
    country: 'Surigao del Norte, Philippines',
    description: 'The surfing capital of the Philippines with swaying palms,\ntidal rock pools, and laid-back island charm.',
    dayImage: '/images/attractions/siargao-day.jpg',
    nightImage: '/images/attractions/siargao-night.jpg'
  },
  {
    id: 'venice',
    name: 'Venice',
    country: 'Italy',
    description: 'Navigate the historic Grand Canal in a gondola,\nsurrounded by centuries of vibrant culture.',
    dayImage: '/images/attractions/venice-day.jpg',
    nightImage: '/images/attractions/venice-night.jpg'
  },
  {
    id: 'mayon',
    name: 'Mayon Volcano',
    country: 'Albay, Philippines',
    description: 'Renowned for its symmetrical cone silhouette,\nrising dramatically above lush green landscapes.',
    dayImage: '/images/attractions/mayon-day.jpg',
    nightImage: '/images/attractions/mayon-night.jpg'
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'United States',
    description: 'Feel the energy of the world\'s most iconic skyline,\nlimitless culture, and illuminated avenues.',
    dayImage: '/images/attractions/new-york-day.jpg',
    nightImage: '/images/attractions/new-york-night.jpg'
  },
  {
    id: 'kawasan',
    name: 'Kawasan Falls',
    country: 'Cebu, Philippines',
    description: 'Turquoise multi-tiered cascade pools sheltered\nby lush rainforests in southern Cebu.',
    dayImage: '/images/attractions/kawasan-day.jpg',
    nightImage: '/images/attractions/kawasan-night.jpg'
  },
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    description: 'Step into ancient history through timeless Colosseum vistas,\npiazzas, and golden hour warmth.',
    dayImage: '/images/attractions/rome-day.jpg',
    nightImage: '/images/attractions/rome-night.jpg'
  },
  {
    id: 'batanes',
    name: 'Batanes',
    country: 'Batanes, Philippines',
    description: 'Rolling hills meeting rugged Pacific coastlines,\ntraditional stone houses, and timeless peace.',
    dayImage: '/images/attractions/batanes-day.jpg',
    nightImage: '/images/attractions/batanes-night.jpg'
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    description: 'Immerse yourself in lush emerald terraces, sacred temples,\nand tranquil coastal sunsets.',
    dayImage: '/images/attractions/bali-day.jpg',
    nightImage: '/images/attractions/bali-night.jpg'
  },
  {
    id: 'intramuros',
    name: 'Intramuros',
    country: 'Manila, Philippines',
    description: 'The historic walled heart of Manila with cobblestone streets,\ncolonial fortifications, and timeless charm.',
    dayImage: '/images/attractions/intramuros-day.jpg',
    nightImage: '/images/attractions/intramuros-night.jpg'
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    description: 'Marvel at the sparkling harbor waters, iconic Opera House,\nand world-famous coastal lifestyle.',
    dayImage: '/images/attractions/sydney-day.jpg',
    nightImage: '/images/attractions/sydney-night.jpg'
  },
  {
    id: 'banff',
    name: 'Banff',
    country: 'Canada',
    description: 'Experience crystal turquoise glacial lakes, towering Rockies,\nand pristine starry wilderness.',
    dayImage: '/images/attractions/banff-day.jpg',
    nightImage: '/images/attractions/banff-night.jpg'
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    description: 'Gaze upon record-breaking architectural marvels,\nluxurious desert horizons, and golden skylines.',
    dayImage: '/images/attractions/dubai-day.jpg',
    nightImage: '/images/attractions/dubai-night.jpg'
  }
];

export default function TouristAttractionCarousel({ theme = 'light' }) {
  // Random tourist spot on initialization for every new session/opening
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * attractions.length));
  const timerRef = useRef(null);
  const thumbnailStripRef = useRef(null);

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

  // Smoothly scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailStripRef.current) {
      const activeThumb = thumbnailStripRef.current.querySelector('.tourist-carousel__thumbnail.active');
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

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
            
            <div className="tourist-carousel__thumbnails-strip" ref={thumbnailStripRef}>
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
