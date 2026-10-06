import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { isDemoMode } from '../data/index.ts'
import { Icon } from './Icon.tsx'

const DEMO_MESSAGE =
  'Demo mode: data saved in this browser only (online database not connected yet)'

export function Layout() {
  const location = useLocation()
  const [openOn, setOpenOn] = useState<string | null>(null)
  const menuOpen = openOn === location.pathname
  const demo = isDemoMode()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="app-shell">
      <a className="skip-link no-print" href="#content">
        Skip to content
      </a>
      <header className="site-header no-print">
        <div className="header-inner">
          <NavLink to="/" className="brand" end>
            <span className="brand-mark" aria-hidden="true">
              P
            </span>
            Portfolio Generator
          </NavLink>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setOpenOn(menuOpen ? null : location.pathname)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
            {menuOpen ? 'Close' : 'Menu'}
          </button>
          <nav id="site-nav" className={menuOpen ? 'nav-links is-open' : 'nav-links'}>
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
            <NavLink
              to="/create"
              className={({ isActive }) =>
                navClass({
                  isActive: isActive || location.pathname.startsWith('/edit/'),
                })
              }
            >
              Create
            </NavLink>
            <NavLink to="/manage" className={navClass}>
              Manage
            </NavLink>
          </nav>
        </div>
      </header>
      {demo ? (
        <p className="demo-banner no-print" role="status">
          {DEMO_MESSAGE}
        </p>
      ) : null}
      <main id="content" className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer no-print">
        Portfolio Generator · a first-year BSCS project
      </footer>
    </div>
  )
}

function navClass({ isActive }: { isActive: boolean }): string {
  return isActive ? 'nav-link is-active' : 'nav-link'
}
