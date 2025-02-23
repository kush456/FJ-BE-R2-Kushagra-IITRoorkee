"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(""); //a good ui feature to simply clear the error when the user starts typing again in the form
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); 
    setLoading(true); 

    try {
      const response = await axios.post("/api/signup", formData);

      if (response.status === 201) {
        //sign in the user already if he has just signed up
        const signInResponse = await signIn("credentials", {
          redirect: false, // CHECK THIS
          email: formData.email,
          password: formData.password,
        });

        if (signInResponse?.ok) {
          router.push("/"); // CHECK THIS
        } else {
          setError("Something went wrong during sign-in.");
        }
      }
    } catch (error: any) {
      if (error.response) {
        setError(error.response.data.message || "Something went wrong.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-md rounded-md">
        <h2 className="text-2xl font-semibold text-center text-gray-700">Get Started with FinTrack!</h2>
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full mt-1 p-2 border rounded-md"
              placeholder="Your Name"
              required
              disabled={loading} // Disable input when loading
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full mt-1 p-2 border rounded-md"
              placeholder="Your Email"
              required
              disabled={loading} // Disable input when loading
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full mt-1 p-2 border rounded-md"
              placeholder="Your Password"
              required
              disabled={loading} // Disable input when loading
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <button
            type="submit"
            className={`w-full px-4 py-2 mt-4 text-white rounded-md ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={loading} // Disable button when loading
          >
            {loading ? "Processing..." : "Sign Up"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <a href="/auth/signin" className="text-blue-600">Log In</a>
        </div>
      </div>
    </div>
  );
}
