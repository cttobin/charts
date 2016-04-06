// export function isOrdinalScale (scale: d3.scale.Linear<number, Range> | d3.scale.Ordinal<string, Range>): boolean {
//   return _.isFunction(_.get(scale, 'rangeRoundPoints'));
// }


export function isOrdinalScale(scale: d3.scale.Linear<any, any>|d3.scale.Ordinal<any, any>): scale is d3.scale.Ordinal<any, any> {
    return _.isUndefined((<d3.scale.Ordinal<any, any>>scale).rangeRoundBands);
}