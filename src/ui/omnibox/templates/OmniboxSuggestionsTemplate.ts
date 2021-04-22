import { IQueryResult } from "coveo-search-ui";
import OmniboxBaseTemplate from "./OmniboxBaseTemplate";

export interface OmniboxSuggestionsTemplateFields extends IQueryResult {
    text?: string;
}

export class OmniboxSuggestionsTemplate extends OmniboxBaseTemplate {
    protected formatFields(fields: OmniboxSuggestionsTemplateFields) {
        const {text, ...result} = fields;

        fields = this.formatResultTitle(<IQueryResult>result);
        fields.raw.highlightedTitle = this.getHighlightedTitle(text, result.title);
        fields.raw.clickUri = result.clickUri;

        return fields;
    }

    protected formatResultTitle(result: IQueryResult): IQueryResult {
        return result;
    }

    protected getHighlightedTitle(text: string, resultTitle: string): string {
        let title = this.replace(resultTitle, text);
        return title;
    }

    protected replace(str: string, find: string): string {

        if (str.length == 0 || find.length == 0) {
          return str;
        }
    
        let terms: string = find.replace(/\s+/g, '|');
        if (terms == '') {
          return str;
        }
    
        let replacement = `<span class="coveo-omnibox-hightlight">$&</span>`
        return str.replace(new RegExp(terms, 'ig'), replacement);
    }

    instantiateToString(): string {
        return `
            <div class="custom-suggestion">
                <div class="title">{{= raw.highlightedTitle }}</div>
            </div>
        `;
    }
}

export default OmniboxSuggestionsTemplate;