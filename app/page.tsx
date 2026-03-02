import Link from 'next/link';

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-800 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
                <div className="mx-auto bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Đại Học Đà Lạt</h1>
                <p className="text-blue-200">Hệ thống điểm danh thông minh</p>

                <div className="pt-6 space-y-4">
                    <Link href="/student" className="block w-full py-3 px-4 bg-white text-indigo-900 font-semibold rounded-xl shadow hover:bg-indigo-50 transition transform hover:-translate-y-1 text-center">
                        Dành cho Sinh Viên
                    </Link>
                    <Link href="/admin" className="block w-full py-3 px-4 bg-transparent border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition text-center">
                        Dành cho Giảng Viên
                    </Link>
                </div>
            </div>
        </main>
    );
}
