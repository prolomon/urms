"use client";
import React, { useState, useEffect } from "react";
import { getPayments } from "@/lib/api";

export default function PaymentHistoryPage({ params }) {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    async function loadPayments() {
      try {
        const paymentData = await getPayments(params.id);
        setPayments(paymentData.payments);
      } catch (error) {
        console.error("Failed to fetch payments", error);
      }
    }
    loadPayments();
  }, [params.id]);

  return (
    <div className="p-3">
      <header className="flex items-center justify-between mb-3 bg-white p-3 rounded-2xl shadow-md">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Payment History</h2>
        </div>
      </header>
      <div className="bg-white p-4 rounded-2xl shadow-md">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Reference
              </th>
              <th scope="col" className="px-6 py-3">
                Amount
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="bg-white border-b">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                >
                  {payment.reference}
                </th>
                <td className="px-6 py-4">{payment.amount}</td>
                <td className="px-6 py-4">{payment.status}</td>
                <td className="px-6 py-4">{new Date(payment.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
