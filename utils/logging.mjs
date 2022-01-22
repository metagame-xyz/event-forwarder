import DatadogWinston from 'datadog-winston';
import winston, { format } from 'winston';

import { DATADOG_API_KEY } from './index.mjs';

const { combine, printf, colorize } = format;

const colors = {
    error: 'red',
    warning: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

const prodFormat = printf(
    (d) =>
        `${d.level}: token_id ${d.token_id} | ${d.function_name} | ${
            d.third_party_name ? `${d.third_party_name} | ` : ''
        }${d.attempt_number ? `attempt ${d.attempt_number} | ` : ''}${d.message}`,
);
const localTransports = [new winston.transports.Console({ level: 'debug' })];

const service =
    process.env.RAILWAY_ENV === 'production'
        ? 'event-forwarder-logger'
        : 'event-forwarder-dev-logger';

const datadogTransport = new DatadogWinston({
    apiKey: DATADOG_API_KEY,
    hostname: 'railway',
    service,
    ddsource: 'nodejs',
    ddtags: `env:${process.env.RAILWAY_ENV}, git_sha:${process.env.RAILWAY_GIT_COMMIT_SHA}, git_ref:${process.env.RAILWAY_GIT_BRANCH}`,
});

const prodTransports = [datadogTransport];

const isProdEnv = process.env.NODE_ENV === 'production';

export const winstonLogger = winston.createLogger({
    levels: winston.config.syslog.levels,
    format: isProdEnv ? prodFormat : combine(colorize(), prodFormat),
    transports: isProdEnv ? prodTransports : localTransports,
});

export const logger = isProdEnv ? winstonLogger : console;

export const logSuccess = (logData, message = 'success') => {
    const logDataCopy = { ...logData, level: 'info', message };
    logDataCopy.third_party_name = null;
    logger.log(logDataCopy);
};

export const logError = (logData, error) => {
    const logDataCopy = {
        ...logData,
        level: 'error',
        message: error?.message || 'error obj had no .message',
    };
    logDataCopy.thrown_error = error;
    logger.log(logDataCopy);
};

export const logWarning = (logData, message = 'warning') => {
    const logDataCopy = { ...logData, level: 'warning', message };
    logDataCopy.alert = true;
    logger.log(logDataCopy);
};
