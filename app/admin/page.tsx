"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Clock, PlayCircle, RefreshCw } from 'lucide-react';

interface AttendanceRecord {
    _id: string;
    email: string;
    timestamp: string;
}

export default function AdminPage() {
    const [sessionCode, setSessionCode] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(0);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const createSession = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/admin/session`);
            setSessionCode(res.data.code);
            setExpiresAt(new Date(res.data.expiresAt));
            setAttendances([]);
            setTimeLeft(600); // 10 minutes
        } catch (error) {
            alert('Lỗi khởi tạo session với máy chủ');
        }
        setLoading(false);
    };

    const fetchAttendances = async () => {
        if (!sessionCode) return;
        try {
            const res = await axios.get(`${API_URL}/admin/session/${sessionCode}/attendances`);
            setAttendances(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (!expiresAt) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = expiresAt.getTime() - now;

            if (distance < 0) {
                setTimeLeft(0);
                clearInterval(interval);
            } else {
                setTimeLeft(Math.floor(distance / 1000));
            }
        }, 1000);

        const refreshInterval = setInterval(() => {
            if (timeLeft > 0) {
                fetchAttendances();
            }
        }, 3000);

        return () => {
            clearInterval(interval);
            clearInterval(refreshInterval);
        };
    }, [expiresAt, sessionCode, timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">

                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between border border-slate-100">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Cổng Giảng Viên</h1>
                        <p className="text-slate-500 mt-2 font-medium">Bảng điều khiển phiên điểm danh nhanh theo thời gian thực</p>
                    </div>
                    <button
                        onClick={createSession}
                        disabled={loading}
                        className="mt-6 md:mt-0 flex items-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-wait text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-1 active:translate-y-0 shrink-0"
                    >
                        <PlayCircle size={22} className="mr-3" />
                        Bắt đầu Session Mới
                    </button>
                </div>

                {sessionCode && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Code Display */}
                        <div className={`lg:col-span-5 rounded-[2rem] p-10 flex flex-col items-center justify-center text-white text-center transition-all duration-700 shadow-2xl ${timeLeft > 0 ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600' : 'bg-slate-800 shadow-none'}`}>
                            <p className="text-white/80 font-bold mb-4 uppercase tracking-[0.2em] text-sm">Mã Điểm Danh Lớp Học</p>
                            <div className="text-7xl md:text-8xl font-black tracking-[0.15em] mb-10 font-mono drop-shadow-md">
                                {sessionCode}
                            </div>

                            <div className="flex bg-black/30 backdrop-blur-md rounded-2xl px-8 py-4 items-center">
                                <Clock size={28} className={`mr-4 ${timeLeft === 0 ? 'text-red-400' : 'text-emerald-400'}`} />
                                <span className={`text-3xl font-black font-mono tracking-widest ${timeLeft === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {timeLeft > 0 ? formatTime(timeLeft) : 'HẾT HẠN'}
                                </span>
                            </div>

                            {timeLeft === 0 && (
                                <p className="mt-8 text-slate-400 font-medium text-sm">Session đã đóng. Sinh viên không thể lấy mã nữa.</p>
                            )}
                        </div>

                        {/* Live Attendances */}
                        <div className="lg:col-span-7 bg-white rounded-[2rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 flex flex-col h-[500px] border border-slate-100">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-50">
                                <div className="flex items-center text-slate-800">
                                    <div className="bg-blue-50 p-3 rounded-xl mr-4 text-blue-600">
                                        <Users size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">Lịch Sử Check-in</h2>
                                        <p className="text-sm text-slate-500 font-medium">Danh sách realtime</p>
                                    </div>
                                </div>
                                <div className="bg-slate-100 text-slate-700 font-black text-xl px-5 py-2 rounded-xl flex items-center shadow-inner">
                                    {attendances.length}
                                    <button onClick={fetchAttendances} className="ml-3 hover:bg-white p-1.5 rounded-lg transition shadow-sm border border-transparent hover:border-slate-200">
                                        <RefreshCw size={18} className="text-blue-600" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-4 space-y-3 custom-scrollbar">
                                {attendances.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <Users size={64} className="mb-6 opacity-20 text-slate-300" />
                                        <p className="font-medium text-lg">Chưa có ai điểm danh vào lúc này</p>
                                    </div>
                                ) : (
                                    attendances.map((att, idx) => (
                                        <div key={att._id} className="flex items-center justify-between bg-slate-50 hover:bg-blue-50/50 transition p-5 rounded-2xl border border-slate-100">
                                            <span className="font-bold text-slate-700 flex items-center text-lg">
                                                <span className="w-8 text-sm text-slate-400 font-black">{idx + 1}.</span>
                                                {att.email}
                                            </span>
                                            <span className="text-sm font-bold text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                                                {new Date(att.timestamp).toLocaleTimeString('vi-VN')}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
