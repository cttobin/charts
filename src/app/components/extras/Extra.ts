export enum ExtraPosition {
    Top,
    Right,
    Bottom,
    Left
}

export function getExtraPositionName(position: ExtraPosition): string {
    switch(position) {
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

const DEFAULT_PADDING: ExtraOffset = {top: 0, right: 0, bottom: 0, left: 0};

export abstract class Extra {

  protected selection: d3.Selection<SVGElement>;
  protected padding: ExtraOffset;

  constructor(public position: ExtraPosition, private rotated: boolean, public className: string|string[]) {
      this.padding = DEFAULT_PADDING;
  }

  protected abstract drawElement(svg: d3.Selection<SVGElement>): d3.Selection<SVGElement>;
  public abstract move(offset: ExtraOffset, plotAreaWidth: number, plotAreaHeight: number): void;


  /**
   * Render the element on the page without much positioning.
   */
  public draw(svg: d3.Selection<SVGElement>): void {
     this.selection = this.drawElement(svg);
     if (!_.isNull(this.className)) {

         let classes = <string> this.className;
         if (_.isArray(this.className)) {
             const classList = <string[]> this.className;
             classes = classList.join(' ');
         }

         this.selection.classed(classes, true);

     }
  }


  /**
   * Get the dimensions and position of the element.
   */
  public getSize(): number {

      if (_.isNull(this.selection) || _.isUndefined(this.selection)) {
          return 0;
      } else {

        const element = <SVGElement> this.selection.node();

        let innerSize;
        if (this.isHorizontal() || this.rotated) {
            innerSize = element.getBoundingClientRect().height;
        } else {
            innerSize = element.getBoundingClientRect().width;
        }

        if (this.isHorizontal()) {
            return innerSize + this.padding.top + this.padding.bottom;
        } else {
            return innerSize + this.padding.left + this.padding.right;
        }

      }
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
