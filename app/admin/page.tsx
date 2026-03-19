"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Clock, PlayCircle, RefreshCw, Copy, Download, History, UserMinus, PlusCircle, Trash2, Gift } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import dynamic from 'next/dynamic';

const Wheel = dynamic(() => import('react-custom-roulette').then(mod => mod.Wheel), { ssr: false });

interface AttendanceRecord {
    _id: string;
    email: string;
    timestamp: string;
}

interface SessionRecord {
    _id: string;
    code: string;
    title: string;
    adminEmail: string;
    createdAt: string;
}

function parseJwt(token: string) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

const ALLOWED_ADMINS = ['2411945@dlu.edu.vn', 'khuedm@dlu.edu.vn'];

export default function AdminPage() {
    const [adminEmail, setAdminEmail] = useState<string | null>(null);
    const [sessionTitle, setSessionTitle] = useState('');

    // Active session state
    const [sessionCode, setSessionCode] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
    const [absences, setAbsences] = useState<any[]>([]);

    // History
    const [history, setHistory] = useState<SessionRecord[]>([]);
    const [viewingHistory, setViewingHistory] = useState<SessionRecord | null>(null);

    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'attendants' | 'absences' | 'random'>('attendants');
    const [manualMssv, setManualMssv] = useState('');

    // Random Wheel state
    const [randomHistory, setRandomHistory] = useState<string[]>([]);
    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);
    const [spinAmount, setSpinAmount] = useState(1);
    const [spinsLeft, setSpinsLeft] = useState(0);
    const [manualWinner, setManualWinner] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const handleLoginSuccess = (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            const payload = parseJwt(credentialResponse.credential);
            if (!ALLOWED_ADMINS.includes(payload.email)) {
                alert('Tài khoản không có quyền truy cập Admin!');
                return;
            }
            setAdminEmail(payload.email);
            fetchHistory();
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/sessions`);
            setHistory(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const createSession = async () => {
        if (!sessionTitle.trim()) {
            alert('Vui lòng nhập tên buổi học/môn học!');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/admin/session`, {
                title: sessionTitle,
                adminEmail
            });
            setSessionCode(res.data.code);
            setExpiresAt(new Date(res.data.expiresAt));
            setAttendances([]);
            setAbsences([]);
            setTimeLeft(600); // 10 minutes
            setViewingHistory(null);
            fetchHistory();
        } catch (error) {
            alert('Lỗi khởi tạo session với máy chủ');
        }
        setLoading(false);
    };

    const fetchAttendances = async (codeToFetch: string = sessionCode || viewingHistory?.code || '') => {
        if (!codeToFetch) return;
        try {
            const resAtt = await axios.get(`${API_URL}/admin/session/${codeToFetch}/attendances`);
            setAttendances(resAtt.data);

            const resAbs = await axios.get(`${API_URL}/admin/session/${codeToFetch}/absences`);
            setAbsences(resAbs.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleManualAdd = async () => {
        if (!manualMssv.trim()) return;
        const code = sessionCode || viewingHistory?.code;
        if (!code) return;

        try {
            await axios.post(`${API_URL}/admin/session/${code}/manual-attendance`, {
                mssv: manualMssv
            });
            alert('Đã thêm thành công!');
            setManualMssv('');
            fetchAttendances(code);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi thêm thủ công');
        }
    };

    const handleDeleteSession = async (code: string, _id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering the row click
        if (window.confirm(`Bạn có chắc chắn muốn xóa phiên điểm danh [${code}] và TOÀN BỘ dữ liệu của phiên này không?`)) {
            try {
                await axios.delete(`${API_URL}/admin/session/${code}`);
                setHistory(history.filter(h => h._id !== _id));
                if (sessionCode === code || viewingHistory?.code === code) {
                    setSessionCode(null);
                    setViewingHistory(null);
                    setAttendances([]);
                    setAbsences([]);
                    setTimeLeft(0);
                }
            } catch (error) {
                alert('Lỗi xóa session');
            }
        }
    };

    // RANDOM WHEEL LOGIC
    const availableOptions = [
        ...attendances.map(a => a.email),
        "Cao Nguyên Hoàng"
    ].filter(name => !randomHistory.includes(name));

    const wheelData = availableOptions.length > 0
        ? availableOptions.map(opt => ({ option: opt.length > 20 ? opt.substring(0, 17) + '...' : opt }))
        : [{ option: 'Trống' }];

    const handleSpinClick = () => {
        if (mustSpin || spinsLeft > 0 || spinAmount < 1 || availableOptions.length === 0) return;
        setSpinsLeft(spinAmount);
    };

    useEffect(() => {
        if (spinsLeft > 0 && !mustSpin && availableOptions.length > 0) {
            const newPrizeNumber = Math.floor(Math.random() * availableOptions.length);
            setPrizeNumber(newPrizeNumber);
            setMustSpin(true);
        }
    }, [spinsLeft, mustSpin, availableOptions.length]);

    const handleStopSpinning = () => {
        setMustSpin(false);
        const winner = availableOptions[prizeNumber];
        if (winner) {
            setRandomHistory(prev => [...prev, winner]);
        }
        
        const nextSpinsLeft = spinsLeft - 1;
        if (nextSpinsLeft > 0 && availableOptions.length > 1) { // >1 because one was just removed
            setTimeout(() => {
                setSpinsLeft(nextSpinsLeft);
            }, 3000); // 3 seconds delay before next spin
        } else {
            setSpinsLeft(0);
        }
    };

    const handleManualWinnerAdd = () => {
        if (!manualWinner.trim()) return;
        if (!randomHistory.includes(manualWinner.trim())) {
            setRandomHistory([...randomHistory, manualWinner.trim()]);
        }
        setManualWinner('');
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
                fetchAttendances(sessionCode!);
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

    const copyToClipboard = () => {
        const dataToCopy = activeTab === 'attendants' ? attendances : absences;
        if (dataToCopy.length === 0) {
            alert("Chưa có danh sách để copy!");
            return;
        }
        let tsvContent = activeTab === 'attendants' ? "STT\tEmail\tThời gian điểm danh\n" : "STT\tMSSV\tHọ Tên\n";

        if (activeTab === 'attendants') {
            (dataToCopy as AttendanceRecord[]).forEach((att, index) => {
                const time = new Date(att.timestamp).toLocaleTimeString('vi-VN');
                tsvContent += `${index + 1}\t${att.email}\t${time}\n`;
            });
        } else {
            (dataToCopy as any[]).forEach((att, index) => {
                tsvContent += `${index + 1}\t${att.mssv}\t${att.name}\n`;
            });
        }

        navigator.clipboard.writeText(tsvContent)
            .then(() => alert('✅ Đã copy! Mở Google Sheets và dán.'))
            .catch(() => alert('❌ Trình duyệt không hỗ trợ tự động copy.'));
    };

    const downloadCSV = () => {
        const dataToCopy = activeTab === 'attendants' ? attendances : absences;
        if (dataToCopy.length === 0) {
            alert("Chưa có danh sách để tải!");
            return;
        }
        let csvContent = activeTab === 'attendants' ? "STT,Email,Thoi gian diem danh\n" : "STT,MSSV,Ho Ten\n";

        if (activeTab === 'attendants') {
            (dataToCopy as AttendanceRecord[]).forEach((att, index) => {
                const time = new Date(att.timestamp).toLocaleTimeString('vi-VN');
                csvContent += `${index + 1},${att.email},${time}\n`;
            });
        } else {
            (dataToCopy as any[]).forEach((att, index) => {
                csvContent += `${index + 1},${att.mssv},${att.name}\n`;
            });
        }

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `DiemDanh_${activeTab}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!adminEmail) {
        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center">
                    <h1 className="text-3xl font-black text-slate-800 mb-4">Admin Portal</h1>
                    <p className="text-slate-500 mb-8">Vui lòng đăng nhập bằng tài khoản Quản trị viên</p>
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleLoginSuccess}
                            onError={() => alert('Lỗi đăng nhập')}
                            shape="pill"
                        />
                    </div>
                </div>
            </main>
        );
    }

    const currentDisplayCode = sessionCode || viewingHistory?.code;

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">

                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between border border-slate-100">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Cổng Giảng Viên</h1>
                        <p className="text-slate-500 mt-2 font-medium">Bảng điều khiển phiên điểm danh nhanh theo thời gian thực</p>
                    </div>
                    <div className="mt-6 md:mt-0 flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Tên môn học / chủ đề..."
                            value={sessionTitle}
                            onChange={e => setSessionTitle(e.target.value)}
                            className="border-2 border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 font-medium"
                        />
                        <button
                            onClick={createSession}
                            disabled={loading || !sessionTitle.trim()}
                            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-wait text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-1 active:translate-y-0"
                        >
                            <PlayCircle size={22} className="mr-3" />
                            Bắt đầu Mới
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Code Display OR History List */}
                    <div className="lg:col-span-4 space-y-8">
                        {currentDisplayCode && (
                            <div className={`rounded-[2rem] p-8 flex flex-col items-center justify-center text-white text-center transition-all duration-700 shadow-2xl ${timeLeft > 0 ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600' : 'bg-slate-800'}`}>
                                <p className="text-white/80 font-bold mb-4 uppercase tracking-[0.2em] text-sm">
                                    {viewingHistory ? `Lịch sử: ${viewingHistory.title}` : `Đang mở: ${sessionTitle}`}
                                </p>
                                <div className="text-6xl font-black tracking-[0.15em] mb-8 font-mono drop-shadow-md">
                                    {currentDisplayCode}
                                </div>

                                <div className="flex bg-black/30 backdrop-blur-md rounded-2xl px-6 py-3 items-center mb-2">
                                    <Clock size={24} className={`mr-4 ${timeLeft === 0 ? 'text-red-400' : 'text-emerald-400'}`} />
                                    <span className={`text-2xl font-black font-mono tracking-widest ${timeLeft === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {timeLeft > 0 ? formatTime(timeLeft) : 'ĐÃ ĐÓNG'}
                                    </span>
                                </div>

                                {viewingHistory && (
                                    <button
                                        onClick={() => { setViewingHistory(null); setAttendances([]); setAbsences([]); }}
                                        className="text-white/80 underline text-sm mt-4 hover:text-white"
                                    >
                                        Đóng & Trở lại
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <div className="flex items-center mb-6 text-slate-800">
                                <History size={24} className="text-blue-600 mr-3" />
                                <h3 className="font-bold text-xl">Lịch sử buổi học</h3>
                            </div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {history.length === 0 ? (
                                    <p className="text-slate-400 text-sm italic">Chưa có lịch sử</p>
                                ) : (
                                    history.map(h => (
                                        <div
                                            key={h._id}
                                            onClick={() => {
                                                setViewingHistory(h);
                                                setSessionCode(null);
                                                setTimeLeft(0);
                                                fetchAttendances(h.code);
                                            }}
                                            className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 cursor-pointer transition flex items-center justify-between group"
                                        >
                                            <div className="overflow-hidden flex-1 pr-2">
                                                <div className="font-bold text-slate-700 truncate">{h.title}</div>
                                                <div className="text-xs text-slate-500">{new Date(h.createdAt).toLocaleString('vi-VN')}</div>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="font-mono text-xs font-bold text-blue-600 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-200">
                                                    {h.code}
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteSession(h.code, h._id, e)}
                                                    title="Xóa phiên điểm danh này"
                                                    className="ml-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Live Attendances */}
                    <div className="lg:col-span-8 bg-white rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 flex flex-col h-[700px] border border-slate-100">
                        {currentDisplayCode ? (
                            <>
                                <div className="flex flex-col md:flex-row items-center justify-between mb-6 pb-6 border-b-2 border-slate-50 gap-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setActiveTab('attendants')}
                                            className={`flex items-center font-bold px-4 py-2 rounded-xl transition ${activeTab === 'attendants' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            <Users size={18} className="mr-2" /> Đã quét ({attendances.length})
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('absences')}
                                            className={`flex items-center font-bold px-4 py-2 rounded-xl transition ${activeTab === 'absences' ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            <UserMinus size={18} className="mr-2" /> Vắng mặt ({absences.length})
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('random')}
                                            className={`flex items-center font-bold px-4 py-2 rounded-xl transition ${activeTab === 'random' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            <Gift size={18} className="mr-2" /> Vòng quay
                                        </button>
                                    </div>

                                    <div className="bg-slate-100 text-slate-700 font-black px-3 py-1.5 rounded-xl flex items-center shadow-inner">
                                        <button onClick={() => fetchAttendances(currentDisplayCode)} title="Làm mới" className="hover:bg-white p-1.5 rounded-lg transition shadow-sm border border-transparent hover:border-slate-200">
                                            <RefreshCw size={18} className="text-blue-600" />
                                        </button>
                                        <button onClick={copyToClipboard} title="Copy để dán trực tiếp vào Google Sheets" className="ml-1 hover:bg-white p-1.5 rounded-lg transition shadow-sm border border-transparent hover:border-slate-200">
                                            <Copy size={18} className="text-emerald-600" />
                                        </button>
                                        <button onClick={downloadCSV} title="Tải file CSV" className="ml-1 hover:bg-white p-1.5 rounded-lg transition shadow-sm border border-transparent hover:border-slate-200">
                                            <Download size={18} className="text-purple-600" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                    {activeTab === 'attendants' && (
                                        attendances.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                <Users size={48} className="mb-4 opacity-20 text-slate-300" />
                                                <p className="font-medium text-sm">Chưa có ai điểm danh vào lúc này</p>
                                            </div>
                                        ) : (
                                            attendances.map((att, idx) => (
                                                <div key={att._id} className="flex items-center justify-between bg-slate-50 hover:bg-blue-50/50 transition p-3 rounded-xl border border-slate-100">
                                                    <span className="font-bold text-slate-700 flex items-center text-sm">
                                                        <span className="w-8 text-xs text-slate-400 font-black">{idx + 1}.</span>
                                                        {att.email}
                                                        {att.email.includes("MANUAL") && <span className="ml-2 text-xs text-white bg-emerald-500 px-2 rounded-full">Manual</span>}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                                                        {new Date(att.timestamp).toLocaleTimeString('vi-VN')}
                                                    </span>
                                                </div>
                                            ))
                                        )
                                    )}

                                    {activeTab === 'absences' && (
                                        absences.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                                                <p className="font-medium text-sm">Không có ai vắng mặt,<br />hoặc server chưa thể tải danh sách Excel tĩnh!</p>
                                            </div>
                                        ) : (
                                            absences.map((att, idx) => (
                                                <div key={att.mssv} className="flex items-center justify-between bg-red-50/30 transition p-3 rounded-xl border border-red-100">
                                                    <span className="font-bold text-slate-700 flex items-center text-sm">
                                                        <span className="w-8 text-xs text-slate-400 font-black">{idx + 1}.</span>
                                                        <span className="text-red-700 mr-4 font-mono font-black">{att.mssv}</span>
                                                        {att.name}
                                                    </span>
                                                </div>
                                            ))
                                        )
                                    )}

                                    {activeTab === 'random' && (
                                        <div className="flex flex-col md:flex-row gap-6 h-[460px]">
                                            {/* Wheel Section */}
                                            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-4 border border-slate-100 overflow-hidden">
                                                <div className="mb-4 flex items-center gap-3">
                                                    <label className="font-bold text-slate-700">Số lượng cờ quay:</label>
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        value={spinAmount} 
                                                        onChange={e => setSpinAmount(Math.max(1, parseInt(e.target.value) || 1))} 
                                                        disabled={mustSpin || spinsLeft > 0}
                                                        className="border-2 border-slate-200 rounded-lg px-3 py-1.5 w-20 text-center font-bold text-lg focus:border-purple-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div className="w-full max-w-[280px] aspect-square flex items-center justify-center mb-6 pointer-events-none">
                                                   <Wheel
                                                        mustStartSpinning={mustSpin}
                                                        prizeNumber={prizeNumber}
                                                        data={wheelData}
                                                        onStopSpinning={handleStopSpinning}
                                                        backgroundColors={['#3e3e3e', '#df3428', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6']}
                                                        textColors={['#ffffff']}
                                                        outerBorderColor="#eeeeee"
                                                        outerBorderWidth={5}
                                                        innerRadius={15}
                                                        innerBorderColor="#30261a"
                                                        innerBorderWidth={0}
                                                        radiusLineColor="#eeeeee"
                                                        radiusLineWidth={1}
                                                        fontSize={16}
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleSpinClick}
                                                    disabled={mustSpin || spinsLeft > 0 || availableOptions.length === 0}
                                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-black text-xl px-12 py-3 rounded-2xl shadow-lg transform transition hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed uppercase"
                                                >
                                                    {spinsLeft > 0 ? `ĐANG QUAY... (${spinsLeft})` : 'QUAY NGAY!'}
                                                </button>
                                                {availableOptions.length === 0 && (
                                                    <p className="text-red-500 text-sm mt-3 font-medium">Hết người để quay!</p>
                                                )}
                                            </div>

                                            {/* Winners List */}
                                            <div className="w-full md:w-1/3 flex flex-col border border-slate-100 rounded-2xl overflow-hidden bg-slate-50">
                                                <div className="bg-gradient-to-r from-purple-100 to-indigo-100 text-indigo-900 p-3 font-black text-center border-b border-indigo-200">
                                                    Danh sách Trúng Thưởng ({randomHistory.length})
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar min-h-[150px]">
                                                    {randomHistory.length === 0 ? (
                                                        <div className="text-center text-slate-400 mt-10 italic text-sm">Chưa có ai trúng thưởng</div>
                                                    ) : (
                                                        randomHistory.map((winner, idx) => (
                                                            <div key={idx} className="bg-white p-2 rounded-lg text-sm font-bold text-slate-700 shadow-sm border border-slate-100 flex items-center justify-between group">
                                                                <span className="truncate flex-1">{winner}</span>
                                                                <button onClick={() => setRandomHistory(randomHistory.filter(w => w !== winner))} className="text-slate-300 hover:text-red-500 ml-2 opacity-0 group-hover:opacity-100 transition">
                                                                   <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                                <div className="p-3 border-t border-slate-200 bg-white flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={manualWinner}
                                                        onChange={e => setManualWinner(e.target.value)}
                                                        placeholder="Nhập tay..."
                                                        className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:border-purple-500 focus:outline-none font-medium"
                                                    />
                                                    <button 
                                                        onClick={handleManualWinnerAdd}
                                                        disabled={!manualWinner.trim()}
                                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white p-1.5 rounded-lg transition"
                                                    >
                                                        <PlusCircle size={18} />
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => {if(window.confirm('Xóa hết DS trúng thưởng?')) setRandomHistory([])}}
                                                    className="w-full bg-slate-200 hover:bg-red-100 hover:text-red-600 text-slate-500 py-2 text-xs font-bold transition"
                                                >
                                                    Làm mới DS Trúng Thưởng
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Manual Action */}
                                {activeTab !== 'random' && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                                        <input
                                            type="text"
                                            placeholder="Nhập MSSV điểm danh tay..."
                                            value={manualMssv}
                                            onChange={e => setManualMssv(e.target.value)}
                                            className="w-full sm:w-auto flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 font-medium font-mono text-sm"
                                        />
                                        <button
                                            onClick={handleManualAdd}
                                            disabled={!manualMssv.trim()}
                                            className="w-full sm:w-auto flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-md shadow-emerald-600/20"
                                        >
                                            <PlusCircle size={18} className="mr-2" />
                                            Thêm bổ sung
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Users size={64} className="mb-6 opacity-20 text-slate-300" />
                                <p className="font-medium text-lg">Bấm "Bắt đầu Mới" hoặc chọn 1 buổi học trong Lịch sử để xem chi tiết.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
