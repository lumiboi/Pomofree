import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './ParallaxFooter.css';

const ParallaxFooter = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const hideTimeoutRef = useRef(null);
    const dismissedRef = useRef(false);
    const footerRef = useRef(null);
    const [isCompact, setIsCompact] = useState(() => (
        window.matchMedia?.('(max-width: 768px)').matches ?? false
    ));

    useEffect(() => {
        const media = window.matchMedia('(max-width: 768px)');
        const updateLayout = event => setIsCompact(event.matches);
        media.addEventListener('change', updateLayout);
        return () => media.removeEventListener('change', updateLayout);
    }, []);

    useEffect(() => {
        if (isCompact) {
            setIsVisible(false);
            document.body.classList.remove('footer-visible');
            return () => {
                document.body.classList.remove('footer-visible');
            };
        }

        const handleMouseMove = (e) => {
            const threshold = Math.min(160, Math.max(96, window.innerHeight * 0.14));
            const isNearBottom = e.clientY >= window.innerHeight - threshold;
            
            // Clear any existing timeout
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
            
            if (isNearBottom) {
                if (!dismissedRef.current) {
                    setIsVisible(true);
                    document.body.classList.add('footer-visible');
                }
            } else {
                const timeout = setTimeout(() => {
                    setIsVisible(false);
                    document.body.classList.remove('footer-visible');
                }, 450);
                hideTimeoutRef.current = timeout;
            }
        };

        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // Also show footer when scrolled to bottom
            const threshold = 100;
            const isAtBottom = scrollTop + windowHeight >= documentHeight - threshold;
            
            if (isAtBottom && !dismissedRef.current) {
                setIsVisible(true);
                document.body.classList.add('footer-visible');
            }
        };

        const handleMouseEnter = () => {
            if (!dismissedRef.current) {
                setIsVisible(true);
                document.body.classList.add('footer-visible');
            }
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
        window.addEventListener('scroll', handleScroll, { passive: true });
        const footer = footerRef.current;
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
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
            document.body.classList.remove('footer-visible');
        };
    }, [isCompact]);

    const closeFooter = () => {
        dismissedRef.current = true;
        setIsVisible(false);
        document.body.classList.remove('footer-visible');
    };

    const toggleFooter = () => {
        if (isVisible) {
            closeFooter();
        } else {
            setIsVisible(true);
            document.body.classList.add('footer-visible');
        }
    };

    return (
        <>
        <footer ref={footerRef} className={`parallax-footer ${isVisible ? 'visible' : ''}`}>
            <button
                type="button"
                className="footer-close-btn"
                onClick={closeFooter}
                aria-label={t('footer.hide')}
            >
                ×
            </button>
            <div className="footer-content">
                <div className="footer-line">
                    <span className="footer-text">Made with</span>
                    <span className="footer-heart">❤️</span>
                    <span className="footer-text">by</span>
                    <a 
                        href="https://lumie.zone" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="footer-author"
                    >
                        Lumi
                    </a>
                    <span className="footer-text">&amp;</span>
                    <a
                        href="https://www.youtube.com/@lsnehir"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-author"
                    >
                        Lethe
                    </a>
                </div>
                <div className="footer-line">
                    <span className="footer-copyright">
                        ©Pomofree {new Date().getFullYear()}. All Rights Reserved.
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
                    <span className="footer-separator">•</span>
                    <a 
                        href="https://www.patreon.com/c/lumiboi/membership" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="footer-legal-link footer-patreon"
                    >
                        {t('footer.support', 'Support on Patreon')}
                    </a>
                    <span className="footer-separator">•</span>
                    <a 
                        href="https://kreosus.com/lumi" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="footer-legal-link footer-kreosus"
                    >
                        {t('footer.kreosus', 'Support on Kreosus')}
                    </a>
                </div>
            </div>
        </footer>
        {isCompact && !dismissedRef.current && (
            <button 
                className={`footer-toggle-btn ${isVisible ? 'active' : ''}`}
                onClick={toggleFooter}
                aria-label={isVisible ? t('footer.hide') : t('footer.show')}
            >
                {isVisible ? '↓' : '↑'}
            </button>
        )}
        </>
    );
};

export default ParallaxFooter;
