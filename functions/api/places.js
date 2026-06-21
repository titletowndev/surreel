/* ============================================================
   /api/places — Google Places (New) text search proxy (Surreel)

   Returns movie theaters matching ?q=<text>, with city/state
   parsed from address components. The key lives in the
   GOOGLE_PLACES_KEY secret, server-side only; it never reaches
   the client.

   GET ?q=<text> -> { places: [{ id, name, address, city, state, location }] }
   missing q     -> 400
   missing key   -> 503
   upstream fail -> 502
   wrong method  -> 405
   ============================================================ */

const FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.addressComponents';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function pickComponent(components, type, useShort) {
  if (!Array.isArray(components)) return null;
  const hit = components.find(
    (c) => Array.isArray(c.types) && c.types.includes(type),
  );
  if (!hit) return null;
  return useShort
    ? hit.shortText || hit.longText || null
    : hit.longText || hit.shortText || null;
}

export async function onRequest(context) {
  const { request, env } = context;
  try {
    if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405);

    const q = (new URL(request.url).searchParams.get('q') || '').trim();
    if (!q) return json({ error: 'missing q' }, 400);
    if (!env.GOOGLE_PLACES_KEY) return json({ error: 'places key not configured' }, 503);

    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Goog-Api-Key': env.GOOGLE_PLACES_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: q,
        includedType: 'movie_theater',
        maxResultCount: 6,
        locationBias: {
          circle: { center: { latitude: 25.7617, longitude: -80.1918 }, radius: 50000 },
        },
      }),
    });
    if (!res.ok) return json({ error: 'places upstream ' + res.status }, 502);

    const data = await res.json();
    const places = (Array.isArray(data.places) ? data.places : [])
      .slice(0, 6)
      .map((p) => {
        const comps = p.addressComponents;
        const city =
          pickComponent(comps, 'locality', false) ||
          pickComponent(comps, 'postal_town', false) ||
          pickComponent(comps, 'administrative_area_level_2', false);
        const state = pickComponent(comps, 'administrative_area_level_1', true);
        return {
          id: p.id,
          name: p.displayName && p.displayName.text ? p.displayName.text : q,
          address: p.formattedAddress || '',
          city: city || null,
          state: state || null,
          location: p.location || null,
        };
      });
    return json({ places });
  } catch (e) {
    return json({ error: e && e.message ? e.message : 'places failure' }, 500);
  }
}
