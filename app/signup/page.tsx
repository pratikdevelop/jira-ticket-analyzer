"use client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Field,
    FieldContent,
    FieldGroup,
    FieldLabel,
    FieldSet,
} from "@/components/ui/field"
import React from 'react'
import { useRouter } from 'next/navigation'

const page = () => {
    const router = useRouter();
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const signup = async () => {
        console.log("Email:", email);
        console.log("Password:", password);
        console.log("Name:", name);
        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, name }),
            });
            const data = await response.json();
            console.log(data);
            if (data.success) {
                console.log("Signup successful, redirecting to home page");
                router.push("/");
            } else {
                alert(data.error || "Signup failed");
            }
            // if (data.success) {
            // } else {
            //     alert(data.error || "Login failed");
            // }
        }
        catch (error) {
            console.error(error);
        }
    }
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">

                <form className="mt-6" method="POST" >
                    <FieldSet >
                        <h1 className="text-3xl text-center font-bold text-gray-900">Signup for an account</h1>

                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">Name</FieldLabel>
                                <FieldContent>
                                    <Input className="border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Enter your name" />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <FieldContent>
                                    <Input className="border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter your email" />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                <FieldContent>
                                    <Input className="border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Enter your password" />
                                </FieldContent>
                            </Field>
                        </FieldGroup>
                    </FieldSet>
                    
                    <Field orientation="horizontal" className="mt-4">
                        <FieldContent>

                            <Button type="button" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600" onClick={signup}>Signup</Button>
                        </FieldContent>
                    </Field>
                </form>
            </div>


        </div>
    )
}


export default page
