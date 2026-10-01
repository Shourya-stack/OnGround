import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project } from '../lib/types';
import { apiClient } from '../lib/apiClient';

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
  const [activeProjectId, setActiveProjectIdState] = useState<string>(() => localStorage.getItem('onground_active_project_id') || '');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProjects = async () => {
    try {
      const data = await apiClient.getProjects();
      setProjects(data);
      const savedProjectId = localStorage.getItem('onground_active_project_id');
      if (data.length > 0 && !data.some((p) => p.id === activeProjectId)) {
        const nextProjectId = data.some((p) => p.id === savedProjectId) ? savedProjectId! : data[0].id;
        setActiveProjectIdState(nextProjectId);
        localStorage.setItem('onground_active_project_id', nextProjectId);
      }
      if (data.length === 0) {
        setActiveProjectIdState('');
        localStorage.removeItem('onground_active_project_id');
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
    localStorage.setItem('onground_active_project_id', id);
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
