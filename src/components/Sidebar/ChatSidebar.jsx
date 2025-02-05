"use client";
import React, { useState, useEffect } from "react";
import SidebarProfile from "./SidebarProfile";
import "../../app/globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NEXT_PUBLIC_API_BASE_URL } from "@/utils/settings";
import axios from "axios";
import { toast } from "react-toastify";
import getAuthUserId from "@/utils/getAuthUserId";

const ChatSidebar = () => {
  const [count, setCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const pathname = usePathname();
  const apiBaseUrl = NEXT_PUBLIC_API_BASE_URL;

  const fetchCounts = async () => {
    try {
      const authUserId = await getAuthUserId();
      const [messageResponse, commentResponse] = await Promise.all([
        axios.get(`${apiBaseUrl}/active-count/${authUserId}`),
        axios.get(`${apiBaseUrl}/active-comment-count/${authUserId}`),
      ]);
      console.log(messageResponse.data.unread_user_active_count);
      setCount(messageResponse.data.unread_user_active_count);
      setCommentCount(commentResponse.data.count);
    } catch (error) {
      console.error(error);
      toast.error(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="chat-sidebar">
      <Link href="/" className="chat-sidebar-logo"></Link>
      <ul className="chat-sidebar-menu">
        <li className={pathname === "/chat" ? "active" : ""}>
          <Link href="/chat" data-title="Chats" className="sidebar-link">
            <i className="ri-discuss-fill"></i>
            {(count > 0 ) && <span className="red-dot"></span>}
          </Link>
        </li>
        <li className={pathname === "/comment" ? "active" : ""}>
          <Link href="/comment" data-title="Comments" className="sidebar-link">
            <i className="ri-chat-smile-3-fill"></i>
            {( commentCount > 0) && <span className="red-dot"></span>}
          </Link>
        </li>
        <SidebarProfile />
      </ul>
      <style jsx>{`
        .red-dot {
          position: absolute;
          top: 5px;
          right: 10px;
          width: 8px;
          height: 8px;
          background-color: red;
          border-radius: 50%;
        }
        .sidebar-link {
          position: relative;
          display: flex;
          align-items: center;
        }
      `}</style>
    </aside>
  );
};

export default ChatSidebar;
