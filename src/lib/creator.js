import { supabase } from '@/lib/supabase';

/**
 * Convert a string into a URL-friendly slug.
 */
export function slugify(value) {
  const base = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return base || 'creator';
}

/**
 * Find creator profile using Supabase user ID.
 */
export async function findCreatorForUser(user) {
  if (!user?.id) return null;

  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to find creator: ${error.message}`);
  }

  return data;
}

/**
 * Generate a unique creator slug.
 */
async function generateUniqueSlug(name) {
  const base = slugify(name);

  const { data, error } = await supabase
    .from('creators')
    .select('id')
    .eq('slug', base)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to check creator slug: ${error.message}`);
  }

  if (!data) return base;

  // Generate alternative slug if already taken.
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Create creator profile if one doesn't exist.
 */
export async function ensureCreator(user) {
  if (!user?.id) {
    throw new Error('Authenticated user is required.');
  }

  // Check existing creator.
  const existing = await findCreatorForUser(user);

  if (existing) return existing;

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.full_name ||
    (user.email || '').split('@')[0] ||
    'New creator';

  const slug = await generateUniqueSlug(fullName);

  const creatorData = {
    name: fullName,
    slug,
    user_id: user.id,
    headline: 'Operator sharing what I have already built',
    bio: '',
    verified: false,
    expertise: [],
    businesses_built: 0,
    years_experience: 0,
    followers: 0,
  };

  const { data, error } = await supabase
    .from('creators')
    .insert(creatorData)
    .select()
    .single();

  if (error) {
    // Handle concurrent creator creation.
    if (error.code === '23505') {
      const creator = await findCreatorForUser(user);

      if (creator) return creator;
    }

    throw new Error(`Unable to create creator: ${error.message}`);
  }

  return data;
}