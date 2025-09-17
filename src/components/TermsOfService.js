import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import './TermsOfService.css';

const TermsOfService = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="legal-page">
            <div className="legal-container">
                <div className="legal-header">
                    <h1>{t('legal.termsTitle', 'Terms of Service')}</h1>
                    <button 
                        className="btn btn-secondary back-btn"
                        onClick={() => navigate('/')}
                    >
                        ← {t('general.back', 'Back')}
                    </button>
                </div>
                
                <div className="legal-content">
                    <p className="last-updated">
                        {t('legal.lastUpdated', 'Last updated:')} {new Date().toLocaleDateString()}
                    </p>

                    <section>
                        <h2>{t('legal.acceptance', '1. Acceptance of Terms')}</h2>
                        <p>
                            {t('legal.acceptanceText', 'By accessing and using Pomofree, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.')}
                        </p>
                    </section>

                    <section>
                        <h2>{t('legal.description', '2. Description of Service')}</h2>
                        <p>
                            {t('legal.descriptionText', 'Pomofree is a Pomodoro timer application that helps users manage their productivity through focused work sessions and breaks. The service includes timer functionality, task management, progress tracking, and study room features.')}
                        </p>
                    </section>

                    <section>
                        <h2>{t('legal.userAccounts', '3. User Accounts')}</h2>
                        <p>
                            {t('legal.userAccountsText', 'To access certain features of the service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.')}
                        </p>
                    </section>

                    <section>
                        <h2>{t('legal.acceptableUse', '4. Acceptable Use')}</h2>
                        <p>
                            {t('legal.acceptableUseText', 'You agree to use the service only for lawful purposes and in accordance with these terms. You may not:')}
                        </p>
                        <ul>
                            <li>{t('legal.useRestriction1', 'Use the service in any way that violates applicable laws or regulations')}</li>
                            <li>{t('legal.useRestriction2', 'Attempt to gain unauthorized access to any part of the service')}</li>
                            <li>{t('legal.useRestriction3', 'Interfere with or disrupt the service or servers connected to the service')}</li>
                            <li>{t('legal.useRestriction4', 'Use the service to transmit any harmful or malicious code')}</li>
                        </ul>
                    </section>

                    <section>
                        <h2>{t('legal.privacy', 'Privacy')}</h2>
                        <p>
                            {t('legal.privacyText', 'Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.')}
                        </p>
                    </section>

                    <section>
                        <h2>{t('legal.disclaimer', '6. Disclaimer of Warranties')}</h2>
                        <p>
                            {t('legal.disclaimerText', 'The service is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.')}
                        </p>
                    </section>

                    <section>
                        <h2>{t('legal.limitation', '7. Limitation of Liability')}</h2>
                        <p>
                            {t('legal.limitationText', 'In no event shall Pomofree or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the service, even if Pomofree or a Pomofree authorized representative has been notified orally or in writing of the possibility of such damage.')}
                        </p>
                    </section>

                    <section>
                        <h2>{t('legal.changes', '8. Changes to Terms')}</h2>
                        <p>
                            {t('legal.changesText', 'We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on this page. Your continued use of the service after any such changes constitutes your acceptance of the new terms.')}
                        </p>
                    </section>

                    <section>
                        <h2>{t('legal.contact', '9. Contact Information')}</h2>
                        <p>
                            {t('legal.contactText', 'If you have any questions about these Terms of Service, please contact us through our support channels.')}
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
