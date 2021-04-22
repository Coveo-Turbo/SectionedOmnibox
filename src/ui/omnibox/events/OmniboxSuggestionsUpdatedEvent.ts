export interface IOmniboxSuggestionsUpdatedArgs {
  text: string,
  numberOfResults: number,
  target: string,
}

export class OmniboxSuggestionsUpdatedEvent {
  public static omniboxSuggestionsUpdated = 'omniboxSuggestionsUpdated';
}
