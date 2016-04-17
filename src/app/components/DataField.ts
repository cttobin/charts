export enum DataFieldType {
  Ordinal,
  Continuous,
  Date
}

export class DataField {

  private uniqueValues: any[];

  constructor(private rows: any[], public name: string, private type: DataFieldType) {
  }

  /**
   * Is the field categorical/ordinal?
   * @returns {boolean}
   */
  isOrdinal(): boolean {
    return this.type === DataFieldType.Ordinal;
  }


  /**
   * Is the field numeric/continuous?
   * @returns {boolean}
   */
  isContinuous(): boolean {
    return this.type === DataFieldType.Continuous;
  }
  
  
  /**
   * Is the field a date field?
   * @returns {boolean}
   */
  isDate(): boolean {
    return this.type === DataFieldType.Date;
  }



  getUniqueValues(): any[] {
    if (_.isUndefined(this.uniqueValues)) {
      this.uniqueValues = _(this.rows)
        .map(this.name)
        .uniq()
        .value();
    }
    return this.uniqueValues;
  }

}

export function isDataField(value: any): boolean {
  return value instanceof DataField;
}
