"use client"
import React, { useEffect, useRef, useState } from 'react'
import "../globals.css";
import MessageItem from "@/components/Message/MessagesList";
import ChatSidebar from "@/components/Sidebar/ChatSidebar";
import SelectField from '@/components/Select/Select';
import { Image, Offcanvas } from 'react-bootstrap';
import { FaAlignLeft, FaBookmark, FaCheck, FaClipboard, FaComment, FaCopy, FaEdit, FaEnvelope, FaEye, FaGripVertical, FaLevelDownAlt, FaPaperclip, FaPlus, FaRegClock, FaRegSmile, FaSearch, FaShareAlt, FaTimes, FaTrashAlt, FaUserPlus } from 'react-icons/fa';
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
import Pusher from 'pusher-js';
import FileUploadModal from '@/components/FileUpload/FileUploadModal';


const Chat = () => {
    const router = useRouter();

    const [sentiment, setSentiment] = useState(null);
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [messageTemplate, setMessageTemplate] = useState([]);
    const [isActive, setIsActive] = useState(false);
    const [userId, setUserId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [short, setShort] = useState('');
    const [details, setDetails] = useState('');
    const [templates, setTemplates] = useState([]);
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [isMessageDisabled, setIsMessageDisabled] = useState(false);

    // get user list funcationalities
    const [userList, setUserList] = useState([]);
    const [activeConversationCount, setActiveConversationCount] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [activeConversation, setActiveConversation] = useState({
        conversationId: '',
        name: '',
        unique_facebook_id: '',
        image: '',
        status: '',
        messages: [],

    });
    const apiBaseUrl = NEXT_PUBLIC_API_BASE_URL;
    const token = NEXT_PUBLIC_API_TOKEN;
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

        if (!isValidMessage(userID, Message, sentiment)) return;

        const authUserId = await getAuthUserId();
        const localPayload = createLocalPayload(userID, authUserId, isChecked);

        try {
            const payload = await createMessagePayload(userID);
            const response = await sendMessageToFacebook(payload);

            if (response.ok) {
                const backendResponse = await sendMessageToBackend(localPayload);
                if (backendResponse.status === 200) {
                    handleSuccess();
                } else {
                    handleError(backendResponse.data.error.message, 'backend');
                }
            } else {
                handleError(response.data.error.message, 'Facebook');
            }
        } catch (error) {
            handleError(error.message, 'general');
        }
    };

    // Helper function to validate message and sentiment
    const isValidMessage = (userID, message, sentiment) => {
        if (!userID) {
            console.error("userID is undefined");
            return false;
        }
        if (!file) {
            if (!message || message.trim() === "") {
                toast.error('You cannot send an empty message!');
                return false;
            }
        }
        if (!sentiment) {
            toast.error('Sentiment cannot be null!');
            return false;
        }
        return true;
    };

    // Helper function to create the local payload
    const createLocalPayload = (userID, authUserId, isChecked) => ({
        to: userID,
        message_content: Message,
        is_checked: isChecked,
        sentiment: sentiment?.value || null,
        assign_user_id: authUserId,
        total_time: timeElapsed,
    });

    // Helper function to create the message payload
    const createMessagePayload = async (userID) => {
        let payload;
        if (file) {
            const fileUploadData = await uploadFile();
            payload = {
                recipient: { id: userID },
                message: {
                    attachment: {
                        type: "file",
                        payload: { attachment_id: fileUploadData.attachment_id },
                    },
                },
            };
        } else {
            payload = {
                recipient: { id: userID },
                message: { text: Message || "hello test" },
                tag: "post_purchase_update",
            };
        }
        return payload;
    };

    // Helper function to handle file upload
    const uploadFile = async () => {
        const message_content = {
            attachment: { type: "file", payload: {} },
        };

        const fileFormData = new FormData();
        fileFormData.append("file", file);
        fileFormData.append("message", JSON.stringify(message_content));

        const fileUploadResponse = await fetch(
            `${META_API_URL}/${PAGE_ID}/message_attachments?access_token=${PAGE_ACCESS_TOKEN}`,
            { method: 'POST', body: fileFormData }
        );

        return await fileUploadResponse.json();
    };

    // Helper function to send message to Facebook
    const sendMessageToFacebook = async (payload) => {
        return await fetch(
            `${META_API_URL}/${PAGE_ID}/messages?access_token=${PAGE_ACCESS_TOKEN}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );
    };

    // Helper function to send message to backend
    const sendMessageToBackend = async (localPayload) => {
        const endpoint = '/send-reply';
        const url = `${apiBaseUrl}${endpoint}`;
        return await axios.post(url, localPayload);
    };

    // Helper function to handle success after sending message
    const handleSuccess = () => {
        toast.success('Message sent successfully!');
        setMessage('');
        resetFormState();
        updateMessages();
    };

    // Helper function to reset form state after successful submission
    const resetFormState = () => {
        if (checkboxRef.current.checked) {
            setIsActive(false);
            checkboxRef.current.checked = false;
        }
    };

    // Helper function to update the conversation messages
    const updateMessages = () => {
        const newMessage = {
            message_content: Message,
            sender: 'You',
            created_time: new Date().toISOString(),
            isMe: true,
            isCurrentMessage: true,
        };
        setActiveConversation(prevState => ({
            ...prevState,
            messages: [...prevState.messages, newMessage],
        }));
        fetchUserList();
        setUserId("");
    };

    const updateMessagesWithFile = (fileType) => {
        const newMessage = {
            message_content: fileType,
            sender: 'You',
            created_time: new Date().toISOString(),
            isMe: true,
            isCurrentMessage: true,
        };

        setActiveConversation(prevState => ({
            ...prevState,
            messages: [...prevState.messages, newMessage],
        }));
        
        fetchUserList();
        resetFormState();
    };

    // Helper function to handle errors
    const handleError = (errorMessage, source) => {
        toast.error(`Error sending message to ${source}: ${errorMessage}`);
        console.error(`Error sending message: ${errorMessage}`);
    };


    const handleShow = async () => {
        setShowOffcanvas(true);
        await fetchMessageTemplate();
    };
    const handleNewLine = () => {
        const textarea = document.querySelector('.conversation-form-input');
        const cursorPos = textarea.selectionStart;
        const newMessage = Message.slice(0, cursorPos) + "\n" + Message.slice(cursorPos);
        setMessage(newMessage);

        // Move the cursor after the new line
        setTimeout(() => {
            textarea.selectionStart = cursorPos + 2;
            textarea.selectionEnd = cursorPos + 2;
        }, 0);
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

    // Function to fetch data
    const fetchData = async (userId) => {
        // console.log(userId);
        if (!userId) {
            // console.error("Invalid userId:", userId);
            return;
        }

        try {
            const endpoint = `/message-list/${userId}`;
            const url = `${apiBaseUrl}${endpoint}`;
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            // console.log(response);
            if (response.data.success) {
                const conversationData = response.data.message_list;
                const userName = response.data.user_name;
                const senderId = response.data.sender_id;
                const unique_facebook_id = response.data.unique_facebook_id;
                const is_follow_up = response.data.is_follow_up;

                // Set the initial conversation data
                setActiveConversation({
                    messages: conversationData,
                    name: userName,
                    image: "https://example.com/default-image.jpg",
                    status: "online",
                    senderId: senderId,
                    unique_facebook_id: unique_facebook_id,
                    is_follow_up: is_follow_up,
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

    // Set up Pusher to listen for new messages
    useEffect(() => {
        // if (userId) {
        //     fetchData(userId); // Only fetch data once when userId is available
        // }

        // Initialize Pusher
        const pusher = new Pusher('6eab3a7f6ae405c21841', {
            cluster: 'ap2',
            forceTLS: true,
        });

        // Subscribe to the channel
        const channel = pusher.subscribe('facebook-notification');

        // Bind the event to update the conversation when a new message comes in
        channel.bind('facebook.notification', (data) => {
            // alert('okk');
            console.log('Received :', data);
            
            // console.log('fetch user list');
            // console.log('Comparing unique_facebook_id:', data.unique_facebook_id, 'with', activeConversation?.unique_facebook_id);
            // Check if the unique Facebook ID matches

            if (data.unique_facebook_id !== 'undefined' && data.unique_facebook_id !== '111074608141788') {
                if (data.unique_facebook_id === activeConversation?.unique_facebook_id) {
                    // alert('okk');
                    console.log('if');
                    // console.log('Matching conversation found.');

                    // Add the new message to the conversation
                    setActiveConversation((prevConversation) => {
                        const updatedConversation = {
                            ...prevConversation,
                            messages: [...prevConversation.messages, data.message_list],
                        };
                        // console.log('Updated conversation:', updatedConversation);
                        return updatedConversation;
                    });

                    // console.log('Messages after update:', activeConversation?.messages);

                    // Fetch the updated data from the API to get the latest messages
                    // console.log('Fetching data for user ID:', userId);
                    // console.log('fetch user list');
                    fetchData(userId);
                    fetchUserList();

                    // Optionally show a Toastr notification
                    // console.log(`Showing Toastr notification: New message from ${data.user_name}`);
                    toast.success(`New Message from ${data.user_name}`, `New Message`, {
                        autoClose: 100000,
                        hideProgressBar: false,
                        closeOnClick: false,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                    });

                } else {
                    // console.log('else');
                    fetchUserList();
                    // console.log('No matching conversation found.');
                    toast.success(`New Message from ${data.user_name}`, `New Message`, {
                        autoClose: 100000,
                        hideProgressBar: false,
                        closeOnClick: false,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                    });

                }
            }

        });

        // Clean up when component unmounts
        return () => {
            pusher.unsubscribe('facebook-notification');
        };
    }, [userId, activeConversation?.unique_facebook_id]);

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
                setIsActive(false);
                fetchUserList();
                toast.success('Archive successfully!');

            }
        } catch (error) {
            console.error('Error:', error);
        }
    };
    const handleFollowUp = async (uniqueFacebookId, e) => {
        e.preventDefault();
        try {
            const endpoint = `/manage-follow-up/${uniqueFacebookId}`;
            const url = `${apiBaseUrl}${endpoint}`;
            const response = await axios.get(url);
            if (response.status === 200) {
                toast.success('Successfully add to Follow Up');
            }
        }
        catch (error) {
            console.error('Error:', error);
        }
    }
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingTemplateId(null);
        setShort('');
        setDetails('');
    };
    const fetchUserList = async () => {
        try {
            const authUserId = await getAuthUserId();
            // console.log('Auth User ID:', authUserId);
            const endpoint = `/user-list/${authUserId}`;
            const url = `${apiBaseUrl}${endpoint}`;
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            // console.log('response:', response);
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
            // console.log('User List:', formattedUserList);
            // console.log(formattedUserList);
            setActiveConversationCount(response.data.count);
            setUserList(formattedUserList);
            setLoading(false);
        } catch (err) {
            setLoading(true);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserList();
    }, [token]);

    const handleUserClick = (event, message) => {
        event.preventDefault();
        const uniquefacebookId = message.uniquefacebookId;
        const userId = message.id;

        if (!uniquefacebookId) {
            console.error("uniquefacebookId is missing!");
            return;
        }
        if (userId !== currentUserId) {
            setUserId(userId);
            setIsActive(true);
            setTimeElapsed(0);
        } else {
            setIsActive(true);
        }

        fetchData(userId);
        setCurrentUserId(userId);
    };

    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        let timerTimeout;
        let fetchTimeout;
        const fetchDataInterval = 4000;
        const timerInterval = 1000;

        if (isActive && userId !== null) {
            const updateTime = () => {
                setTimeElapsed(prevTime => prevTime + 1);
                timerTimeout = setTimeout(updateTime, timerInterval);
            };

            // const fetchDataAtInterval = () => {
            //     fetchData(userId);
            //     fetchTimeout = setTimeout(fetchDataAtInterval, fetchDataInterval);
            // };
            updateTime();
            // fetchDataAtInterval();
        }

        // Cleanup function
        return () => {
            clearTimeout(timerTimeout);
            clearTimeout(fetchTimeout);
        };
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
                            <div className="conversation-user" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <ImageSlug name={activeConversation.name} />
                                        <div className="conversation-user-name">{activeConversation.name}</div>
                                    </div>
                                    <div style={{ color: 'green', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <FaRegClock /> <span style={{ fontWeight: 'bold' }}>Time tracking started... </span> <div style={{ display: 'none' }}> {timeElapsed}</div>
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
                                                            name={message && message.unique_facebook_id === null ? 'Edu Tune' : activeConversation?.name}
                                                        />

                                                        <div className="conversation-item-content">
                                                            <div className="conversation-item-wrapper">
                                                                <div className="conversation-item-box">
                                                                    <div className="conversation-item-text">
                                                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-start', alignItems: 'start' }}>
                                                                            {message.unique_facebook_id !== null ? (
                                                                                message.message_type === 'text' ? (
                                                                                    <>
                                                                                        <p style={{ marginBottom: 0, textAlign: 'justify' }}>
                                                                                            {message.message_content || 'No content available'}
                                                                                        </p>
                                                                                        {containsDigits(message.message_content) && (
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleNumberCopyClick(index, message.message_content)}
                                                                                                className="conversation-form-button conversation-form-submit"
                                                                                                title="Copy to clipboard"
                                                                                                style={{ marginLeft: '5px' }}
                                                                                            >
                                                                                                {message.name}
                                                                                                {copiedMessageIndex === index ? <FaCheck /> : <FaCopy />}
                                                                                            </button>
                                                                                        )}
                                                                                    </>
                                                                                ) : message.message_type === 'image' ? (
                                                                                    <img
                                                                                        src={message.message_content}
                                                                                        alt="Message Image"
                                                                                        style={{ maxWidth: '100%', height: 'auto', marginBottom: '10px' }}
                                                                                    />
                                                                                ) : message.message_type === 'audio' ? (
                                                                                    <audio controls style={{ marginBottom: '10px' }}>
                                                                                        <source src={message.message_content} type="audio/mpeg" />
                                                                                        Your browser does not support the audio element.
                                                                                    </audio>
                                                                                ) : message.message_type === 'video' ? (
                                                                                    <video controls style={{ maxWidth: '100%', marginBottom: '10px' }}>
                                                                                        <source src={message.message_content} type="video/mp4" />
                                                                                        Your browser does not support the video tag.
                                                                                    </video>
                                                                                ) : message.message_type === 'file' ? (
                                                                                    <a
                                                                                        href={message.message_content}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        style={{ color: 'white', textDecoration: 'none' }}
                                                                                    >
                                                                                        Download File
                                                                                    </a>
                                                                                ) : (
                                                                                    <p style={{ marginBottom: 0, textAlign: 'justify', color: 'gray' }}>
                                                                                        Unsupported message type.
                                                                                    </p>
                                                                                )
                                                                            ) : (
                                                                                <p style={{ marginBottom: 0, textAlign: 'justify' }}>
                                                                                    {message.message_content || 'No content available'}
                                                                                </p>
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
                                        <div style={{ display: "flex", justifyContent: 'space-between', gap: '24px' }}>
                                            <FaLevelDownAlt
                                                className={styles.icon}
                                                onClick={handleNewLine}
                                                data-title="Add New Line"
                                                title="Add New Line"
                                            />
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

                                            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                                                {activeConversation.is_follow_up === 0 && (
                                                    <input
                                                        type="checkbox"
                                                        onClick={(e) => handleFollowUp(activeConversation.unique_facebook_id, e)}
                                                        value={activeConversation.is_follow_up}
                                                        style={{
                                                            width: "20px",
                                                            height: "20px",
                                                            cursor: "pointer",
                                                            accentColor: "#4CAF50",
                                                            border: "2px solid #ccc",
                                                            borderRadius: "4px"
                                                        }}
                                                    />
                                                )}
                                                <span
                                                    style={{
                                                        marginLeft: activeConversation.is_follow_up === 0 ? "8px" : "0",
                                                        fontSize: "14px",
                                                        color: activeConversation.is_follow_up === 0 ? "#333" : "red"
                                                    }}
                                                >
                                                    {activeConversation.is_follow_up === 0 ? "Add to Follow Up" : "Already added to Follow Up"}
                                                </span>
                                            </label>


                                        </div>

                                        <div style={{ display: 'flex', gap: '10px' }}>

                                            {/* <FaPlus className={styles.icon} onClick={handleNewLine}/> */}
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
                                                                        rows={3}
                                                                        cols={50}
                                                                        placeholder="Enter your template details here... If you Want to add new line use \n where you want to break the line."
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
                                                                                        onClick={() => handleMessagesClick(messages.template_details)}
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
                                    {file && (
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                marginTop: "10px",
                                            }}
                                        >
                                            <p style={{ margin: '0 10px' }}>{file.name}</p>
                                            <FaTimes
                                                style={{
                                                    cursor: "pointer",
                                                    color: "red",
                                                }}
                                                onClick={handleFileDelete}
                                            />
                                        </div>
                                    )}
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
                                            placeholder="Type here.."
                                            value={Message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            disabled={isMessageDisabled}
                                        />
                                    </div>
                                </div>
                                <div className='col-lg-12' style={{ padding: '8px 16px', backgroundColor: '#fff', }}>
                                    <div className='selectField' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', }}>
                                        <FileUploadModal userId={userId} facebookId={activeConversation.unique_facebook_id} fileUploadSuccess={updateMessagesWithFile} setIsActive={setIsActive} />
                                        <SelectField
                                            isMulti={false}
                                            options={sentimentOptions}
                                            onChange={(selected) => {
                                                // console.log('Selected sentiment:', selected);
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
                                                accentColor: "#00a884",
                                                border: "2px solid rgb(204, 204, 204)",
                                                borderRadius: "4px",
                                            }}
                                            ref={checkboxRef}
                                            defaultChecked={true}
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

                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Chat
