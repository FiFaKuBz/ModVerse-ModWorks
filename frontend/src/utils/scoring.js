// Shared scoring helpers for project ranking.
const toDate = (raw) => {
  if (!raw) return null;
  const candidate = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(candidate.getTime()) ? null : candidate;
};

const recencyBonus = (rawCreatedAt) => {
  const created = toDate(rawCreatedAt);
  if (!created) return 0;
  const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 30) return 40;    // freshest work goes first
  if (days <= 60) return 20;    // still recent, but slightly behind
  if (days <= 120) return 8;    // older but not stale
  return 0;                     // beyond ~4 months, recency stops adding value
};

const updatedBonus = (rawUpdatedAt) => {
  const updated = toDate(rawUpdatedAt);
  if (!updated) return 0;
  const days = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 14) return 5;     // gentle nudge for recently maintained work
  if (days <= 30) return 2;
  return 0;
};

export const score7d = (metrics = {}, rawCreatedAt, rawUpdatedAt) => {
  const { likes = 0, saves = 0, comments = 0 } = metrics;
  // Saves and comments outrank likes; likes break ties.
  const engagementScore = saves * 4 + comments * 4 + likes;
  return engagementScore + recencyBonus(rawCreatedAt) + updatedBonus(rawUpdatedAt);
};

export const normalizeMetrics7d = (input) => {
  if (!input || typeof input !== "object") {
    return { likes: 0, saves: 0, comments: 0 };
  }
  return {
    likes: Number.isFinite(input.likes) ? input.likes : 0,
    saves: Number.isFinite(input.saves) ? input.saves : 0,
    comments: Number.isFinite(input.comments) ? input.comments : 0,
  };
};

export const pickCreatedAt = (item = {}) =>
  item.createdAt || item.created_at || item.created;

export const pickUpdatedAt = (item = {}) =>
  item.updatedAt || item.updated_at || item.updated;
