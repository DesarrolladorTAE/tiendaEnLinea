import React, { useState, useEffect } from 'react';
import Nav from './NavTest';
import { Link } from 'react-router-dom';
import SideMenu from './SideMenuTest';

function HeaderTest() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    const [isSticky, setIsSticky] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 150) {
                setIsSticky(true);
            } else {
                setIsSticky(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Clean up the event listener on component unmount
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);
    return (
        <div>
            <header className={`header-three header--sticky  ${isSticky ? 'sticky' : ''}`}>
                <div className="container">
                    <div className="row header-top-three">
                        <div className="col-lg-6">
                            <p className="top-left">
                                Are you ready to grow up your business?{" "}
                                <Link href="contactus.html">
                                    Contact Us <i className="far fa-arrow-right" />
                                </Link>
                            </p>
                        </div>
                        <div className="col-lg-6 right-h-three">
                            <div className="header-top-right">
                                <div className="single-right email">
                                    <i className="fas fa-envelope" />
                                    <Link to={'#'}>info@example.com</Link>
                                </div>
                                <div className="single-right call">
                                    <i className="far fa-phone-volume" />
                                    <span>Hotline:</span>
                                    <Link to={'#'}>+210-9856988</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row main-header main-header-three">
                        <div className="col-lg-3 col-md-4 col-sm-5 col-5">
                            <Link to={'/'} className="thumbnail-logo">
                                <img src="assets/images/logo/logo-3.svg" alt="Logo_three" />
                            </Link>
                        </div>
                        <div className="col-lg-6 d-none d-xl-block">
                            <div className="text-center d-flex justify-content-center">
                                <Nav />
                            </div>
                        </div>
                        <div className="col-xl-3 col-lg-9 col-md-8 col-sm-7 col-7">
                            <div className="right justify-content-end">
                                <Link to={'#'} className="rts-btn btn-primary-3">
                                    Book a Meeting
                                </Link>
                                <button
                                    id="menu-btn"
                                    className="menu rts-btn btn-primary-3-menu ml--20" onClick={toggleSidebar}
                                >
                                    <img
                                        className="menu-dark"
                                        src="assets/images/icon/menu.png"
                                        alt="Menu-icon"
                                    />
                                    <img
                                        className="menu-light"
                                        src="assets/images/icon/menu-light.png"
                                        alt="Menu-icon"
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <SideMenu isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </div>
    )
}

export default HeaderTest