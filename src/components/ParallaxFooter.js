import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './ParallaxFooter.css';

const ParallaxFooter = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [hideTimeout, setHideTimeout] = useState(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const windowHeight = window.innerHeight;
            const mouseY = e.clientY;
            
            // Show footer when mouse is near the bottom of the viewport
            const threshold = 150; // 150px from bottom for more stability
            const isNearBottom = mouseY >= windowHeight - threshold;
            
            // Clear any existing timeout
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                setHideTimeout(null);
            }
            
            if (isNearBottom) {
                setIsVisible(true);
                document.body.classList.add('footer-visible');
            } else {
                // Add delay before hiding
                const timeout = setTimeout(() => {
                    setIsVisible(false);
                    document.body.classList.remove('footer-visible');
                }, 500); // 500ms delay
                setHideTimeout(timeout);
            }
        };

        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // Also show footer when scrolled to bottom
            const threshold = 100;
            const isAtBottom = scrollTop + windowHeight >= documentHeight - threshold;
            
            if (isAtBottom) {
                setIsVisible(true);
                document.body.classList.add('footer-visible');
            }
        };

        // Add mouse enter/leave for footer area to keep it visible when hovering
        const handleMouseEnter = () => {
            setIsVisible(true);
            document.body.classList.add('footer-visible');
        };
        const handleMouseLeave = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const isAtBottom = scrollTop + windowHeight >= documentHeight - 100;
            
            // Only hide if not at bottom of page
            if (!isAtBottom) {
                setIsVisible(false);
                document.body.classList.remove('footer-visible');
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll);
        
        // Add event listeners to footer for stability
        const footer = document.querySelector('.parallax-footer');
        if (footer) {
            footer.addEventListener('mouseenter', handleMouseEnter);
            footer.addEventListener('mouseleave', handleMouseLeave);
        }
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
            if (footer) {
                footer.removeEventListener('mouseenter', handleMouseEnter);
                footer.removeEventListener('mouseleave', handleMouseLeave);
            }
            if (hideTimeout) {
                clearTimeout(hideTimeout);
            }
        };
    }, []);

    return (
        <div className={`parallax-footer ${isVisible ? 'visible' : ''}`}>
            <div className="footer-content">
                <div className="footer-line">
                    <span className="footer-text">Made with</span>
                    <span className="footer-heart">❤️</span>
                    <span className="footer-text">by</span>
                    <a 
                        href="https://codedbylumi.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="footer-author"
                    >
                        Lumi
                    </a>
                </div>
                <div className="footer-line">
                    <span className="footer-copyright">
                        ©Pomofree 2025. All Rights Reserved.
                    </span>
                </div>
                <div className="footer-legal-links">
                    <a href="/terms" className="footer-legal-link">
                        {t('legal.terms', 'Terms of Service')}
                    </a>
                    <span className="footer-separator">•</span>
                    <a href="/privacy" className="footer-legal-link">
                        {t('legal.privacy', 'Privacy Policy')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ParallaxFooter;
