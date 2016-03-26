import { DataField, DataFieldType } from './DataField';


export class Data {

  public fields: {[index: string]: DataField};

  constructor(public rows: {[index: string]: any}[]) {

    this.fields = {};

    // Get all field names.
    let fields = _(rows)
      .map((datum: any) => _.keys(datum))
      .flatten()
      .uniq()
      .value();

    // Types inferred so far.
    let row = 0;

    // The names of the fields for which types have been found on this row.
    let typesFound: string[];

    while (fields.length && row < rows.length) {

      typesFound = [];

      _.forEach(fields, (field: string) => {

        // Field at current row.
        let value = rows[row][field];

        // Determine the fields type.
        if (_.isString(value)) {
          this._createDataField(typesFound, field, DataFieldType.Ordinal);
        } else if (_.isNumber(value)) {
          this._createDataField(typesFound, field, DataFieldType.Continuous);
        } else if (_.isDate(value)) {
          this._createDataField(typesFound, field, DataFieldType.Date);
        }

      });

      // Remove the found fields from the overall list.
      fields = _.difference(fields, typesFound);

      // The field was null or undefined so move on to the next row.
      row++;

    }

  }

  _createDataField(typesFound: string[], field: string, type: DataFieldType) {
    this.fields[field] = new DataField(this.rows, field, type);
    typesFound.push(field);
  }

}
