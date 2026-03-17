'use client';

import { useState, useEffect } from 'react';
import ProjectGrid from '@/components/ProjectGrid';
import AddProjectForm from '@/components/AddProjectForm';
import { Project } from '@/lib/storage';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch {
      console.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            My Project <span className="text-blue-600">Museum</span>
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            A curated collection of my deployed projects and experiments.
          </p>
        </header>

        <main>
          <AddProjectForm onProjectAdded={fetchProjects} />

          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center sm:text-left">Collection</h2>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ProjectGrid projects={projects} />
            )}
          </div>
        </main>

        <footer className="mt-24 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} Project Museum. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
