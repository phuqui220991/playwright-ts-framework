import { env } from '@utils/env';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export class Logger {
    static info(message: string, meta?: unknown): void {
        this.print('INFO', message, meta);
    }

    static warn(message: string, meta?: unknown): void {
        this.print('WARN', message, meta);
    }

    static error(message: string, meta?: unknown): void {
        this.print('ERROR', message, meta);
    }

    static debug(message: string, meta?: unknown): void {
        if (env.debug) {
            this.print('DEBUG', message, meta);
        }
    }

    private static print(level: LogLevel, message: string, meta?: unknown): void {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level}] ${message}`;

        if (meta === undefined) {
            this.write(level, formattedMessage);
            return;
        }

        this.write(level, `${formattedMessage}\n${JSON.stringify(meta, null, 2)}`);
    }

    private static write(level: LogLevel, message: string): void {
        switch (level) {
            case 'ERROR':
                console.error(message);
                break;
            case 'WARN':
                console.warn(message);
                break;
            default:
                console.log(message);
        }
    }
}
