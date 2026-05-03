"use client";

export default function Header() {
    return (
        <header className="bg-white rounded-md mb-6">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    <div className="bg-green-600 w-10 h-10 rounded flex items-center justify-center text-white font-bold">A</div>
                    <div>
                        <div className="font-bold text-lg text-gray-800">AURMS Admin Dashboard</div>
                        <div className="text-sm text-gray-500">Revenue Management & Analytics</div>
                    </div>
                </div>
                {/* Navigation removed per request */}
            </div>
        </header>
    );
}
