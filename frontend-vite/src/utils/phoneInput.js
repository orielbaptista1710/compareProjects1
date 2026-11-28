// Turns whatever a user types or pastes into the 10-digit Indian mobile the
// backend expects (/^[6-9]\d{9}$/).
//
// Pasting "+91 98765 43210" used to be cut to 10 characters, and "919876543210"
// became "9198765432": a different, valid-looking number that was then saved.
// The +91 / 0 prefix is only removed when there are more than 10 digits, so
// typing a number that starts with 91 or 0 one key at a time is not disturbed.
export const normalizeIndianMobile = (raw) => {
  let digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length > 10) {
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  }
  return digits.slice(0, 10);
};

export const isValidIndianMobile = (raw) => /^[6-9]\d{9}$/.test(normalizeIndianMobile(raw));
