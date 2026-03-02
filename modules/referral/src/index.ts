export const PLATFORM_FEE_BPS = 500; // 5%
export const REFERRAL_SHARE_OF_FEE = 0.1; // 10% of platform fee

export function computePlatformFee(amount: number, feeBps = PLATFORM_FEE_BPS) {
  const fee = Number((amount * (feeBps / 10000)).toFixed(8));
  return fee;
}

export function computeReferralRewardFromFee(fee: number, share = REFERRAL_SHARE_OF_FEE) {
  return Number((fee * share).toFixed(8));
}

export function computeWinnerPayout(totalPot: number, feeBps = PLATFORM_FEE_BPS, share = REFERRAL_SHARE_OF_FEE) {
  const fee = computePlatformFee(totalPot, feeBps);
  const referralReward = computeReferralRewardFromFee(fee, share);
  const platformRevenue = Number((fee - referralReward).toFixed(8));
  const payout = Number((totalPot - fee).toFixed(8));
  return { fee, referralReward, platformRevenue, payout };
}

export function generateReferralCode(seed: string) {
  const base = seed.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${rand}`.slice(0, 10);
}
