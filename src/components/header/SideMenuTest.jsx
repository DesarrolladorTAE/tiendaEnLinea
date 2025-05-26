import React, { useEffect } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';


function SideMenuTest({ isSidebarOpen, toggleSidebar }) {

    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (menuhome) => {
        setOpenMenu(openMenu === menuhome ? null : menuhome);
    };


    // useEffect(() => {
    //     const sidebar = document.getElementById('side-bar');
    //     const anywhereHome = document.getElementById('anywhere-home');

    //     if (isSidebarOpen) {
    //         sidebar.classList.add('show');
    //         anywhereHome.classList.add('bgshow');
    //     } else {
    //         sidebar.classList.remove('show');
    //         anywhereHome.classList.remove('bgshow');
    //     }
    // }, [isSidebarOpen]);


    return (
        <div>
            <div id="side-bar" className={`side-bar ${isSidebarOpen ? 'show' : ''}`}>
                <button className="close-icon-menu" aria-label="Close Menu" onClick={toggleSidebar}>
                    <i className="far fa-times"></i>
                </button>
                {/* inner menu area desktop start */}
                <div className="rts-sidebar-menu-desktop">
                    <Link className="logo-1" href="index.html">
                        <img
                            className="logo"
                            src="/assets/images/logo/logo-1.svg"
                            alt="finbiz_logo"
                        />
                    </Link>
                    <Link className="logo-2" href="index.html">
                        <img
                            className="logo"
                            src="/assets/images/logo/logo-4.svg"
                            alt="finbiz_logo"
                        />
                    </Link>
                    <Link className="logo-3" href="index.html">
                        <img
                            className="logo"
                            src="/assets/images/logo/logo-3.svg"
                            alt="finbiz_logo"
                        />
                    </Link>
                    <Link className="logo-4" href="index.html">
                        <img
                            className="logo"
                            src="/assets/images/logo/logo-5.svg"
                            alt="finbiz_logo"
                        />
                    </Link>
                    <div className="body d-none d-xl-block">
                        <p className="disc">
                            We must explain to you how all seds this mistakens idea denouncing
                            pleasures and praising account.
                        </p>
                        <div className="get-in-touch">
                            {/* title */}
                            <div className="h6 title">Get In Touch</div>
                            {/* title End */}
                            <div className="wrapper">
                                {/* single */}
                                <div className="single">
                                    <i className="fas fa-phone-alt" />
                                    <Link href="#">+8801234566789</Link>
                                </div>
                                {/* single ENd */}
                                {/* single */}
                                <div className="single">
                                    <i className="fas fa-envelope" />
                                    <Link href="#">example@gmail.com</Link>
                                </div>
                                {/* single ENd */}
                                {/* single */}
                                <div className="single">
                                    <i className="fas fa-globe" />
                                    <Link href="#">www.webexample.com</Link>
                                </div>
                                {/* single ENd */}
                                {/* single */}
                                <div className="single">
                                    <i className="fas fa-map-marker-alt" />
                                    <Link href="#">13/A, New Pro State, NYC</Link>
                                </div>
                                {/* single ENd */}
                            </div>
                            <div className="social-wrapper-two menu">
                                <Link href="#">
                                    <i className="fab fa-facebook-f" />
                                </Link>
                                <Link href="#">
                                    <i className="fab fa-twitter" />
                                </Link>
                                <Link href="#">
                                    <i className="fab fa-instagram" />
                                </Link>
                                <Link href="#">
                                    <i className="fab fa-whatsapp" />
                                </Link>
                                {/* <Link href="#"><i class="fab fa-linkedin"></i></Link> */}
                            </div>
                        </div>
                    </div>
                    <div className="body-mobile d-block d-xl-none">
                        <nav className="nav-main mainmenu-nav">
                            <ul className="mainmenu metismenu" id="mobile-menu-active">
                                <li className="has-droupdown menu-item">
                                    <Link className="menu-link" href="#" onClick={() => toggleMenu(1)}>
                                        Home
                                    </Link>
                                    <ul className={`submenu ${openMenu === 1 ? 'mm-collapse mm-show' : 'mm-collapse'}`} >
                                        <li>
                                            <ul>
                                                <Link href="#0" className="tag">
                                                    Homepages
                                                </Link>
                                                <li className="mobile-menu-link">
                                                    <Link to={'/'}>Main Home</Link>
                                                </li>
                                                <li className="mobile-menu-link">
                                                    <Link to={'/home-two'}>Consulting Home</Link>
                                                </li>
                                                <li className="mobile-menu-link">
                                                    <Link to={'/home-three'}>Corporate Home</Link>
                                                </li>
                                                <li className="mobile-menu-link">
                                                    <Link to={'/home-four'}>Insurance Home</Link>
                                                </li>
                                                <li className="mobile-menu-link">
                                                    <Link to={'/home-five'}>Marketing Home</Link>
                                                </li>
                                                <li className="mobile-menu-link">
                                                    <Link to={'/home-six'}>Finance Home</Link>
                                                </li>
                                                <li className="mobile-menu-link">
                                                    <Link to={'/home-seven'}>Human Resources</Link>
                                                </li>
                                                <li className="mobile-menu-link">
                                                    <Link to={'/home-eight'}>IT Solutions</Link>
                                                </li>
                                                <li className="mobile-menu-link">
                                                    <Link to={'/home-nine'}>Modern Agency</Link>
                                                </li>
                                                <li className="mobile-menu-link">
                                                    <Link to={'/home-ten'}>Startup Agency</Link>
                                                </li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                                <li className="menu-item">
                                    <Link className="menu-link" href="about-us.html">
                                        About Us
                                    </Link>
                                </li>
                                <li className="has-droupdown menu-item">
                                    <Link className="menu-link" href="#" onClick={() => toggleMenu(2)}>
                                        Services
                                    </Link>
                                    <ul className={`submenu ${openMenu === 2 ? 'mm-collapse mm-show' : 'mm-collapse'}`}>
                                        <li>
                                            <Link to={'/our-service'}>Service 1</Link>
                                        </li>
                                        <li>
                                            <Link to={'/service-2'}>Service 2</Link>
                                        </li>
                                        <li>
                                            <Link to={'/service-3'}>Service 3</Link>
                                        </li>
                                        <li className="mobile-menu-link">
                                            <Link href="service-details.html">Service Details</Link>
                                        </li>
                                    </ul>
                                </li>
                                <li className="has-droupdown menu-item">
                                    <Link className="menu-link" href="#" onClick={() => toggleMenu(3)}>
                                        Pages
                                    </Link>
                                    <ul className={`submenu ${openMenu === 3 ? 'mm-collapse mm-show' : 'mm-collapse'}`}>
                                        <li className="mobile-menu-link">
                                            <Link href="project.html">Project</Link>
                                        </li>
                                        <li className="mobile-menu-link">
                                            <Link href="project-details.html">Project Details</Link>
                                        </li>
                                        <li className="mobile-menu-link">
                                            <Link href="team.html">Team</Link>
                                        </li>
                                        <li className="mobile-menu-link">
                                            <Link href="team-details.html">Team Details</Link>
                                        </li>
                                        <li className="mobile-menu-link">
                                            <Link href="appoinment.html">appoinment</Link>
                                        </li>
                                        <li className="mobile-menu-link">
                                            <Link href="price-plan.html">Price Plan</Link>
                                        </li>
                                        <li className="mobile-menu-link">
                                            <Link href="404.html">404 Page</Link>
                                        </li>
                                    </ul>
                                </li>
                                <li className="has-droupdown menu-item">
                                    <Link className="menu-link" href="#" onClick={() => toggleMenu(4)}>
                                        Blog
                                    </Link>
                                    <ul className={`submenu ${openMenu === 4 ? 'mm-collapse mm-show' : 'mm-collapse'}`}>
                                        <li className="mobile-menu-link">
                                            <Link href="blog-list.html">Blog List</Link>
                                        </li>
                                        <li className="mobile-menu-link">
                                            <Link href="blog-grid.html">Blog Grid</Link>
                                        </li>
                                        <li className="mobile-menu-link">
                                            <Link href="blog-details.html">Blog Details</Link>
                                        </li>
                                    </ul>
                                </li>
                                <li className="menu-item menu-item">
                                    <Link className="menu-link" href="contactus.html">
                                        Contact
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                        <div className="social-wrapper-two menu mobile-menu">
                            <Link href="#">
                                <i className="fab fa-facebook-f" />
                            </Link>
                            <Link href="#">
                                <i className="fab fa-twitter" />
                            </Link>
                            <Link href="#">
                                <i className="fab fa-instagram" />
                            </Link>
                            <Link href="#">
                                <i className="fab fa-whatsapp" />
                            </Link>
                            {/* <Link href="#"><i class="fab fa-linkedin"></i></Link> */}
                        </div>
                        <Link
                            href="#"
                            className="rts-btn btn-primary ml--20 ml_sm--5 header-one-btn quote-btnmenu"
                        >
                            Get Quote
                        </Link>
                    </div>
                </div>
                {/* inner menu area desktop End */}
            </div>


        </div>
    )
}

export default SideMenuTest