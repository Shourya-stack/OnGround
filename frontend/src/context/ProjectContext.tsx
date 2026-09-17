import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project } from '../lib/types';
import { apiService } from '../api/apiService';

interface ProjectContextType {
  activeProject: Project | null;
  projects: Project[];
  loading: boolean;
  setActiveProjectId: (id: string) => void;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string>('proj-01');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProjects = async () => {
    try {
      const data = await apiService.getProjects();
      setProjects(data);
      if (data.length > 0 && !data.some((p) => p.id === activeProjectId)) {
        setActiveProjectIdState(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const setActiveProjectId = (id: string) => {
    setActiveProjectIdState(id);
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  return (
    <ProjectContext.Provider
      value={{
        activeProject,
        projects,
        loading,
        setActiveProjectId,
        refreshProjects: fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return ctx;
};
