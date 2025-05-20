export function checkItineraryLimit(userData, currentCount) {
  if (!userData.premium) {
    return currentCount < 1;
  }

  const plan = userData.plan;
  const limits = {
    basic: 5,
    advanced: 15,
    unlimited: Infinity
  };

  return currentCount < (limits[plan] ?? 0);
}
