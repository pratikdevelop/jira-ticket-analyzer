"use client";

import { Field, FieldContent, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input, Button } from "@base-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useEffect } from "react";

export default function ResetPasswordPage() {
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const searchParams = useSearchParams();
    const router = useRouter();
    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            // Optionally, you can verify the token on the cli
            // ent side here
            console.log("Received token:", token);
                fetch("/api/auth/verify-reset-token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token }),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        console.log("Token verification response:", data);
                        if (data.success) {
                            console.log("Token is valid, proceed with password reset");
                            // You can set some state here to show the password reset form
                        }
                        else {
                            alert(data.error || "Invalid or expired token");
                            router.push("/login");
                            
                        }
                    })
                    .catch((error) => {
                        console.error("Error verifying token:", error);
                        alert("An error occurred while verifying the token");
                    });

        } else {
            console.warn("No token found in URL");
        }
    }, []);
    const resetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
            const token = searchParams.get("token");
            console.log("Resetting password with token:", token);
            try {
                const response = await fetch("/api/auth/reset-password", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token, password }),
                }); 
                const data = await response.json();
                console.log("Password reset response:", data);
                if (response.ok && data.success) {
                    alert("Password reset successful! You can now log in with your new password.");
                    router.push("/login");
                }
                else {
                    alert(data.error || "Password reset failed");
                }
            } catch (error) {
                console.error("Error during password reset:", error);
                alert("An error occurred while resetting the password");
            }   
    }


//   const token = searchParams.get("token");

  return (
           <div className="min-h-screen flex items-center justify-center">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">

                {/* 4. Bind the handler to onSubmit of the form */}
                <form className="mt-6" onSubmit={resetPassword}>
                    <FieldSet >
                        <h1 className="text-3xl text-center font-bold text-gray-900">Reset Password</h1>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="password">New Password</FieldLabel>
                                <FieldContent>
                                    <Input className="border p-1 px-2 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Enter your new password" required />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                                <FieldContent>
                                    <Input className="border p-1 px-2 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="Confirm your new password" required />
                                </FieldContent>
                            </Field>
                        </FieldGroup>
                    </FieldSet>
              
                    {/* <a href="/forget-password" className="text-sm text-blue-500 hover:underline">Forgot password?</a> */}

                    <Field orientation="horizontal" className="mt-4">
                        <FieldContent>
                                <Button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Login</Button>
                        </FieldContent>
                    </Field>
                </form>
            </div>
        </div>
  );
}