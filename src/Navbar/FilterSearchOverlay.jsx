import React, { useState } from 'react';
import './FilterSearchOverlay.css';

export function FilterSearchOverlay({ visible, onClose, onApply }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [diet, setDiet] = useState('');

  console.log("Overlay visibility:", visible);

  // Αν δεν είναι ορατό, μην το εμφανίσεις καθόλου
  if (!visible) return null;

  const handleApply = () => {
    onApply({ query, category, difficulty, prepTime, diet });
  };

  return (
    <div className="filter-overlay" onClick={onClose}>
      <div className="filter-panel" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Αναζήτηση & Φίλτρα</h2>
        <input
          type="text"
          placeholder="Αναζήτηση..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="filters">
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Κατηγορία</option>
            <option value="main">Κυρίως Πιάτο</option>
            <option value="dessert">Επιδόρπιο</option>
            <option value="salad">Σαλάτα</option>
          </select>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="">Δυσκολία</option>
            <option value="easy">Εύκολο</option>
            <option value="medium">Μεσαίο</option>
            <option value="hard">Δύσκολο</option>
          </select>
          <select value={prepTime} onChange={e => setPrepTime(e.target.value)}>
            <option value="">Χρόνος Προετοιμίας</option>
            <option value="15">&lt; 15 λεπτά</option>
            <option value="30">&lt; 30 λεπτά</option>
            <option value="60">&lt; 1 ώρα</option>
          </select>
          <select value={diet} onChange={e => setDiet(e.target.value)}>
            <option value="">Διατροφή</option>
            <option value="vegetarian">Χορτοφαγικό</option>
            <option value="vegan">Βίγκαν</option>
            <option value="gluten-free">Χωρίς Γλουτένη</option>
          </select>
        </div>
        <div className="actions">
          <button className="btn-secondary" onClick={onClose}>Ακύρωση</button>
          <button className="btn-primary" onClick={handleApply}>Αναζήτηση</button>
        </div>
      </div>
    </div>
  );
}

export default FilterSearchOverlay;
