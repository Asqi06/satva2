'use client';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon, ArrowRight, X } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import './page.css';

const QUICK_FILTERS = [
  { label: 'All Pieces', value: '' },
  { label: 'Chains & Necklaces', value: 'chain' },
  { label: 'Hoops & Earrings', value: 'earring' },
  { label: 'Bangles & Bracelets', value: 'bangle' },
  { label: 'Rings', value: 'ring' },
  { label: 'Korean Aesthetic', value: 'korean' },
  { label: 'Indian Heritage', value: 'indian' },
];

export default function SearchClient({ initialProducts = [] }) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeChip, setActiveChip] = useState('');
  const [allProducts, setAllProducts] = useState(initialProducts);
  const [hasFetched, setHasFetched] = useState(initialProducts.length > 0);

  useEffect(() => {
    if (allProducts.length === 0 && !hasFetched) {
      fetch('/api/products?limit=150')
        .then((res) => {
          if (!res.ok) return null;
          const ct = res.headers.get('content-type') || '';
          return ct.includes('application/json') ? res.json() : null;
        })
        .then((data) => {
          if (data?.products?.length > 0) {
            setAllProducts(data.products);
          }
        })
        .catch(() => {})
        .finally(() => {
          setHasFetched(true);
        });
    }
  }, [allProducts.length, hasFetched]);

  const isLoading = !hasFetched && allProducts.length === 0;

  const filteredProducts = useMemo(() => {
    const term = (activeChip || searchTerm).trim().toLowerCase();
    if (!term) return allProducts;

    return allProducts.filter((p) => {
      return (
        p.title?.toLowerCase().includes(term) ||
        p.name?.toLowerCase().includes(term) ||
        p.subcategory?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.material?.toLowerCase().includes(term) ||
        (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(term)))
      );
    });
  }, [allProducts, searchTerm, activeChip]);

  return (
    <div className="container search-page-container">
      {/* Search Header */}
      <div className="search-header-box">
        <span className="search-kicker">Catalog Search</span>
        <h1 className="search-headline">Discover Demifine Jewellery</h1>

        {/* Live Search Input */}
        <form onSubmit={(e) => e.preventDefault()} className="search-input-wrapper">
          <SearchIcon size={18} className="search-input-icon" />
          <input
            type="search"
            placeholder="Search chains, earrings, waterproof mangalsutras, 18k rings..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setActiveChip('');
            }}
            className="search-field"
            aria-label="Search collection"
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </form>

        {/* Quick Filter Chips */}
        <div className="search-filter-chips">
          {QUICK_FILTERS.map((chip) => {
            const isSelected = activeChip === chip.value && (!searchTerm || chip.value !== '');
            return (
              <button
                key={chip.label}
                type="button"
                className={`chip-button ${isSelected ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveChip(chip.value);
                  setSearchTerm('');
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Grid */}
      <div className="search-results-meta">
        <span className="results-count-text">
          Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'piece' : 'pieces'}
          {(searchTerm || activeChip) && ` for "${activeChip || searchTerm}"`}
        </span>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', color: '#6e675f', fontSize: '0.95rem' }}>
          <p>Curating collection pieces...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="search-no-results">
          <p className="no-results-msg">No pieces found matching your query.</p>
          <div className="search-suggestions-box">
            <span className="suggestions-title">Suggestions:</span>
            <ul>
              <li>Check your spelling or try broader terms like &ldquo;chain&rdquo;, &ldquo;ring&rdquo;, or &ldquo;earring&rdquo;</li>
              <li>Browse our best-selling waterproof collections below</li>
            </ul>
          </div>
          <Link href="/anti-tarnish-jewellery" className="btn btn-primary">
            Explore Anti-Tarnish Collection <ArrowRight size={15} style={{ marginLeft: 6 }} />
          </Link>
        </div>
      ) : (
        <div className="home-products-grid">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      )}
    </div>
  );
}
