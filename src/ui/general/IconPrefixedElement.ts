

import {l, $$,IComponentBindings,ComponentOptions,Component,Initialization,} from "coveo-search-ui"
export interface IIconPrefixedElementOptions {
    icon: string;
    iconPath?: string;
    iconType?: string;
}

export class IconPrefixedElement extends Component {
    static ID = 'IconPrefixedElement';

    static options: IIconPrefixedElementOptions = {
        icon: ComponentOptions.buildStringOption(),
        iconType: ComponentOptions.buildStringOption({
            defaultValue: 'svg'
        }),
        iconPath: ComponentOptions.buildStringOption({
            defaultValue: 'assets/images'
        }),
    };

    constructor(public element: HTMLElement, public options: IIconPrefixedElementOptions, public bindings: IComponentBindings) {
        super(element, IconPrefixedElement.ID, bindings);
        this.options = ComponentOptions.initComponentOptions(element, IconPrefixedElement, options);
        this.render();
    }

    buildIconPath(icon) {
        const { iconType, iconPath } = this.options;

        return [iconPath, `${icon}.${iconType}`].filter(i => i).join('/');
    }

    buildSelector() {
        let className = this.element.getAttribute('class');
        let id = this.element.getAttribute('id');

        let pieces = [
            {value: className, cssRule: '.'},
            {value: id, cssRule: '#'}
        ].filter(({value}) => value);

        return pieces.map(({value, cssRule}) => value.split(' ').map(value => `${cssRule}${value}`).join('')).join('');
    }

    getIconPrefix(icon) {
        const selector = this.buildSelector();
        icon = this.buildIconPath(icon);
        return `${selector}::before{background-image: url(${icon})}`
    }

    render() {
        const {icon} = this.options;

        let styles = [
            icon && this.getIconPrefix(icon),
        ]

        let inlineStyling = Coveo.$$('style', {}, ...styles.filter(v => v));
        Coveo.$$(this.element).prepend(inlineStyling.el);
    }

}

Initialization.registerAutoCreateComponent(IconPrefixedElement);

export default IconPrefixedElement;