export interface CommandMetadata {
  commandExecutionId?: string;
}

export type CommandHandler<T> = (
  metadata: CommandMetadata
) => (args: T) => Promise<void> | void;
