'use client';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import './ProductCarousel.css';

export default function ProductCarousel({ title, products }) {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section className="product-carousel-section">
      <div className="container">
        <div className="pc-header">
          <h2>{title}</h2>
          <div className="pc-controls hide-on-mobile">
            <button className="pc-btn" onClick={scrollLeft}><ChevronLeft size={24} /></button>
            <button className="pc-btn" onClick={scrollRight}><ChevronRight size={24} /></button>
          </div>
        </div>
        
        <div className="pc-scroll-area" ref={scrollRef}>
          {products.map(product => (
            <div className="pc-item-wrapper" key={product.id}>
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
