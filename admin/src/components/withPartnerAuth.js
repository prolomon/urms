"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePartner } from "@/context/PartnerContext";

const withPartnerAuth = (WrappedComponent) => {
  const Wrapper = (props) => {
    const router = useRouter();
    const { isAuthenticated, loading } = usePartner();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push("/auth/partner");
      }
    }, [isAuthenticated, loading, router]);

    if (loading || !isAuthenticated) {
      return null; // Or a loading spinner
    }

    return <WrappedComponent {...props} />;
  };

  return Wrapper;
};

export default withPartnerAuth;
