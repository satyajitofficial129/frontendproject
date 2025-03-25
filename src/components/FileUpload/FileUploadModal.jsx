import React, { useEffect, useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import getAuthUserId from '@/utils/getAuthUserId';
import axios from 'axios';
import { META_API_URL, NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_API_TOKEN, PAGE_ACCESS_TOKEN, PAGE_ID } from '@/utils/settings';
import { toast } from "react-toastify";

const FileUploadModal = ({ userId , facebookId , fileUploadSuccess, setIsActive }) => {
    useEffect(() => {
    }, [userId,facebookId]);
    const [showModal, setShowModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [fileType, setFileType] = useState("image");
    const [fileTypeName, setFileTypeName] = useState('');
    const apiBaseUrl = NEXT_PUBLIC_API_BASE_URL;

    const handleFileClick = () => setShowModal(true);

    const closeModal = () => {
        setShowModal(false);
        resetFile();
        setIsActive(false);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        
        if (file) {
            setSelectedFile(file);
            const fileType = file.type.startsWith("image")
                ? "image"
                : file.type.startsWith("audio")
                ? "audio"
                : file.type.startsWith("video")
                ? "video"
                : "file";
    
            setFileType(fileType);
            if (fileType === "image") {
                setFilePreview(URL.createObjectURL(file));
            } else {
                setFilePreview(file.name);
            }
        }
    };
    const resetFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        document.getElementById("fileInput").value = "";
    };

    const handleUploadFile = async (userID) => {
        if (!isValidMessage(facebookId, fileTypeName)) return;
        const authUserId = await getAuthUserId();
        const localPayload = createLocalPayload(facebookId, fileTypeName, authUserId);
        try {
            const payload = await createMessagePayload(userID);
            const response = await sendMessageToFacebook(payload);
            console.log(response);
            if (response.ok) {
                try {
                    const endpoint = '/send-file-reply';
                    const url = `${apiBaseUrl}${endpoint}`;
                    const backendResponse = await axios.post(url, localPayload);
                    console.log(backendResponse);
            
                    if (backendResponse.status === 200) {
                        fileUploadSuccess(backendResponse.data.data.message_content);
                        resetFile();
                        closeModal();
                    } else {
                        handleError(backendResponse.data.error.message, 'backend');
                    }
                    
                    toast.success(fileType + ' sent successfully!');
                } catch (error) {
                    // Handle any errors that occur during the request
                    console.error("Error sending file:", error);
                    toast.error("An error occurred while sending the file.");
                }
            }
             else {
                handleError(response.data.error.message, 'Facebook');
            }
        } catch (error) {
            handleError(error.message, 'general');
        }
    };
    const createMessagePayload = async (userID) => {
        const fileUploadData = await uploadFileToFacebook();
        console.log(fileUploadData.data.attachment_id);
        const payload = {
            recipient: { id: facebookId },
            message: {
                attachment: {
                    type: fileType,
                    payload: { attachment_id: fileUploadData.data.attachment_id },
                },
            },
        };
        return payload;
        
    };

    const uploadFileToFacebook = async () => {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('message', JSON.stringify({
            attachment: {
                type: fileType,
                payload: {
                    is_reusable: true
                }
            }
        }));
    
        // Use the PAGE_ACCESS_TOKEN dynamically
        formData.append('access_token', `${PAGE_ACCESS_TOKEN}`);
    
        try {
            const response = await axios.post(`${META_API_URL}/me/message_attachments`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
    
            // Return response containing attachment_id
            return { ok: true, data: response.data };
        } catch (error) {
            console.error('Error uploading file to Facebook:', error);
            return { ok: false, data: error.response?.data || error.message };
        }
    };
    const sendMessageToFacebook = async (payload) => {
        console.log(payload)
        try {
            const response = await axios.post(`${META_API_URL}/${PAGE_ID}/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json' // Ensure JSON content type
                    }
                }
            );
            return { ok: true, data: response.data };
        } catch (error) {
            console.error('Error: Failed to send file:', error);
            return { ok: false, data: error.response?.data || error.message };
        }
    };
    
    // Helper function to create the local payload
    const createLocalPayload = (facebookId, fileTypeName , authUserId) => ({
        to: facebookId,
        message_type: fileType,
        message_content: fileTypeName,
        assign_user_id: authUserId,

    });
    // Helper function to send message to backend
    const sendMessageToBackend = async (localPayload) => {
        const endpoint = '/send-file-reply';
        const url = `${apiBaseUrl}${endpoint}`;
        return await axios.post(url, localPayload);
    };
    const isValidMessage = (facebookId ,fileTypeName) => {
        console.log('validation');
        if (!facebookId) {
            console.error("facebookId is undefined");
            return false;
        }
        if (!fileTypeName ) {
            toast.error('Mention The file Type As a message..');
            return;
        }
        return true;
    };
    // Helper function to handle errors
    const handleError = (errorMessage, source) => {
        toast.error(`Error sending message to ${source}: ${errorMessage}`);
        console.error(`Error sending message: ${errorMessage}`);
    };
    

    return (
        <>
            <div
                style={{
                    cursor: "pointer",
                    width: "35px",
                    height: "35px",
                    border: "2px dashed #ccc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                onClick={handleFileClick}
            >
                <FaPlus />
            </div>

            {showModal && (
                <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Upload File</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body text-center">
                                <div className="mb-3">
                                <input
                                    placeholder="Enter your File Type here..."
                                    type="text"
                                    onChange={(e) => setFileTypeName(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: 10,
                                        border: "1px solid rgb(204, 204, 204)",
                                        borderRadius: 5,
                                        fontSize: 14,
                                        backgroundColor: "rgb(249, 249, 249)"
                                    }}
                                />

                                </div>
                                <div className="mb-3" style={{ textAlign: 'left' }}>
                                    <label className="me-2">
                                        <input
                                            type="radio"
                                            name="fileType"
                                            value="image"
                                            checked={fileType === "image"}
                                            onChange={(e) => { 
                                                setFileType("image");  // Set file type to image
                                                resetFile();  // Reset the file input if needed
                                            }}
                                        /> Image
                                    </label>
                                    <label className="me-2">
                                        <input
                                            type="radio"
                                            name="fileType"
                                            value="file"
                                            checked={fileType === "file"}
                                            onChange={(e) => { 
                                                setFileType("file");  // Set file type to file
                                                resetFile();  // Reset the file input if needed
                                            }}
                                        /> Document
                                    </label>
                                    <label className="me-2">
                                        <input
                                            type="radio"
                                            name="fileType"
                                            value="audio"
                                            checked={fileType === "audio"}
                                            onChange={(e) => { 
                                                setFileType("audio");  // Set file type to audio
                                                resetFile();  // Reset the file input if needed
                                            }}
                                        /> Audio
                                    </label>
                                </div>


                                <input
                                    id="fileInput"
                                    type="file"
                                    accept={
                                        fileType === "image"
                                            ? "image/*"
                                            : fileType === "video"
                                                ? "video/*"
                                                : fileType === "audio"
                                                    ? "audio/*"
                                                    : ".pdf,.doc,.docx,.txt"
                                    }
                                    onChange={handleFileChange}
                                    className="form-control mb-3"
                                />

                                {filePreview && (
                                    <div className="mt-2 d-flex align-items-center justify-content-center" style={{ position: 'relative' }}>
                                        {fileType === "image" ? (
                                            <img
                                                src={filePreview}
                                                alt="Preview"
                                                style={{ maxWidth: "100%", height: "auto", borderRadius: "5px" }}
                                            />
                                        ) : (
                                            <p className="mb-0">{filePreview}</p>
                                        )}
                                        <button
                                            className="btn btn-danger btn-sm ms-2"
                                            onClick={resetFile}
                                            title="Remove File"
                                            style={{ position: 'absolute', top: '0', right: '0' }}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Close
                                </button>
                                <button type="button" onClick={handleUploadFile} className="btn btn-primary" disabled={!selectedFile}>
                                    Upload {fileType.charAt(0).toUpperCase() + fileType.slice(1)}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FileUploadModal;