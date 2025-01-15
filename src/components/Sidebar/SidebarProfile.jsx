import React, { useState } from "react";
import "../../app/globals.css";
import ImageSlug from "../ImageSlug";

const SidebarProfile = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

    // Logout function
    const handleLogout = () => {
      localStorage.removeItem("auth-token");
      window.location.href = "/login";
    };

  return (
    <li className={`chat-sidebar-profile ${
      isDropdownOpen ? "active" : ""
    }`}>
      <button
        type="button"
        style={{ border: 'none' }}
        onClick={toggleDropdown}
      >
        <ImageSlug 
          name="Edu Tune"
        />
      </button>

      <ul
        className="chat-sidebar-profile-dropdown "
      >
        <li>
          <a href="#" onClick={handleLogout}>
            <i className="ri-logout-box-line" /> Logout
          </a>
        </li>
      </ul>
    </li>
  );
};

export default SidebarProfile;
