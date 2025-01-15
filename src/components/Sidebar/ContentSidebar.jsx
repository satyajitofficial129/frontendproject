"use client";
import { usePathname } from "next/navigation";
import React from "react";
import ImageSlug from "../ImageSlug";

const ContentSidebar = ({ listType = "user", listData = [], handleClick = () => {} }) => {
    const pathname = usePathname();

    // Function to determine sidebar title based on the current path
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

    // Function to render user item
    const renderUserItem = (user) => (
        <li key={user.id || user.uniquefacebookId}>
            <a
                onClick={(e) => handleClick(e, user)}
                href="#"
                data-conversation={user.uniquefacebookId}
            >
                <ImageSlug name={user.name} />
                <span className="content-message-info">
                    <span className="content-message-name">{user.name}</span>
                    {user.lastMessageReadStatus === 0 ? (
                        <span
                            className="content-message-text"
                            style={{ fontWeight: "700", color: "black" }}
                        >
                            {user.lastMessage}
                        </span>
                    ) : (
                        <span
                            className="content-message-text"
                            style={{ fontWeight: "400" }}
                        >
                            {user.lastMessage}
                        </span>
                    )}
                </span>
                <span className="content-message-more">
                    <span className="content-message-unread">{user.messageLogsCount}</span>
                    <span className="content-message-time">{user.createdTime}</span>
                </span>
            </a>
        </li>
    );

    // Function to render comment item
    const renderCommentItem = (comment) => (
        <li key={comment.commentId}>
            <a
                onClick={(e) => handleClick(e, comment)}
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
                {/* <span className="content-message-more">
                    <span className="content-message-unread">{comment.message}</span>
                    <span className="content-message-time">{comment.createdTime}</span>
                </span> */}
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
