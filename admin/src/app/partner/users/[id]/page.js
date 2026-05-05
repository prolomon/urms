"use client";
import React, { useState, useEffect } from "react";
import { getMember } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserPage({ params }) {
  const [member, setMember] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function loadMember() {
      try {
        const memberData = await getMember(params.id);
        setMember(memberData);
      } catch (error) {
        console.error("Failed to fetch member", error);
      }
    }
    loadMember();
  }, [params.id]);

  if (!member) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-3">
      <header className="flex items-center justify-between mb-3 bg-white p-3 rounded-2xl shadow-md">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {member.fullname}
          </h2>
          <p className="text-slate-500">{member.email}</p>
        </div>
        <Link href={`/users/${member.id}/payments`} legacyBehavior>
          <a className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            View Payment History
          </a>
        </Link>
      </header>
      <div className="bg-white p-4 rounded-2xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-md font-bold text-slate-800">
              Business Name
            </h3>
            <p className="text-slate-500">{member.businessName}</p>
          </div>
          <div>
            <h3 className="text-md font-bold text-slate-800">
              Business Type
            </h3>
            <p className="text-slate-500">{member.businessType}</p>
          </div>
          <div>
            <h3 className="text-md font-bold text-slate-800">Phone</h3>
            <p className="text-slate-500">{member.phone}</p>
          </div>
          <div>
            <h3 className="text-md font-bold text-slate-800">Location</h3>
            <p className="text-slate-500">{member.location.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
