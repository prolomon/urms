"use client";
import React, { useState, useEffect } from "react";
import { Eye, UserCircle } from "lucide-react";
import KPI from "../../components/KPI";
import LineChartCard from "../../components/LineChartCard";
import PieChartCard from "../../components/PieChartCard";
import withPartnerAuth from "../../components/withPartnerAuth";
import { getAllPayments, getPricing } from "@/lib/api";
import { getMembersByCompanyId } from "@/lib/services/member";
import { getAgents } from "@/lib/services/agent";
import { getPricingByCenter } from "@/lib/services/pricing";
import { usePartner } from "@/context/PartnerContext";
import { getWallet } from "@/lib/services/wallet";

function Home() {
  const { user } = usePartner();
  const [wallet, setWallet] = useState();
  const userId = user?.uid;
  const [isLive, setIsLive] = useState(true);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [totals, setTotals] = useState({
    entities: 0,
    monthlyRevenue: 0,
    paymentRate: 0, 
    agents: 0,
  });

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      try {

        const walletRes = await getWallet(userId, "COMPANY");
        console.log(walletRes)
        setWallet(walletRes);

        // fetch members (get a larger page so we can build distribution)
        const memberData = await getMembersByCompanyId(1, 100, user.uid);
        if (isCancelled) return;
        const membersList = memberData?.data || [];
        const totalEntities = memberData?.meta?.total ?? membersList.length;

        // fetch payments for dashboard calculations
        const paymentsData = await getAllPayments();
        if (isCancelled) return;
        const allPayments = paymentsData?.data || paymentsData || [];

        // fetch agents
        const agentsData = await getAgents(user.uid);
        if (isCancelled) return;
        const agentsList = agentsData?.data || [];
        const totalAgents = agentsData?.meta?.total ?? agentsList.length;

        // fetch pricing tiers
        const pricingData = await getPricingByCenter(user.center);
        if (isCancelled) return;
        const pricingList = pricingData?.data || pricingData || [];

        // compute monthly revenue (current month)
        const now = new Date();
        const monthly = allPayments.reduce((sum, p) => {
          const date = p.date
            ? new Date(p.date)
            : p.createdAt
              ? new Date(p.createdAt)
              : null;
          if (!date) return sum;
          if (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth()
          ) {
            const amt =
              typeof p.amount === "number"
                ? p.amount
                : parseFloat(p.amount) || 0;
            return sum + amt;
          }
          return sum;
        }, 0);

        // compute payment success rate
        const totalPayments = allPayments.length;
        const successCount = allPayments.filter(
          (p) => (p.status || "").toLowerCase() === "success",
        ).length;
        const paymentRate =
          totalPayments > 0
            ? Math.round((successCount / totalPayments) * 1000) / 10
            : 0;

        setMembers(membersList);
        setPayments(allPayments);
        setAgents(agentsList);
        setPricing(pricingList);
        setTotals({
          entities: totalEntities,
          monthlyRevenue: monthly,
          paymentRate,
          agents: totalAgents,
        });
        console.log(
          "Data loaded",
          totalEntities,
          monthly,
          paymentRate,
          totalAgents,
        );
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to fetch data", error);
        }
      }
    };

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [user.center, user.uid, userId]);

  console.log(user, wallet, members.length, payments.length, agents.length, pricing.length);

  // // derive revenueData (last 12 months) from payments
  const revenueDataFromPayments = React.useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d);
    }
    return months.map((m) => {
      const monthLabel = m.toLocaleString("default", { month: "short" });
      const value = payments.reduce((sum, p) => {
        const date = p.date
          ? new Date(p.date)
          : p.createdAt
            ? new Date(p.createdAt)
            : null;
        if (!date) return sum;
        if (
          date.getFullYear() === m.getFullYear() &&
          date.getMonth() === m.getMonth()
        ) {
          const amt =
            typeof p.amount === "number" ? p.amount : parseFloat(p.amount) || 0;
          return sum + amt;
        }
        return sum;
      }, 0);
      return { name: monthLabel, value };
    });
  }, [payments]);

  // derive pie chart data (businessType distribution) from members
  const pieDataFromMembers = React.useMemo(() => {
    const counts = { SMALL: 0, MEDIUM: 0, LARGE: 0, INDIVIDUAL: 0 };
    members.forEach((m) => {
      const t = (m.businessType || "").toUpperCase();
      if (t === "SMALL") counts.SMALL++;
      else if (t === "MEDIUM") counts.MEDIUM++;
      else if (t === "LARGE") counts.LARGE++;
      else counts.INDIVIDUAL++;
    });
    const arr = [];
    if (counts.SMALL) arr.push({ name: "Small Business", value: counts.SMALL });
    if (counts.MEDIUM)
      arr.push({ name: "Medium Business", value: counts.MEDIUM });
    if (counts.LARGE) arr.push({ name: "Large Business", value: counts.LARGE });
    if (counts.INDIVIDUAL)
      arr.push({ name: "Individual", value: counts.INDIVIDUAL });
    return arr.length ? arr : [{ name: "No Data", value: 1 }];
  }, [members]);

  // derive bar chart data (revenue by pricing tier)
  const barDataFromPricing = React.useMemo(() => {
    const tierRevenue = {};
    payments.forEach((p) => {
      const tierTitle = p.pricingTier || p.tier || "Unassigned";
      const amt =
        typeof p.amount === "number" ? p.amount : parseFloat(p.amount) || 0;
      tierRevenue[tierTitle] = (tierRevenue[tierTitle] || 0) + amt;
    });
    // If no payments by tier, use pricing tier names from schema
    if (Object.keys(tierRevenue).length === 0 && pricing.length > 0) {
      return pricing.map((p) => ({
        name: p.title || "Unknown",
        value: 0,
      }));
    }
    return Object.entries(tierRevenue).map(([name, value]) => ({
      name,
      value: Math.round(value / 1000),
    }));
  }, [payments, pricing]);

  return (
    <div className="mx-auto max-w-7xl p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-linear-to-r from-emerald-50 to-cyan-50 p-4 rounded-2xl shadow-sm ring-1 ring-emerald-100 gap-2">
        <div className="text-lg font-semibold text-slate-600">
          Welcome back, Admin. Here&apos;s your overview.
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm font-semibold ${
              isLive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-blue-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-blue-500"} animate-pulse`}
            />
            {isLive ? "Live" : "Test"}
          </div>
          <button
            onClick={() => setIsLive(!isLive)}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-800 rounded-xl text-sm font-semibold hover:bg-slate-200"
          >
            <Eye size={16} />
            <span className="hidden sm:inline">Switch to {isLive ? "Test" : "Live"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPI
          title="Total Entities"
          value={totals.entities.toLocaleString()}
          meta="Updated now"
          colorClass="text-emerald-600"
        />
        <KPI
          title="Monthly Revenue"
          value={`₦${totals.monthlyRevenue.toLocaleString()}`}
          meta="Current month"
          colorClass="text-emerald-600"
        />
        <KPI
          title="Payment Rate"
          value={`${totals.paymentRate}%`}
          meta="Success rate"
          colorClass="text-emerald-600"
        />
        <KPI
          title="Active Agents"
          value={totals.agents.toLocaleString()}
          meta="Registered"
          colorClass="text-emerald-600"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Performance Overview</h3>
            <p className="text-sm text-slate-500">Revenue trend and entity distribution</p>
          </div>
          <span className="hidden sm:inline text-xs text-slate-400">Last updated just now</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <LineChartCard
              data={revenueDataFromPayments}
              title="Revenue Trend (Last 12 Months)"
            />
          </div>
          <div className="lg:col-span-1">
            <PieChartCard
              data={pieDataFromMembers}
              title="Entity Distribution"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default withPartnerAuth(Home);
