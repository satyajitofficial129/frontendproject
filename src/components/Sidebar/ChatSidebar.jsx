"use client";
import React from 'react';
import SidebarProfile from './SidebarProfile';
import "../../app/globals.css";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ChatSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="chat-sidebar">
      <Link href="/" className="chat-sidebar-logo">
      </Link>
      <ul className="chat-sidebar-menu">
        <li className={pathname === '/chat' ? 'active' : ''}>
          <Link href="/chat" data-title="Chats">
            <i className="ri-discuss-fill"></i>
          </Link>
        </li>
        <li className={pathname === '/comment' ? 'active' : ''}>
          <Link href="/comment" data-title="Comments">
            <i className="ri-chat-smile-3-fill"></i>
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
