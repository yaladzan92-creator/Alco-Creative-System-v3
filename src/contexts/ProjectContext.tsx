import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db, doc, getDoc } from "@/lib/firebase";
import { normalizeProject } from "@/lib/projectSchema";

interface ProjectContextType {
  activeProjectId: string | null;
  activeProject: any | null;
  setActiveProjectId: (id: string | null) => void;
  setActiveProject: (project: any | null) => void;
  refreshActiveProject: () => Promise<void>;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType>({
  activeProjectId: null,
  activeProject: null,
  setActiveProjectId: () => {},
  setActiveProject: () => {},
  refreshActiveProject: async () => {},
  loading: false,
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      // Check current URL first if already on a wizard route
      const match = window.location.pathname.match(/\/wizard\/([^/?#]+)/);
      if (match && match[1] && match[1] !== "undefined" && match[1] !== "null") {
        return match[1];
      }
      const saved = localStorage.getItem("alco_active_project_id");
      if (saved && saved !== "undefined" && saved !== "null") {
        return saved;
      }
    }
    return null;
  });

  const [activeProject, setActiveProjectState] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const setActiveProjectId = useCallback((id: string | null) => {
    if (!id || id === "undefined" || id === "null") {
      setActiveProjectIdState(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("alco_active_project_id");
      }
      setActiveProjectState(null);
      return;
    }

    setActiveProjectIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("alco_active_project_id", id);
    }
  }, []);

  const setActiveProject = useCallback((project: any | null) => {
    if (!project) {
      setActiveProjectState(null);
      return;
    }
    const normalized = normalizeProject(project);
    setActiveProjectState(normalized);
    if (normalized.id && normalized.id !== "undefined" && normalized.id !== "null") {
      setActiveProjectIdState(normalized.id);
      if (typeof window !== "undefined") {
        localStorage.setItem("alco_active_project_id", normalized.id);
      }
    }
  }, []);

  const fetchProjectById = useCallback(async (id: string) => {
    if (!id || id === "undefined" || id === "null") return null;
    try {
      setLoading(true);
      const docRef = doc(db, "projects", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const raw = snap.data();
        const normalized = normalizeProject({ id: snap.id, ...raw });
        return normalized;
      }
      return null;
    } catch (err) {
      console.warn("[ProjectContext] Gagal mengambil data proyek:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshActiveProject = useCallback(async () => {
    if (activeProjectId) {
      const proj = await fetchProjectById(activeProjectId);
      if (proj) {
        setActiveProjectState(proj);
      }
    }
  }, [activeProjectId, fetchProjectById]);

  // When activeProjectId changes and activeProject doesn't match, fetch it
  useEffect(() => {
    if (activeProjectId && (!activeProject || activeProject.id !== activeProjectId)) {
      let isMounted = true;
      fetchProjectById(activeProjectId).then((proj) => {
        if (isMounted && proj) {
          setActiveProjectState(proj);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [activeProjectId, activeProject, fetchProjectById]);

  // Synchronize across tabs or local changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "alco_active_project_id") {
        const newId = e.newValue;
        if (newId && newId !== "undefined" && newId !== "null") {
          setActiveProjectIdState(newId);
        } else {
          setActiveProjectIdState(null);
          setActiveProjectState(null);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        activeProjectId,
        activeProject,
        setActiveProjectId,
        setActiveProject,
        refreshActiveProject,
        loading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
