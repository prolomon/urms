export default function EntityTable({ rows = [] }) {
    return (
        <div className="bg-white rounded-2xl shadow-md p-3">
            <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-xl text-gray-800">Entity Management</div>
                <div className="space-x-3">
                    <button className="bg-green-600 text-white px-3 py-2 rounded-2xl hover:bg-green-700 transition-colors">+ Add Entity</button>
                    <button className="bg-blue-600 text-white px-3 py-2 rounded-2xl hover:bg-blue-700 transition-colors">Bulk Import</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-sm text-gray-500">
                            <th className="py-3">Entity ID</th>
                            <th>Business Name</th>
                            <th>Category</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Last Payment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i} className="hover:bg-gray-50 even:bg-gray-50 text-gray-800">
                                <td className="px-3 py-3 text-sm text-gray-700">{r.id}</td>
                                <td className="px-3">{r.name}</td>
                                <td><span className="px-3 py-1 rounded  text-sm">{r.category}</span></td>
                                <td className="px-3">{r.location}</td>
                                <td>
                                    <span className={`px-3 py-1 rounded text-sm font-medium ${r.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td className="text-sm text-gray-600">{r.lastPayment}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="text-sm text-gray-500 mt-3">Showing <strong className="text-gray-800">{rows.length}</strong> of 2,847 entities</div>
        </div>
    );
}
