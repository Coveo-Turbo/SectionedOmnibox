import { IQueryResult } from 'coveo-search-ui';
import {
    OmniboxBaseSuggestionsHistoryTemplate,
    OmniboxSuggestionsResultTemplate,
    OmniboxBaseTemplate,
} from './templates';

export class OmniboxSuggestedResultTemplateResolver {


    public resolveByResult(result: IQueryResult): OmniboxBaseTemplate {
        /*
        const {raw = {}} = result;
        const {objecttype} = raw;

        if (-1 !== OmniboxSuggestedResultTemplateResolver.REGULAR_TEMPLATE_OBJECTTYPES.indexOf(objecttype)) {
            return new OmniboxSuggestionsResultTemplate();
        }
        */
        return new OmniboxSuggestionsResultTemplate();
    }

    public resolveByType(type: string) {
        if ('history' === type) {
            return new OmniboxBaseSuggestionsHistoryTemplate();
        }

        return new OmniboxSuggestionsResultTemplate();
    }
}

export default OmniboxSuggestedResultTemplateResolver;