
import { supabase } from '@/lib/supabase';

/**
 * Custom MFA error.
 */
export class MfaError extends Error {
  constructor(message, status = null, retryAfter = null) {
    super(message);
    this.name = 'MfaError';
    this.status = status;
    this.retryAfter = retryAfter;
  }

  get mustSignInAgain() {
    return this.status === 401;
  }
}

/**
 * Get current authentication session.
 */
export async function getAuthSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new MfaError(error.message);
  }

  return data.session;
}

/**
 * Get MFA authentication level.
 */
export async function getMfaAssuranceLevel() {
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error) {
    throw new MfaError(error.message);
  }

  return data;
}

/**
 * Get enrolled MFA factors.
 */
export async function getMfaFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();

  if (error) {
    throw new MfaError(error.message);
  }

  return data;
}

/**
 * Check whether MFA verification is required.
 */
export async function isMfaRequired() {
  const assurance = await getMfaAssuranceLevel();

  return (
    assurance.nextLevel === 'aal2' &&
    assurance.currentLevel !== 'aal2'
  );
}

/**
 * Create an MFA challenge.
 */
export async function createMfaChallenge(factorId) {
  const { data, error } = await supabase.auth.mfa.challenge({
    factorId,
  });

  if (error) {
    throw new MfaError(error.message);
  }

  return data;
}

/**
 * Verify MFA code.
 */
export async function verifyMfa(factorId, challengeId, code) {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });

  if (error) {
    throw new MfaError(error.message);
  }

  return data;
}

/**
 * Sign in to manage MFA settings.
 */
export async function signInToManageMfa(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new MfaError(error.message);
  }

  return {
    user: data.user,
    session: data.session,
    requiresMfa: await isMfaRequired(),
  };
}

/**
 * MFA session manager.
 *
 * Supabase automatically manages authentication sessions.
 * No custom management token rotation is necessary.
 */
export function mfaSession() {
  return {

    /**
     * Verify an existing MFA challenge.
     */
    verify: async (code, factorId, challengeId) => {
      return verifyMfa(factorId, challengeId, code);
    },

    /**
     * Send another sign-in code.
     *
     * For phone MFA, creating another challenge
     * triggers a new SMS.
     */
    sendSignInCode: async (factorId) => {
      return createMfaChallenge(factorId);
    },

    /**
     * Setup TOTP authenticator.
     */
    setupAuthenticator: async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'BizzPath Authenticator',
      });

      if (error) {
        throw new MfaError(error.message);
      }

      return data;
    },

    /**
     * Confirm TOTP enrollment.
     */
    confirmAuthenticator: async (
      code,
      factorId,
      challengeId
    ) => {
      return verifyMfa(factorId, challengeId, code);
    },

    /**
     * Setup phone MFA.
     */
    sendPhoneCode: async (phoneNumber) => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'phone',
        phone: phoneNumber,
      });

      if (error) {
        throw new MfaError(error.message);
      }

      return data;
    },

    /**
     * Confirm phone enrollment.
     */
    confirmPhone: async (code, factorId, challengeId) => {
      return verifyMfa(factorId, challengeId, code);
    },

    /**
     * Get MFA status.
     */
    status: async () => {
      const [factors, assurance] = await Promise.all([
        getMfaFactors(),
        getMfaAssuranceLevel(),
      ]);

      return {
        factors,
        assurance,
        hasMfa: factors.totp.length > 0 || factors.phone.length > 0,
      };
    },

    /**
     * Send phone verification code.
     */
    sendProofCode: async (factorId) => {
      return createMfaChallenge(factorId);
    },

    /**
     * Remove an MFA method.
     */
    removeMethod: async (factorId) => {
      const { data, error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        throw new MfaError(error.message);
      }

      return data;
    },

    /**
     * Supabase does not provide a direct equivalent
     * of Base44's trusted-device clearing API.
     */
    forgetDevices: async () => {
      throw new MfaError(
        'Trusted device management is not supported by this implementation.'
      );
    },
  };
}

/**
 * Resume authentication after OAuth redirect.
 *
 * Supabase automatically processes the OAuth callback
 * and exchanges the authorization code for a session.
 */
let resumed;

export function resumeMfa() {
  resumed ||= (async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new MfaError(error.message);
    }

    return data.session
      ? {
          user: data.session.user,
          session: data.session,
          access_token: data.session.access_token,
        }
      : null;
  })();

  return resumed;
}

/**
 * Load available sign-in options.
 *
 * Configure these options in your application.
 */
export async function loadSignInOptions() {
  return {
    auth_config: {
      mfa_policy: 'optional',
      enabled_providers: [
        'google',
        'azure',
        'facebook',
        'apple',
      ],
    },
  };
}

/**
 * Social login.
 */
export async function signInWithProvider(
  provider,
  returnTo = '/',
  { manage = false } = {}
) {
  const supportedProviders = [
    'google',
    'azure',
    'facebook',
    'apple',
  ];

  const redirectUrl = new URL(returnTo, window.location.origin);

  // Prevent external redirect URLs.
  if (redirectUrl.origin !== window.location.origin) {
    throw new MfaError('Invalid redirect URL.');
  }

  if (provider === 'sso') {
    throw new MfaError(
      'Configure your SSO provider using Supabase signInWithSSO.'
    );
  }

  if (!supportedProviders.includes(provider)) {
    throw new MfaError('Unsupported authentication provider.');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl.href,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw new MfaError(error.message);
  }

  return data;
}

/**
 * Google login.
 */
export function loginWithGoogle(returnTo = '/') {
  return signInWithProvider('google', returnTo);
}

/**
 * Microsoft login.
 */
export function loginWithMicrosoft(returnTo = '/') {
  return signInWithProvider('azure', returnTo);
}

/**
 * Enterprise SSO.
 */
export async function loginWithSSO(domain, returnTo = '/') {
  const redirectUrl = new URL(returnTo, window.location.origin);

  if (redirectUrl.origin !== window.location.origin) {
    throw new MfaError('Invalid redirect URL.');
  }

  const { data, error } = await supabase.auth.signInWithSSO({
    domain,
    options: {
      redirectTo: redirectUrl.href,
    },
  });

  if (error) {
    throw new MfaError(error.message);
  }

  return data;
}

/**
 * Finish sign-in.
 */
export function finishSignIn(accessToken, returnTo = '/') {
  const redirectUrl = new URL(returnTo, window.location.origin);

  if (redirectUrl.origin !== window.location.origin) {
    throw new MfaError('Invalid redirect URL.');
  }

  window.location.assign(redirectUrl.href);
}