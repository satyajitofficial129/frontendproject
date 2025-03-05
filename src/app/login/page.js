'use client';

import { useState } from 'react';
import styles from "@/styles/Login.module.css";
import { toast } from 'react-toastify';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';  // Correctly imported
import { generateHash } from '@/utils/hash';
import { NEXT_PUBLIC_API_BASE_URL } from '@/utils/settings';

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const apiBaseUrl = NEXT_PUBLIC_API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailOrPhone === '' || password === '') {
      setError('Both Email/Phone and Password fields are required.');
      return;
    }

    const localPayload = {
      email_or_phone: emailOrPhone,
      password: password
    };

    try {
      const endpoint = '/login';
      const url = `${apiBaseUrl}${endpoint}`;

      const response = await axios.post(url, localPayload, {
        headers: {
          'Content-Type': 'application/json',
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS"
        },
        withCredentials: true,
      });
      if (response.status === 200) {
        const token = response.data.token;
        const hash = generateHash(token); 
        localStorage.setItem('auth-token', JSON.stringify({ token, hash }));
        toast.success('Login successful!');
        router.push('/chat');
      }
    } catch (error) {

      console.log(error.response.data.message);
      if (error.response && error.response.data && error.response.data.messages) {
        const validationError = error.response.data.messages['email_or_phone'] ? error.response.data.messages['email_or_phone'][0] : 'An error occurred';
        setError(validationError);
      } else if (error.response && error.response.data && error.response.data.error) {
        const CredentialsError = error.response.data.error ? error.response.data.error : 'Invalid Credentials';
        setError(CredentialsError);
        console.log(error.response.data.error);
      }else if (error.response && error.response.data && error.response.data.message){
        const activationError = error.response.data.message;
        setError(activationError);
      }
    }
  };

  const handleInputChange = () => {
    setError("");
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginForm}>
        <h1 className={styles.loginTitle}>Login</h1>
        {error && <p className={styles.errorMessage}>{error}</p>} {/* Error message display */}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email or Phone:</label>
            <input
              className={styles.formInput}
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              onInput={handleInputChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Password:</label>
            <input
              className={styles.formInput}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onInput={handleInputChange}
            />
          </div>
          <button className={styles.submitButton} type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}
