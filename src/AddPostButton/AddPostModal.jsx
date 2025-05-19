import React, { useState, useRef } from 'react';
import './AddPostModal.css';
import axios from 'axios';

function AddPostModal({ visible, onClose, onSubmit }) {
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [prepTime, setPrepTime] = useState('');
  const [timeUnit, setTimeUnit] = useState('minutes');
  const [category, setCategory] = useState('main');
  const [isDragging, setIsDragging] = useState(false);

  const sanitizeInput = (text) => text.replace(/[<>"'&]/g, '');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddIngredient = () => {
    if (currentIngredient.trim()) {
      const cleanIngredient = sanitizeInput(currentIngredient.trim());
      setIngredients([...ingredients, cleanIngredient]);
      setCurrentIngredient('');
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // Reset the file input
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || ingredients.length === 0 || !prepTime) {
      alert('Παρακαλώ συμπλήρωσε όλα τα υποχρεωτικά πεδία.');
      return;
    }

    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    form.append('difficulty', difficulty);
    form.append('prep_time_value', prepTime);
    form.append('prep_time_unit', timeUnit);
    form.append('category', category);
    form.append('ingredients', JSON.stringify(ingredients));
    if (image) form.append('image', image);

    try {
      await axios.post('http://localhost:3001/api/posts', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Η συνταγή αποθηκεύτηκε!');
      onSubmit && onSubmit();

      setTitle('');
      setIngredients([]);
      setCurrentIngredient('');
      setDescription('');
      setDifficulty('medium');
      setPrepTime('');
      setTimeUnit('minutes');
      setCategory('main');
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
      onClose();

    } catch (err) {
      console.error(err);
      alert('Σφάλμα κατά την αποθήκευση.');
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Προσθήκη Νέας Συνταγής</h2>

        <div className="form-group">
          <label>Τίτλος Συνταγής*:</label>
          <input type="text" placeholder="Τίτλος Συνταγής*" value={title} onChange={(e) => setTitle(sanitizeInput(e.target.value))} required />
        </div>

        <div className="form-group">
          <label>Δυσκολία:</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="modal-select">
            <option value="easy">Εύκολη</option>
            <option value="medium">Μεσαία</option>
            <option value="hard">Δύσκολη</option>
          </select>
        </div>

        <div className="form-group">
          <label>Χρόνος Προετοιμασίας*:</label>
          <div className="time-input">
            <input type="number" min="1" placeholder="45" value={prepTime} onChange={(e) => setPrepTime(e.target.value.replace(/\D/g, ''))} required />
            <select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)} className="modal-select">
              <option value="minutes">Λεπτά</option>
              <option value="hours">Ώρες</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Κατηγορία:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="modal-select">
            <option value="appetizer">Ορεκτικό</option>
            <option value="main">Κύριο Πιάτο</option>
            <option value="dessert">Επιδόρπιο</option>
          </select>
        </div>

        <div className="form-group ingredients-section">
          <label>Υλικά*:</label>
          <div className="ingredients-input">
            <input type="text" placeholder="Προσθέστε υλικό" value={currentIngredient} onChange={(e) => setCurrentIngredient(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()} />
            <button type="button" onClick={handleAddIngredient} className="add-ingredient-btn">+</button>
          </div>
          <div className="ingredients-tags">
            {ingredients.map((ingredient, index) => (
              <span key={index} className="ingredient-tag">
                {ingredient}
                <button onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))} className="remove-tag-btn">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Περιγραφή*:</label>
          <textarea placeholder="Αναλυτικές οδηγίες..." value={description} onChange={(e) => setDescription(sanitizeInput(e.target.value))} required />
        </div>

        <div className="form-group image-upload">
          <label className="image-upload-label">Φωτογραφία:</label>
          <div
            className={`drop-area ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={!imagePreview ? triggerFileInput : undefined}
          >
            {imagePreview ? (
              <div className="image-preview-wrapper">
                <img src={imagePreview} alt="preview" className="image-preview" />
              </div>
            ) : (
              <p className="drop-message">Σύρετε & αποθέστε την εικόνα εδώ ή κάντε κλικ για επιλογή</p>
            )}
          </div>
          {imagePreview && (
            <div className="image-actions-below">
              <button type="button" onClick={triggerFileInput} className="image-action-btn">Αλλαγή</button>
              <button type="button" onClick={handleRemoveImage} className="image-action-btn remove">Αφαίρεση</button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input"
            ref={fileInputRef}
          />
        </div>

        <button className="submit-btn" onClick={handleSubmit}>
          Δημοσίευση Συνταγής
        </button>
      </div>
    </div>
  );
}

export default AddPostModal;