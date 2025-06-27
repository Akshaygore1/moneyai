"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import GmailDashboardRoute from "../components/GmailDashboardRoute";
import Chat from "@/components/AichatBox";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  console.log(session);
  if (session) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {session.user?.name}!
              </h1>
              <div className="flex items-center gap-4">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-600">
                  {session.user?.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gmail Dashboard */}
        <div className="py-8">
          <GmailDashboardRoute />
        </div>
        <div className="py-8">
          <Chat />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to My App
          </h1>
          <p className="text-gray-600 mb-6">Please sign in to continue</p>
          <button
            onClick={() => signIn("google")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
