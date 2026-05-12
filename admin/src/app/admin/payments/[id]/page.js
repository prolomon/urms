"use client";
import React, { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, Ban } from "lucide-react";
import { getPayment } from "@/lib/api";

export default function PaymentDetailsPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const receiptRef = useRef(null);

  const router = useRouter();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await getPayment(id);
        if (!mounted) return;
        const paymentData = response?.payment || null;
        setPayment(paymentData);
      } catch (e) {
        console.error("Failed to fetch payment", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [id]);

  const handleRetry = async () => {
    setLoading(true);
    try {
      const response = await getPayment(id);
      const paymentData = response?.payment || null;
      setPayment(paymentData);
    } catch (e) {
      console.error("Failed to fetch payment", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.back();

  const downloadAsPDF = async () => {
    setDownloading(true);
    try {
      // Dynamically import html2canvas and jsPDF
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Receipt-${payment?.reference || id}.pdf`);
    } catch (e) {
      console.error('PDF download failed', e);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '—';
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusConfig = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'SUCCESS':
        return {
          icon: CheckCircle,
          bg: 'bg-emerald-100',
          text: 'text-emerald-700',
          label: 'Success',
        };
      case 'PENDING':
        return {
          icon: Clock,
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          label: 'Pending',
        };
      case 'FAILED':
        return {
          icon: XCircle,
          bg: 'bg-rose-100',
          text: 'text-rose-700',
          label: 'Failed',
        };
      case 'CANCELLED':
        return {
          icon: Ban,
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          label: 'Cancelled',
        };
      case 'REFUNDED':
        return {
          icon: RefreshCw,
          bg: 'bg-purple-100',
          text: 'text-purple-700',
          label: 'Refunded',
        };
      default:
        return {
          icon: AlertCircle,
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          label: status || 'Unknown',
        };
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-3xl space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 md:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-20 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="text-rose-600" size={48} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Payment not found</h2>
          <p className="text-sm md:text-base text-slate-600 mb-6">
            We couldn&apos;t find the requested payment record.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <RefreshCw size={18} />
              Retry
            </button>
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(payment.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <button
          onClick={downloadAsPDF}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <Download size={18} />
          {downloading ? 'Generating PDF...' : 'Download Receipt'}
        </button>
      </div>

      {/* Receipt */}
      <div ref={receiptRef} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        {/* Receipt Header */}
        <div className="bg-linear-to-r from-emerald-500 to-emerald-600 p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Payment Receipt</h1>
              <p className="text-emerald-100 mt-1">Amac Revenue Collection</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${statusConfig.bg} ${statusConfig.text} font-semibold`}>
              <StatusIcon size={20} />
              {statusConfig.label}
            </div>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Reference and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Reference Number</p>
              <p className="text-lg font-mono font-semibold text-slate-900">{payment.reference}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Payment Date</p>
              <p className="text-lg font-semibold text-slate-900">{formatDate(payment.date)}</p>
            </div>
          </div>

          <div className="border-t border-slate-200" />

          {/* Business Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Business Name</p>
                <p className="text-base font-medium text-slate-900">{payment.businessName || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Business Type</p>
                <p className="text-base font-medium text-slate-900">{payment.businessType || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">User ID</p>
                <p className="text-base font-mono text-slate-900">{payment.userId || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Billing Frequency</p>
                <p className="text-base font-medium text-slate-900">{payment.frequency || '—'}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200" />

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Payment Method</p>
                <p className="text-base font-medium text-slate-900">{payment.payment || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Due Date</p>
                <p className="text-base font-medium text-slate-900">{formatDate(payment.due)}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200" />

          {/* Amount */}
          <div className="bg-slate-50 rounded-xl p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Total Amount</p>
                <p className="text-3xl md:text-4xl font-bold text-slate-900">{formatCurrency(payment.amount)}</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div>
              <span className="font-medium">Created:</span> {formatDate(payment.createdAt)}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {formatDate(payment.updatedAt)}
            </div>
          </div>
        </div>

        {/* Receipt Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600">
            This is an official receipt from Amac Revenue Collection System
          </p>
          <p className="text-xs text-slate-500 mt-1">
            For inquiries, please contact the revenue office with your reference number
          </p>
        </div>
      </div>
    </div>
  );
}
