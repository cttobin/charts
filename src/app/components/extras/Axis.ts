import { isOrdinalScale } from './../utilities/isOrdinalScale';
import { Extra, ExtraOffset, ExtraPosition, ExtraSize, ExtraBooleans } from './Extra';
import { translate } from './../utilities/translate';

// TODO: Make sure the axis text isn't getting cut off/overflowing.

export type AxisOrientation = 'top' | 'right' | 'bottom' | 'left';

export class Axis extends Extra {

    private axis: d3.svg.Axis;

    constructor(position: number,
        className: string | string[],
        private scale: d3.scale.Linear<any, any> | d3.scale.Ordinal<any, any>,
        private ticks: number,
        private ticksFormat: (x: number) => string) {

        super(position, false, className);

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
                this.scale.range([0, plotAreaWidth]);
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
                this.scale.range([0, plotAreaWidth]);
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

        if (_.isNull(this.selection) || _.isUndefined(this.selection)) {

            return { width: 0, height: 0, topOffset: 0, leftOffset: 0 };

        } else {

            const element = <SVGElement>this.selection.node();

            let innerSize;
            if (this.isHorizontal() || this.rotated) {
                innerSize = element.getBoundingClientRect().height;
            } else {
                innerSize = element.getBoundingClientRect().width;
            }

            let labelOverflow = 0;
            if (this.isHorizontal()) {
                
                let leftOffset = 0;
                if (!otherExtras.right) {
                    labelOverflow += this.calculateLabelOverflow(_.last, 'width');
                }

                if (!otherExtras.left) {
                    labelOverflow += this.calculateLabelOverflow(_.first, 'width');
                    leftOffset = labelOverflow;
                }

                return {
                    width: labelOverflow,
                    height: innerSize + this.padding.top + this.padding.bottom,
                    topOffset: 0,
                    leftOffset: leftOffset
                };

            } else {

                let topOffset = 0;
                if (!otherExtras.top) {
                    labelOverflow += this.calculateLabelOverflow(_.first, 'height');
                    topOffset = labelOverflow;
                }

                if (!otherExtras.bottom) {
                    labelOverflow += this.calculateLabelOverflow(_.last, 'height');
                }

                return {
                    width: innerSize + this.padding.left + this.padding.right,
                    height: labelOverflow,
                    topOffset: topOffset,
                    leftOffset: 0
                };

            }

        }

    }
    

    /**
     * Calculate how far past the chart extent an axis label goes. This might be needed to adjust 
     * the axis back a bit to stop overflowing.
     * @param selector  A function to select an item from the array of labels that will be found.
     * @param dimension The name of the dimension to measure ('height' or 'width').
     * @returns         Half of the height or width of the selected label element. 
     */
    private calculateLabelOverflow(selector: (x: any) => HTMLElement, dimension: string): number {
        const labels = this.selection.selectAll('text')[0];
        const lastLabel = selector(labels).getBoundingClientRect();
        return lastLabel[dimension] / 2;
    }

}