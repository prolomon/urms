export default function AgentList({ agents = [] }) {
    return (
        <div className="space-y-4">
            {agents.map((a, i) => (
                <div key={i} className="p-6 bg-white rounded-2xl shadow-md">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h4 className="font-bold text-gray-800">{a.name}</h4>
                            <p className="text-xs text-gray-400">ID: {a.id} | Zone: {a.zone}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-emerald-600">{a.percentage}%</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Target Achievement</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium">Entities: <span className="text-gray-800 font-bold">{a.entities}</span></span>
                        <span className="text-gray-600 font-medium">Collections: <span className="text-gray-800 font-bold">{a.collected}</span></span>
                    </div>

                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-1000"
                            style={{ width: `${a.percentage}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
