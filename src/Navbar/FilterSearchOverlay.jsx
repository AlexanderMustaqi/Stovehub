import React, { useState } from 'react';
import './FilterSearchOverlay.css';

export function FilterSearchOverlay({ visible, onClose, onApply }) {
  const [activeTab, setActiveTab] = useState('recipes');

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [timeUnit, setTimeUnit] = useState('minutes');
  const [ingredients, setIngredients] = useState([]);
  const [currentIngredient, setCurrentIngredient] = useState('');

  const [userQuery, setUserQuery] = useState('');

  if (!visible) return null;

  const handleAddIngredient = () => {
    if (currentIngredient.trim() !== '' && !ingredients.includes(currentIngredient.trim())) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient('');
    }
  };

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleApplyRecipes = () => {
    let prepTimeInMinutes = null;
    if (prepTime) {
      prepTimeInMinutes = timeUnit === 'hours' ? parseInt(prepTime) * 60 : parseInt(prepTime);
    }

    onApply({
      type: 'recipes',
      query,
      category,
      difficulty,
      prepTime: prepTimeInMinutes, 
      ingredients: ingredients.join(',') 
    });
    
    onClose();
  };

  const handleApplyUsers = () => {
    onApply({ 
      type: 'users', 
      query: userQuery 
    });
    
    onClose();
  };

  return (
    <div className="filter-overlay" onClick={onClose}>
      <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="tabs">
          <button
            className={activeTab === 'recipes' ? 'active' : ''}
            onClick={() => setActiveTab('recipes')}
          >
            Συνταγές
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Χρήστες
          </button>
        </div>

        {activeTab === 'recipes' && (
          <>
            <h2>Αναζήτηση Συνταγών</h2>
            <input
              type="text"
              placeholder="Τίτλος ή περιγραφή..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="filters">
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Κατηγορία</option>
                <option value="appetizer">Ορεκτικό</option>
                <option value="main">Κύριο Πιάτο</option>
                <option value="dessert">Επιδόρπιο</option>
              </select>

              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="">Δυσκολία</option>
                <option value="easy">Εύκολη</option>
                <option value="medium">Μεσαία</option>
                <option value="hard">Δύσκολη</option>
              </select>

              <div className="time-filter-group">
                <input
                  type="number"
                  min="1"
                  placeholder="Χρόνος Προετοιμασίας"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value.replace(/\D/g, ''))}
                />
                <select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)}>
                  <option value="minutes">Λεπτά</option>
                  <option value="hours">Ώρες</option>
                </select>
              </div>
            </div>

            <div className="ingredients-filter">
              <label>Υλικά:</label>
              <div className="ingredients-input">
                <input
                  type="text"
                  placeholder="Προσθέστε υλικό"
                  value={currentIngredient}
                  onChange={(e) => setCurrentIngredient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
                />
                <button type="button" onClick={handleAddIngredient}>+</button>
              </div>
              <div className="ingredients-tags">
                {ingredients.map((ing, index) => (
                  <span key={index} className="ingredient-tag">
                    {ing}
                    <button onClick={() => handleRemoveIngredient(index)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="actions">
              <button className="btn-secondary" onClick={onClose}>Ακύρωση</button>
              <button className="btn-primary" onClick={handleApplyRecipes}>Αναζήτηση</button>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <>
            <h2>Αναζήτηση Χρηστών</h2>
            <input
              type="text"
              placeholder="Ψάξε για χρήστη..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
            />
            <div className="actions">
              <button className="btn-secondary" onClick={onClose}>Ακύρωση</button>
              <button className="btn-primary" onClick={handleApplyUsers}>Αναζήτηση</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FilterSearchOverlay;