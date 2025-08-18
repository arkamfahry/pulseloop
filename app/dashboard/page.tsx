"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export default function Dashboard() {
  const role = useQuery(api.user.getUserRole);

  if (role === undefined) {
    return <div>Loading...</div>;
  }

  if (role !== "admin") {
    return <div>You do not have permission to view the Dashboard.</div>;
  }

  return <div>Protected Dashboard</div>;
}
