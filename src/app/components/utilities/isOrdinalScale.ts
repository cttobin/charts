export function isOrdinalScale (scale: d3.scale.Linear<number, Range> | d3.scale.Ordinal<string, Range>): boolean {
  return _.isFunction(_.get(scale, 'rangeRoundPoints'));
}
