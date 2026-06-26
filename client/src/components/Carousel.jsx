import { useState, useEffect, useCallback } from 'react'

const ChevronLeftIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRightIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

/**
 * Auto-rotating carousel with manual controls
 * @param {string[]} images - Array of image URLs
 * @param {number} autoPlayInterval - Time in ms between auto-rotations (default: 5000)
 * @param {string} className - Additional CSS classes
 */
const Carousel = ({ images = [], autoPlayInterval = 5000, className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    )
  }, [images.length])

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    )
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  // Auto-play effect
  useEffect(() => {
    if (images.length <= 1 || isPaused) return

    const interval = setInterval(() => {
      goToNext()
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [images.length, isPaused, autoPlayInterval, goToNext])

  if (!images || images.length === 0) {
    return (
      <div className={`relative w-full h-96 bg-gray-100 rounded-2xl flex items-center justify-center ${className}`}>
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-sm">No photos available</p>
        </div>
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className={`relative w-full h-96 rounded-2xl overflow-hidden ${className}`}>
        <img
          src={images[0]}
          alt="Gallery"
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`relative w-full h-96 rounded-2xl overflow-hidden group ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Image */}
      <div className="relative w-full h-full">
        <img
          src={images[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-500"
        />

        {/* Gradient Overlay for better button visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/20 pointer-events-none" />
      </div>

      {/* Previous Button */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
        aria-label="Previous slide"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>

      {/* Next Button */}
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
        aria-label="Next slide"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'w-8 h-2 bg-white'
                : 'w-2 h-2 bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Counter */}
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 text-white text-sm font-medium rounded-full backdrop-blur-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Pause Indicator */}
      {isPaused && (
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 text-white text-xs font-medium rounded-full backdrop-blur-sm">
          Paused
        </div>
      )}
    </div>
  )
}

export default Carousel
