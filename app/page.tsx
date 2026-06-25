"use client";

import { useEffect, useState } from "react";
import Navbar from "./Navbar/page";
import { ProjectsAccordian } from "./ProjectAccordian";
import  ProjectDetailsBoard  from "./ProjectDetailsBoard/page";

export default function page() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);
const fetchProjects = async () => {
  try {
    const response = await fetch("/api/projects/get_projects", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await response.json();

    console.log("API Response:", data);
if (data.success) {
  setProjects(data.data);
  console.log("Projects loaded:", data.data);
}
  } catch (error) {
    console.error(error);
  }
};
const showProjectDetails = (project: any) => {
  setSelectedProject(project);
}

  return (
    <div className="min-h-screen flex bg-slate-100">

        <aside className="w-3/12 bg-white border-r h-screen p-5">
          <h2 className="font-bold text-xl mb-6">Issue Tracker</h2>

          <nav className="space-y-3">
            {/* <div>Dashboard</div> */}
            {/* <div>Projects</div> */}
            <ProjectsAccordian projects={projects} showProjectDetails={showProjectDetails}  />
          </nav>
        </aside>

        <main className="w-9/12 ">
          <Navbar/>
          {/* <div className="flex justify-between mb-6 p-8">
            <h1 className="text-3xl font-bold">Projects</h1>

            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Create Project
            </button>
          </div> */}

          <div className="flex-1 gap-6 p-8">
            {
              selectedProject ? (
              <ProjectDetailsBoard project={selectedProject} />
              ) : (
                <div className="col-span-3 text-center text-gray-500">
                  Select a project to see details
                </div>
              )
            }
           
          </div>
        </main>
      </div>
  );
}