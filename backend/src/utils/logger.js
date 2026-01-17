function formatTimestamp() {
  return new Date().toISOString();
}

export function log(message, data = null) {
  const timestamp = formatTimestamp();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

export function error(message, errorObj = null) {
  const timestamp = formatTimestamp();
  console.error(`[${timestamp}] ERROR: ${message}`);
  if (errorObj) {
    console.error(errorObj);
  }
}

export function warn(message, data = null) {
  const timestamp = formatTimestamp();
  if (data) {
    console.warn(`[${timestamp}] WARN: ${message}`, data);
  } else {
    console.warn(`[${timestamp}] WARN: ${message}`);
  }
}

export function info(message, data = null) {
  const timestamp = formatTimestamp();
  if (data) {
    console.info(`[${timestamp}] INFO: ${message}`, data);
  } else {
    console.info(`[${timestamp}] INFO: ${message}`);
  }
}

export default { log, error, warn, info };
