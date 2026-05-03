export default function KPI({ title, value, meta, colorClass = 'text-emerald-600' }) {
    return (
        <div className="relative bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow ring-1 ring-slate-100">
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-linear-to-r from-emerald-500 via-cyan-500 to-blue-500 opacity-20" />
            <div>
                <p className="text-xs text-slate-500 mb-1 tracking-wide uppercase">{title}</p>
                <h3 className="text-3xl font-bold text-slate-800 mb-1">{value}</h3>
                <div className={`text-sm font-medium ${colorClass}`}>{meta}</div>
            </div>
        </div>
    );
}
