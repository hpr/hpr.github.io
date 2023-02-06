type WaCalculatorOptions = { edition: '2022'; gender: 'm' | 'f'; venueType: 'outdoor' | 'indoor'; electronicMeasurement: true; discipline: string };

declare class WaCalculator {
  constructor(options: WaCalculatorOptions) {
    this.options = options;
  }
  evaluate: (mark: number) => number;
}

declare module '@glaivepro/wa-calculator' {
  export { WaCalculator };
}

declare module 'wikibase-sdk';
