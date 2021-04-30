import {
    Component, $$,
    IComponentBindings,
    ComponentOptions,
    Initialization,
    OmniboxEvents,
    IPopulateOmniboxSuggestionsEventArgs,
    IOmniboxSuggestion,
    IQueryResult,
    IQueryResults,
    IQuery,
    INewQueryEventArgs} from "coveo-search-ui"

import { OmniboxSuggestionsCache } from './OmniboxSuggestionsCache';
import OmniboxSuggestedResultTemplateResolver from './OmniboxSuggestedResultTemplateResolver';
import { OmniboxSuggestionsUpdatedEvent } from './events';
import { debounce, once} from 'underscore';


export interface IOmniboxMatchedContentsOptions {
    numberOfQueries: number;
    openNewTab?: boolean;
    expression?: string;
    context: {};
    fieldsToInclude?: string;
    target: string;
}

export class OmniboxMatchedContents extends Component {
    static ID = 'OmniboxMatchedContents';

    private lastSuggestionsQueryText: string = '';
    private lastSuggestionsQueryNbResults: number = 0;
    private searchSuggestionsCache: OmniboxSuggestionsCache<IQueryResults> = new OmniboxSuggestionsCache<IQueryResults>();
    private OmniboxSuggestedResultTemplateResolver: OmniboxSuggestedResultTemplateResolver = new OmniboxSuggestedResultTemplateResolver();
    public firstSuggestion: IQueryResult;

    static options: IOmniboxMatchedContentsOptions = {
        numberOfQueries: ComponentOptions.buildNumberOption({ defaultValue: 10 }),
        openNewTab: ComponentOptions.buildBooleanOption({
            defaultValue: false
        }),
        expression: ComponentOptions.buildStringOption({
            defaultValue: '@uri'
        }),
        context: ComponentOptions.buildJsonObjectOption({
            defaultValue: {}
        }),
        fieldsToInclude: ComponentOptions.buildStringOption({
            defaultValue: 'title'
        }),
        target: ComponentOptions.buildStringOption(),
    };

    constructor(public element: HTMLElement, public options: IOmniboxMatchedContentsOptions, public bindings: IComponentBindings) {
        super(element, OmniboxMatchedContents.ID, bindings);
        this.options = ComponentOptions.initComponentOptions(element, OmniboxMatchedContents, options);
        this.bind.onRootElement(Coveo.QueryEvents.newQuery, (args: INewQueryEventArgs) => this.handleSuggestionRedirect(args));
        this.bind.onRootElement(OmniboxEvents.populateOmniboxSuggestions, (args: IPopulateOmniboxSuggestionsEventArgs) => this.handleQuerySuggestions(args));
    }

    private render(items = []) {
        let fragment = new DocumentFragment();

        const container = $$('div', { class: 'coveo-magicbox-suggestions suggestions-section' }).el;
        
        items.forEach(({html, onSelect}) => { 
            const listDecorator = $$('div', {className: 'magic-box-suggestion', role: 'option'}, html);
            listDecorator.on('click keyboardSelect', () => onSelect());
            container.appendChild(listDecorator.el);
            fragment.appendChild(container);
        });

        this.element.appendChild(fragment);
    }

    private removeMatchedItems() {
        if (!this.element) {
            return;
        }
        
        while(this.element.firstChild) {
          this.element.firstChild.remove();
        }
    }

    private async handleQuerySuggestions(args) {
        const { omnibox } = args;
        
        const text = omnibox.getText();
        const target = this.options.target;
        let suggestedResults = await this.getSuggestions(text);
        suggestedResults = this.prepareSuggestions(suggestedResults);

        this.refreshElement();
        this.removeMatchedItems();
        this.render(suggestedResults);

        this.bind.trigger(this.root, OmniboxSuggestionsUpdatedEvent.omniboxSuggestionsUpdated, {numberOfResults: suggestedResults.length, text, target});
    }

    private handleSuggestionRedirect(args: INewQueryEventArgs) {
        let textContent : string = "";
        const searchbox = <HTMLElement>document.querySelector('.CoveoSearchbox .magic-box-input');
        const standalonesearchbox = <HTMLElement>document.querySelector('.CoveoStandaloneSearchbox  .magic-box-input');

        if (searchbox) {
            textContent = searchbox.textContent;
        }
        else if (standalonesearchbox) {
            textContent = standalonesearchbox.textContent.trim();
        }
    
        if (textContent != "" && this.firstSuggestion) {
            args.cancel = true;
            //this.onSearchSuggestionsSelection(this.firstSuggestion);
        }
    }

    //Probably a bug with the dynamic sorting sections, the element gets orphaned on the DOM and we need to reassign it.
    private refreshElement() {
        this.element = document.querySelector(`#matched-content > .Coveo${OmniboxMatchedContents.ID}`);
    }

    private prepareSuggestions(magicboxSuggestions: Coveo.MagicBox.Suggestion[]): IOmniboxSuggestion[] {
        let suggestions: Coveo.Suggestion[] = [];
        suggestions = [...suggestions, ...magicboxSuggestions];

        return suggestions;
    }

    private async getSuggestions(text: string) {
        return await this.searchSuggestions(text);
    }

    private searchSuggestions(text: string): Promise<IOmniboxSuggestion[]> {
        return new Promise<IOmniboxSuggestion[]>((resolve) => {
            try {
                if (!this.shouldTriggerNextSuggestionsQuery(text)) {
                    return resolve([]);
                }
        
                const suggestions = this.searchSuggestionsCache.getSuggestions(text, () => this.queryForSuggestions(text));
                suggestions.then((queryResults) => {
                    const {results = []} = queryResults;
            
                    this.lastSuggestionsQueryText = text;
                    this.lastSuggestionsQueryNbResults = results.length;
            
                    if (!results.length) {
                        return resolve([]);
                    }
                    
                    this.firstSuggestion = results[0];
                    let omniboxedSuggestions: IOmniboxSuggestion[] = results.map((result, index) => this.mapQueryResult(result, results.length - index, text));
                    return resolve(omniboxedSuggestions);
                });
            } catch (error) {
                this.logger.error(error);
                return resolve([]);
            }
        });
    }

    private shouldTriggerNextSuggestionsQuery(text: string): boolean {
        if (!text) {
          return false;
        }
    
        return true;
    }

    private queryForSuggestions(text: string): Promise<IQueryResults> {
        const query = this.buildSuggestionsQuery(text);
        const Suggestions = this.queryController.getEndpoint().search(query);
        this.handleSearchSuggestionsAnalytics(query, Suggestions);
        return Suggestions;
    }

    private buildSuggestionsQuery(q: string): Coveo.IQuery {
        const {numberOfQueries, expression, context, fieldsToInclude} = this.options;

        q = q.trim();
        return {
            q,
            cq: expression,
            firstResult: 0,
            numberOfResults: numberOfQueries,
            searchHub: this.getBindings().componentOptionsModel.get(Coveo.ComponentOptionsModel.attributesEnum.searchHub),
            context,
            debug: false,
            enableQuerySyntax: false,
            //wildcards: true,
            sortCriteria: 'relevancy',
            fieldsToInclude: fieldsToInclude.split(',').filter(s => s).map(s => s.trim()),
        };
    }
    
    private handleSearchSuggestionsAnalytics(query: IQuery, searchPromise: Promise<IQueryResults>) {
        if (this.getBindings().usageAnalytics) {
    
            this.getBindings().usageAnalytics.logSearchEvent({
                name: 'omniboxSuggestionsSearch',
                type: 'omnibox'
            }, {
                q: query
            });
    
            Coveo.$$(this.queryController.element).trigger(Coveo.QueryEvents.duringQuery, this.buildDataToSendDuringQuery(query, searchPromise));
        }
    }

    private buildDataToSendDuringQuery(query: IQuery, searchPromise: Promise<IQueryResults>): Coveo.IDuringQueryEventArgs {
        let searchAsYouType: boolean = false;
        if (document.querySelector('.CoveoSearchbox') != null)
            searchAsYouType= (<Coveo.Searchbox>Coveo.get(<HTMLElement>document.querySelector('.CoveoSearchbox'), 'Searchbox')).options.enableSearchAsYouType;

        let qb: Coveo.QueryBuilder = new Coveo.QueryBuilder();

        if (!query.q) {
            return;
        }

        qb.expression.add(query.q);
    
        return {
            queryBuilder: qb,
            query: query,
            searchAsYouType: searchAsYouType,
            promise: searchPromise,
        };
    }

    private mapQueryResult(result: IQueryResult, index: number, text: string): IOmniboxSuggestion {
        const template = this.OmniboxSuggestedResultTemplateResolver.resolveByResult(result);
        let html: string = '<div class="coveo-suggested-result"> <a class="title" href="'+ result.clickUri +'"> '+ result.title + '</a> </div>';        

        //let html: string = template.render({text, ...result});
        return <IOmniboxSuggestion>{
            html: html,
            text: result.title,
            onSelect: () => this.onSearchSuggestionsSelection(result),
            index: index
        };
    }

    private onSearchSuggestionsSelection(result: IQueryResult) {
        const executeOnlyOnce = once(() => this.logClickEvent(result));
        executeOnlyOnce();
    
        if (this.options.openNewTab) {
            this.openLinkInNewWindow(result.clickUri);
        } else {
            this.openLink(result.clickUri);
        }
    }

    private openLink(uri: string) {
        window.location.href = uri;
    };
    
    private openLinkInNewWindow(uri: string) {
        window.open(uri, '_blank');
    };
    
    private logClickEvent = debounce(
        (queryResult: IQueryResult) => {
            let rootElement = Coveo.get(document.querySelector('.CoveoSearchInterface'), 'SearchInterface').element
            let clickEventCause: Coveo.IAnalyticsActionCause = { name: 'documentOpenSuggestedResultsSearch', type: 'document' };
            Coveo.logClickEvent(rootElement, clickEventCause, {}, queryResult);
            Coveo.Defer.flush();
        },
        2500,
        true
    );
}

Initialization.registerAutoCreateComponent(OmniboxMatchedContents);

export default OmniboxMatchedContents;