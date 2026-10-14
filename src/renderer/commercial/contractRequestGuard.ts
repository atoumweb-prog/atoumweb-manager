/** Guards async contract responses from a previous quote or obsolete request. */
export function isCurrentContractRequest(
  requestedQuoteId: string,
  activeQuoteId: string,
  requestNumber: number,
  latestRequestNumber: number,
): boolean {
  return requestedQuoteId === activeQuoteId && requestNumber === latestRequestNumber;
}
