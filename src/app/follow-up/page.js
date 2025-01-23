"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify"; // Assuming you're using react-toastify for notifications
import ChatSidebar from "@/components/Sidebar/ChatSidebar";
import { NEXT_PUBLIC_API_BASE_URL } from "@/utils/settings";
import getAuthUserId from "@/utils/getAuthUserId";
import Link from "next/link";
import { useRouter } from "next/compat/router";

const Page = () => {
  const [conversations, setConversations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const apiBaseUrl = NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();

  const handleRedirect = (customerId) => {
    const updateChat = async () => {
      try {
        const endpoint = `/go-to-chat/${customerId}`;
        const url = `${apiBaseUrl}${endpoint}`;
        const response = await axios.get(url);

        // Show success message
        // console.log(response.data.message);
        toast.success(response.data.message);

        // Redirect only if successful
        window.location.href = '/chat';
      } catch (error) {
        console.error('Error during API call:', error);
        toast.error('An error occurred while processing your request.');
      }
    };

    updateChat();
  };

  const fetchConversations = async () => {
    try {
      const authUserId = await getAuthUserId();
      const endpoint = `/follow-up-list/${authUserId}?page=${currentPage}`;
      const url = `${apiBaseUrl}${endpoint}`;

      const response = await axios.get(url);
      console.log(response.data);

      if (response.status === 200) {
        const data = response.data.data.map((conversation) => ({
          customerId: conversation.id,
          customerName: conversation.name,
          messageLogs: conversation.message_logs || [],
        }));
        setConversations(data);
        setCurrentPage(response.data.current_page);
        setTotalPages(response.data.total_pages);
        setTotalItems(response.data.total_items);
      }
    } catch (error) {
      toast.error("Error fetching conversations");
      console.error("Error fetching conversations:", error);
    }
  };

  const handleFollowUp = (customerId) => {
    const removeFollowUp = async () => {
      try {
        const endpoint = `/remove-follow-up/${customerId}`;
        const url = `${apiBaseUrl}${endpoint}`;
        const response = await axios.get(url);

        toast.success(response.data.message);

        // Fetch the updated list of conversations after removing follow-up
        fetchConversations();
      } catch (error) {
        console.error('Error during API call:', error);
        toast.error('An error occurred while processing your request.');
      }
    };
    removeFollowUp();
  };

  useEffect(() => {
    fetchConversations();
  }, [apiBaseUrl, currentPage]); // Re-run the fetch when apiBaseUrl or currentPage changes

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <section className="chat-section">
      <div className="chat-container" style={{ width: "1650px" }}>
        <ChatSidebar />
        <div className="chat-content">
          <div className="table-responsive mt-4" style={{ padding: "20px" }}>
            <table className="table table-bordered ">
              <thead className="thead-dark">
                <tr>
                  <th scope="col" style={{ width: '20%' }}>Customer Name</th>
                  <th scope="col" style={{ width: '50%' }}>Conversation</th>
                  <th scope="col" style={{ width: '20%', textAlign: 'center' }}>Remove From Followup</th>
                  <th scope="col" style={{ width: '10%', textAlign: 'center' }}>Go To Chat</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conversation, index) => (
                  <tr key={index}>
                    <td>{conversation.customerName}</td>
                    <td>
                      <ul>
                        {conversation.messageLogs.map((log, idx) => (
                          <li key={idx} style={{ listStyle: 'none' }}>
                            {log.unique_facebook_id === null ? (
                              <span className="badge bg-primary " style={{ marginRight: '10px', }}>Agent</span>
                            ) : (
                              <span className="badge bg-secondary " style={{ marginRight: '10px', }}>Client</span>
                            )}
                            {log.message_content || "No content"}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          const isConfirmed = window.confirm("Are you sure ? you want to Remove From Follow Up!!");
                          if (isConfirmed) {
                            handleFollowUp(conversation.customerId);
                          }
                        }}
                      >
                        <i className="ri-eraser-line"></i>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div
                        className="btn btn-sm btn-primary"
                        onClick={() => handleRedirect(conversation.customerId)}
                      >
                        <i className="ri-corner-up-left-double-line"></i>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pagination-controls mt-3" style={{ position: 'absolute', right: '10px', bottom: '20px' }}>
            <nav aria-label="Page navigation">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>

                {/* Page Number */}
                <li className="page-item disabled">
                  <span className="page-link">
                    Page {currentPage} of {totalPages}
                  </span>
                </li>
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Page;
