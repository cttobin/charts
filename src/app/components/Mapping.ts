import { Data } from './Data';
import { DataField } from './DataField';


export interface Mappings {
  x: Mapping;
  y: Mapping;
  label?: Mapping;
}

export class Mapping {

  constructor (public name: string, public definition?: { [index: string]: any } | { [index: number]: any } | number[]) {

  }

  public isValid(data): boolean {

    if (this.hasCustomDefinition()) {

      // The requirements differ for continuous and ordinal variables.
      const dataField = data.fields[this.name];
      if (dataField.isContinuous()) {
        return _.isArray(this.definition);
      } else {

        if (_.isPlainObject(this.definition)) {
          // Make sure every unique value has a mapping defined.
          const keys = _.keys(this.definition);
          const values = dataField.getUniqueValues();
          return _.difference(keys, values).length === 0;
        } else {
          return false;
        }

      }

    }

  }

  public hasCustomDefinition(): boolean {
    return !_.isUndefined(this.definition);
  }

}
