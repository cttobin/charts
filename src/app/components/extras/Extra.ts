export enum ExtraPosition {
    Top,
    Right,
    Bottom,
    Left
}

export interface ExtraArrays {
    [index: string]: Extra[];
    top: Extra[];
    bottom: Extra[];
    left: Extra[];
    right: Extra[];
};

export interface ExtraBooleans {
    [index: string]: boolean;
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
};

export interface ExtraSize {
    width: number;
    height: number;
    topOffset: number;
    leftOffset: number;
};

export function getExtraPositionName(position: ExtraPosition): string {
    switch (position) {
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

export interface ExtraOffset {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}

const DEFAULT_PADDING: ExtraOffset = { top: 0, right: 0, bottom: 0, left: 0 };

export abstract class Extra {

    protected selection: d3.Selection<SVGElement>;
    protected padding: ExtraOffset;
    protected size: { width: number, height: number, topOffset: number, leftOffset: number };

    constructor(public position: ExtraPosition, protected rotated: boolean, public className: string | string[]) {
        this.padding = DEFAULT_PADDING;
    }

    protected abstract drawElement(svg: d3.Selection<SVGElement>): d3.Selection<SVGElement>;
    public abstract move(offset: ExtraOffset, plotAreaWidth: number, plotAreaHeight: number): void;
    protected abstract getSize(otherExtras: { top: boolean, right: boolean, bottom: boolean, left: boolean }): ExtraSize;


    /**
     * Render the element on the page without much positioning.
     */
    public draw(svg: d3.Selection<SVGElement>, otherExtras: ExtraBooleans): ExtraSize {

        this.selection = this.drawElement(svg);
        if (!_.isNull(this.className)) {
            
            // Create a single string of classes to apply to the element.
            let classes = <string>this.className;
            if (_.isArray(this.className)) {
                classes = (<string[]>this.className).join(' ');
            }

            this.selection.classed(classes, true);

        }

        this.size = this.getSize(otherExtras);
        return this.size;

    }


    /**
     * Is this element at the sides of the chart?
     */
    public isHorizontal(): boolean {
        return this.atTop() || this.atBottom();
    }


    /**
     * Is this element at the top or bottom of the chart?
     */
    public isVertical(): boolean {
        return this.atLeft() || this.atRight();
    }

    /**
     * Is this element positioned at the top of the chart?
     */
    public atTop(): boolean {
        return this.position === ExtraPosition.Top;
    }


    /**
     * Is this element positioned at the bottom of the chart?
     */
    public atBottom(): boolean {
        return this.position === ExtraPosition.Bottom;
    }


    /**
     * Is this element positioned at the left of the chart?
     */
    public atLeft(): boolean {
        return this.position === ExtraPosition.Left;
    }


    /**
     * Is this element positioned at the right of the chart?
     */
    public atRight(): boolean {
        return this.position === ExtraPosition.Right;
    }

}
