import Icon from './assets/add-post-icon.png';
import './AddPostButton.css';

function AddPostButton({ onClick }) {
  return (
    <img
      src={Icon}
      alt="Add Post"
      className="add-post-button"
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    />
  );
}

export default AddPostButton;