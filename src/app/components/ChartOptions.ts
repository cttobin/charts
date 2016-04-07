export type ChartCentre = 'partial' | 'full';

export interface ChartOptions {
  titlePadding?: number;
  axisTitlePadding?: number;
  theme?: string;
  axisPadding?: number;
  position?: string;
  centreVertical?: ChartCentre;
  centreHorizontal?: ChartCentre;
}