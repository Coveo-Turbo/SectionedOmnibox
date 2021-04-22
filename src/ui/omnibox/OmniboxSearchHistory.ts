

import { IOmniboxSuggestion,IPopulateOmniboxSuggestionsEventArgs, l,
    logCustomEvent,
    state,
    $$,
    LocalStorageUtils,
    IQuerySuccessEventArgs,
    QueryEvents,
    IComponentBindings,
    ComponentOptions,
    Component,
    Initialization,
    OmniboxEvents  } from "coveo-search-ui";
import OmniboxSuggestedResultTemplateResolver from "./OmniboxSuggestedResultTemplateResolver";
import OmniboxSection from "./OmniboxSection";
import { OmniboxSuggestionsUpdatedEvent } from "./events";

export interface IOmniboxSearchHistoryOptions {
    caption: string;
    numberOfQueries: number;
    isStandalone: boolean;
    useCookies: boolean;
    cookieDomain: string;
    showPreviousQueriesInOmnibox: boolean;
    removeIndividualSuggestions: boolean;
    target: string;
}

export class OmniboxSearchHistory extends Component {
    static ID = 'OmniboxSearchHistory';

    static options: IOmniboxSearchHistoryOptions = {
        caption: ComponentOptions.buildStringOption(),
        numberOfQueries: ComponentOptions.buildNumberOption({ defaultValue: 10 }),
        isStandalone: ComponentOptions.buildBooleanOption({ defaultValue: false }),
        useCookies: ComponentOptions.buildBooleanOption({ defaultValue: false }),
        cookieDomain: ComponentOptions.buildStringOption({}),
        showPreviousQueriesInOmnibox: ComponentOptions.buildBooleanOption({ defaultValue: false }),
        removeIndividualSuggestions: ComponentOptions.buildBooleanOption({ defaultValue: false }),
        target: ComponentOptions.buildStringOption(),
    };

    private queriesList: string[] = [];
    private queriesListHTMLElement: HTMLElement | null = null;
    private localStorage: any;
    private expDate: Date;
    private refreshList: boolean = true;
    private templateResolver: OmniboxSuggestedResultTemplateResolver;

    constructor(public element: HTMLElement, public options: IOmniboxSearchHistoryOptions, public bindings: IComponentBindings) {
        super(element, OmniboxSearchHistory.ID, bindings);
        this.options = ComponentOptions.initComponentOptions(element, OmniboxSearchHistory, options);
        this.bind.onRootElement(QueryEvents.querySuccess, (args: IQuerySuccessEventArgs) => this.handleQuerySuccess(args));
        this.bind.onRootElement(OmniboxEvents.populateOmniboxSuggestions, (args: IPopulateOmniboxSuggestionsEventArgs) => this.handleQuerySuggestions(args));

        this.templateResolver = new OmniboxSuggestedResultTemplateResolver();

        this.hide();

        const { showPreviousQueriesInOmnibox, isStandalone } = this.options;

        if (!showPreviousQueriesInOmnibox && isStandalone) {
            this.element.appendChild(this.build());
        }
        this.initQueryStorage();
        this.render();
    }

    private render() {
        let parent = $$(this.element).el.parentElement;

        if (parent.classList.contains(`Coveo${OmniboxSection.ID}`)) {
            let clearHistory = $$('button', {className: 'clear-history'}, 'Clear All');
            clearHistory.on('click', () => this.handleClearHistory());

            let header = $$(parent).find('h3');
            header.appendChild(clearHistory.el);
        }
    }

    private initQueryStorage() {
        const { useCookies, isStandalone } = this.options;

        if (useCookies) {
            this.expDate = new Date()
            this.expDate.setMonth(this.expDate.getMonth() + 1);
            this.queriesList = this.getRecentQueriesCookie() || [];
        } else {
            this.localStorage = new LocalStorageUtils('SearchHistory');
            this.queriesList = JSON.parse(this.localStorage.load()) || [];
        }

        if (isStandalone) {
            this.buildPreviousQueries(this.queriesList);
            if (this.queriesList.length > 0) {
                this.show();
            }
        }
    }

    private handleClearHistory() {
        this.removeAllFromQueriesList();
        this.buildPreviousQueries(this.queriesList);
    }

    private hide() {
        $$(this.element).addClass('hidden');
    }

    private show() {
        $$(this.element).removeClass('hidden');
    }

    private handleQuerySuccess(args: IQuerySuccessEventArgs) {
        const query = args.queryBuilder.expression.build();
        if (this.refreshList && args.results.results.length > 0) {
            this.show();
            this.updateQueriesList(query);
        } else {
            this.hide();
        }

        $$(this.element).toggleClass('hidden', this.queriesList.length === 0);
        this.refreshList = true;
    }

    private handleQuerySuggestions(args: IPopulateOmniboxSuggestionsEventArgs) {
        const { omnibox } = args;
        const { showPreviousQueriesInOmnibox, isStandalone, target } = this.options;
        const text = omnibox.getText();

        if (isStandalone) {
            this.buildPreviousQueries(this.queriesList.filter(suggestion => -1 !== suggestion.indexOf(text)));
        }

        if (showPreviousQueriesInOmnibox && !text) {
            args.suggestions.push(this.getPreviousQueriesForOmnibox());
        }

        if (text) {
            $$(this.element).toggleClass('hidden', this.queriesList.length === 0);
        }

        this.refreshList = true;
        this.bind.trigger(this.root, OmniboxSuggestionsUpdatedEvent.omniboxSuggestionsUpdated, {numberOfResults: this.queriesList.length, text, target});
    }

    private getPreviousQueriesForOmnibox(): Promise<IOmniboxSuggestion[]> {
        return new Promise<IOmniboxSuggestion[]>((resolve) => {
            let shownQueries: IOmniboxSuggestion[] = this.queriesList.map(query => this.buildOmniboxPreviousQueries(query));
            return resolve(shownQueries);
        })
    }

    private buildOmniboxPreviousQueries(query: string): Coveo.Suggestion {
        const el = $$('div');
        const suggestion_el = $$('div');
        suggestion_el.addClass("coveo-omnibox-previous-queries");

        const span = $$('span');
        span.text(query);

        suggestion_el.append(span.el);
        el.append(suggestion_el.el);

        var suggest = <IOmniboxSuggestion>{
            html: el.el.outerHTML,
            text: query,
            index: 0,
        }
        return suggest;
    }

    private handleClick(expression: string) {
        this.refreshList = false;
        state(this.root, 'q', expression);
        this.queryController.deferExecuteQuery({
            beforeExecuteQuery: () => {
                logCustomEvent(
                    this.root,
                    { name: 'searchFromHistory', type: 'customEventType' },
                    {
                        queryHistory: expression
                    }
                );
            }
        });
        this.updateQueriesList(expression);
    }

    private updateQueriesList(query: string) {
        this.queriesList = _.chain(this.queriesList)
            .unshift(query)
            .compact()
            .uniq()
            .first(this.options.numberOfQueries)
            .value();

        const { useCookies, cookieDomain } = this.options;

        if (useCookies) {
            document.cookie = `recent_queries=${JSON.stringify(this.queriesList)};domain=${cookieDomain};expires=${this.expDate.toUTCString()};path=/`
        } else {
            this.localStorage.save(JSON.stringify(this.queriesList));
        }

        this.buildPreviousQueries(this.queriesList);
    }

    private removeFromQueriesList(query: string) {
        this.queriesList = _.chain(this.queriesList)
            .without(query)
            .compact()
            .uniq()
            .last(this.options.numberOfQueries + 1)
            .value();

        const { useCookies, cookieDomain } = this.options;

        if (useCookies) {
            document.cookie = `recent_queries=${JSON.stringify(this.queriesList)};domain=${cookieDomain};expires=${this.expDate.toUTCString()};path=/`
        } else {
            this.localStorage.save(JSON.stringify(this.queriesList));
        }
    }

    private removeAllFromQueriesList() {
        this.queriesList = [];

        const { useCookies, cookieDomain } = this.options;

        if (useCookies) {
            document.cookie = `recent_queries=${JSON.stringify(this.queriesList)};domain=${cookieDomain};expires=${this.expDate.toUTCString()};path=/`
        } else {
            this.localStorage.save(JSON.stringify(this.queriesList));
        }
    }

    public build(): HTMLElement {
        this.queriesListHTMLElement = $$('div', { class: 'coveo-magicbox-suggestions suggestions-section' }).el;
        return this.queriesListHTMLElement;
    }

    public buildPanelHeading(): HTMLElement {
        const panelHeading = $$('div', { className: 'panel-heading' });
        const caption = $$('span', { className: 'caption-for-queries-history' }, this.options.caption || l('SearchHistory'));

        panelHeading.append($$('i', { className: 'fas fa-history' }).el);
        panelHeading.append(caption.el);

        return panelHeading.el;
    }

    public buildPreviousQueries(list: any[]) {
        const { showPreviousQueriesInOmnibox, removeIndividualSuggestions } = this.options;

        if (showPreviousQueriesInOmnibox) {
            return;
        }

        if (!this.queriesListHTMLElement) {
            this.logger.warn('queriesListHTMLElement is null');
            return;
        }

        //this.refreshElement();

        let fragment = new DocumentFragment();
        this.removeHistoryItems();

        list.forEach(expression => {
            const historyItem = this.buildItem(expression, removeIndividualSuggestions);
            fragment.appendChild(historyItem);
        });

        this.queriesListHTMLElement.appendChild(fragment);
        this.element.appendChild(this.queriesListHTMLElement);
    }

    protected buildItem(expression: string, canBeRemoved?: boolean): HTMLElement {
        const listDecorator = $$('div', { className: 'magic-box-suggestion', role: 'option', "aria-label": expression });
        listDecorator.on('click keyboardSelect', () => this.handleClick(expression));
        const template = this.templateResolver.resolveByType('history');
        listDecorator.el.innerHTML = template.render({ text: expression });

        if (canBeRemoved) {
            const removeFromList = $$('span', { className: 'queries-history-remove' }, 'x');

            removeFromList.el.addEventListener('click', evt => {
                this.removeFromQueriesList(expression);
                this.buildPreviousQueries(this.queriesList);
                evt.cancelBubble = true;
                evt.preventDefault();
            });

            listDecorator.append(removeFromList.el);
        }

        return listDecorator.el;
    }

    private removeHistoryItems() {
        if (!this.queriesListHTMLElement) {
            return;
        }

        while (this.queriesListHTMLElement.firstChild) {
            this.queriesListHTMLElement.firstChild.remove();
        }
    }

    //Probably a bug with the dynamic sorting sections, the element gets orphaned on the DOM and we need to reassign it.
    private refreshElement() {
        this.element = document.querySelector('#search-history > .CoveoOmniboxSearchHistory');
    }

    private getRecentQueriesCookie(): any {
        let cookies = document.cookie;

        const [item] = cookies.split(';').filter(cookie => -1 === cookie.indexOf('recent_queries='));

        if (!item) {
            return;
        }

        return JSON.parse(item.replace('recent_queries=', ''));
    }

}

Initialization.registerAutoCreateComponent(OmniboxSearchHistory);

export default OmniboxSearchHistory;