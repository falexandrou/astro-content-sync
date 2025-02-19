export type AstroOptions = {
  /**
  * @description The path to Astro's src directory
  */
  srcDir: string;

  /**
  * @description The path to Astro's public directory
  */
  publicDir: string;
};

export type Syncable = {
  /**
   * @description The path to the directory that will be watched for changes
   */
  source: string;

  /**
   * @description The path to the directory that the sourcePath will be synced to
   */
  target?: string;

  /**
   * @description List of glob patterns to be ignored by the integration
   */
  ignored?: string[];

  /**
   * @description Function to transform the path of the file before syncing
   * @param path The path of the file
   * @returns The transformed path
   */
  transform?: (path: string) => string;
};
