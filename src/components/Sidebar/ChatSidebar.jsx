"use client";
import React, { useState, useEffect } from 'react';
import SidebarProfile from './SidebarProfile';
import "../../app/globals.css";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_API_TOKEN } from '@/utils/settings';
import axios from 'axios';
import { toast } from 'react-toastify';
import getAuthUserId from '@/utils/getAuthUserId';

const ChatSidebar = () => {
  const [count, setCount] = useState(0); // Message count
  const [commentCount, setCommentCount] = useState(0); // Comment count
  const pathname = usePathname();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchActiveCount = async () => {
    try {
      const authUserId = await getAuthUserId();
      const endpoint = `/active-count/${authUserId}`;
      const url = `${apiBaseUrl}${endpoint}`;
      const response = await axios.get(url);
      setCount(response.data.unread_user_active_count || 0);
    } catch (error) {
      console.error(error);
      toast.error(`Error fetching active count: ${error.message}`);
    }
  };

  const fetchActiveCommentCount = async () => {
    try {
      const authUserId = await getAuthUserId();
      const endpoint = `/active-comment-count/${authUserId}`;
      const url = `${apiBaseUrl}${endpoint}`;
      const commentResponse = await axios.get(url);
      setCommentCount(commentResponse.data.count || 0);
    } catch (error) {
      console.error(error);
      toast.error(`Error fetching active comment count: ${error.message}`);
    }
  };
  useEffect(() => {
    fetchActiveCount();
    fetchActiveCommentCount();
    const interval = setInterval(fetchActiveCount, 60000);
    const commentInterval = setInterval(fetchActiveCommentCount, 60000);

    // Clean up intervals on component unmount
    return () => {
      clearInterval(interval);
      clearInterval(commentInterval);
    };
  }, []);

  return (
    <aside className="chat-sidebar">
      <Link href="/" className="chat-sidebar-logo">
      </Link>
      <ul className="chat-sidebar-menu">
        <li className={pathname === '/chat' ? 'active' : ''} style={{ position: 'relative' }}>
          <Link href="/chat" data-title="Chats">
            <i className="ri-discuss-fill"></i>
            <span
              className="count"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: 'red',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 8px',
                fontSize: '12px',
              }}
            >
              {count}
            </span>
          </Link>
        </li>
        <li className={pathname === '/comment' ? 'active' : ''}>
          <Link href="/comment" data-title="Comments">
            <i className="ri-chat-smile-3-fill"></i>
            <span
              className="count"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: 'red',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 8px',
                fontSize: '12px',
              }}
            >
              {commentCount}
            </span>
          </Link>
        </li>
        <li className={pathname === '/follow-up' ? 'active' : ''}>
          <Link href="/follow-up" data-title="FollowUp">
            <i className="ri-chat-follow-up-line"></i>

          </Link>
        </li>
        <SidebarProfile />
      </ul>
    </aside>
  );
};

export default ChatSidebar;
