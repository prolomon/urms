"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function LineChartCard({ data, title }) {
    // Currency formatter
    const currencyFormatter = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    // Calculate max value and domain for Y-axis
    const maxValue = data && data.length > 0 
        ? Math.max(...data.map(item => item.value || 0))
        : 100;
    
    const yAxisMax = Math.max(1, Math.ceil(maxValue));
    const yAxisTicks = Array.from(
        new Set([
            0,
            Math.ceil(yAxisMax * 0.25),
            Math.ceil(yAxisMax * 0.5),
            Math.ceil(yAxisMax * 0.75),
            yAxisMax,
        ])
    ).sort((a, b) => a - b);
    
    return (
        <div className="bg-white rounded-2xl shadow-md p-3">
            <h3 className="text-lg font-bold text-gray-600 mb-3">{title}</h3>
            <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={true} tickLine={true} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                        <YAxis 
                            axisLine={true} 
                            tickLine={true} 
                            tick={{ fill: '#94a3b8', fontSize: 12 }} 
                            dx={-10} 
                            domain={[0, yAxisMax]}
                            ticks={yAxisTicks}
                            tickFormatter={(val) => currencyFormatter.format(val)} 
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [currencyFormatter.format(value), 'Revenue']}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
