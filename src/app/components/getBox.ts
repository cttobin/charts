/**
 * Get an element's bounding box.
 * @param element
 * @returns {*}
 */
export function getBox (element: any) : SVGRect {
    return element.node().getBBox();
}
