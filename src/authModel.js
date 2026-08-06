export const shouldShowSeoContent = (authReady, user) => authReady && !user;

export const shouldShowUserDataContent = (user, status) => !user || status === 'ready';
