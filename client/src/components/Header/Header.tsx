import { useState } from 'react'
import './Header.css'

type NavItem = {
    label: string
    href: string
}

const navItems: NavItem[] = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Thế giới', href: '/the-gioi' },
    { label: 'Thời sự', href: '/thoi-su' },
    { label: 'Kinh doanh', href: '/kinh-doanh' },
    { label: 'Thể thao', href: '/the-thao' },
    { label: 'Giải trí', href: '/giai-tri' },
]

function Header() {
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <header className="header">
            <div className="header__inner">
                <a className="header__logo" href="/">
                    News24h
                </a>

                <button
                    type="button"
                    className="header__toggle"
                    onClick={() => setMenuOpen((value) => !value)}
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? '✕' : '☰'}
                </button>

                <nav className={`header__nav${menuOpen ? ' header__nav--open' : ''}`}>
                    <ul className="header__list">
                        {navItems.map((item) => (
                            <li key={item.label}>
                                <a
                                    className="header__link"
                                    href={item.href}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </header>
    )
}

export default Header