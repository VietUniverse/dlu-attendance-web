"use client";

import { useState, useEffect } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import axios from 'axios';
import { MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import fpPromise from '@fingerprintjs/fingerprintjs';

function parseJwt(token: string) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

export default function StudentPage() {
    const [email, setEmail] = useState<string | null>(null);
    const [editableEmail, setEditableEmail] = useState<string>('');
    const [sessionCode, setSessionCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [deviceId, setDeviceId] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    // Initialize FingerprintJS
    useEffect(() => {
        const getFingerprint = async () => {
            const fp = await fpPromise.load();
            const result = await fp.get();
            // Store fingerprint in localstorage as fallback and state
            let storedId = localStorage.getItem('dlu_device_id');
            if (!storedId) {
                storedId = result.visitorId;
                localStorage.setItem('dlu_device_id', storedId);
            }
            setDeviceId(storedId);
        };
        getFingerprint();
    }, []);

    const handleLoginSuccess = (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            const payload = parseJwt(credentialResponse.credential);
            if (!payload.email.endsWith('@dlu.edu.vn')) {
                setStatus('error');
                setMessage('Vui lòng sử dụng email sinh viên (@dlu.edu.vn)');
                return;
            }
            setEmail(payload.email);
            setEditableEmail(payload.email); // prefill editable field
            setStatus('idle');
            setMessage('');
        }
    };

    const handleCheckIn = () => {
        if (!sessionCode || sessionCode.length !== 6) {
            setStatus('error');
            setMessage('Mã phiên điểm danh phải gồm 6 chữ số');
            return;
        }

        if (!deviceId) {
            setStatus('error');
            setMessage('Đang nhận dạng thiết bị, vui lòng thử lại sau vài giây...');
            return;
        }

        setStatus('loading');
        setMessage('Đang truy xuất vị trí GPS của bạn...');

        if (!navigator.geolocation) {
            setStatus('error');
            setMessage('Trình duyệt không hỗ trợ Geolocation API');
            return;
        }

        // Optimized for Safari iOS
        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 15000, // 15s timeout
            maximumAge: 0   // Force fresh location
        };

        const successCallback = async (position: GeolocationPosition) => {
            try {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                setMessage('Đang kiểm duyệt dữ liệu bảo mật lên máy chủ...');

                const res = await axios.post(`${API_URL}/attendance`, {
                    code: sessionCode,
                    lat,
                    lon,
                    email: editableEmail,
                    deviceId
                });

                setStatus('success');
                setMessage('Điểm danh thành công!');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Có lỗi xảy ra khi điểm danh');
            }
        };

        const errorCallback = (error: GeolocationPositionError) => {
            setStatus('error');
            if (error.code === error.PERMISSION_DENIED) {
                setMessage('BẠN ĐÃ TỪ CHỐI QUYỀN VỊ TRÍ! Vui lòng vào Cài đặt của trình duyệt Safari/Chrome để CẤP LẠI QUYỀN LOCATION.');
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                setMessage('Không nhận diện được tín hiệu GPS. Cần bật định vị trên thiết bị.');
            } else if (error.code === error.TIMEOUT) {
                setMessage('Hết thời gian lấy vị trí do mạng yếu, hãy thử lại.');
            } else {
                setMessage('Lỗi không xác định khi lấy GPS.');
            }
        };

        navigator.geolocation.getCurrentPosition(successCallback, errorCallback, geoOptions);
    };

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full shrink-0">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800 mb-2">Sinh viên</h1>
                    <p className="text-slate-500 font-medium">Cổng điểm danh bằng GPS vị trí</p>
                </div>

                {!email ? (
                    <div className="flex flex-col items-center justify-center space-y-6 py-6">
                        <div className="bg-blue-50 p-5 rounded-full mb-2">
                            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
                        </div>
                        <GoogleLogin
                            onSuccess={handleLoginSuccess}
                            onError={() => {
                                setStatus('error');
                                setMessage('Đăng nhập Google thất bại');
                            }}
                            useOneTap
                            shape="pill"
                        />
                        {status === 'error' && <p className="text-red-500 text-sm font-medium text-center bg-red-50 p-3 rounded-lg w-full">{message}</p>}
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm flex items-center justify-between shadow-sm border border-emerald-100">
                            <input
                                type="email"
                                value={editableEmail}
                                onChange={(e) => setEditableEmail(e.target.value)}
                                className="w-full text-center text-2xl font-medium py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition outline-none"
                                placeholder="email@dlu.edu.vn"
                            />
                            <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-2" />
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Mã Phiên Của Lớp (6 số)</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={sessionCode}
                                    onChange={(e) => setSessionCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="------"
                                    disabled={status === 'loading' || status === 'success'}
                                    className="w-full text-center tracking-[0.5em] text-4xl font-black py-4 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition outline-none shadow-inner bg-slate-50"
                                />
                            </div>

                            {status === 'loading' && (
                                <div className="flex items-center justify-center text-blue-600 bg-blue-50/80 backdrop-blur p-4 rounded-xl border border-blue-100">
                                    <Loader2 className="animate-spin shrink-0" size={20} />
                                    <span className="text-sm font-semibold ml-3">{message}</span>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="flex items-start text-red-600 bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm">
                                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                    <span className="text-sm font-semibold ml-3">{message}</span>
                                </div>
                            )}

                            {status === 'success' && (
                                <div className="flex flex-col items-center justify-center text-emerald-600 bg-emerald-50 p-6 rounded-2xl border border-emerald-200 shadow-sm scale-in-center">
                                    <CheckCircle size={40} className="mb-3 text-emerald-500" />
                                    <span className="font-bold text-lg">{message}</span>
                                </div>
                            )}

                            {status !== 'success' && (
                                <button
                                    onClick={handleCheckIn}
                                    disabled={status === 'loading'}
                                    className="w-full bg-slate-800 hover:bg-black disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:shadow-md flex items-center justify-center text-lg mt-2"
                                >
                                    <MapPin size={22} className="mr-2" />
                                    Xóa Tọa Độ & Điểm Danh
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
