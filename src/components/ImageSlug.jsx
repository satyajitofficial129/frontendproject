import React from "react";

const ImageSlug = ({ name }) => {
    const getInitials = (name) => {
        if (!name) return "";
        const words = name.split(" ");
        const initials = words.map((word) => word.charAt(0).toUpperCase());
        return initials.slice(0, 2).join("");
    };
    
    const initials = getInitials(name);

    return (
        <div className="image-slug" style={{ marginRight: '5px' }}>
            <span >{initials}</span>
            <style jsx>{`
                .image-slug {
                background-color: #2d5291; /* Background color for placeholder */
                color: #fff; /* White text color */
                border-radius: 50%; /* Circular design */
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: bold;
                text-transform: uppercase;
                font-family: Arial, sans-serif;
                padding: 10px 11px;
                margin-left: 8px;
                }
            `}</style>
        </div>
    );
};

export default ImageSlug;
