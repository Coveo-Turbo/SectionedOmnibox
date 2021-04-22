import { OmniboxSuggestionsTemplate } from "./OmniboxSuggestionsTemplate";

export class OmniboxSuggestionsProductTemplate extends OmniboxSuggestionsTemplate {
    protected formatFields(fields) {
        fields = super.formatFields(fields);

        const style = `
            .aux-links a::after {
                background: url(${process.env.APPLICATION_BASE_PATH}/assets/images/icon-right-arrow.svg) center center / cover no-repeat;
            }
        `
        return {...fields, style};
    }

    instantiateToString(): string {
        return `
            <div class="coveo-suggested-result" id="product">
                <div class="coveo-result-frame support-frame">
                    <div class="coveo-result-row">
                        <div class="coveo-result-cell result-thumbnail" style="width:100px">
                            <span style="height: 100px">
                                <a class="title" href="{{- raw.clickableuri }}">
                                    <picture>
                                        <img 
                                            alt="" 
                                            data-src-pc="https://images.samsung.com/is/image/samsung/{{- raw.commonimageurl }}" 
                                            data-src-mobile="https://images.samsung.com/is/image/samsung/{{- raw.commonimageurl }}" 
                                            src="https://images.samsung.com/is/image/samsung/{{- raw.commonimageurl }}"
                                        >
                                    </picture> 
                                </a>
                            </span>
                        </div>                
                        <div class="coveo-result-cell result-content">
                            <style>
                                {{- style}}
                            </style>
                            <div class="coveo-result-row">
                                <a class="title" href="{{- raw.clickableuri }}">
                                    <span class="blue">[{{- raw.objecttype }}]</span>
                                    {{= raw.highlightedTitle }}
                                </a>
                            </div>
                            <div class="coveo-result-row aux-links" >
                                {{ if (raw.pdcsupportlinkurl) }}
                                <a href="//samsung.com{{- raw.pdcsupportlinkurl }}#downloads">Owners Manual</a>
                                <a href="//samsung.com{{- raw.pdcsupportlinkurl }}">Support</a>
                                {{ }}
                                <a href="//cybersvc2.samsungcsportal.com/uk/index?language=en">Register</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}