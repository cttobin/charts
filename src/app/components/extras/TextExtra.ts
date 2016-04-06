import { Extra, ExtraOffset } from './Extra';


export class TextExtra extends Extra {

    constructor(position: number, className: string|string[], private text: string) {
        super(position, className);
    }

    protected drawElement(svg: d3.Selection<SVGElement>): d3.Selection<SVGElement> {

        const container = <SVGElement> svg.node();
        let selection: d3.Selection<SVGElement>;

        if (container instanceof SVGElement) {

            // Append text element and vertical centre it.
            selection = svg.append('text')
                .attr('text-anchor', 'middle')
                .text(this.text);

        }

        return selection;

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

}
