const REFERRAL_KEY = "ltronics_referral_id";

/** Every visitor gets a persistent anonymous ID — no login required. */
export function getReferralId(): string {
  let id = localStorage.getItem(REFERRAL_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(REFERRAL_KEY, id);
  }
  return id;
}

export function getShareLink(): string {
  return `${window.location.origin}/?ref=${getReferralId()}`;
}
