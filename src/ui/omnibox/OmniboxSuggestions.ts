
import {
    Component,Initialization,
    ComponentOptions,
    IComponentBindings,
    IQueryResult,
    IOmniboxSuggestion, 
    Omnibox, 
    KEYBOARD,
} from "coveo-search-ui"

import OmniboxSuggestedResultTemplateResolver from './OmniboxSuggestedResultTemplateResolver';
import OmniboxSection from './OmniboxSection';
import { OmniboxSuggestionsUpdatedEvent } from './events';

export interface IOmniboxSuggestionsOptions {
    title?: string;
    sectionOrder?: string;
    headerIcon?: string;
    showWhenOmniboxIsEmpty?: boolean;
    target: string;
}

/**
 * This component is meant to be used inside a result template to display the URI or path to access a result.
 */
export class OmniboxSuggestions extends Component {
    static ID = 'OmniboxSuggestions';
    static options: IOmniboxSuggestionsOptions = {
        title: ComponentOptions.buildStringOption({
            defaultValue: 'Query Suggestions'
        }),
        sectionOrder: ComponentOptions.buildStringOption({}),
        headerIcon: ComponentOptions.buildStringOption({}),
        //Until I can finally separate the section from the content, we have to couple this for now
        showWhenOmniboxIsEmpty: ComponentOptions.buildBooleanOption({
            defaultValue: true
        }),
        target: ComponentOptions.buildStringOption({
            defaultValue: 'related-searches'
        }),
    };

    private currentSelectedIndex: number = 0;
    private currentScrollPageIndex: number = 0;

    private templateResolver: OmniboxSuggestedResultTemplateResolver;

    /**
     * Create a new OmniboxSuggestions
     * @param element
     * @param options
     * @param bindings
     * @param result
     */
    constructor(public element: HTMLElement, public options: IOmniboxSuggestionsOptions, bindings?: IComponentBindings, public result?: IQueryResult) {
        super(element, OmniboxSuggestions.ID, bindings);
        this.options = ComponentOptions.initComponentOptions(element, OmniboxSuggestions, options);
        
        this.bind.onRootElement(Coveo.OmniboxEvents.populateOmniboxSuggestions, (args: Coveo.IPopulateOmniboxSuggestionsEventArgs) => this.handlePopulateOmniboxSuggestions(args));
        
        this.bind.onRootElement(Coveo.InitializationEvents.afterComponentsInitialization, () => this.handleAfterComponentInitialization());

        this.templateResolver = new OmniboxSuggestedResultTemplateResolver();

    }

    private renderHtml() {
        this.injectOmniboxContent();
        this.putMagicBoxIntoSection();

        /*
        const { sectionOrder } = this.options;
        if (sectionOrder) {
            this.sortSections(sectionOrder.split(',').filter(i => i));
        }*/
    }

    private setContainerActive () {
        let section: HTMLElement = <HTMLElement>document.querySelector('div.coveo-omnibox-content');
        if (!section) {
            return;
        }
        section.setAttribute('class', `${section.getAttribute('class')} active`);
    } 

    private injectOmniboxContent() {
        this.setContainerActive()
        let section: HTMLElement = <HTMLElement>document.querySelector('div.coveo-omnibox-content');
        if (!section) {
            return;
        }

        let suggestionsListEl: HTMLElement = <HTMLElement>document.querySelector('div.magic-box-suggestions');
        if (!suggestionsListEl) {
            console.error("Suggestion List was not found")
            return;
        }
        let fragment = new DocumentFragment();
        fragment.appendChild(section);

        suggestionsListEl.appendChild(fragment);
    }

    private putMagicBoxIntoSection() {
        const { title, headerIcon, showWhenOmniboxIsEmpty, target } = this.options;
        let suggestionsListEl: HTMLElement = <HTMLElement>document.querySelector('div.magic-box-suggestions');
        const relatedSearchesSectionEl: HTMLElement = Coveo.$$('div', { id: target }).el;
        new OmniboxSection(relatedSearchesSectionEl, { showWhenOmniboxIsEmpty, id: target, title, icon: headerIcon }, this.getBindings());
        let fragment = new DocumentFragment();

        const sectionWrapper = Coveo.$$('div').el;
        suggestionsListEl.classList.add('suggestions-section');
        sectionWrapper.appendChild(suggestionsListEl.querySelector('.coveo-magicbox-suggestions'));

        relatedSearchesSectionEl.appendChild(sectionWrapper);
        fragment.appendChild(relatedSearchesSectionEl);

        suggestionsListEl.insertBefore(relatedSearchesSectionEl, suggestionsListEl.firstElementChild )
    }

    private handleAfterComponentInitialization() {

        this.renderHtml();

        let omniboxInput: HTMLElement = <HTMLElement>document.querySelector('.CoveoOmnibox input');
        if (omniboxInput) {
            Coveo.$$(omniboxInput).on('keyup', (e) => { this.handleScrollThroughSuggestions(e) });
        }
    }

    private handleScrollThroughSuggestions(evt) {
        let currentSelectedHTML: HTMLElement = <HTMLElement>document.querySelector('.magic-box-suggestion.coveo-omnibox-selectable.coveo-omnibox-selected');
        let selectedElements = document.getElementsByClassName('magic-box-suggestion');
        if (currentSelectedHTML) {
            let i = 0;
            _.each(selectedElements, (selectedElement) => {
                if (selectedElement.className == currentSelectedHTML.className) {
                    this.currentSelectedIndex = i;
                    return;
                }
                i++;
            });
        }
        
        let wrapper: HTMLElement = <HTMLElement>document.querySelector('.magic-box-suggestions.magic-box-hasSuggestion');
        if (wrapper) {
            if ((<KeyboardEvent>evt).keyCode == KEYBOARD.DOWN_ARROW) {
                if (this.currentSelectedIndex == selectedElements.length) {
                    this.currentScrollPageIndex = 0;
                }

                if (this.currentScrollPageIndex > 11) {
                    this.currentScrollPageIndex--;
                    wrapper.scrollTop = (this.currentSelectedIndex - 11) * (23.75);
                }

                this.currentScrollPageIndex++;
            } else if ((<KeyboardEvent>evt).keyCode == KEYBOARD.UP_ARROW) {
                if (this.currentSelectedIndex == selectedElements.length) {
                    this.currentScrollPageIndex = 11;
                    wrapper.scrollTop = selectedElements.length * (23.75);
                }

                if (this.currentScrollPageIndex == 1) {
                    this.currentScrollPageIndex++;
                    wrapper.scrollTop = this.currentSelectedIndex * (23.75);
                }

                this.currentScrollPageIndex--;
            }
        }
    }

    private async handlePopulateOmniboxSuggestions(args: Coveo.IPopulateOmniboxSuggestionsEventArgs) {
        let { suggestions, omnibox } = args;
        const text = omnibox.getText();
        this.toggleExpandedMode(text);

        /* Removes null promises */
        let filteredSuggestions = suggestions.filter(function (t) {return t!=null});
        suggestions.push(this.formatSuggestions(filteredSuggestions.pop(), text));
    }

    private toggleExpandedMode(text: string) {
        const resultContainer = document.querySelector('.magic-box-suggestions.magic-box-hasSuggestion');
        if (!resultContainer) {
            return;
        }
        if (text) {
            resultContainer.classList.add('expanded');
        } else {
            resultContainer.classList.remove('expanded');
        }
    }

    private formatBaseSuggestions(baseSuggestions: Coveo.Suggestion[]): Coveo.Suggestion[] {
        return baseSuggestions.map(({ html, text }) => {
            const template = this.templateResolver.resolveByType('base');
         //   html = template.render({ text: html })
            html = ""

            return { html, text };
        });
    }

    private async formatSuggestions(baseSuggestions, text) {
        baseSuggestions = await Promise.resolve(baseSuggestions);
        baseSuggestions = []
        //baseSuggestions = this.prepareBaseSuggestions(baseSuggestions);
        const target = this.options.target;

        this.bind.trigger(this.root, OmniboxSuggestionsUpdatedEvent.omniboxSuggestionsUpdated, {numberOfResults: baseSuggestions.length, text, target});

        return new Promise<IOmniboxSuggestion[]>((resolve) => {
            let suggestions: Coveo.Suggestion[] = [];

            if (this.shouldHide(text)) {
                baseSuggestions = [{html: '', title: ''}];
            }

            suggestions = [...suggestions, ...baseSuggestions];

            return resolve(suggestions);
        });
    }

    private shouldHide(text) {
        return !this.options.showWhenOmniboxIsEmpty && !text;
    }

    private prepareBaseSuggestions(suggestions: Coveo.MagicBox.Suggestion[]): IOmniboxSuggestion[] {
        let mergedSuggestions: Coveo.Suggestion[] = [];

        suggestions = this.formatBaseSuggestions(suggestions);
        mergedSuggestions = [...mergedSuggestions, ...suggestions];

        return mergedSuggestions;
    }
}

Initialization.registerAutoCreateComponent(OmniboxSuggestions);