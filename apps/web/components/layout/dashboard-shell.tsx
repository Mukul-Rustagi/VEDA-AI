"use client";

import clsx from "clsx";
import {
  ArrowLeft,
  Bell,
  Clock3,
  ChevronDown,
  FileText,
  Image,
  LayoutGrid,
  Menu,
  Plus,
  RotateCcw,
  Settings,
  Sparkles,
  Square,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_SCHOOL_PROFILE,
  DEFAULT_USER_NAME,
  useUiPrefsStore
} from "@/store/use-ui-prefs-store";

const menuItems = [
  { id: "home", label: "Home", href: "/home", icon: LayoutGrid },
  { id: "groups", label: "My Groups", href: "/groups", icon: Image },
  {
    id: "assignments",
    label: "Assignments",
    href: "/assignments",
    icon: FileText,
    badge: "59"
  },
  {
    id: "toolkit",
    label: "AI Teacher's Toolkit",
    href: "/toolkit",
    icon: Square
  },
  { id: "library", label: "My Library", href: "/library", icon: Clock3 }
];

interface DashboardShellProps {
  pageTitle: string;
  children: ReactNode;
}

export function DashboardShell({
  children,
  pageTitle
}: DashboardShellProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const userName = useUiPrefsStore((state) => state.userName);
  const school = useUiPrefsStore((state) => state.school);
  const notificationsEnabled = useUiPrefsStore(
    (state) => state.notificationsEnabled
  );
  const setUserName = useUiPrefsStore((state) => state.setUserName);
  const setSchool = useUiPrefsStore((state) => state.setSchool);
  const toggleNotifications = useUiPrefsStore(
    (state) => state.toggleNotifications
  );
  const resetUiPrefs = useUiPrefsStore((state) => state.resetUiPrefs);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);

  const [draftUserName, setDraftUserName] = useState(userName);
  const [draftSchoolName, setDraftSchoolName] = useState(school.name);
  const [draftSchoolLocation, setDraftSchoolLocation] = useState(school.location);
  const [draftSchoolAvatar, setDraftSchoolAvatar] = useState(school.avatar);

  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const userInitial = useMemo(() => {
    const trimmed = userName.trim();
    return trimmed ? trimmed[0]?.toUpperCase() : "J";
  }, [userName]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (!isUserMenuOpen) return;
      if (!userMenuRef.current) return;
      if (userMenuRef.current.contains(event.target as Node)) return;
      setIsUserMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isUserMenuOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      setIsUserMenuOpen(false);
      setIsProfileModalOpen(false);
      setIsSchoolModalOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  function openProfileModal(): void {
    setDraftUserName(userName);
    setIsProfileModalOpen(true);
    setIsUserMenuOpen(false);
  }

  function openSchoolModal(): void {
    setDraftSchoolName(school.name);
    setDraftSchoolLocation(school.location);
    setDraftSchoolAvatar(school.avatar);
    setIsSchoolModalOpen(true);
    setIsUserMenuOpen(false);
  }

  function handleBack(): void {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/home");
  }

  const isAssignmentsListPage = pathname === "/assignments";
  const sidebarPrimaryHref = isAssignmentsListPage ? "/assignments/new" : "/toolkit";
  const sidebarPrimaryLabel = isAssignmentsListPage
    ? "Create Assignment"
    : "AI Teacher's Toolkit";

  return (
    <div className="dashboardRoot">
      <aside className="sidebar desktopOnly">
        <div className="brandBlock">
          <div className="brandLogo">V</div>
          <span>VedaAI</span>
        </div>

        <Link className="sidebarCreateBtn" href={sidebarPrimaryHref}>
          {isAssignmentsListPage ? <Plus size={13} /> : <Sparkles size={13} />}
          {sidebarPrimaryLabel}
        </Link>

        <nav className="menuBlock">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={clsx("menuItem", {
                  active
                })}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {"badge" in item && item.badge ? (
                  <span className="menuItemBadge">{item.badge}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <button type="button" className="sidebarSettings" onClick={openSchoolModal}>
          <Settings size={13} />
          <span>Settings</span>
        </button>

        <button type="button" className="schoolCardButton" onClick={openSchoolModal}>
          <div className="schoolCard">
            <div className="schoolAvatar">{school.avatar}</div>
            <div>
              <p className="schoolName">{school.name}</p>
              <p className="schoolLocation">{school.location}</p>
            </div>
          </div>
        </button>
      </aside>

      <div className="contentWrap">
        <header className="topbar">
          <div className="topLeft topCrumb">
            <button
              className="crumbBackBtn"
              type="button"
              aria-label="Go back"
              onClick={handleBack}
            >
              <ArrowLeft size={16} />
            </button>
            <LayoutGrid size={13} />
            <span>{pageTitle}</span>
          </div>
          <div className="topLeft mobileOnly">
            <button className="iconBtn mobileOnly" aria-label="Open menu">
              <Menu size={18} />
            </button>
            <h1>{pageTitle}</h1>
          </div>
          <div className="topRight">
            <button
              className={clsx("iconBtn", { mutedBell: !notificationsEnabled })}
              aria-label={
                notificationsEnabled
                  ? "Disable notifications"
                  : "Enable notifications"
              }
              onClick={toggleNotifications}
              type="button"
            >
              <Bell size={16} />
              {notificationsEnabled ? <span className="notifDot" /> : null}
            </button>

            <div className="userMenuWrap" ref={userMenuRef}>
              <button
                type="button"
                className={clsx("userChip", { open: isUserMenuOpen })}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
              >
                <div className="userAvatar">{userInitial}</div>
                <span>{userName}</span>
                <ChevronDown size={14} />
              </button>

              {isUserMenuOpen ? (
                <div className="userDropdown" role="menu" aria-label="User menu">
                  <button type="button" role="menuitem" onClick={openProfileModal}>
                    <UserRound size={14} />
                    Edit Profile
                  </button>
                  <button type="button" role="menuitem" onClick={openSchoolModal}>
                    <Settings size={14} />
                    School Details
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      toggleNotifications();
                      setIsUserMenuOpen(false);
                    }}
                  >
                    <Bell size={14} />
                    {notificationsEnabled
                      ? "Turn Off Notifications"
                      : "Turn On Notifications"}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      resetUiPrefs();
                      setDraftUserName(DEFAULT_USER_NAME);
                      setDraftSchoolName(DEFAULT_SCHOOL_PROFILE.name);
                      setDraftSchoolLocation(DEFAULT_SCHOOL_PROFILE.location);
                      setDraftSchoolAvatar(DEFAULT_SCHOOL_PROFILE.avatar);
                      setIsUserMenuOpen(false);
                    }}
                  >
                    <RotateCcw size={14} />
                    Reset Demo Profile
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="contentArea">{children}</main>
        <MobileBottomNav pathname={pathname} />
      </div>

      {isProfileModalOpen ? (
        <div
          className="prefsModalBackdrop"
          onClick={() => setIsProfileModalOpen(false)}
          role="presentation"
        >
          <form
            className="prefsModalCard"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              setUserName(draftUserName);
              setIsProfileModalOpen(false);
            }}
          >
            <h3>Edit Profile</h3>
            <label>
              <span>Display Name</span>
              <input
                value={draftUserName}
                onChange={(event) => setDraftUserName(event.target.value)}
                maxLength={40}
                required
              />
            </label>
            <div className="prefsModalActions">
              <button
                className="secondaryBtn"
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
              >
                Cancel
              </button>
              <button className="primaryAction compact" type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {isSchoolModalOpen ? (
        <div
          className="prefsModalBackdrop"
          onClick={() => setIsSchoolModalOpen(false)}
          role="presentation"
        >
          <form
            className="prefsModalCard"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              setSchool({
                name: draftSchoolName,
                location: draftSchoolLocation,
                avatar: draftSchoolAvatar
              });
              setIsSchoolModalOpen(false);
            }}
          >
            <h3>School Details</h3>
            <label>
              <span>School Name</span>
              <input
                value={draftSchoolName}
                onChange={(event) => setDraftSchoolName(event.target.value)}
                maxLength={80}
                required
              />
            </label>
            <label>
              <span>Location</span>
              <input
                value={draftSchoolLocation}
                onChange={(event) => setDraftSchoolLocation(event.target.value)}
                maxLength={80}
                required
              />
            </label>
            <label>
              <span>Avatar (emoji)</span>
              <input
                value={draftSchoolAvatar}
                onChange={(event) => setDraftSchoolAvatar(event.target.value)}
                maxLength={4}
              />
            </label>
            <div className="prefsModalActions">
              <button
                className="secondaryBtn"
                type="button"
                onClick={() => setIsSchoolModalOpen(false)}
              >
                Cancel
              </button>
              <button className="primaryAction compact" type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }): JSX.Element {
  return (
    <nav className="mobileBottomNav mobileOnly" aria-label="Bottom navigation">
      {menuItems
        .filter((item) => ["home", "assignments", "library", "toolkit"].includes(item.id))
        .map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={clsx("mobileBottomItem", { active })}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}
