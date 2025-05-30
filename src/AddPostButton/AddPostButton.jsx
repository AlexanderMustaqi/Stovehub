import Icon from './assets/add-post-icon.png';
import './AddPostButton.css';

function AddPostButton({ onClick }) {
  return (
    <div
      className="floating-image-button tooltip"
      onClick={onClick}
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