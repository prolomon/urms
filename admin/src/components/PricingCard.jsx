export default function PricingCard({ title, price, features = [], activeEntities, highlighted = false }) {
    return (
        <div className={`p-4 rounded-2xl transition-all ${highlighted
            ? 'border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/10'
            : "bg-white"
            }`}>
            <div className="flex items-start justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            </div>

            <div className="mb-8">
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-emerald-600">{price}</span>
                    <span className="text-slate-400 font-medium">/month</span>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-emerald-500">✓</span>
                        {f}
                    </div>
                ))}
            </div>

            <div className="pt-6 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-500">
                    Active Entities: <span className="text-slate-800 font-bold">{activeEntities.toLocaleString()}</span>
                </p>
            </div>
        </div>
    );
}
