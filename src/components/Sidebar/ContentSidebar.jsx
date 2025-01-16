"use client";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import ImageSlug from "../ImageSlug";

const ContentSidebar = ({ listType = "user", listData = [], handleClick = () => {} }) => {
    const pathname = usePathname();
    const [activeItemId, setActiveItemId] = useState(null);

    const getSidebarTitle = () => {
        switch (pathname) {
            case "/chat":
                return "Chats";
            case "/comment":
                return "Comments";
            default:
                return "Chats";
        }
    };

    const handleItemClick = (e, item) => {
        e.preventDefault();
        setActiveItemId(item.id || item.commentId || item.uniquefacebookId);
        handleClick(e, item);
    };

    const renderUserItem = (user) => (
        <li 
            key={user.id || user.uniquefacebookId}
            className={activeItemId === (user.id || user.uniquefacebookId) ? "active" : ""}
        >
            <a
                onClick={(e) => handleItemClick(e, user)}
                href="#"
                data-conversation={user.uniquefacebookId}
            >
                <ImageSlug name={user.name} />
                <span className="content-message-info">
                    <span className="content-message-name">{user.name}</span>
                    <span
                        className="content-message-text"
                        style={{
                            fontWeight: user.lastMessageReadStatus === 0 ? "700" : "400",
                            color: user.lastMessageReadStatus === 0 ? "black" : "inherit"
                        }}
                    >
                        {user.lastMessage}
                    </span>
                </span>
                <span className="content-message-more">
                    <span className="content-message-unread">{user.messageLogsCount}</span>
                    <span className="content-message-time">{user.createdTime}</span>
                </span>
            </a>
        </li>
    );

    const renderCommentItem = (comment) => (
        <li 
            key={comment.commentId}
            className={activeItemId === comment.commentId ? "active" : ""}
        >
            <a
                onClick={(e) => handleItemClick(e, comment)}
                href="#"
                data-conversation={comment.commentId}
            >
                <ImageSlug name={comment.fromName} />
                <span className="content-message-info">
                    <span className="content-message-name">{comment.fromName}</span>
                    <span
                        className="content-message-text"
                        style={{ fontWeight: "700", color: "black" }}
                    >
                        {comment.message}
                    </span>
                </span>
            </a>
        </li>
    );

    return (
        <div className="content-sidebar">
            <div className="content-sidebar-title">{getSidebarTitle()}</div>
            <div className="content-messages">
                <ul className="content-messages-list">
                    {listData.length > 0 ? (
                        listData.map((item) => (
                            listType === "user" ? renderUserItem(item) : renderCommentItem(item)
                        ))
                    ) : (
                        <li>No {listType === "user" ? "users" : "comments"} found</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ContentSidebar;
