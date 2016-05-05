import { Extra, ExtraOffset, ExtraPosition, ExtraBooleans, ExtraSize } from './Extra';


export class TextExtra extends Extra {

    constructor(position: number, className: string | string[], private text: string) {
        super(position, position === ExtraPosition.Left || position === ExtraPosition.Right, className);
    }

    protected drawElement(svg: d3.Selection<SVGElement>): d3.Selection<SVGElement> {

        // Append text element and vertical centre it.
        return svg.append('text')
            .attr('text-anchor', 'middle')
            .text(this.text);

    }

    public move(offset: ExtraOffset, plotAreaWidth: number, plotAreaHeight: number): void {

        const verticalCentre = (plotAreaHeight / 2) + offset.top;

        if (this.atTop()) {
            this.selection.attr({
                'x': (plotAreaWidth / 2) + offset.left,
                'y': offset.top + this.padding.top,
                'alignment-baseline': 'before-edge'
            });
        } else if (this.atBottom()) {
            this.selection.attr({
                'x': (plotAreaWidth / 2) + offset.left,
                'y': offset.top + plotAreaHeight + offset.bottom - this.padding.bottom,
                'alignment-baseline': 'before-edge'
            });
        } else if (this.atLeft()) {
            const left = offset.left + this.padding.left;
            this.selection.attr({
                'x': left,
                'y': verticalCentre,
                'transform': `rotate(270, ${left}, ${verticalCentre})`,
                'alignment-baseline': 'before-edge'
            });
        } else if (this.atRight()) {
            const rightEdge = offset.left + plotAreaWidth + offset.right + this.padding.right;
            this.selection.attr({
                'x': rightEdge,
                'y': verticalCentre,
                'transform': `rotate(270, ${rightEdge}, ${verticalCentre})`,
                'alignment-baseline': 'before-edge'
            });
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
