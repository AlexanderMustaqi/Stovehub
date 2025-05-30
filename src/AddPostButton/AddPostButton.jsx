import Icon from './assets/add-post-icon.png';
import './AddPostButton.css';

function AddPostButton({ onClick }) {
  return (
    <div
      className="floating-image-button tooltip"
      onClick={onClick}
      // title="Προσθήκη συνταγής" // Consider using title attribute for accessibility if tooltip is purely visual
    >
      <img
        src={Icon}
        alt="Add Post"
      />
      <span className="tooltip-text">Προσθήκη συνταγής</span>
    </div>
  );
}

export default AddPostButton;