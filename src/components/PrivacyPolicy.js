import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="legal-page">
            <div className="legal-container">
                <div className="legal-header">
                    <h1>{t('legal.privacyTitle', 'Privacy Policy')}</h1>
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
                        <h2>{t('legal.introduction', '1. Introduction')}</h2>
                        <p>
                            {t('legal.introductionText', 'This Privacy Policy explains how Pomofree collects, uses, and protects your information when you use our service. We are committed to protecting your privacy and ensuring the security of your personal data.')}
                        </p>
                    </section>

                    <section>
                        <h2>{t('legal.informationWeCollect', '2. Information We Collect')}</h2>
                        <h3>{t('legal.personalInfo', 'Personal Information')}</h3>
                        <p>
                            {t('legal.personalInfoText', 'When you create an account, we may collect:')}
                        </p>
                        <ul>
                            <li>{t('legal.collect1', 'Email address')}</li>
                            <li>{t('legal.collect2', 'Username or display name')}</li>
                            <li>{t('legal.collect3', 'Profile information you choose to provide')}</li>
                        </ul>
                        
                        <h3>{t('legal.usageInfo', 'Usage Information')}</h3>
                        <p>
                            {t('legal.usageInfoText', 'We automatically collect certain information about your use of the service:')}
                        </p>
                        <ul>
                            <li>{t('legal.usage1', 'Timer sessions and productivity data')}</li>
                            <li>{t('legal.usage2', 'Tasks and projects you create')}</li>
                            <li>{t('legal.usage3', 'Settings and preferences')}</li>
                            <li>{t('legal.usage4', 'Device information and browser type')}</li>
                        </ul>
                    </section>

                    <section>
                        <h2>{t('legal.howWeUse', '3. How We Use Your Information')}</h2>
                        <p>
                            {t('legal.howWeUseText', 'We use the information we collect to:')}
                        </p>
                        <ul>
                            <li>{t('legal.use1', 'Provide and maintain the service')}</li>
                            <li>{t('legal.use2', 'Process your account and manage your data')}</li>
                            <li>{t('legal.use3', 'Generate productivity reports and statistics')}</li>
                            <li>{t('legal.use4', 'Improve our service and develop new features')}</li>
                            <li>{t('legal.use5', 'Communicate with you about the service')}</li>
                        </ul>
                    </section>

                    <section>
                        <h2>{t('legal.dataStorage', '4. Data Storage and Security')}</h2>
                        <p>
                            {t('legal.dataStorageText', 'Your data is stored securely using industry-standard encryption and security measures. We use Firebase for data storage, which provides enterprise-grade security. However, no method of transmission over the internet or electronic storage is 100% secure.')}
                        </p>
                    </section>

                    <section>
                        <h2>{t('legal.dataSharing', '5. Information Sharing')}</h2>
                        <p>
                            {t('legal.dataSharingText', 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except:')}
                        </p>
                        <ul>
                            <li>{t('legal.share1', 'When required by law or legal process')}</li>
                            <li>{t('legal.share2', 'To protect our rights or the safety of our users')}</li>
                            <li>{t('legal.share3', 'With service providers who assist us in operating our service (under strict confidentiality agreements)')}</li>
                        </ul>
                    </section>

                    <section>
                        <h2>{t('legal.cookies', '6. Cookies and Tracking')}</h2>
                        <p>
                            {t('legal.cookiesText', 'We may use cookies and similar tracking technologies to enhance your experience, remember your preferences, and analyze usage patterns. You can control cookie settings through your browser preferences.')}
                        </p>
                    </section>

                    <section>
                        <h2>{t('legal.yourRights', '7. Your Rights')}</h2>
                        <p>
                            {t('legal.yourRightsText', 'You have the right to:')}
                        </p>
                        <ul>
                            <li>{t('legal.rights1', 'Access your personal data')}</li>
                            <li>{t('legal.rights2', 'Correct inaccurate information')}</li>
                            <li>{t('legal.rights3', 'Delete your account and data')}</li>
                            <li>{t('legal.rights4', 'Export your data')}</li>
                            <li>{t('legal.rights5', 'Opt out of certain data processing activities')}</li>
                        </ul>
                    </section>

                    <section>
                        <h2>{t('legal.dataRetention', '8. Data Retention')}</h2>
                        <p>
                            {t('legal.dataRetentionText', 'We retain your personal information for as long as your account is active or as needed to provide you with our service. When you delete your account, we will delete your personal data within 30 days, unless we are required to retain it for legal reasons.')}
                        </p>
                    </section>

                    <section>
                        <h2>{t('legal.children', '9. Children\'s Privacy')}</h2>
                        <p>
                            {t('legal.childrenText', 'Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.')}
                        </p>
                    </section>

                    <section>
                        <h2>{t('legal.changes', '10. Changes to This Policy')}</h2>
                        <p>
                            {t('legal.changesText', 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.')}
                        </p>
                    </section>

                    <section>
                        <h2>{t('legal.contact', '11. Contact Us')}</h2>
                        <p>
                            {t('legal.contactText', 'If you have any questions about this Privacy Policy or our data practices, please contact us through our support channels.')}
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
