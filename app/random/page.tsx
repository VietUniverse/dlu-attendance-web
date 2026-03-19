"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Gift, Trash2, PlusCircle, UserCheck } from 'lucide-react';

const Wheel = dynamic(() => import('react-custom-roulette').then(mod => mod.Wheel), { ssr: false });

// Data tĩnh từ danh sách lớp CTK48B
const STATIC_STUDENTS = [
  "Nguyễn Trị An", "Bùi Thị Lan Anh", "Huỳnh Gia Bảo", "Lưu Ngọc Bạch",
  "Phan Bá Cường", "Phạm Doãn Du", "Đào Bảo Duy", "Trần Anh Duy",
  "Dương Nguyễn Minh Hiếu", "Bùi Lê Mạnh Hoàng", "Nguyễn Thanh Hồng",
  "Nguyễn Thanh Hợp", "Lê Phi Hưng", "Hồ Nguyễn Gia Huy", "Trịnh Hoàng Gia Huy",
  "Nguyễn Đăng Huy", "Nguyễn Đình Quốc Huy", "Kiều Minh Khang", "Nguyễn Tiến Khang",
  "Nguyễn Anh Khôi", "Ninh Bảo Khôi", "Phạm Huy Kiên", "Trần Trung Kiên",
  "Phạm Gia Kỳ", "Đỗ Hoàng Lâm", "Huỳnh Phúc Lâm", "Đoàn Khánh Linh",
  "Ngô Quyền Linh", "Đinh Hoàng Long", "Nguyễn Nguyên Bảo Long", "Trịnh Nguyễn Phương Nam",
  "Trương Bảo Ngân", "Cao Khôi Nguyên", "Nguyễn Hữu Phúc", "Nguyễn Minh Quân",
  "Đoàn Phú Quý", "Đỗ Bá Quyền", "Phạm Trịnh Đức Thảo", "Trần Thị Thanh Thảo",
  "Trần Phúc Thiên", "Nguyễn Văn Thịnh", "Tôn Thất Thịnh", "Huỳnh Thị Anh Thư",
  "Nguyễn Văn Thuận", "Lê Duy Việt", "Lê Quang Vinh", "Trần Thị Như Ý",
  "Cao Nguyên Hoàng"
];

export default function RandomPage() {
    // Random Wheel state
    const [randomHistory, setRandomHistory] = useState<string[]>([]);
    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);
    const [spinAmount, setSpinAmount] = useState(1);
    const [spinsLeft, setSpinsLeft] = useState(0);
    const [manualWinner, setManualWinner] = useState('');

    const availableOptions = STATIC_STUDENTS.filter(name => !randomHistory.includes(name));

    const wheelData = availableOptions.length > 0
        ? availableOptions.map(opt => ({ option: opt.length > 20 ? opt.substring(0, 17) + '...' : opt }))
        : [{ option: 'Hết tên' }];

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
        if (nextSpinsLeft > 0 && availableOptions.length > 1) { // Lớn hơn 1 vì có thể vừa quay hết
            setTimeout(() => {
                setSpinsLeft(nextSpinsLeft);
            }, 3000); // Tạm nghỉ 3s
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

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-500 to-indigo-600"></div>
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 tracking-tight flex items-center mb-2">
                            <Gift size={40} className="mr-4 text-purple-600" />
                            Vòng Quay May Mắn
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Chọn ngẫu nhiên sinh viên CTK48B tham gia sự kiện</p>
                    </div>
                    <div className="mt-6 md:mt-0 bg-purple-50 px-6 py-3 rounded-2xl border border-purple-100 flex items-center gap-3">
                        <UserCheck className="text-purple-600" />
                        <div>
                            <p className="text-sm text-purple-800 font-bold mb-0.5">Sĩ số chờ quay</p>
                            <p className="text-2xl font-black text-purple-600">{availableOptions.length}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Wheel Area */}
                    <div className="lg:col-span-8 bg-white rounded-[2rem] p-6 lg:p-10 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center border border-slate-100 min-h-[600px] relative">
                        
                        <div className="w-full flex justify-between items-center mb-10 pb-6 border-b-2 border-slate-50 relative z-10">
                            <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl shadow-inner ml-auto mr-auto lg:mr-0 lg:ml-0">
                                <label className="font-bold text-slate-600 px-3 uppercase tracking-wider text-sm">Số lượng giải:</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    value={spinAmount} 
                                    onChange={e => setSpinAmount(Math.max(1, parseInt(e.target.value) || 1))} 
                                    disabled={mustSpin || spinsLeft > 0}
                                    className="border-none rounded-xl px-4 py-2 w-24 text-center font-black text-2xl text-purple-700 focus:ring-4 focus:ring-purple-500/20 focus:outline-none transition shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="flex-1 w-full flex flex-col items-center justify-center pointer-events-none mb-10 relative z-10">
                            <div className="w-full max-w-[350px] md:max-w-[450px] aspect-square flex items-center justify-center filter drop-shadow-2xl transition-transform duration-500 hover:scale-105">
                                <Wheel
                                    mustStartSpinning={mustSpin}
                                    prizeNumber={prizeNumber}
                                    data={wheelData}
                                    onStopSpinning={handleStopSpinning}
                                    backgroundColors={['#2c3e50', '#e74c3c', '#2980b9', '#f39c12', '#27ae60', '#8e44ad', '#16a085', '#d35400', '#c0392b', '#1abc9c']}
                                    textColors={['#ffffff']}
                                    outerBorderColor="#ffffff"
                                    outerBorderWidth={6}
                                    innerRadius={20}
                                    innerBorderColor="#ffffff"
                                    innerBorderWidth={3}
                                    radiusLineColor="#ffffff"
                                    radiusLineWidth={2}
                                    fontSize={14}
                                    textDistance={55}
                                />
                            </div>
                        </div>

                        <div className="w-full max-w-sm mt-auto relative z-10">
                            <button
                                onClick={handleSpinClick}
                                disabled={mustSpin || spinsLeft > 0 || availableOptions.length === 0}
                                className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 disabled:opacity-70 text-white font-black text-2xl px-6 py-5 rounded-2xl shadow-xl shadow-purple-600/30 transform transition hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 disabled:transform-none disabled:shadow-none uppercase tracking-widest overflow-hidden relative group"
                            >
                                <span className="relative z-10 flex items-center justify-center">
                                    {spinsLeft > 0 ? (
                                        <>
                                            <span className="animate-pulse mr-3">🌀</span>
                                            ĐANG QUAY... ({spinsLeft})
                                        </>
                                    ) : 'BẮT ĐẦU QUAY'}
                                </span>
                                {spinsLeft === 0 && availableOptions.length > 0 && (
                                    <div className="absolute inset-0 h-full w-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                )}
                            </button>
                            {availableOptions.length === 0 && (
                                <p className="text-red-500 text-center text-sm font-bold mt-4 bg-red-50 py-2 rounded-lg">Không còn ai trong danh sách ghép đôi!</p>
                            )}
                        </div>
                    </div>

                    {/* Winners Panel */}
                    <div className="lg:col-span-4 flex flex-col bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[600px]">
                        <div className="bg-gradient-to-br from-purple-100 to-indigo-100 px-6 py-8 text-center border-b border-purple-200 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <Gift size={60} className="text-purple-600" />
                            </div>
                            <h2 className="text-indigo-900 font-black text-2xl uppercase tracking-widest relative z-10">Giải Thưởng</h2>
                            <p className="text-purple-600 font-bold mt-1 bg-white/50 backdrop-blur-md self-center py-1 px-4 rounded-full inline-block text-sm shadow-sm relative z-10">
                                Đã trao: {randomHistory.length} giải
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/50 relative">
                            {randomHistory.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
                                    <Gift size={48} className="mb-3 opacity-30" />
                                    <span className="font-medium text-sm">Chưa bốc trúng người nào</span>
                                </div>
                            ) : (
                                randomHistory.map((winner, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl font-bold text-slate-700 shadow-sm border border-slate-100 flex items-center justify-between group transition-all hover:border-purple-300 hover:shadow-md slide-in-bottom">
                                        <div className="flex items-center flex-1 overflow-hidden">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs mr-3 font-black shrink-0">
                                                {idx + 1}
                                            </div>
                                            <span className="truncate text-[15px]">{winner}</span>
                                        </div>
                                        <button 
                                            onClick={() => setRandomHistory(randomHistory.filter(w => w !== winner))} 
                                            className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition shrink-0 ml-2"
                                            title="Rút lại giải thưởng này"
                                        >
                                           <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t border-slate-100 bg-white p-4 space-y-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={manualWinner}
                                    onChange={e => setManualWinner(e.target.value)}
                                    placeholder="Thêm tay người trúng giải..."
                                    className="flex-1 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition"
                                />
                                <button 
                                    onClick={handleManualWinnerAdd}
                                    disabled={!manualWinner.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white p-3 rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95 disabled:active:scale-100"
                                    title="Thêm vào danh sách trúng thưởng"
                                >
                                    <PlusCircle size={22} />
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => {if(window.confirm('Bạn có chắc chắn muốn TẨY TRẮNG toàn bộ danh sách những người đã trúng giải không?')) setRandomHistory([])}}
                                className="w-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 px-4 py-3 rounded-xl text-xs font-black transition uppercase tracking-wider disabled:opacity-50"
                                disabled={randomHistory.length === 0}
                            >
                                Làm mới toàn bộ danh sách
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
