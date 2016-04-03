/**
 * Closure to generate function for making human-readable lists of items ending in 'and' or 'or'.
 * E.g. something like "one, two and three".
 * @param terminal  'and' or 'or'.
 * @returns {function(any[]): string}
 */
function quoteList (terminal: string): (items: any[]) => string {

  return function (items: any[]) : string {
    if (_.size(items) === 1) {
      return `"${items}"`;
    }

    let start = '"' + _.initial(items).join('", "') + '"';
    return start + ' ' + terminal + ' "' + _.last(items) + '"';
  };

}

/**
 * Create a list penultimately separated with 'or'.
 * @type {function(any[]): string}
 */
export const orList = quoteList('or');


/**
 * Create a list penultimately separated with 'and'.
 * @type {function(any[]): string}
 */
export const andList = quoteList('and');
