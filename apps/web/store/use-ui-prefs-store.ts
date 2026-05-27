"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SchoolProfile {
  name: string;
  location: string;
  avatar: string;
}

export const DEFAULT_USER_NAME = "John Doe";
export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  name: "Delhi Public School",
  location: "Bokaro Steel City",
  avatar: "👨🏻"
};

interface UiPrefsStoreState {
  userName: string;
  school: SchoolProfile;
  notificationsEnabled: boolean;
  setUserName: (name: string) => void;
  setSchool: (school: SchoolProfile) => void;
  toggleNotifications: () => void;
  resetUiPrefs: () => void;
}

export const useUiPrefsStore = create<UiPrefsStoreState>()(
  persist(
    (set) => ({
      userName: DEFAULT_USER_NAME,
      school: DEFAULT_SCHOOL_PROFILE,
      notificationsEnabled: true,

      setUserName: (name) => {
        const nextName = name.trim();
        if (!nextName) return;
        set({ userName: nextName });
      },

      setSchool: (school) => {
        const nextName = school.name.trim();
        const nextLocation = school.location.trim();
        const nextAvatar = school.avatar.trim() || DEFAULT_SCHOOL_PROFILE.avatar;

        if (!nextName || !nextLocation) return;

        set({
          school: {
            name: nextName,
            location: nextLocation,
            avatar: nextAvatar
          }
        });
      },

      toggleNotifications: () =>
        set((state) => ({
          notificationsEnabled: !state.notificationsEnabled
        })),

      resetUiPrefs: () =>
        set({
          userName: DEFAULT_USER_NAME,
          school: DEFAULT_SCHOOL_PROFILE,
          notificationsEnabled: true
        })
    }),
    {
      name: "vedaai-ui-prefs",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
