import OmniboxBaseTemplate from "./OmniboxBaseTemplate";

export class OmniboxSuggestionsBaseTemplate extends OmniboxBaseTemplate {
    instantiateToString(): string {
        return `<span class="base-suggestion">{{=text}}</span>`;
    }
}