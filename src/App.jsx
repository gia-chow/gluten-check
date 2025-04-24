import React, { useState } from 'react';
import BarcodeScanner from './BarcodeScanner';

// 🔧 URL builder for product search
const buildURL = (query) => {
  const base = "https://world.openfoodfacts.org/cgi/search.pl";
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: 1,
    action: "process",
    json: 1,
    fields: "product_name,allergens_tags,ingredients_text,image_thumb_url,labels_tags",
    page_size: 5,
  });
  return `${base}?${params.toString()}`;
};

function App() {
  const [productName, setProductName] = useState('');
  const [results, setResults] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

  const searchProduct = async () => {
    if (!productName.trim()) return;

    setLoading(true);
    setResults([]);
    setExpandedIndex(null);
    setResultMsg('');

    try {
      const res = await fetch(buildURL(productName));
      const data = await res.json();
      if (data.products.length > 0) {
        setResults(data.products);
      } else {
        setResultMsg('No results found.');
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setResultMsg("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const checkGluten = (index) => {
    setExpandedIndex(index);
  };

  const handleBarcodeScan = async (barcode) => {
    setShowScanner(false);
    setLoading(true);
    setExpandedIndex(null);
    setResults([]);
    setResultMsg('');

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();

      if (data.status === 1) {
        setResults([data.product]);
        setExpandedIndex(0);
      } else {
        setResultMsg("Product not found.");
      }
    } catch (error) {
      console.error("Barcode fetch error:", error);
      setResultMsg("Error retrieving product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '650px', margin: 'auto' }}>
      <h2>C'est La Wheat</h2>
      <h4>It looks safe, but is it gluten?</h4>
      <input
        type="text"
        placeholder="Enter food name (e.g., Heinz ketchup)"
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        style={{ padding: '0.5rem', width: '100%', marginBottom: '1rem' }}
      />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={searchProduct} style={{ padding: '0.5rem 1rem' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
        <button onClick={() => setShowScanner(true)} style={{ padding: '0.5rem 1rem' }}>
          📷 Scan Barcode
        </button>
      </div>

      {showScanner && (
        <div style={{ marginTop: '1rem' }}>
          <BarcodeScanner onScanSuccess={handleBarcodeScan} onClose={() => setShowScanner(false)} />
        </div>
      )}

      {resultMsg && <p style={{ marginTop: '1rem' }}>{resultMsg}</p>}

      {results.map((product, index) => (
        <div key={index} style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem' }}>
          <strong>{product.product_name || 'Unnamed product'}</strong>
          {product.image_thumb_url && (
            <div>
              <img src={product.image_thumb_url} alt={product.product_name} width="100" />
            </div>
          )}
          <button
            onClick={() => checkGluten(index)}
            style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem' }}
          >
            Check Gluten
          </button>

          {expandedIndex === index && (
            <div style={{ marginTop: '1rem' }}>
              <p>
                <strong>Ingredients:</strong> {product.ingredients_text || 'Ingredients not listed.'}
              </p>
              <p>
                {(() => {
                  const containsGluten = product.allergens_tags?.includes('en:gluten');
                  const labels = product.labels_tags || [];
                  const isCertifiedGlutenFree =
                    labels.includes('en:gluten-free') ||
                    labels.includes('en:no-gluten') ||
                    labels.includes('en:certified-gluten-free');

                  let glutenStatus = containsGluten
                    ? '⚠️ Contains gluten'
                    : '✅ Gluten-free (according to this listing)';

                  if (isCertifiedGlutenFree) {
                    glutenStatus += ' — 🏅 Certified Gluten-Free';
                  }

                  if (
                    product.product_name?.toLowerCase().includes('gluten free') &&
                    containsGluten &&
                    !isCertifiedGlutenFree
                  ) {
                    glutenStatus += ' — (⚠️ Tag mismatch — labeled as gluten-free but flagged for gluten. Double-check!)';
                  }

                  return <span>{glutenStatus}</span>;
                })()}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;
