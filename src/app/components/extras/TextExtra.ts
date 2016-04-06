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

        if (this.atTop()) {
            this.selection.attr({
                'x': (plotAreaWidth / 2) + offset.left,
                'y': offset.top,
                'alignment-baseline': 'before-edge'
            });
        } else if (this.atBottom()) {
            this.selection.attr({
                'x': (plotAreaWidth / 2) + offset.left,
                'y': (offset.top + plotAreaHeight) + offset.bottom,
                'alignment-baseline': 'before-edge'
            });
        } else if (this.atLeft()) {
            const centre = (plotAreaHeight / 2) + offset.top;
            this.selection.attr({
                'x': offset.left,
                'y': centre,
                'transform': `rotate(270, ${offset.left}, ${centre})`,
                'alignment-baseline': 'before-edge'
            });
        } else if (this.atRight()) {
            const centre = (plotAreaHeight / 2) + offset.top;
            const rightEdge = offset.left + plotAreaWidth + offset.right;
            this.selection.attr({
                'x': rightEdge,
                'y': centre,
                'transform': `rotate(270, ${rightEdge}, ${centre})`,
                'alignment-baseline': 'before-edge'
            });
        }

    }

}
