"use client"

import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export default function(){

    const router = useRouter();
    return(
        <div>
            <Button onClick = {() => {
                router.push("/auth/signup")
            }} >
                Get Started
            </Button>
        </div>
    )
}