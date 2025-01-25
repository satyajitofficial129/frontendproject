"use client";
import ChatSidebar from '@/components/Sidebar/ChatSidebar'
import getAuthUserId from '@/utils/getAuthUserId';
import { NEXT_PUBLIC_API_BASE_URL } from '@/utils/settings';
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify';

const profile = () => {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const apiBaseUrl = NEXT_PUBLIC_API_BASE_URL;
    
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const authUserId = await getAuthUserId();
                const endpoint = `/profile-info/${authUserId}`;
                const url = `${apiBaseUrl}${endpoint}`;

                const response = await axios.get(url);
                console.log(response.data.user);
                if (response.status === 200) {
                    const { name } = response.data.user;
                    setUserName(name);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                setError('An error occurred while fetching profile information.');
            }
        };

        fetchUserProfile();
    }, [apiBaseUrl]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (userName === '') {
            toast.error('Name is required');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match! Please check again...');
            return;
        }
        const localPayload = {
            name: userName,
            password: password,
        }
        setError("");
        try {
            const authUserId = await getAuthUserId();
            const endpoint = `/profile-update/${authUserId}`;
            const url = `${apiBaseUrl}${endpoint}`;
      
            const response = await axios.post(url, localPayload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.status === 200) {
                console.log(response.data.message);
              toast.success(response.data.message);
            }
        } catch (error) {
            console.error('Error during API call:', error);
            setError('An error occurred while processing your request.');
        }
    }
    const handleInputChange = () => {
        setError("");
    }

    return (
        <section className="chat-section">
            <div className="chat-container" style={{ width: "1650px" }}>
                <ChatSidebar />
                <div className="chat-content p-6">
                    <div className="card bg-white rounded-0 p-3">
                        {/* Card Header */}
                        <div className="card-header p-3">
                            Update Profile
                        </div>

                        {/* Card Body */}
                        <div className="card-body p-6">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Name <span style={{ color: 'red', }}>*</span> </label>
                                    <input 
                                        type="text" 
                                        className="form-control"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        onInput={handleInputChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input 
                                        type="password" 
                                        className="form-control"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onInput={handleInputChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Confirm Password</label>
                                    <input 
                                        type="password" 
                                        className="form-control"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">Submit</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default profile