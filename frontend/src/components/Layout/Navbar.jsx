import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bars3Icon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import UserProfileDropdown from '../UserProfileDropdown'

const Navbar = ({ user, onMenuClick }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Check if we're on a hero page (dashboard, events, clubs, gallery)
  const isHeroPage = ['/', '/dashboard', '/events', '/clubs', '/gallery'].includes(location.pathname)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully!')
    navigate('/login')
  }

  // Styles for navbar
  const navStyles = {
    position: isScrolled ? 'fixed' : (isHeroPage ? 'absolute' : 'sticky'),
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 40,
    transition: 'all 0.3s ease',
    padding: '0.75rem 0',
    background: !isScrolled ? 'transparent' : '#ffffff',
    boxShadow: !isScrolled ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.1)'
  }

  const containerStyles = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }

  const brandStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none'
  }

  const logoStyles = {
    height: '50px',
    width: 'auto',
    objectFit: 'contain',
    filter: isScrolled 
      ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.3)) drop-shadow(0 0 15px rgba(102,126,234,0.5))'
      : 'drop-shadow(0 2px 4px rgba(0,0,0,0.15)) drop-shadow(0 0 10px rgba(102,126,234,0.3))'
  }

  const brandTextStyles = {
    fontFamily: "'Fredoka One', cursive",
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#ffffff',
    textShadow: isScrolled
      ? '0 2px 6px rgba(0,0,0,0.4), 0 0 20px rgba(102,126,234,0.6)'
      : '0 2px 4px rgba(0,0,0,0.2), 0 0 15px rgba(102,126,234,0.4)'
  }

  const menuStyles = {
    display: 'flex',
    listStyle: 'none',
    gap: '2rem',
    margin: 0,
    padding: 0
  }

  const getLinkStyles = (isActive) => ({
    color: (isHeroPage && !isScrolled) 
      ? (isActive ? '#ffffff' : 'rgba(255,255,255,0.9)')
      : (isActive ? '#667eea' : '#1f2937'),
    textDecoration: 'none',
    fontWeight: isActive ? 600 : 500,
    transition: 'opacity 0.3s ease',
    opacity: isActive ? 1 : 0.9,
    textShadow: (isHeroPage && !isScrolled) ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
  })

  const buttonContainerStyles = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  }

  const loginButtonStyles = {
    padding: '0.6rem 1.5rem',
    border: (isHeroPage && !isScrolled) ? '2px solid rgba(255,255,255,0.8)' : '2px solid #667eea',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'transparent',
    color: (isHeroPage && !isScrolled) ? '#ffffff' : '#667eea'
  }

  const registerButtonStyles = {
    padding: '0.6rem 1.5rem',
    border: '2px solid #667eea',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#667eea',
    color: '#ffffff'
  }

  return (
    <nav style={navStyles}>
      <div style={containerStyles}>
        
        {/* Brand/Logo Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onMenuClick}
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              padding: '0.5rem',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#ffffff'
            }}
            className="mobile-menu-toggle"
          >
            <Bars3Icon style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
          
          <Link to={user ? "/dashboard" : "/"} style={brandStyles}>
            <img 
              src="/img/logo1.png" 
              alt="CluboraX Logo" 
              style={logoStyles}
            />
            <span style={brandTextStyles} className="brand-text">
              CluboraX
            </span>
          </Link>
        </div>

        {/* Navigation Menu - Only shown when logged in */}
        {user && (
          <ul style={menuStyles} className="nav-menu">
            <li>
              <Link
                to="/dashboard"
                style={getLinkStyles(location.pathname === '/dashboard')}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = location.pathname === '/dashboard' ? '1' : '0.9'
                }}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/events"
                style={getLinkStyles(location.pathname === '/events')}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = location.pathname === '/events' ? '1' : '0.9'
                }}
              >
                Events
              </Link>
            </li>
            <li>
              <Link
                to="/clubs"
                style={getLinkStyles(location.pathname === '/clubs')}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = location.pathname === '/clubs' ? '1' : '0.9'
                }}
              >
                Clubs
              </Link>
            </li>
            <li>
              <Link
                to="/gallery"
                style={getLinkStyles(location.pathname === '/gallery')}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = location.pathname === '/gallery' ? '1' : '0.9'
                }}
              >
                Gallery
              </Link>
            </li>
          </ul>
        )}

        {/* Actions Section */}
        <div style={buttonContainerStyles}>
          {user ? (
            <UserProfileDropdown user={user} />
          ) : (
            <>
              <Link
                to="/login"
                style={loginButtonStyles}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  if (isHeroPage && !isScrolled) {
                    e.target.style.background = 'rgba(255,255,255,0.15)'
                    e.target.style.boxShadow = '0 4px 8px rgba(255,255,255,0.2)'
                  } else {
                    e.target.style.background = 'rgba(102,126,234,0.05)'
                    e.target.style.boxShadow = '0 4px 8px rgba(102,126,234,0.2)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                  e.target.style.background = 'transparent'
                }}
              >
                Login
              </Link>
              <Link
                to="/register"
                style={registerButtonStyles}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(255,255,255,0.4)'
                  e.target.style.background = '#5a52d5'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                  e.target.style.background = '#667eea'
                }}
                className="flex items-center gap-2"
              >
                Get Started Now
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .nav-menu {
            display: none !important;
          }
          .mobile-menu-toggle {
            display: block !important;
          }
        }
        @media (max-width: 640px) {
          .brand-text {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  )
}

export default Navbar

