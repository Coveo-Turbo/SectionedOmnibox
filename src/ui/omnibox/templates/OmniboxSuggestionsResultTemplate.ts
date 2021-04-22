import { OmniboxSuggestionsTemplate } from "./OmniboxSuggestionsTemplate";

export class OmniboxSuggestionsResultTemplate extends OmniboxSuggestionsTemplate {
    instantiateToString(): string {
        return `
            <div class="coveo-suggested-result" id="result">
                <div class="coveo-result-frame support-frame">
                    <div class="coveo-result-row">              
                        <div class="coveo-result-cell result-content">
                            <div class="coveo-result-row">
                                <a class="title" href="{{- raw.clickUri }}">
                                    {{= raw.highlightedTitle }}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}