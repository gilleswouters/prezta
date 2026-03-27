import { create } from 'zustand';
import type { ProjectFormData } from '@/types/project';
import { ProjectStatus } from '@/types/project';

interface ProjectWizardState {
    currentStep: number;
    projectData: Partial<ProjectFormData>;
    setStep: (step: number) => void;
    updateData: (data: Partial<ProjectFormData>) => void;
    reset: () => void;
}

const initialState: Partial<ProjectFormData> = {
    name: '',
    client_id: '',
    description: '',
    status: ProjectStatus.DRAFT,
    expected_documents: [],
    start_date: null,
    end_date: null,
};

export const useProjectWizardStore = create<ProjectWizardState>((set) => ({
    currentStep: 1,
    projectData: initialState,
    setStep: (step) => set({ currentStep: step }),
    updateData: (data) => set((state) => ({
        projectData: { ...state.projectData, ...data }
    })),
    reset: () => set({ currentStep: 1, projectData: initialState })
}));
