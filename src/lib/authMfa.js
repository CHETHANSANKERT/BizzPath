
import { supabase } from '@/lib/supabase';

/**
 * Login with email and password.
 * Checks whether MFA verification is required.
 */
export async function loginWithMfa(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data: assuranceData, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError) {
    throw new Error(assuranceError.message);
  }

  // Check whether MFA verification is required.
  if (
    assuranceData.nextLevel === 'aal2' &&
    assuranceData.currentLevel !== 'aal2'
  ) {
    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors();

    if (factorsError) {
      throw new Error(factorsError.message);
    }

    const verifiedFactor = factors.totp.find(
      (factor) => factor.status === 'verified'
    );

    if (!verifiedFactor) {
      throw new Error('No verified MFA factor found.');
    }

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({
        factorId: verifiedFactor.id,
      });

    if (challengeError) {
      throw new Error(challengeError.message);
    }

    return {
      requiresMfa: true,
      factorId: verifiedFactor.id,
      challengeId: challenge.id,
      user: data.user,
      session: data.session,
    };
  }

  return {
    requiresMfa: false,
    user: data.user,
    session: data.session,
  };
}

/**
 * Continue MFA verification using TOTP code.
 */
export async function continueMfa(factorId, challengeId, code) {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    requiresMfa: false,
    user: data.user,
    session: data,
  };
}

/**
 * Social login.
 * Supported providers:
 * google, azure, facebook, apple
 */
export async function loginWithSocial(provider, returnTo = '/') {
  const redirectTo = `${window.location.origin}${returnTo}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Google login.
 */
export function loginWithGoogle(returnTo = '/') {
  return loginWithSocial('google', returnTo);
}
