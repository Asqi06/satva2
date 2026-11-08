'use client';
import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import { X } from 'lucide-react';
import './CollectionPage.css';

export default function CollectionPage({
  title,
  tagline,
  bannerBg = "var(--canvas-subtle)",
  initialProducts = [],
  categorySlug = "anti-tarnish-jewellery",
}) {
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('bestselling');

  const subcategories = useMemo(() => {
    const list = Array.from(new Set(initialProducts.map((p) => p.subcategory).filter(Boolean)));
    return ['all', ...list];
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    let list = [...initialProducts];

    if (selectedSubcategory !== 'all') {
      list = list.filter((p) => p.subcategory === selectedSubcategory);
    }

    if (selectedPriceRange === 'under-499') {
      list = list.filter((p) => p.price <= 499);
    } else if (selectedPriceRange === '500-999') {
      list = list.filter((p) => p.price >= 500 && p.price <= 999);
    } else if (selectedPriceRange === '1000-plus') {
      list = list.filter((p) => p.price >= 1000);
    }

    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else {
      list.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    }

    return list;
  }, [initialProducts, selectedSubcategory, selectedPriceRange, sortBy]);

  const hasActiveFilters = selectedSubcategory !== 'all' || selectedPriceRange !== 'all';

  const clearFilters = () => {
    setSelectedSubcategory('all');
    setSelectedPriceRange('all');
    setSortBy('bestselling');
  };

  // Automated ItemList Schema for Google Rich Collection Snippet
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    description: tagline || `Browse ${title} at Satvastones Demi-Fine Jewellery.`,
    numberOfItems: filteredProducts.length,
    itemListElement: filteredProducts.slice(0, 24).map((prod, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `https://satvastones.com/products/${prod.id}`,
      name: prod.title,
      image: prod.image || "https://satvastones.com/logo.png",
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://satvastones.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: `https://satvastones.com/${categorySlug}`,
      },
    ],
  };

  return (
    <div className="atelier-collection-page">
      {/* Automated Structured Data for Google Collection SERP */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Editorial Header */}
      <header className="collection-editorial-header" style={{ background: bannerBg }}>
        <div className="container collection-header-content">
          <span className="collection-kicker">Catalog</span>
          <h1 className="collection-title">{title}</h1>
          {tagline && <p className="collection-lead">{tagline}</p>}
          <span className="collection-count">{filteredProducts.length} pieces</span>
        </div>
      </header>

      {/* Sticky Filter Strip */}
      <div className="collection-controls-strip">
        <div className="container controls-inner-row">
          {/* Subcategory Filters */}
          <div className="subcategory-tabs-scroll" role="tablist">
            {subcategories.map((sub) => (
              <button
                key={sub}
                type="button"
                className={`subcategory-tab ${selectedSubcategory === sub ? 'is-active' : ''}`}
                onClick={() => setSelectedSubcategory(sub)}
              >
                {sub === 'all' ? 'All Pieces' : sub.charAt(0).toUpperCase() + sub.slice(1)}
              </button>
            ))}
          </div>

          {/* Sorters */}
          <div className="dropdowns-group">
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="atelier-select"
              aria-label="Filter by price range"
            >
              <option value="all">All Prices</option>
              <option value="under-499">Under ₹499</option>
              <option value="500-999">₹500 - ₹999</option>
              <option value="1000-plus">₹1,000 & Above</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="atelier-select"
              aria-label="Sort pieces"
            >
              <option value="bestselling">Most requested</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest rated</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                className="clear-filters-chip"
                onClick={clearFilters}
                aria-label="Clear all applied filters"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container collection-grid-container">
        {filteredProducts.length === 0 ? (
          <div className="collection-empty-slate">
            <h3>No pieces found in this selection</h3>
            <p>Try resetting filters or explore other categories.</p>
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="collection-products-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
