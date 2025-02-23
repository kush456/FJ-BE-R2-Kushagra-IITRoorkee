"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";   
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Add loading state
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true); // Set loading to true

    const result = await signIn("credentials", {
      email,
      password,
      redirect : false,
    });

    setLoading(false); // Set loading to false

    if (result?.error) {
     setError(result.error);
     return;
    }

    console.log("sign in successful");
    // Redirect to the home page after successful sign in
    router.push("/dashboard");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#f7f9fc]">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Welcome Back to FinTrack!
        </h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"} {/* Show loader text */}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-4">
          New here? <a href="/auth/signup" className="text-blue-600">Create an account</a>
        </div>
      </div>
    </div>
  );
}
