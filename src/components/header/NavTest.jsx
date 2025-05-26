import React from 'react'
import { Link } from 'react-router-dom';
function NavTest() {
    return (
        <div>
            <nav className="nav-main mainmenu-nav d-none d-xl-block">
                <ul className="mainmenu">
                    <li className="has-droupdown">
                        <Link className="nav-link" to={'#'} >
                            Home
                        </Link>
                        <ul className="submenu menu-link1">
                            <li className="menu-item">
                                <Link className="tag" to={'#'} >
                                    Multi Pages
                                </Link>
                                <ul>
                                    <li>
                                        <Link to={'/'}>Main Home</Link>
                                    </li>
                                    <li>
                                        <Link to={'/home-two'}>Consulting Home</Link>
                                    </li>
                                    <li>
                                        <Link to={'/home-three'}>Corporate Home</Link>
                                    </li>
                                    <li>
                                        <Link to={'/home-four'}>Insurance Home</Link>
                                    </li>
                                    <li>
                                        <Link to={'/home-five'}>Marketing Home</Link>
                                    </li>
                                    <li>
                                        <Link to={'/home-six'}>Home finance</Link>
                                    </li>
                                    <li>
                                        <Link to={'/home-seven'}>Human Resources</Link>
                                    </li>
                                    <li>
                                        <Link to={'/home-eight'}>IT Solutions</Link>
                                    </li>
                                    <li>
                                        <Link to={'/home-nine'}>Modern Agency</Link>
                                    </li>
                                    <li>
                                        <Link to={'/home-ten'}>Startup Agency</Link>
                                    </li>
                                </ul>
                            </li>
                            <li className="menu-item">
                                <Link className="tag" to={'#'} >
                                    One Page
                                </Link>
                                <ul>
                                    <li>
                                        <Link target='_blank' to={'/onepage-one'}>Main Home</Link>
                                    </li>
                                    <li>
                                        <Link target='_blank' to={'/onepage-two'}>Consulting Home</Link>
                                    </li>
                                    <li>
                                        <Link target='_blank' to={'/onepage-three'}>Corporate Home</Link>
                                    </li>
                                    <li>
                                        <Link target='_blank' to={'/onepage-four'}>Insurance Home</Link>
                                    </li>
                                    <li>
                                        <Link target='_blank' to={'/onepage-five'}>Marketing Home</Link>
                                    </li>
                                    <li>
                                        <Link target='_blank' to={'/onepage-six'}>Home finance</Link>
                                    </li>
                                    <li>
                                        <Link target='_blank' to={'/onepage-seven'}>Human Resources</Link>
                                    </li>
                                    <li>
                                        <Link target='_blank' to={'/onepage-eight'}>IT Solutions</Link>
                                    </li>
                                    <li>
                                        <Link target='_blank' to={'/onepage-nine'}>Modern Agency</Link>
                                    </li>
                                    <li>
                                        <Link target='_blank' to={'/onepage-ten'}>Startup Agency</Link>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                    <li className="has-droupdown">
                        <Link className="nav-link" to={'#'}>
                            Services
                        </Link>
                        <ul className="submenu menu-link3">
                            <li className="sub-droupdown">
                                <Link className="sub-menu-link" to={'#'}>
                                    Our Service
                                </Link>
                                <ul className="submenu third-lvl">
                                    <li>
                                        <Link to={'/our-service'}>Service 1</Link>
                                    </li>
                                    <li>
                                        <Link to={'/service-2'}>Service 2</Link>
                                    </li>
                                    <li>
                                        <Link to={'/service-3'}>Service 3</Link>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <Link to={'/service-details'}>Service Details</Link>
                            </li>
                        </ul>
                    </li>
                    <li className="has-droupdown">
                        <Link className="nav-link" to={'#'}>
                            Pages
                        </Link>
                        <ul className="submenu menu-link">
                            <li className="menu-item">
                                <Link className="tag" to={'#'}>
                                    Pages
                                </Link>
                                <ul>
                                    <li>
                                        <Link to={'/appoinment'}>Appoinment</Link>
                                    </li>
                                    <li>
                                        <Link to={'/about-us'}>About Us</Link>
                                    </li>
                                    <li>
                                        <Link to={'/pricing-plane'}>Price Plans</Link>
                                    </li>
                                    <li>
                                        <Link to={'/our-service'}>Our Services</Link>
                                    </li>
                                    <li>
                                        <Link to={'/testimonial-style-1'}>Testimonial</Link>
                                    </li>
                                    <li>
                                        <Link to={'/404'}>404 Page</Link>
                                    </li>
                                </ul>
                            </li>
                            <li className="menu-item">
                                <Link className="tag" to={'#'}>
                                    Portfolio
                                </Link>
                                <ul>
                                    <li>
                                        <Link to={'/project'}>Portfolio Style 1</Link>
                                    </li>
                                    <li>
                                        <Link to={'/portfolio-style-2'}>
                                            Portfolio Style 2
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to={'/portfolio-style-3'}>
                                            Portfolio Style 3
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to={'/portfolio-style-4'}>
                                            Portfolio Style 4
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to={'/portfolio-style-5'}>
                                            Portfolio Style 5
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to={'/project-details'}>Portfolio Details</Link>
                                    </li>
                                </ul>
                            </li>
                            <li className="menu-item">
                                <Link className="tag" to={'#'}>
                                    Our Teams
                                </Link>
                                <ul>
                                    <li>
                                        <Link to={'/team'}>Team Style 1</Link>
                                    </li>
                                    <li>
                                        <Link to={'/team-style-2'}>Team Style 2</Link>
                                    </li>
                                    <li>
                                        <Link to={'/team-style-3'}>Team Style 3</Link>
                                    </li>
                                    <li>
                                        <Link to={'/team-style-4'}>Team Style 4</Link>
                                    </li>
                                    <li>
                                        <Link to={'/team-style-5'}>Team Style 5</Link>
                                    </li>
                                    <li>
                                        <Link to={'/team-details'}>Team Details</Link>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                    <li className="has-droupdown">
                        <Link className="nav-link" to={'#'}>
                            Blog
                        </Link>
                        <ul className="submenu">
                            <li>
                                <Link to={'/blog-list'}>Blog List</Link>
                            </li>
                            <li>
                                <Link to={'/blog-grid'}>Blog Grid</Link>
                            </li>
                            <li>
                                <Link to={'/blog-details-default'}>Blog Details</Link>
                            </li>
                        </ul>
                    </li>
                    <li >
                        <Link className="nav-item" to={'/pricing-plane'}>
                            Pricing Plane
                        </Link>
                    </li>
                    <li>
                        <Link className="nav-item" to={'/contactus'}>
                            Contact
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    )
}

export default NavTest