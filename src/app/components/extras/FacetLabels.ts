import { Extra, ExtraBooleans, ExtraOffset, ExtraSize } from './Extra';

export class FacetLabels extends Extra {

    constructor(position: number, className: string | string[], private labels: string[]) {
        super(position, false, className);
    }

    protected drawElement(svg: d3.Selection<SVGElement>): d3.Selection<SVGElement> {

        return <any>svg
            .append('g')
            .selectAll('.what')
            .data(this.labels)
            .enter()
            .append('text')
            .attr({
                'text-anchor': 'middle',
                'alignment-baseline': 'before-edge'
            })
            .text(_.identity);

    }


    /**
     * Move facet labels into the available space. The labels must also be stacked beside or on top
     * of each other depending on if they're positioned vertically or horizontally.
     */
    public move(offset: ExtraOffset, plotAreaWidth: number, plotAreaHeight: number): void {

        if (this.isHorizontal()) {

            // Horizontally stack the labels if they're going at the top or bottom of the chart.    
            const labelWidth = plotAreaWidth / this.labels.length;
            this.selection.attr('x', (datum: any, index: number) =>
                offset.left + ((index + 0.5) * labelWidth));

            if (this.atTop()) {
                this.selection.attr('y', offset.top + this.padding.top);
            } else if (this.atBottom()) {
                this.selection.attr('y', offset.top + plotAreaHeight + offset.bottom - this.padding.bottom);
            }

        } else {
            
            // Stack the labels vertically. This needs a crazy function here because the rotation of
            // the labels also needs to no their vertical position i.e. it's needed multiple times.
            const labelHeight = plotAreaHeight / this.labels.length;
            const calculateVertical = (datum: any, index: number) =>
                (plotAreaHeight / 2) + offset.top - ((index - 0.5) * labelHeight);
                
            this.selection.attr('y', calculateVertical);

            if (this.atRight()) {
                const rightEdge = offset.left + plotAreaWidth + offset.right + this.padding.right;
                this.selection.attr({
                    'x': rightEdge,
                    'transform': function (datum: any, index: number) {
                        const vertical = calculateVertical(datum, index);
                        return `rotate(270, ${rightEdge}, ${vertical})`
                    }
                });
            }

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

            if (this.isHorizontal()) {
                return { height: innerSize + this.padding.top + this.padding.bottom, width: 0, topOffset: 0, leftOffset: 0 };
            } else {
                return { width: innerSize + this.padding.left + this.padding.right, height: 0, topOffset: 0, leftOffset: 0 };
            }

        }
    }

} 