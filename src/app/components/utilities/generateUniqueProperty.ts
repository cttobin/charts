/*
 * Create a unique field on an object. The whole point of this is so there are no name clashes with
 * existing properties.
 */
export function generateUniqueProperty(object: { [index: string]: any }[]): string {
    
    // Find the length of the largest current property.
    const length = _(object).map(_.keys).flatten().uniq().map(_.size).max();
    
    // Generate a name that is guaranteed to be unique.
    return _.uniqueId(Array(length).join('-'));

}