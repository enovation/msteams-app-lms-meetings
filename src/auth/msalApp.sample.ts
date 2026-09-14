import { PublicClientApplication } from '@azure/msal-browser';

export const msalApp = new PublicClientApplication({
  auth: {
    clientId: 'YOUR_AAD_APP_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/common',
    postLogoutRedirectUri: 'YOUR_POST_LOGOUT_REDIRECT_URI'
  },
  cache: {
    cacheLocation: 'sessionStorage'
  }
});

export const msalAppReady = msalApp.initialize();
