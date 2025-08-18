"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export default function Wall() {
  const role = useQuery(api.user.getUserRole);

  if (role === undefined) {
    return <div>Loading...</div>;
  }

  if (role !== "user") {
    return <div>You do not have permission to view the Wall.</div>;
  }

  return <div>Protected Wall</div>;
}
