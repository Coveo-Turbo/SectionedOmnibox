import OmniboxBaseTemplate from "./OmniboxBaseTemplate";

export class OmniboxBaseSuggestionsHistoryTemplate extends OmniboxBaseTemplate {
    instantiateToString(): string {
        return `<span class="history-suggestion">{{=text}}</span>`;
    }
}