class Logger {
  constructor(subsystem = "Chrome") {
    this.subsystem = subsystem;
  }

  forSubsystem(name) {
    return new Logger(name);
  }

  format(level, message, ...args) {
    const timestamp = new Date().toISOString().substring(11, 19);
    return `[${timestamp}] [${this.subsystem}] [${level.toUpperCase()}]: ${message}`;
  }

  info(message, ...args) {
    console.log(this.format("info", message), ...args);
  }

  warn(message, ...args) {
    console.warn(this.format("warn", message), ...args);
  }

  error(message, ...args) {
    console.error(this.format("error", message), ...args);
  }

  debug(message, ...args) {
    if (process.env.CHROME_DEBUG === "1") {
      console.debug(this.format("debug", message), ...args);
    }
  }
}

module.exports = new Logger();
