import { Extra, ExtraOffset, ExtraPosition } from './Extra';
import { translate } from './../utilities/translate';


export type AxisOrientation = 'top' | 'right' | 'bottom' | 'left';

export class Axis extends Extra {

    private axis: d3.svg.Axis;

    constructor(position: number,
                className: string|string[],
                private scale: d3.scale.Linear<any, any>|d3.scale.Ordinal<any, any>,
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
                .attr('transform', translate(offset.left + this.getSize(), offset.top))
                .call(this.axis);

        } else if (this.atBottom()) {

            this.scale.rangeRoundBands([0, plotAreaWidth], 0.1);
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

            this.scale.rangeRoundBands([0, plotAreaWidth], 0.1);
            this.axis.scale(this.scale);
            this.selection
                .attr('transform', translate(offset.left, offset.top + this.getSize()))
                .call(this.axis);

        }

    }


    /**
     * Get the axis orientation for rendering with d3. Could just use the Enum here and extra from
     * an array but that will break if for some inconceivable reason the Enum changes order.
     */
    private getOrientation(): AxisOrientation {
        switch(this.position) {
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

}