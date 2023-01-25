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
