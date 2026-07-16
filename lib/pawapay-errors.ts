// Shared between the checkout page and dashboard PaymentModal — both surface
// PawaPay's failureCode to the user via this same mapping, so keep it here
// rather than duplicated inline to avoid the two copies drifting.

export function getPawapayFailureMessage(reason?: string | null): string {
  switch (reason) {
    case "PAYER_LIMIT_REACHED":  return "You have exceeded your daily MoMo limit. Try again tomorrow.";
    case "NOT_ENOUGH_FUNDS":     return "Insufficient balance. Please top up your MoMo account and try again.";
    case "PAYER_NOT_FOUND":      return "Mobile Money account not found for this number. Please check the number.";
    case "PAYMENT_NOT_APPROVED": return "Payment was not approved. Please try again.";
    case "UNSPECIFIED_FAILURE":  return "Payment failed. Please check your MoMo balance and try again.";
    default:                    return "Payment failed. Please try again or use a different payment method.";
  }
}
