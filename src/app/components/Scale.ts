export class Scale {

  private _defaultValue: any;

  constructor(defaultValue: any) {
    this._defaultValue = defaultValue;
  }

  get defaultValue(): any {
    return this._defaultValue;
  }

  isStatic(): boolean {
    return this instanceof StaticRangeScale;
  }

}

export class OrdinalRangeScale extends Scale {

  private _ordinalValues: any[];
  private _continuousLimits: any[];

  constructor(defaultValue: any, ordinalValues: any[], continuousLimits: any[]) {

    super(defaultValue);
    this._ordinalValues = ordinalValues;
    this._continuousLimits = continuousLimits;

  }

  public static isValueValid(value: any): boolean {
    return _.isString(value);
  }

  public setOrdinalValues(values: any[]) {
    this._ordinalValues = values;
  }

  public getOrdinalRange(scale) {
    scale.range(this._ordinalValues);
  }

  public getContinuousRange(scale) {
    scale.range(this._continuousLimits);
  }

}


export class ContinuousRangeScale extends Scale {

  private _limits: number[];

  constructor(defaultValue: any, limits: number[]) {

    super(defaultValue);
    this._limits = limits;

  }

  static isValueValid(value: any): boolean {
    return _.isNumber(value);
  }

  public setLimits(limits: number[]): void {
    if (limits.length !== 2) {
      throw new Error('Limits for a continuous scale must be of length two.');
    }
    this._limits = limits;
  }

  public getOrdinalRange(scale) {
    scale.rangePoints(this._limits);
  }

  public getContinuousRange(scale) {
    scale.range(this._limits);
  }

}

export class StaticRangeScale extends Scale {

  private _validValues: any[];

  constructor(defaultValue: any, validValues: any[]) {
    super(defaultValue);
    this._validValues = validValues;
  }

  get validValues(): any[] {
    return this._validValues;
  }

  isValueValid(value: any): any {
    return _.includes(this._validValues, value);
  }

}
