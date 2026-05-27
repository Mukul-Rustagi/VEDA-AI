"use client";

import type {
  AssignmentDetail,
  AssignmentStatusEvent,
  AssignmentSummary
} from "@vedaai/shared";
import { create } from "zustand";

import {
  deleteAssignment as deleteAssignmentRequest,
  fetchAssignmentById,
  fetchAssignments,
  regenerateAssignment
} from "@/lib/api";

interface AssignmentStoreState {
  assignments: AssignmentSummary[];
  loading: boolean;
  error: string | null;
  selectedAssignment: AssignmentDetail | null;
  selectedLoading: boolean;
  selectedError: string | null;
  loadAssignments: () => Promise<void>;
  loadAssignmentById: (id: string) => Promise<void>;
  upsertAssignment: (assignment: AssignmentSummary) => void;
  removeAssignment: (id: string) => void;
  applyStatusEvent: (event: AssignmentStatusEvent) => void;
  triggerRegeneration: (id: string) => Promise<void>;
  deleteAssignmentById: (id: string) => Promise<void>;
}

function upsertCollection(
  collection: AssignmentSummary[],
  nextItem: AssignmentSummary
): AssignmentSummary[] {
  const existingIndex = collection.findIndex((item) => item.id === nextItem.id);
  if (existingIndex === -1) {
    return [nextItem, ...collection];
  }

  const nextCollection = [...collection];
  nextCollection[existingIndex] = {
    ...nextCollection[existingIndex],
    ...nextItem
  };
  return nextCollection;
}

export const useAssignmentStore = create<AssignmentStoreState>((set, get) => ({
  assignments: [],
  loading: false,
  error: null,
  selectedAssignment: null,
  selectedLoading: false,
  selectedError: null,

  loadAssignments: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchAssignments();
      set({ assignments: data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to fetch assignments"
      });
    }
  },

  loadAssignmentById: async (id: string) => {
    set({ selectedLoading: true, selectedError: null });
    try {
      const data = await fetchAssignmentById(id);
      set((state) => ({
        selectedAssignment: data,
        selectedLoading: false,
        assignments: upsertCollection(state.assignments, {
          id: data.id,
          title: data.title,
          subject: data.subject,
          className: data.className,
          dueDate: data.dueDate,
          createdAt: data.createdAt,
          status: data.status,
          totalQuestions: data.totalQuestions,
          totalMarks: data.totalMarks,
          errorMessage: data.errorMessage
        })
      }));
    } catch (error) {
      set({
        selectedLoading: false,
        selectedError:
          error instanceof Error ? error.message : "Unable to fetch assignment"
      });
    }
  },

  upsertAssignment: (assignment) => {
    set((state) => ({
      assignments: upsertCollection(state.assignments, assignment)
    }));
  },

  removeAssignment: (id) => {
    set((state) => ({
      assignments: state.assignments.filter((item) => item.id !== id),
      selectedAssignment:
        state.selectedAssignment?.id === id ? null : state.selectedAssignment,
      selectedError: state.selectedAssignment?.id === id ? null : state.selectedError
    }));
  },

  applyStatusEvent: (event) => {
    set((state) => ({
      assignments: state.assignments.map((item) =>
        item.id === event.assignmentId
          ? {
              ...item,
              status: event.status,
              errorMessage: event.errorMessage
            }
          : item
      ),
      selectedAssignment:
        state.selectedAssignment?.id === event.assignmentId
          ? {
              ...state.selectedAssignment,
              status: event.status,
              errorMessage: event.errorMessage
            }
          : state.selectedAssignment
    }));
  },

  triggerRegeneration: async (id: string) => {
    const updated = await regenerateAssignment(id);
    get().upsertAssignment(updated);
  },

  deleteAssignmentById: async (id: string) => {
    await deleteAssignmentRequest(id);
    get().removeAssignment(id);
  }
}));
