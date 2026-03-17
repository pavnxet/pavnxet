import React from 'react';
import ProjectCard from './ProjectCard';
import { Project } from '@/lib/storage';

interface ProjectGridProps {
  projects: Project[];
}

const ProjectGrid: React.FC<ProjectGridProps> = ({ projects }) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <p className="text-gray-500">No projects added yet. Start by adding your first project above!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          name={project.name}
          url={project.url}
          icon={project.icon}
        />
      ))}
    </div>
  );
};

export default ProjectGrid;
