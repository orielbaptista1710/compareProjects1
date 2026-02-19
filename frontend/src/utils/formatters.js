// src/utils/formatter.js

/** 
 * Format number in Indian currency format with commas
 * Example: 12500000 -> ₹1,25,00,000
 */
export const formatCurrency = (value, options = {}) => {
  const {
    showSymbol = true,
    fallback = "Price on Request",
  } = options;

  const num = Number(value);
  if (!num || Number.isNaN(num) || num <= 0) return fallback;

  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(num);

  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Format to short readable format
 * Example: 12500000 -> ₹1.25 Cr
 *          750000  -> ₹7.5 L
 */
export const formatCurrencyShort = (value, options = {}) => {
  const {
    showSymbol = true,
    fallback = "Price on Request",
    decimals = 2,
  } = options;

  const num = Number(value);
  if (!num || Number.isNaN(num) || num <= 0) return fallback;

  let formatted;

  if (num >= 10000000) {
    formatted = `${(num / 10000000).toFixed(decimals).replace(/\.00$/, "")} Cr`;
  } else if (num >= 100000) {
    formatted = `${(num / 100000).toFixed(decimals).replace(/\.00$/, "")} L`;
  } else if (num >= 1000) {
    formatted = `${(num / 1000).toFixed(decimals).replace(/\.00$/, "")} K`;
  } else {
    formatted = num.toString();
  }

  return showSymbol ? `₹${formatted}` : formatted;
};


//????Add automatic possession status calculation based on reraDate and fallback??? CHECK THIS 