"use client"
import { signIn } from "next-auth/react";
import { Button } from "../ui/button";

export default function(){

    return(
        <div>
            <Button onClick={() => signIn()} variant="ghost">
                Log In
            </Button>
        </div>
    )
}