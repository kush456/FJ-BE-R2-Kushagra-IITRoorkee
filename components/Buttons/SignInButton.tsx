"use client"
import { signIn } from "next-auth/react";
import { Button } from "../ui/button";

export default function SignInButton(){

    return(
        <div>
            <Button onClick={() => signIn()} variant="ghost">
                Log In
            </Button>
        </div>
    )
}