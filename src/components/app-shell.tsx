"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense, useMemo, useState } from "react";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";
import { signOutAction } from "@/app/auth-actions";
import { demoWorkspaces } from "@/lib/demo-data";
import { navigationItems } from "@/lib/navigation";
import { ActiveWorkspaceProvider } from "@/lib/workspace-context";
import { DemoWorkspaceProvider } from "@/lib/workspace-demo-context";

function NavigationLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: typeof navigationItems;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map((item) => {
        const selected =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            aria-current={selected ? "page" : undefined}
            className={`nav-link ${selected ? "nav-link-active" : ""}`}
            href={item.href}
            key={item.id}
            onClick={onNavigate}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

function currentTitle(pathname: string): string {
  return (
    navigationItems.find(
      (item) =>
        item.href === pathname ||
        (item.href !== "/" && pathname.startsWith(`${item.href}/`)),
    )?.label ?? "Workspace"
  );
}

export function AppShell({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail: string;
}) {
  return (
    <Suspense fallback={<main className="page-content" role="status">Loading workspace…</main>}>
      <AppShellContent userEmail={userEmail}>{children}</AppShellContent>
    </Suspense>
  );
}

function AppShellContent({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const [workspaceId, setWorkspaceId] = useState(demoWorkspaces[0].id);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tabletNavExpanded, setTabletNavExpanded] = useState(false);
  const workspace = useMemo(
    () => demoWorkspaces.find((item) => item.id === workspaceId) ?? demoWorkspaces[0],
    [workspaceId],
  );
  const visibleNavigation = navigationItems;

  function chooseWorkspace(nextId: string) {
    setWorkspaceId(
      demoWorkspaces.find((item) => item.id === nextId)?.id ?? demoWorkspaces[0].id,
    );
  }

  return (
    <div className={`app-frame ${tabletNavExpanded ? "tablet-nav-expanded" : ""}`}>
      <aside aria-label="Main sidebar" className="app-sidebar">
        <Brand />
        <div className="sidebar-workspace">
          <span className="workspace-avatar">GC</span>
          <span className="sidebar-workspace-copy">
            <strong>{workspace.name}</strong>
            <small>Sample inventory workspace</small>
          </span>
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Main navigation" className="sidebar-nav">
          <NavigationLinks items={visibleNavigation} pathname={pathname} />
        </nav>
        <div className="sidebar-bottom">
          <span className="demo-indicator"><i /> Demonstration mode</span>
          <p>Workspace data is sample-only.</p>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button
            aria-expanded={mobileMenuOpen || tabletNavExpanded}
            aria-label={
              mobileMenuOpen || tabletNavExpanded
                ? "Collapse navigation"
                : "Expand navigation"
            }
            className="nav-toggle"
            onClick={() => {
              if (window.matchMedia("(min-width: 700px)").matches) {
                setTabletNavExpanded(!tabletNavExpanded);
              } else {
                setMobileMenuOpen(!mobileMenuOpen);
              }
            }}
            type="button"
          >
            <Icon name="menu" />
          </button>
          <div className="topbar-title">
            <p className="eyebrow">PHARMACY MANAGEMENT</p>
            <h1>{currentTitle(pathname)}</h1>
          </div>
          <label className="workspace-picker">
            <span className="sr-only">Switch pharmacy workspace</span>
            <Icon name="store" size={18} />
            <select
              aria-label="Switch pharmacy workspace (demo)"
              onChange={(event) => chooseWorkspace(event.target.value)}
              value={workspace.id}
            >
              {demoWorkspaces.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <Icon className="workspace-chevron" name="chevron" size={16} />
          </label>
          <details className="profile-menu">
            <summary aria-label="Open account menu">
              <span aria-hidden="true" className="profile-avatar">
                {userEmail.charAt(0).toUpperCase()}
              </span>
              <span className="profile-copy">
                <strong>{userEmail}</strong>
                <small>Signed in</small>
              </span>
              <Icon className="profile-chevron" name="chevron" size={16} />
            </summary>
            <div className="profile-popover">
              <p className="popover-heading">Signed in as</p>
              <p className="popover-user-email">{userEmail}</p>
              <Link className="popover-link" href="/onboarding">
                Add a pharmacy workspace
              </Link>
              <form action={signOutAction}>
                <button className="popover-link" type="submit">Sign out</button>
              </form>
            </div>
          </details>
          {mobileMenuOpen && (
            <nav aria-label="Mobile navigation" className="mobile-nav">
              <p className="nav-caption">WORKSPACE</p>
              <NavigationLinks
                items={visibleNavigation}
                onNavigate={() => setMobileMenuOpen(false)}
                pathname={pathname}
              />
            </nav>
          )}
        </header>

        <main className="page-content">
          <div className="workspace-context">
            <span><Icon name="pin" size={15} /> {workspace.location}</span>
            <span className="demo-badge">Inventory is sample data</span>
          </div>
          <ActiveWorkspaceProvider pharmacyId={workspace.id}>
            <DemoWorkspaceProvider>{children}</DemoWorkspaceProvider>
          </ActiveWorkspaceProvider>
          <footer className="page-footer">
            <span>MediSync</span>
            <span>Signed-in account · sample inventory data</span>
          </footer>
        </main>
      </div>
      <nav aria-label="Primary mobile navigation" className="bottom-nav">
        {navigationItems
          .filter((item) =>
            ["billing", "sales", "customers", "reports", "settings"].includes(item.id),
          )
          .map((item) => {
            const selected = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                aria-current={selected ? "page" : undefined}
                className={selected ? "bottom-nav-active" : ""}
                href={item.href}
                key={item.id}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
