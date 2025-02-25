"use client"
import { signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Navbar() {


  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-xl font-bold">
          FinTrack
        </div>
        <div className="flex space-x-4">
          <Link href="/dashboard" className="text-white">
            Dashboard
          </Link>
          <Link href="/transactions" className="text-white">
            Transactions
          </Link>
          <Link href="/budget" className="text-white">
            Budget
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="text-white">
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}
