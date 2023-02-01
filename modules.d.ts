declare module 'wikibase-sdk' {
  function WBK({ instance: string, sparqlEndpoint: string }) {
    return {
      simplify: {
        entities: (object, options?: { keepIds?: boolean; keepReferences?: boolean; keepQualifiers?: boolean }) => any,
      },
      getEntities: (entities: string[] | string): string => {},
      getManyEntities: (entities: string[] | string): string[] => {},
    };
  }
  export = WBK;
}

declare class WaCalculator {
  constructor(options: { edition: '2022'; gender: 'm' | 'w'; venueType: 'outdoor' | 'indoor'; electronicMeasurement: true; discipline: string }) {}
  evaluate: (mark: number) => number;
}

declare module '@glaivepro/wa-calculator' {
  export { WaCalculator };
}
