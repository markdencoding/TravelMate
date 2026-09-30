import { useState, useEffect, useCallback, useRef } from 'react';
import './TouristAttractionCarousel.css';

const attractions = [
  {
    id: 'boracay',
    name: 'Boracay',
    country: 'Aklan, Philippines',
    description: 'Powder-soft white sand beaches, crystalline waters,\nand vibrant world-renowned tropical sunsets.',
    dayImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1600&q=80'
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
    dayImage: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80'
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
    dayImage: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?auto=format&fit=crop&w=1600&q=80'
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
    dayImage: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80'
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
    dayImage: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    description: 'Discover futuristic cityscapes, vibrant night districts,\nand rich traditional heritage side-by-side.',
    dayImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1536098565842-c4b11ac5d194?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'siargao',
    name: 'Siargao',
    country: 'Surigao del Norte, Philippines',
    description: 'The surfing capital of the Philippines with swaying palms,\ntidal rock pools, and laid-back island charm.',
    dayImage: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80'
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
    dayImage: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'United States',
    description: 'Feel the energy of the world’s most iconic skyline,\nlimitless culture, and illuminated avenues.',
    dayImage: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1518235506717-e1ed3306a89b?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'kawasan',
    name: 'Kawasan Falls',
    country: 'Cebu, Philippines',
    description: 'Turquoise multi-tiered cascade pools sheltered\nby lush rainforests in southern Cebu.',
    dayImage: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    description: 'Step into ancient history through timeless Colosseum vistas,\npiazzas, and golden hour warmth.',
    dayImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'batanes',
    name: 'Batanes',
    country: 'Batanes, Philippines',
    description: 'Rolling hills meeting rugged Pacific coastlines,\ntraditional stone houses, and timeless peace.',
    dayImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    description: 'Immerse yourself in lush emerald terraces, sacred temples,\nand tranquil coastal sunsets.',
    dayImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'intramuros',
    name: 'Intramuros',
    country: 'Manila, Philippines',
    description: 'The historic walled heart of Manila with cobblestone streets,\ncolonial fortifications, and timeless charm.',
    dayImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    description: 'Marvel at the sparkling harbor waters, iconic Opera House,\nand world-famous coastal lifestyle.',
    dayImage: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'banff',
    name: 'Banff',
    country: 'Canada',
    description: 'Experience crystal turquoise glacial lakes, towering Rockies,\nand pristine starry wilderness.',
    dayImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    description: 'Gaze upon record-breaking architectural marvels,\nluxurious desert horizons, and golden skylines.',
    dayImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80',
    nightImage: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1600&q=80'
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
