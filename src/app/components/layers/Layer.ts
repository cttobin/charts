import { Chart } from './../Chart';
import { LayerParameters } from './../LayerParameters';
import { Data } from './../Data';
import { orList } from './../quotedList';
import { StaticRangeScale } from './../Scale';
import { Mapping } from './../Mapping';


export class Layer {

  protected className: string;
  protected parameterScales: LayerParameters;
  protected tooltip: SVGElement;
  protected tooltipClass: string;

  constructor(protected name: string,
              protected chart: Chart,
              protected userParameters: LayerParameters,
              protected defaultParameters: LayerParameters) {

    // The class to apply to the layer when its drawn. Used for CSS styling.
    this.className = 'layer-' + name;
    this.parameterScales = this._generateScales(chart._data);
    this.tooltip = null;
    this.tooltipClass = this.className + '-tooltip';

    // Check for duplicate user parameters.
    const parameters = _.keys(userParameters);
    if (parameters.length !== _.uniq(parameters).length) {
      throw new Error(`Duplicate parameters passed to ${name} layer.`);
    }

  }

  protected _generateScales(data: Data): { [index: string]: () => string|number } {

    let scales: { [index: string]: () => string|number } = {};

    _.forOwn(this.userParameters, (parameter: any, parameterName: string) => {

      // Input to output mapping.
      let parameterScale;

      // Find the appropriate scale.
      const scaleObject = this.defaultParameters[parameterName];

      if (_.isUndefined(scaleObject)) {
        const validParameters = _.keys(this.defaultParameters).join(', ');
        throw new Error(`"${parameterName}" is not a valid parameter for ${this.name}. The parameters you may choose from are: ${validParameters}.`);
      }

      // Will map the parameter to a data field if necessary.
      if (parameter instanceof Mapping) {

        // Get the field used for the current mapping.
        const dataField = data.fields[this.userParameters[parameterName].name];

        // Static parameters can not be mapped.
        if (scaleObject.isStatic()) {
          const validValues = orList(scaleObject.validValues);
          throw new Error(`You have attempted to map "${dataField.name}" to the "${parameterName}" parameter but this parameter cannot be mapped to the data. You may only specific a fixed value (one of: ${validValues}).`);
        }

        let scale;
        let extent;

        if (dataField.isOrdinal()) {

          if (parameter.hasCustomDefinition()) {

            if (!parameter.isValid(data)) {
              throw new Error(`To map the ${this.name} layer's "${parameterName}" parameter to "${dataField.name}" (an ordinal variable) an object must be supplied. That object must have a key for every unique value in "${dataField.name}".`);
            }

            // Change the extent to the user's definition. This is important so that the user's definition matches up to
            // the values provided. Otherwise the natural extent might be in a different order. The extent should
            // contain the same contents even if they're not in the same order because an error is thrown earlier if
            // this is not the case.
            extent = _.keys(parameter.definition);

            // Overwrite the default values for this scale.
            scaleObject.setOrdinalValues(_.values(parameter.definition));

          } else {

            extent = d3.extent(data.rows, (datum: any) => datum[dataField.name]);

          }

          scale = d3.scale.ordinal().domain(extent);
          scaleObject.getOrdinalRange(scale);

        } else if (dataField.isContinuous()) {

          if (parameter.hasCustomDefinition()) {

            if (!parameter.isValid(data)) {
              throw new Error(`To map the ${this.name} layer's "${parameterName}" parameter to "${dataField.name}" (a continuous variable) an array of length two must be supplied.`);
            }

            scaleObject.setLimits(parameter.definition);
          }

          scale = d3.scale.linear()
            .domain(d3.extent(data.rows, (datum: any) => datum[dataField.name]));

          scaleObject.getContinuousRange(scale);

        }

        // Save method to apply scale.
        parameterScale = (datum: any) => {
          return scale(datum[dataField.name]);
        };

      } else if (_.isFunction(parameter)) {

        parameterScale = parameter;

      } else {

        // The parameter value is just a fixed/constant value. Make sure it's suitable.
        if (scaleObject instanceof StaticRangeScale && !scaleObject.isValueValid(parameter)) {
          throw new Error(`"${parameter}" is not a valid value for "${parameterName}".`);
        }

        parameterScale = _.constant(parameter);

      }

      scales[parameterName] = parameterScale;

    });

    // All parameters provided by the user.
    let userParameterNames = _.keys(this.userParameters);
    _(this.defaultParameters)
      .keys()
      .reject(function (name: string) {

        // Do not apply default parameters if the user has overridden them.
        return _.includes(userParameterNames, name);

      }).forEach((name: string) => {

      // Extract default scale.
      let parameter = this.defaultParameters[name];

      // Make constant getter for default value.
      scales[name] = _.constant(parameter.defaultValue);

    });

    return scales;

  }

  public draw(): void {}
  public remove(): void {}

}
