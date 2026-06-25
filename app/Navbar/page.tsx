import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'
import {Input} from "@/components/ui/input"
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

const page = () => {
    const [profile, setProfile] = React.useState<any>(null);
    const router = useRouter();
    useEffect(() => {
        const token = localStorage.getItem("token");
        console.log("Token on page load:", token);
        if (!token) {
          console.log("No token found, redirecting to login");
            router.push("/login");
        }
        const fetchProfile = async () => {
            try {
                const response = await fetch("/api/auth/profile", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },  
                });

                const data = await response.json();
                console.log("Profile API Response:", data);
                if (!response.ok) {
                    alert(data.error || "Failed to fetch profile");
                    localStorage.removeItem("token");
                    router.push("/login");
                } else {
                    setProfile(data.data);
                    console.log("Profile loaded:", data.data);
                }
            } catch (error) {
                console.error("Profile fetch error:", error);
                localStorage.removeItem("token");
                router.push("/login");
            }   
        };
        fetchProfile();
    }, []);

  return (
    <div className="h-20 border border-slate-300 bg-white w-full p-6 flex items-center">
        <div className="flex items-center w-8/12">

        <Input
          type="search"
          placeholder="Search projects..."
          className="p-2 border rounded"
        />
        <Button variant="default" size="lg"  className="ml-4 bg-blue-600 text-white px-4 py-2 rounded">
          <PlusIcon size={16} className="text-white text-base" />
          <span className="ml-1 text-base">Create</span>
        </Button>
        </div>
        <div className="flex items-center justify-end w-4/12">
          {profile ? (
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                </div>
            </div>
          )
            : (
                <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
                    Login
                </Button>
            )
          }
          </div>
        
                {/* <span className="text-sm font-medium">{profile.name || profile.email}</span> */}
    </div>
  )
}

export default page
