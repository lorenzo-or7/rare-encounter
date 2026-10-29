/**
 * Set by the landing's resume banner just before the Liquid Flow runs, read once by the
 * Preparation destination when the liquid covers the page: the encounter then opens the
 * saved session directly instead of offering Preparation.
 */
let resumeRequested = false;

export function requestResume(): void {
  resumeRequested = true;
}

export function takeResumeRequest(): boolean {
  const requested = resumeRequested;
  resumeRequested = false;
  return requested;
}
