declare module '@xenova/transformers' {
  export function pipeline(
    task: string,
    model: string,
    options?: Record<string, unknown>,
  ): Promise<TextGenerationPipeline>;

  export interface TextGenerationPipeline {
    (
      text: string,
      options?: Record<string, unknown>,
    ): Promise<Array<{ generated_text: string }>>;
  }
}
