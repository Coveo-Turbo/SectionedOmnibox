

import {Component, $$, IComponentBindings,ComponentOptions,Initialization} from "coveo-search-ui"
import { IconPrefixedElement } from "../general";
import { OmniboxSuggestionsUpdatedEvent, IOmniboxSuggestionsUpdatedArgs } from "./events";

export interface IOmniboxSectionOptions {
    showWhenOmniboxHasText?: boolean;
    showWhenOmniboxIsEmpty?: boolean;
    showWhenNoSuggestions?: boolean;
    allowKeyboardSelection?: boolean;
    id: string;
    title?: string;
    icon?: string;
    iconPath?: string;
    iconType?: string;
}

export class OmniboxSection extends Component {
    static ID = 'OmniboxSection';

    static options: IOmniboxSectionOptions = {
        showWhenOmniboxHasText: ComponentOptions.buildBooleanOption({
            defaultValue: true
        }),
        showWhenOmniboxIsEmpty: ComponentOptions.buildBooleanOption({
            defaultValue: true
        }),
        showWhenNoSuggestions: ComponentOptions.buildBooleanOption({
            defaultValue: false
        }),
        allowKeyboardSelection: ComponentOptions.buildBooleanOption({
            defaultValue: false
        }),
        id: ComponentOptions.buildStringOption(),
        title: ComponentOptions.buildStringOption(),
        icon: ComponentOptions.buildStringOption(),
        iconType: ComponentOptions.buildStringOption(),
        iconPath: ComponentOptions.buildStringOption(),
    };

    constructor(public element: HTMLElement, public options: IOmniboxSectionOptions, public bindings: IComponentBindings) {
        super(element, OmniboxSection.ID, bindings);
        this.options = ComponentOptions.initComponentOptions(element, OmniboxSection, options);
        this.bind.onRootElement(OmniboxSuggestionsUpdatedEvent.omniboxSuggestionsUpdated, (args: IOmniboxSuggestionsUpdatedArgs) => this.handleSuggestionsUpdated(args));
        this.hide();
        this.toggleVisibility('');
        this.render();
    }

    handleSuggestionsUpdated(args: IOmniboxSuggestionsUpdatedArgs) {
        const {text, numberOfResults, target} = args;

        if (target !== this.options.id) {
            return;
        }

        this.toggleVisibility(text, numberOfResults)
    }

    private render() {
        const {title, id, icon, iconType, iconPath} = this.options;
        if (title) {
            const h3 = $$('h3', {id, class: 'title'}, title).el;
            if (icon) {
                new IconPrefixedElement(h3, {icon, iconType, iconPath}, this.getBindings());
            }
            this.element.insertBefore(h3, this.element.firstElementChild);
        }    
    }

    private toggleVisibility(text: string = '', count: number = 0) {
        const {showWhenOmniboxHasText, showWhenOmniboxIsEmpty, showWhenNoSuggestions} = this.options;
        let isVisible = true;

        if (!showWhenOmniboxHasText) {
            isVisible = isVisible && !text;
        }

        if (!showWhenOmniboxIsEmpty) {
            isVisible = isVisible && !!text;
        }

        if (!showWhenNoSuggestions) {
            isVisible = isVisible && count > 0;
        }

        isVisible ? this.show() : this.hide();
    }

    private hide() {
        $$(this.element).el.classList.add('hidden');

        if (this.options.allowKeyboardSelection) {
            const suggestions: HTMLCollection = this.getResultsElements();
            for (let i = 0; i < suggestions.length; ++i) {
                const child = suggestions.item(i)
                child.classList.remove('coveo-omnibox-selectable');
            }
        }
    }

    private show() {
        if (this.options.allowKeyboardSelection) {
            const suggestions: HTMLCollection = this.getResultsElements();
    
            for (let i = 0; i < suggestions.length; ++i) {
                const child = suggestions.item(i)
                child.classList.add('coveo-omnibox-selectable');
            }
        }
        
        $$(this.element).el.classList.remove('hidden');
    }

    private getResultsElements() {
        return $$(this.element).el.getElementsByClassName('magic-box-suggestion');
    }

    private getContent() {
        return $$(this.element).el.querySelector('[class^=Coveo]');
    }
}

Initialization.registerAutoCreateComponent(OmniboxSection);

export default OmniboxSection;