"use client"
import React, { useEffect, useRef, useState } from 'react'
import "../globals.css";
import MessageItem from "@/components/Message/MessagesList";
import ChatSidebar from "@/components/Sidebar/ChatSidebar";
import SelectField from '@/components/Select/Select';
import { Image, Offcanvas } from 'react-bootstrap';
import { FaAlignLeft, FaBookmark, FaCheck, FaClipboard, FaComment, FaCopy, FaEdit, FaEnvelope, FaEye, FaGripVertical, FaPaperclip, FaPlus, FaRegSmile, FaSearch, FaShareAlt, FaTrashAlt, FaUserPlus } from 'react-icons/fa';
import ContentSidebar from '@/components/Sidebar/ContentSidebar';
import styles from '@/styles/Comment.module.css';
import $ from "jquery";
import axios from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { generateHash } from '@/utils/hash';
import ImageSlug from '@/components/ImageSlug';
import getAuthUserId from '@/utils/getAuthUserId';
import { META_API_URL, NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_API_TOKEN, PAGE_ACCESS_TOKEN, PAGE_ID } from '@/utils/settings';


const Chat = () => {
    const router = useRouter();

    const [sentiment, setSentiment] = useState(null);
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [messageTemplate, setMessageTemplate] = useState([]);
    const [isActive, setIsActive] = useState(false);
    const [userId, setUserId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [short, setShort] = useState('');
    const [details, setDetails] = useState('');
    const [templates, setTemplates] = useState([]);
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    // get user list funcationalities
    const [userList, setUserList] = useState([]);
    const [activeConversationCount, setActiveConversationCount] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [file, setFile] = useState(null);
    const [activeConversation, setActiveConversation] = useState({
        conversationId: '',
        name: '',
        unique_facebook_id: '',
        image: '',
        status: '',
        messages: [],

    });
    const apiBaseUrl = NEXT_PUBLIC_API_BASE_URL;
    const token =NEXT_PUBLIC_API_TOKEN;
    const checkboxRef = useRef(null);

    useEffect(() => {
        const authTokenData = localStorage.getItem('auth-token');
        if (!authTokenData) {
            router.push('/login');
        } else {
            try {
                const { token, hash } = JSON.parse(authTokenData);
                const recalculatedHash = generateHash(token);
                if (recalculatedHash !== hash) {
                    localStorage.removeItem('auth-token');
                    router.push('/login');
                }
            } catch (error) {
                console.log(error);
                localStorage.removeItem('auth-token');
                router.push('/login');
            }
        }
    }, [router]);
    const sentimentOptions = [
        { value: '1', label: 'Positive' },
        { value: '2', label: 'Neutral' },
        { value: '3', label: 'Negative' },
    ];

    const handleMessageSubmit = async () => {
        const userID = activeConversation.unique_facebook_id;
        const isChecked = checkboxRef.current.checked;
        if (!userID) {
            console.error("userID is undefined");
            return;
        }
        if (!Message || Message.trim() === "") {
            toast.error('You can not sent an empty message!');
            return;
        }
        if (!sentiment) {
            toast.error('Sentiment cannot be null!');
            return;
        }

        const payload = {
            recipient: {
                id: userID,
            },
            message: {
                text: Message || "hello test",
            },
        };
        const authUserId = await getAuthUserId();
        const localPayload = {
            to: userID,
            message_content: Message,
            is_checked: isChecked,
            sentiment: sentiment?.value || null,
            assign_user_id : authUserId,
        };
        try {
            const response = await fetch(
                `${META_API_URL}/${PAGE_ID}/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );
            const data = await response.json();
            if (response.ok) {
                const endpoint = '/send-reply';
                const url = `${apiBaseUrl}${endpoint}`;
                const backendResponse = await axios.post(url, localPayload);
                if (backendResponse.status === 200) {
                    toast.success('Message sent Successfully!');
                    setMessage('');
                    if (isChecked) {
                        setIsActive(false);
                        checkboxRef.current.checked = false;
                    }
                    const newMessage = {
                        message_content: Message,
                        sender: 'You',
                        created_time: new Date().toISOString(),
                        isMe: true,
                        isCurrentMessage: true,
                    };
                    setActiveConversation(prevState => ({
                        ...prevState,
                        messages: [
                            ...prevState.messages,
                            newMessage,
                        ],
                    }));
                }
                else {
                    toast.error(`Error sending message to backend: ${backendResponse.data.error.message}`);
                }
            } else {
                toast.error(`Error sending message to Facebook: ${data.error.message}`);
            }
        } catch (error) {
            toast.error('Error sending message: ' + error.message);
            console.error('Error sending message:', error);
        }
    };

    const handleShow = async () => {
        setShowOffcanvas(true);
        await fetchMessageTemplate();
    };
    const fetchMessageTemplate = async () => {
        try {
            const authUserId = await getAuthUserId();
            const endpoint = `/message-Templates/${authUserId}`;
            const url = `${apiBaseUrl}${endpoint}`;
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 200) {
                setMessageTemplate(response.data.message_templates);
            } else {
                console.error("Unexpected response:", response);
            }
        } catch (error) {
            console.error("Error fetching message templates:", error.message);
        }
    };

    const handleClose = () => setShowOffcanvas(false);
    const handleCopyClick = () => {
        const commentIdInput = document.getElementById('commentId');
        const commentIdValue = commentIdInput.value;

        if (commentIdValue) {
            navigator.clipboard.writeText(commentIdValue).then(() => {
                alert('Copied to clipboard!');
            });
        }
    };

    const handlePaste = (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
            navigator.clipboard.readText().then((text) => {
                setPastedText(text);
            });
        }
    };

    const fetchData = async (userId) => {
        try {
            const endpoint = `/message-list/${userId}`;
            const url = `${apiBaseUrl}${endpoint}`;
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.data.success) {
                const conversationData = response.data.message_list;
                const userName = response.data.user_name;
                const senderId = response.data.sender_id;
                const unique_facebook_id = response.data.unique_facebook_id;
                setActiveConversation({
                    messages: conversationData,
                    name: userName,
                    image: "https://example.com/default-image.jpg",
                    status: "online",
                    senderId: senderId,
                    unique_facebook_id: unique_facebook_id,
                });
                setIsActive(true);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            if (error.response) {
                console.error("Response Error Data:", error.response.data);
            } else if (error.request) {
                console.error("No response received:", error.request);
            } else {
                console.error("Error Message:", error.message);
            }
        }
    };
    const handleBack = () => {
        setIsActive(false);
    };
    const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);

    const handleNumberCopyClick = (index, messageContent) => {
        const textarea = document.createElement('textarea');
        textarea.value = messageContent;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        setCopiedMessageIndex(index);
        setTimeout(() => setCopiedMessageIndex(null), 5000);
    };

    const containsDigits = (str) => /\d/.test(str);

    const [Message, setMessage] = useState('');
    const handleMessagesClick = (message) => {
        setShowOffcanvas(false);
        const textarea = document.querySelector('.conversation-form-input');
        const cursorPosition = textarea.selectionStart;
        const currentMessage = Message;
        const updatedMessage =
            currentMessage.slice(0, cursorPosition) + message + currentMessage.slice(cursorPosition);
        setMessage(updatedMessage);
        setTimeout(() => {
            textarea.setSelectionRange(cursorPosition + message.length, cursorPosition + message.length);
            textarea.focus();
        }, 0);
    };
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };
    const handleEditResponse = (templateId, shortValue, detailsValue) => {

        setShort(shortValue);
        setDetails(detailsValue);
        setEditingTemplateId(templateId);
        setIsEditing(true);
    };
    const handleTemplateCreateUpdate = async (e) => {
        e.preventDefault();
        if (!short || !details) {
            toast.error('Both fields are required... Please insert value.');
            return;
        }
        try {
            const authUserId = await getAuthUserId();
            const templateData = {
                user_id: authUserId,
                template_short: short,
                template_details: details,
            };
            if (isEditing) {
                const endpoint = `/template-create-or-update/${editingTemplateId}`;
                const url = `${apiBaseUrl}${endpoint}`;
                const response = await axios.post(url, templateData);
                if (response.status === 200) {
                    setMessageTemplate((prevTemplates) =>
                        prevTemplates.map((template) =>
                            template.id === editingTemplateId
                                ? {
                                    ...template,
                                    short: response.data.data.template_short,
                                    details: response.data.data.template_details,
                                }
                                : template
                        )
                    );
                    setIsEditing(false);
                    setEditingTemplateId(null);
                    setShowOffcanvas(false);
                    toast.success('Template Updated successfully!');
                }
            } else {
                const endpoint = `/template-create-or-update`;
                const url = `${apiBaseUrl}${endpoint}`;
                const response = await axios.post(url, templateData);
                if (response.status === 201) {
                    setMessageTemplate((prevTemplates) => [
                        ...prevTemplates,
                        { ...response.data.data },
                    ]);
                    toast.success('Template Created successfully!');
                }
            }
            setShort('');
            setDetails('');
        } catch (error) {
            console.error('Error while creating/updating template:', error);
            toast.error('An error occurred while processing the request.');
        }
    };
    const handleRemoveUser = async (uniqueFacebookId, e) => {
        e.preventDefault();
        try {
            const endpoint = `/remove-user/${uniqueFacebookId}`;
            const url = `${apiBaseUrl}${endpoint}`;
            const response = await axios.get(url);
            if (response.status === 200) {
                toast.success('Template Archive successfully!');
                setIsActive(false);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingTemplateId(null);
        setShort('');
        setDetails('');
    };
    const closeModal = () => {
        setShowModal(false);
        setModalContent('');
    };
    useEffect(() => {
        const fetchUserList = async () => {
            try {
                const authUserId = await getAuthUserId();
                const endpoint = `/user-list/${authUserId}`;
                const url = `${apiBaseUrl}${endpoint}`;
                const response = await axios.get(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                // console.log('User List:', response.data);
                const formattedUserList = response.data.message.map((user) => {
                    const messageLogs = Array.isArray(user.message_logs) ? user.message_logs : [];
                    const lastMessage = messageLogs.length > 0 ? messageLogs[messageLogs.length - 1] : null;

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        uniquefacebookId: user.unique_facebook_id,
                        updatedAt: user.updated_at,
                        messageLogsCount: messageLogs.length,
                        lastMessage: lastMessage ? lastMessage.message_content : null,
                        lastMessageTimestamp: lastMessage ? lastMessage.timestamp : null,
                        lastMessageReadStatus: lastMessage ? lastMessage.is_read : null,
                    };
                });
                setActiveConversationCount(response.data.count);
                setUserList(formattedUserList);
                // console.log('User List:', formattedUserList);
                setLoading(false);
            } catch (err) {
                setLoading(true);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUserList();
        const interval = setInterval(fetchUserList, 5000);
        return () => clearInterval(interval);
    }, [token]);

    const handleUserClick = (event, message) => {
        event.preventDefault();
        const uniquefacebookId = message.uniquefacebookId;
        const userId = message.id;
        if (!uniquefacebookId) {
            console.error("uniquefacebookId is missing!");
            return;
        }
        setUserId(userId);
        setIsActive(true);
    };
    useEffect(() => {
        if (isActive && userId !== null) {
            const interval = setInterval(() => {
                fetchData(userId);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [isActive, userId]);

    return (
        <section className="chat-section">
            <div className="chat-container">
                <ChatSidebar count={activeConversationCount} loading={loading} error={error} />
                <div className="chat-content">
                    {/* <ContentSidebar handleClick={handleClick} userList={userList} /> */}
                    <ContentSidebar
                        listType="user"
                        listData={userList} 
                        handleClick={handleUserClick}
                    />

                    <div className={`conversation conversation-default ${!isActive ? "active" : ""}`}>
                        <i className="ri-chat-3-line" />
                        <p>Select chat and view conversation!</p>
                    </div>
                    <div
                        className={`conversation ${isActive ? "active" : ""}`}
                    >
                        <div className="conversation-top">
                            <button type="button" className="conversation-back">
                                <i className="ri-arrow-left-line" />
                            </button>
                            <div className="conversation-user">
                                <div >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <ImageSlug name={activeConversation.name} />
                                        <div className="conversation-user-name">{activeConversation.name}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="conversation-main">
                            <ul className="conversation-wrapper">
                                {activeConversation && activeConversation.messages && (
                                    <>
                                        {activeConversation.messages.length > 0 ? (
                                            <>
                                                {activeConversation.messages.map((message, index) => (
                                                    <li key={index} className={`conversation-item ${message.isCurrentMessage ? "" : (message.unique_facebook_id !== null ? "me" : "")}`}>
                                                        <ImageSlug
                                                            name={message.unique_facebook_id === null ? 'Edu Tune' : activeConversation.name}
                                                        />
                                                        <div className="conversation-item-content">
                                                            <div className="conversation-item-wrapper">
                                                                <div className="conversation-item-box">
                                                                    <div className="conversation-item-text">
                                                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-start', alignItems: 'start' }}>
                                                                            <p style={{ marginBottom: '0', textAlign: 'justify' }}>{message.message_content}</p>
                                                                            {containsDigits(message.message_content) && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleNumberCopyClick(index, message.message_content)} // Pass the message index
                                                                                    className="conversation-form-button conversation-form-submit"
                                                                                    title="Copy to clipboard"
                                                                                    style={{ marginLeft: '5px' }}
                                                                                >
                                                                                    {message.name}
                                                                                    {/* Display FaCheck if the current message is copied, else FaCopy */}
                                                                                    {copiedMessageIndex === index ? <FaCheck /> : <FaCopy />}
                                                                                </button>
                                                                            )}
                                                                        </div>

                                                                        <div className="conversation-item-time">
                                                                            {new Date(message.created_time).toLocaleDateString('en-GB')} | <span> </span>
                                                                            {new Date(message.created_time).toLocaleTimeString('en-US', {
                                                                                hour: '2-digit',
                                                                                minute: '2-digit',
                                                                                second: '2-digit',
                                                                                hour12: true,
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </>
                                        ) : (
                                            <div>No messages yet</div>
                                        )}
                                    </>
                                )}
                            </ul>
                        </div>
                        <div>
                            <div>
                                <div className='col-lg-12' style={{ padding: '8px 16px', backgroundColor: '#fff', }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                                                <input
                                                    type="checkbox"
                                                    onClick={(e) => handleRemoveUser(activeConversation.unique_facebook_id, e)}
                                                    value={activeConversation.unique_facebook_id}
                                                    style={{
                                                        width: "20px",
                                                        height: "20px",
                                                        cursor: "pointer",
                                                        accentColor: "#4CAF50",
                                                        border: "2px solid #ccc",
                                                        borderRadius: "4px"
                                                    }}
                                                />
                                                <span style={{ marginLeft: "8px", fontSize: "14px", color: "#333" }}>Archive without message</span>
                                            </label>
                                        </div>

                                        <div>
                                            <FaEye className={styles.icon} onClick={handleShow} />
                                        </div>
                                        <Offcanvas show={showOffcanvas} onHide={handleClose} placement="end">
                                            <Offcanvas.Header closeButton>
                                            </Offcanvas.Header>
                                            <Offcanvas.Body>
                                                <div className="row">
                                                    <div className="col-lg-12">
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <div style={{ marginTop: '10px' }}>
                                                                    <input
                                                                        type="text"
                                                                        value={short}
                                                                        onChange={(e) => setShort(e.target.value)}
                                                                        placeholder="Enter your short template here..."
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '10px',
                                                                            border: '1px solid #ccc',
                                                                            borderRadius: '5px',
                                                                            fontSize: '14px',
                                                                            backgroundColor: '#f9f9f9',
                                                                        }}
                                                                    />
                                                                    <textarea
                                                                        value={details}
                                                                        onChange={(e) => setDetails(e.target.value)}
                                                                        rows={2}
                                                                        cols={50}
                                                                        placeholder="Enter your template details here..."
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '10px',
                                                                            border: '1px solid #ccc',
                                                                            borderRadius: '5px',
                                                                            fontSize: '14px',
                                                                            backgroundColor: '#f9f9f9',
                                                                            resize: 'vertical',
                                                                            marginTop: '10px',
                                                                        }}
                                                                    />
                                                                </div>

                                                                {/* Submit Button */}
                                                                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                                                    <button
                                                                        onClick={handleTemplateCreateUpdate}
                                                                        style={{
                                                                            padding: '5px 10px',
                                                                            backgroundColor: '#4CAF50',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '5px',
                                                                            cursor: 'pointer',
                                                                            fontSize: '16px',
                                                                        }}
                                                                    >
                                                                        {isEditing ? 'Update Template' : 'Create Template'}
                                                                    </button>
                                                                    {isEditing && (
                                                                        <button
                                                                            onClick={handleCancelEdit}
                                                                            style={{
                                                                                padding: '5px 10px',
                                                                                backgroundColor: '#f44336',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                borderRadius: '5px',
                                                                                cursor: 'pointer',
                                                                                fontSize: '16px',
                                                                            }}
                                                                        >
                                                                            Cancel Edit
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="card-body">
                                                                <h6>Quick Response</h6>
                                                                <div className="table-responsive mt-3">
                                                                    <table className="table table-bordered">
                                                                        <thead>
                                                                            <tr>
                                                                                <th style={{ width: '5%' }}>#</th>
                                                                                <th>Template</th>
                                                                                <th style={{ width: '10%', textAlign: 'center' }}>Actions</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {messageTemplate.map((messages, index) => (
                                                                                <tr key={messages.id}>
                                                                                    <td>{index + 1}</td>
                                                                                    <td
                                                                                        style={{ cursor: 'pointer' }}
                                                                                        onClick={() => handleMessagesClick(messages.template_details)} // Use template_details
                                                                                    >
                                                                                        <div className="d-flex align-items-center gap-2">
                                                                                            <FaAlignLeft style={{ fontSize: '18px' }} />
                                                                                            {messages.template_short}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td style={{ textAlign: 'center' }}>
                                                                                        <FaEdit
                                                                                            style={{ fontSize: '18px', cursor: 'pointer' }}
                                                                                            onClick={() =>
                                                                                                handleEditResponse(
                                                                                                    messages.id,
                                                                                                    messages.template_short,
                                                                                                    messages.template_details
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Offcanvas.Body>
                                        </Offcanvas>
                                    </div>
                                    {file && <p>{file.name}</p>}
                                </div>

                                <div className="conversation-form">
                                    <input
                                        type="text"
                                        id="user-id"
                                        readOnly
                                        hidden
                                        value={activeConversation.unique_facebook_id || ""}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                    <div className="conversation-form-group">
                                        <textarea
                                            className="conversation-form-input"
                                            rows={1}
                                            placeholder="Type here..."
                                            value={Message}
                                            onChange={(e) => setMessage(e.target.value)}
                                        />
                                        <button type="button" className="conversation-form-record">
                                            <i className="ri-mic-line" />
                                        </button>
                                    </div>
                                </div>
                                <div className='col-lg-12' style={{ padding: '8px 16px', backgroundColor: '#fff', }}>
                                    <div className='selectField' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '10px', }}>
                                        <SelectField
                                            isMulti={false}
                                            options={sentimentOptions}
                                            onChange={(selected) => {
                                                console.log('Selected sentiment:', selected);
                                                setSentiment(selected);
                                            }}
                                        />
                                        <input
                                            type="checkbox"
                                            data-title="Chats"
                                            style={{
                                                width: "80px",
                                                height: "38px",
                                                cursor: "pointer",
                                                accentColor: "#662d91",
                                                border: "2px solid rgb(204, 204, 204)",
                                                borderRadius: "4px",
                                            }}
                                            ref={checkboxRef}
                                        />
                                        <button
                                            type="button"
                                            className="conversation-form-button conversation-form-submit"
                                            onClick={handleMessageSubmit}
                                        >
                                            <i className="ri-send-plane-2-line" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {showModal && (
                                <div className="modal show d-block" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                                    <div className="modal-dialog modal-lg modal-dialog-centered">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title">{modalContent}</h5>
                                                <button type="button" className="btn-close" onClick={closeModal}></button>
                                            </div>
                                            <div className="modal-body">
                                                <p>Here you can {modalContent.toLowerCase()}.</p>
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                                    Close
                                                </button>
                                                <button type="button" className="btn btn-primary">
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Chat



