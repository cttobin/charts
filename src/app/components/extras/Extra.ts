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
    
    public position: ExtraPosition;
    public classList: string|string[];
    
    protected rotated: boolean;
    protected className: string;
    protected selection: d3.Selection<SVGElement>;
    protected padding: ExtraOffset;
    protected size: { width: number, height: number, topOffset: number, leftOffset: number };

    constructor(position: ExtraPosition, rotated: boolean, classList: string|string[]) {
        this.padding = DEFAULT_PADDING;
        this.position = position;
        this.rotated = rotated;
        this.classList = classList
    }

    protected abstract drawElement(svg: d3.Selection<SVGElement>): d3.Selection<SVGElement>;
    public abstract move(offset: ExtraOffset, plotAreaWidth: number, plotAreaHeight: number): void;


    /**
     * Render the element on the page without much positioning.
     */
    public draw(svg: d3.Selection<SVGElement>, otherExtras: ExtraBooleans): ExtraSize {

        this.selection = this.drawElement(svg);
        if (!_.isNull(this.classList)) {
            
            // Create a single string of classes to apply to the element.
            this.className = <string>this.classList;
            if (_.isArray(this.classList)) {
                this.className = (<string[]>this.classList).join(' ');
            }

            this.selection.classed(this.className, true);

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
