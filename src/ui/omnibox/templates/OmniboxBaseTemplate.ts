export abstract class OmniboxBaseTemplate {
  abstract instantiateToString(): string;

  protected formatFields(fields: {}) {
      return fields;
  }

  public render(fields: {}): string {
      const template = _.template(this.instantiateToString());
      return template(this.formatFields(fields));
  }
}

export default OmniboxBaseTemplate;