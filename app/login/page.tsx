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

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


const Page = () => { // Capitalised component name (React best practice)
    const router = useRouter();
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [resetEmail, setResetEmail] = React.useState(""); // State for forgot password email input

    // 1. Added Form Event parameter here
    const login = async (e: React.FormEvent) => {
        e.preventDefault(); // 2. Prevents the page from reloading on submit

        console.log("Email:", email);
        console.log("Password:", password);
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log("API Response Data:", data);

            // 3. Double check: Ensure data.success matches exactly what your backend returns (true/false)
            if (response.ok && data.success) {
                localStorage.setItem("token", data.token);
                console.log("Login successful, redirecting to home page");
                router.push("/");
            } else {
                alert(data.error || "Login failed");
            }
        }
        catch (error) {
            console.error("Login catch error:", error);
        }
    }



    const SendPasswordResetLink = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: resetEmail }),
            });
            const data = await response.json();
            console.log("Forgot Password API Response:", data);
            if (response.ok && data.success) {
                alert("Password reset link sent to your email!");
            }
            else {
                alert(data.error || "Failed to send password reset link");
            }
        } catch (error) {
            console.error("Forgot Password catch error:", error);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">

                {/* 4. Bind the handler to onSubmit of the form */}
                <form className="mt-6" onSubmit={login}>
                    <FieldSet >
                        <h1 className="text-3xl text-center font-bold text-gray-900">Login your account</h1>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <FieldContent>
                                    <Input className="border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter your email" required />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                <FieldContent>
                                    <Input className="border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Enter your password" required />
                                </FieldContent>
                            </Field>
                        </FieldGroup>
                    </FieldSet>
                    <AlertDialog>
                        <AlertDialogTrigger className="text-sm text-blue-500 hover:underline mt-4 block text-center">
                            Forgot Password?
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Password Reset</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Enter your email to receive a password reset link:
                                </AlertDialogDescription>
                                    <Field className="mt-4">
                                        <FieldContent className="mt-2 w-full">
                                            <Input className="border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2" id="resetEmail" name="resetEmail" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} type="email" placeholder="Enter your email for password reset" required />
                                        </FieldContent>
                                    </Field>

                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={SendPasswordResetLink}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    {/* <a href="/forget-password" className="text-sm text-blue-500 hover:underline">Forgot password?</a> */}

                    <Field orientation="horizontal" className="mt-4">
                        <FieldContent>
                                <Button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Login</Button>
                        </FieldContent>
                    </Field>
                    <a href="/signup" className="text-sm text-blue-500 hover:underline mt-4 block text-center">Don't have an account? Sign up</a>
                </form>
            </div>
        </div>
    )
}

export default Page;


