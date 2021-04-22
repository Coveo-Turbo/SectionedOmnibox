# OmniboxSuggestions

Disclaimer: This component was built by the community at large and is not an official Coveo JSUI Component. Use this component at your own risk.

## Getting Started

1. Install the component into your project.

```
npm i @coveops/sectioned-omnibox
```

2. Use the Component or extend it

Typescript:

```javascript
import { OmniboxSuggestions, IOmniboxSuggestionsOptions } from '@coveops/sectioned-omnibox';
```

Javascript

```javascript
const OmniboxSuggestions = require('@coveops/sectioned-omnibox').OmniboxSuggestions;
```

3. You can also expose the component alongside other components being built in your project.

```javascript
export * from '@coveops/sectioned-omnibox'
```

4. Or for quick testing, you can add the script from unpkg

```html
<script src="https://unpkg.com/@coveops/sectioned-omnibox@latest/dist/index.min.js"></script>
```

> Disclaimer: Unpkg should be used for testing but not for production.

5. Include the component in your template as follows:

Place the component in your markup:

```html
  <div  class="CoveoOmniboxSuggestions" 
        data-title="Suggested Queries"
        data-icon-component="CoveoIconPrefixedElement"
        data-header-icon="icon-related"
        data-show-when-omnibox-is-empty="false">
      <div  class="coveo-omnibox-content">
          <div class="CoveoOmniboxSection" 
                data-title="Suggested Results"
                data-icon="icon-matched"
                id="matched-content"
                data-id="matched-content"
                data-show-when-omnibox-is-empty="false"
                data-allow-keyboard-selection="false">
              <div  class="CoveoOmniboxMatchedContents"
                    data-number-of-queries="5"
                    data-expression=''
                    data-fields-to-include='title,filetype,objecttype'
                    data-target="matched-content"
              ></div>
          </div>
        </div>
  </div>
```

## Extending

Extending the component can be done as follows:

```javascript
import { OmniboxSuggestions, IOmniboxSuggestionsOptions } from "@coveops/sectioned-omnibox";

export interface IExtendedOmniboxSuggestionsOptions extends IOmniboxSuggestionsOptions {}

export class ExtendedOmniboxSuggestions extends OmniboxSuggestions {}
```

## Contribute

1. Clone the project
2. Copy `.env.dist` to `.env` and update the COVEO_ORG_ID and COVEO_TOKEN fields in the `.env` file to use your Coveo credentials and SERVER_PORT to configure the port of the sandbox - it will use 8080 by default.
3. Build the code base: `npm run build`
4. Serve the sandbox for live development `npm run serve`