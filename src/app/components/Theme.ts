export class Theme {

    private _swatch: string[];
    private _gradient: string[];

    constructor (swatch: string[], gradient: string[]) {
        this._swatch = swatch;
        this._gradient = gradient;
    }

    get swatch(): string[] {
        return this._swatch;
    }

    get gradient(): string[] {
        return this._gradient;
    }

}
