"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function GmailDashboardRoute() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    redirect("/");
    return <div>Unauthenticated</div>;
  }

  if (status === "authenticated") {
    return (
      <div className="flex flex-col gap-4 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Get Emails</h1>
          </div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer"
            onClick={async () => {
              setLoading(true);
              const response = await fetch("/api/gmail/emails", {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              });
              const data = await response.json();
              console.log(data);
              setLoading(false);
            }}
          >
            Get Emails
          </button>
        </div>
      </div>
    );
  }
}
