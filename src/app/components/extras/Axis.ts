import { isOrdinalScale } from './../utilities/isOrdinalScale';
import { Extra, ExtraOffset, ExtraPosition, ExtraSize, ExtraBooleans } from './Extra';
import { translate } from './../utilities/translate';

export type AxisOrientation = 'top' | 'right' | 'bottom' | 'left';

export class Axis extends Extra {

    private axis: d3.svg.Axis;
    private centreTicks: boolean;

    constructor(position: number,
        className: string | string[],
        private scale: d3.scale.Linear<any, any> | d3.scale.Ordinal<any, any>,
        private ticks: number,
        private ticksFormat: (x: number) => string,
        psuedoOrdinal: boolean) {

        super(position, false, className);
        this.centreTicks = psuedoOrdinal && !isOrdinalScale(scale);

    }

    protected drawElement(svg: d3.Selection<SVGElement>): d3.Selection<SVGElement> {

        const orientation = this.getOrientation();

        this.axis = d3.svg.axis()
            .scale(this.scale)
            .orient(orientation)
            .ticks(this.ticks)
            .outerTickSize(0)
            .tickFormat(this.ticksFormat);

        const element = svg
            .append('g')
            .call(this.axis);

        return element;

    }

    public move(offset: ExtraOffset, plotAreaWidth: number, plotAreaHeight: number): void {

        // Getting the tick width to make adjustments for layers that need an ordinal-like scale.
        const ticks = this.selection.selectAll('.tick');
        const tickCount = ticks[0].length;
        const tickSize = this.isHorizontal() ? (plotAreaWidth / tickCount) : (plotAreaHeight / tickCount);
        const rangeReduction = (this.centreTicks ? tickSize : 0) / 2;

        // TODO: Adjust vertical axis for psuedo ordinal scales.

        if (this.atLeft()) {

            this.scale.range([plotAreaHeight, 0]);
            this.axis.scale(this.scale);
            this.selection
                .attr('transform', translate(offset.left + this.size.width, offset.top))
                .call(this.axis);

        } else if (this.atBottom()) {

            if (isOrdinalScale(this.scale)) {
                (<d3.scale.Ordinal<string, number>>this.scale).rangeRoundBands([0, plotAreaWidth], 0.1);
            } else {
                this.scale.range([rangeReduction, plotAreaWidth - rangeReduction]);
            }

            this.axis.scale(this.scale);
            this.selection
                .attr('transform', translate(offset.left, offset.top + plotAreaHeight + offset.bottom))
                .call(this.axis);

        } else if (this.atRight()) {

            const rightEdge = offset.left + plotAreaWidth + offset.right;
            this.scale.range([plotAreaHeight, 0]);
            this.axis.scale(this.scale);
            this.selection
                .attr('transform', translate(rightEdge, offset.top))
                .call(this.axis);

        } else if (this.atTop()) {

            if (isOrdinalScale(this.scale)) {
                (<d3.scale.Ordinal<string, number>>this.scale).rangeRoundBands([0, plotAreaWidth], 0.1);
            } else {
                this.scale.range([0, plotAreaWidth - rangeReduction]);
            }

            this.axis.scale(this.scale);
            this.selection
                .attr('transform', translate(offset.left, offset.top + this.size.height))
                .call(this.axis);

        }


    }


    /**
     * Get the axis orientation for rendering with d3. Could just use the Enum here and extra from
     * an array but that will break if for some inconceivable reason the Enum changes order.
     */
    private getOrientation(): AxisOrientation {
        switch (this.position) {
            case ExtraPosition.Top:
                return 'top';
            case ExtraPosition.Right:
                return 'right';
            case ExtraPosition.Bottom:
                return 'bottom';
            case ExtraPosition.Left:
                return 'left';
        }
    }

    protected getSize(otherExtras: ExtraBooleans): ExtraSize {

        const result: ExtraSize = { width: 0, height: 0, topOffset: 0, leftOffset: 0 };

        if (!_.isNull(this.selection) && !_.isUndefined(this.selection)) {

            const element = <SVGGElement>this.selection.node();
            const rectangle = element.getBBox();

            if (this.isHorizontal()) {

                if (!otherExtras.left) {
                    result.width = this.calculateLabelOverflow(rectangle, _.first, 'width');
                    result.leftOffset = result.width;
                }

                if (!otherExtras.right) {
                    result.width += this.calculateLabelOverflow(rectangle, _.last, 'width');
                }

                result.height = rectangle.height + this.padding.top + this.padding.bottom;

            } else {

                if (!otherExtras.top) {
                    result.height = this.calculateLabelOverflow(rectangle, _.last, 'height');
                    result.topOffset = result.height;
                }

                if (!otherExtras.bottom) {
                    result.height += this.calculateLabelOverflow(rectangle, _.first, 'height');
                }

                result.width = rectangle.width + this.padding.left + this.padding.right;

            }

        }

        return result;

    }


    /**
     * Calculate how far past the chart extent an axis label goes. This might be needed to adjust 
     * the axis back a bit to stop overflowing.
     * 
     * @param axisRectangle  The position of the axis element.
     * @param selector       A function to select an item from the array of labels that will be 
     *                       found.
     * @param dimension      The name of the dimension to measure ('height' or 'width').
     * @returns              How much the label overflows the axis' outer position. 
     */
    private calculateLabelOverflow(axisRectangle: SVGRect, selector: (x: any) => SVGTextElement, dimension: string) {

        if (isOrdinalScale(this.scale)) {
            return 0;
        }

        const coordinate = dimension === 'width' ? 'x' : 'y';
        const label = selector(this.selection.selectAll('text')[0]).getBBox();
        if (Math.abs(axisRectangle[coordinate] - label[coordinate]) < label[dimension]) {
            return label[dimension] / 2;
        } else {
            return 0;
        }

    }

}