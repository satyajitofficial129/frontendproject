"use client";
import ChatSidebar from '@/components/Sidebar/ChatSidebar';
import ContentSidebar from '@/components/Sidebar/ContentSidebar';
import React, { useEffect, useState } from 'react';
import { Image, Offcanvas } from 'react-bootstrap';
import axios from 'axios';
import { META_API_URL, NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_API_TOKEN, PAGE_ACCESS_TOKEN, PAGE_ID } from '@/utils/settings';
import ImageSlug from '@/components/ImageSlug';
import SelectField from '@/components/Select/Select';
import { FaAlignLeft, FaComment, FaEdit, FaEye, FaLevelDownAlt } from 'react-icons/fa';
import styles from '@/styles/Comment.module.css';
import { toast } from 'react-toastify';
import getAuthUserId from '@/utils/getAuthUserId';

const Comment = () => {
    const [commentList, setCommentList] = useState([]);
    const [commentInfo, setCommentInfo] = useState({});
    const [postDetails, setPostDetails] = useState({});
    const [isActive, setIsActive] = useState(false);
    const [short, setShort] = useState('');
    const [details, setDetails] = useState('');
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [messageTemplate, setMessageTemplate] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [Message, setMessage] = useState('');
    const [commentMessage, setCommentMessage] = useState('');
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [sentiment, setSentiment] = useState(null);
    const [showMessageTextarea, setShowMessageTextarea] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [error, setError] = useState(null);
    const apiBaseUrl = NEXT_PUBLIC_API_BASE_URL;
    const token = NEXT_PUBLIC_API_TOKEN;


    useEffect(() => {
        const commentList = async () => {
            try {
                const authUserId = await getAuthUserId();
                const response = await axios.get(`${apiBaseUrl}/user-comment-list/${authUserId}`);
                // console.log(response.data);
                const formattedCommentList = response.data.map(comment => ({
                    commentId: comment.comment_id,
                    createdAt: comment.created_at,
                    createdTime: comment.created_time,
                    fromId: comment.from_id,
                    fromName: comment.from_name,
                    message: comment.message,
                    parentPostId: comment.parent_post_id,
                    postId: comment.post_id,
                    uniqueFacebookId: comment.unique_facebook_id,
                    updatedAt: comment.updated_at,
                    user: {
                        id: comment.user?.id,
                        name: comment.user?.name,
                        email: comment.user?.email,
                        uniqueFacebookId: comment.user?.unique_facebook_id,
                        commentArchive: comment.user?.comment_archive,
                        conversationAssignBefore: comment.user?.conversation_assign_before,
                        conversationAssignTo: comment.user?.conversation_assign_to,
                        createdAt: comment.user?.created_at,
                        done: comment.user?.done,
                        emailVerifiedAt: comment.user?.email_verified_at,
                        updatedAt: comment.user?.updated_at,
                    },
                    parent: {
                        fromName: comment.parent?.from_name,
                        parentComment: comment.parent?.message,
                        parentCommentCreatedAt: comment.parent?.created_time,
                    },
                    userId: comment.user_id,
                    verb: comment.verb,
                }));
                setCommentList(formattedCommentList);
            } catch (err) {
                setError(err.message);
            }
        };
        commentList();
        const interval = setInterval(commentList, 5000);

        return () => clearInterval(interval);
    }, [apiBaseUrl, token]);

    const sentimentOptions = [
        { value: '1', label: 'Positive' },
        { value: '2', label: 'Neutral' },
        { value: '3', label: 'Negative' },
    ];

    const handleCommentClick = async (event, comment) => {
        // console.log("Comment: ", comment);
        event.preventDefault();
        const postId = comment.postId;

        setCommentInfo(comment);
        const url = `${META_API_URL}/${postId}?fields=full_picture,picture,message,created_time,story,attachments&access_token=${PAGE_ACCESS_TOKEN}`;
        try {
            const response = await axios.get(url);
            setIsActive(true);
            setPostDetails(response.data);
        } catch (error) {
            console.error("Error fetching post details: ", error.message);
        }
    };

    const handleMessageTemplateShow = async () => {
        // console.log("Show message template");
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
                    toast.success('Template updated successfully!');
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
                    toast.success('Template created successfully!');
                }
            }
            setShort('');
            setDetails('');
        } catch (error) {
            console.error('Error while creating/updating template:', error);
            toast.error('An error occurred while processing the request.');
        }
    };
    const handleMessagesClick = (message, index) => {
        const checkbox = document.getElementById(`checkbox-${index}`);

        if (checkbox && checkbox.checked) {
        } else {
            console.log('Checkbox is not checked');
        }

        setShowOffcanvas(false);

        const textareas = document.querySelectorAll('.conversation-form-input');
        const primaryTextarea = textareas[0];
        const secondaryTextarea = textareas[1] && showMessageTextarea ? textareas[1] : null;

        const insertMessage = (textarea, message) => {
            const cursorPosition = textarea.selectionStart || 0;
            const currentMessage = textarea.value || '';
            const updatedMessage =
                currentMessage.slice(0, cursorPosition) + message + currentMessage.slice(cursorPosition);

            textarea.value = updatedMessage;

            setTimeout(() => {
                textarea.setSelectionRange(
                    cursorPosition + message.length,
                    cursorPosition + message.length
                );
                textarea.focus();
            }, 0);
        };
        if (checkbox && checkbox.checked && secondaryTextarea) {
            if (secondaryTextarea) {
                insertMessage(secondaryTextarea, message);
                setCommentMessage(secondaryTextarea.value);
            } else {
                console.error('Secondary textarea not available');
            }
        } else {
            if (primaryTextarea && primaryTextarea.value && secondaryTextarea && !secondaryTextarea.value) {
                insertMessage(secondaryTextarea, message);
                setCommentMessage(secondaryTextarea.value);
            } else if (primaryTextarea) {
                insertMessage(primaryTextarea, message);
                setMessage(primaryTextarea.value);
            }
        }
    };

    const handleEditResponse = (templateId, shortValue, detailsValue) => {

        setShort(shortValue);
        setDetails(detailsValue);
        setEditingTemplateId(templateId);
        setIsEditing(true);
    };
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingTemplateId(null);
        setShort('');
        setDetails('');
    };

    const handleMessageClick = () => {
        setCommentMessage("");
        setShowMessageTextarea(prevState => !prevState);
    }
    const handleCommentSubmit = async () => {
        const userId = commentInfo.uniqueFacebookId;
        const commentId = commentInfo.commentId;
        let  messageBody = Message;
        const replyMessage = showMessageTextarea ? commentMessage : null;

        // Validate input
        if (!messageBody || messageBody.trim() === "") {
            toast.error('You cannot send an empty comment!');
            return;
        }
        if (!commentId) {
            toast.error('Invalid comment ID.');
            return;
        }
        if (!sentiment) {
            toast.error('Sentiment cannot be null!');
            return;
        }
        if (!userId && replyMessage) {
            toast.error('User ID is required to send a reply.');
            return;
        }
        // Append user mention to the message
        messageBody = `@[${userId}] ${messageBody}`;

        try {
            const response = await axios.post(
                `${META_API_URL}/${commentId}/comments`,
                null,
                {
                    params: {
                        message: messageBody,
                        access_token: PAGE_ACCESS_TOKEN,
                    },
                }
            );
            if (response.status === 200) {
                await updateBackendComment(commentId , sentiment?.value || null);
                if (replyMessage) {
                    await sendReplyMessage(userId, replyMessage);
                }
                toast.success('Comment submitted successfully!');
                // console.log('Response:', response.data);
            } else {
                toast.error('Failed to submit the comment. Please try again.');
            }
        } catch (error) {
            handleError('Error submitting the comment', error);
        }
    };

    // Utility to update backend comment
    const updateBackendComment = async (commentId, sentiment) => {
        try {
            // console.log('Sentiment:', sentiment);
            const endpoint = '/update-comment';
            const url = `${apiBaseUrl}${endpoint}`;
            const requestData = {
                id: commentId ,
                sentiment: sentiment ?? null,
            };
            // console.log('Request data:', requestData);
            const backendResponse = await axios.post(url, requestData);
            // console.log(backendResponse.data.message);
            toast.success('Task Done successfully!');
            resetState();
            setIsChecked(false);
        } catch (error) {
            console.log(error);
            handleError('Error updating backend comment', error);
        }
    };

    // Utility to send a reply message
    const sendReplyMessage = async (userId, replyMessage) => {
        const payload = {
            recipient: {
                id: userId 
            },
            message: { 
                text: replyMessage 
            },
            tag: "post_purchase_update",
        };

        try {
            const messageResponse = await fetch(
                `${META_API_URL}/${PAGE_ID}/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );

            if (messageResponse.ok) {
                toast.success('Reply message sent successfully!');
            } else {
                const errorData = await messageResponse.json();
                console.error('Failed to send reply:', errorData);
                toast.error('Failed to send the reply message.');
            }
        } catch (error) {
            handleError('Error sending reply message', error);
        }
    };
    const saveSentiment = async () => {

    }
    const handleNewLine = () => {
        if (!showMessageTextarea) return;
        const textarea = document.querySelector('.conversation-form-group:nth-child(2) .conversation-form-input');
        if (!textarea) return;
    
        const cursorPos = textarea.selectionStart;
        const newMessage = commentMessage.slice(0, cursorPos) + "\n" + commentMessage.slice(cursorPos);
        setCommentMessage(newMessage);
        setTimeout(() => {
            textarea.selectionStart = cursorPos + 1;
            textarea.selectionEnd = cursorPos + 1;
        }, 0);
    };
    

    // Utility to handle errors
    const handleError = (message, error) => {
        console.error(message, error.response?.data || error);
        toast.error(message);
    };

    // Utility to reset state
    const resetState = () => {
        setIsActive(false);
        setMessage('');
        setCommentMessage('');
        setShowMessageTextarea(false);
    };
    if (error) return <p>Error: {error}</p>;

    return (
        <section className="chat-section">
            <div className="chat-container">
                <ChatSidebar />
                <div className="chat-content">
                    <ContentSidebar
                        listType="comment"
                        listData={commentList}
                        handleClick={handleCommentClick}
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
                                        <ImageSlug name={commentInfo.fromName} />
                                        <div className="conversation-user-name">{commentInfo.fromName}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="conversation-main">
                            <div className='row'>

                                <div className='col-lg-6'>
                                    <ul className="conversation-wrapper">
                                        {commentInfo.parent && commentInfo.parent.parentComment !== undefined && (
                                            <li className="conversation-item me">
                                                <div className="conversation-item-content">
                                                    <div className="conversation-item-wrapper">
                                                        <div className="conversation-item-box">
                                                            <div className="conversation-item-text">
                                                                <p
                                                                    style={{ borderBottom: '1px solid #ddd' }}
                                                                >
                                                                    {commentInfo.parent.fromName}
                                                                </p>
                                                                <p className='mt-2 ' >
                                                                    <b>{commentInfo.parent.parentComment}</b>
                                                                </p>
                                                                <div className="conversation-item-time">{commentInfo.parent.parentCommentCreatedAt}</div>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        )}

                                        <li className={`conversation-item ${commentInfo.parent?.parentComment === undefined ? 'me' : ''}`}>
                                            <div className="conversation-item-content">
                                                <div className="conversation-item-wrapper">
                                                    <div className="conversation-item-box">
                                                        <div className="conversation-item-text">
                                                            <p style={{ borderBottom: '1px solid #000' }}>{commentInfo.fromName}</p>

                                                            <p>
                                                                <b>{commentInfo.message}</b>
                                                            </p>
                                                            <div className="conversation-item-time">{commentInfo.createdTime}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>

                                    </ul>
                                </div>
                                <div className='col-lg-6'>
                                    <div className="conversation-middle" style={{ borderRadius: '0', overflow: 'hidden', backgroundColor: '#f9f9f9', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                                        <div className="conversation-middle-content" style={{ display: 'flex', alignItems: 'start', padding: '20px', gap: '10px', flexDirection: 'column-reverse' }}>
                                            <div className="conversation-middle-content-text" style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#333', lineHeight: '1.5', textAlign: 'justify' }}>
                                                {postDetails.message}
                                            </div>
                                            <div className="conversation-middle-content-image" style={{ height: '150px', width: 'auto', borderRadius: '8px', overflow: 'hidden' }}>
                                                {postDetails.full_picture && (
                                                    <img
                                                        src={postDetails.full_picture}
                                                        alt="Post"
                                                        style={{ height: '100%', width: 'auto', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='col-lg-12' style={{ padding: '8px 16px', backgroundColor: '#fff', }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <FaLevelDownAlt 
                                        className={styles.icon} 
                                        onClick={handleNewLine} 
                                        data-title="Add New Line" 
                                        title="Add New Line"
                                    />
                                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => updateBackendComment(commentInfo.commentId, null)}>
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => setIsChecked(!isChecked)}
                                            style={{
                                                width: "20px",
                                                height: "20px",
                                                cursor: "pointer",
                                                accentColor: "#4CAF50",
                                                border: "2px solid #ccc",
                                                borderRadius: "4px"
                                            }}
                                        />
                                        <span style={{ marginLeft: "8px", fontSize: "14px", color: "#333" }} >Archive without Comment</span>
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div><FaComment onClick={handleMessageClick} className={styles.icon} /></div>
                                    <div><FaEye className={styles.icon} onClick={handleMessageTemplateShow} /></div>
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
                                                                        <th>M</th>
                                                                        <th style={{ width: '10%', textAlign: 'center' }}>Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {messageTemplate.map((messages, index) => (
                                                                        <tr key={messages.id}>
                                                                            <td>{index + 1}</td>
                                                                            <td
                                                                                style={{ cursor: 'pointer' }}
                                                                                onClick={() => handleMessagesClick(messages.template_details, index)}
                                                                            >
                                                                                <div className="d-flex align-items-center gap-2">
                                                                                    <FaAlignLeft style={{ fontSize: '18px' }} />
                                                                                    {messages.template_short.length > 20
                                                                                        ? `${messages.template_short.substring(0, 20)}...`
                                                                                        : messages.template_short}
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                <input type="checkbox" id={`checkbox-${index}`} />
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
                        </div>
                        <div className="conversation-form" style={{ display: 'flex', gap: '5px' }}>
                            <div className="conversation-form-group">
                                <textarea
                                    className="conversation-form-input"
                                    rows={1}
                                    placeholder="Type Comment here..."
                                    value={Message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                                <button type="button" className="conversation-form-record">
                                    <i className="ri-mic-line" />
                                </button>
                            </div>
                            {showMessageTextarea && (
                                <div className="conversation-form-group">
                                    <textarea
                                        className="conversation-form-input"
                                        rows={1}
                                        placeholder="Type Message here..."
                                        value={commentMessage}
                                        onChange={(e) => setCommentMessage(e.target.value)}
                                    />
                                    <button type="button" className="conversation-form-record">
                                        <i className="ri-mic-line" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className='col-lg-12' style={{ padding: '8px 16px', backgroundColor: '#fff', }}>
                            <div className='selectField' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '10px', }}>
                                <SelectField
                                    isMulti={false}
                                    options={sentimentOptions}
                                    onChange={(selected) => {
                                        // console.log('Selected sentiment:', selected);
                                        setSentiment(selected);
                                    }}
                                />

                                <button
                                    type="button"
                                    className="conversation-form-button conversation-form-submit"
                                    onClick={handleCommentSubmit}
                                >
                                    <i className="ri-send-plane-2-line" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Comment;
