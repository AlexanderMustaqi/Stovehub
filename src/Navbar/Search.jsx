import React from 'react';
import SearchIcon from "./assets/search-outline.svg"

function Search({ onClick }) {
    return (
      <img
        src={SearchIcon}
        alt="Search"
        className="navbar-search"
        style={{ cursor: 'pointer' }}
        onClick={onClick}
        role="button"
        tabIndex="0"
      />
    );
  }

export default Search;