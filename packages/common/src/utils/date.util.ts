import "reflect-metadata"
import {injectable} from "tsyringe"

@injectable()
export class DateUtil {
  formatDuration(milliseconds: number) {
    const parts = [];
    const units = [
      {name: "year", duration: 31536000000}, // 1000ms*60s*60m*24h*365d
      {name: "day", duration: 86400000}, // 1000*60*60*24
      {name: "hour", duration: 3600000}, // 1000*60*60
      {name: "minute", duration: 60000}, // 1000*60
      {name: "second", duration: 1000}, // 1000
      {name: "ms", duration: 1}, // 1
    ]

    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      const value = Math.floor(milliseconds / unit.duration);
      if (value > 0 || (parts.length > 0 && value === 0)) {
        parts.push(`${value} ${unit.name}${value > 1 && unit.name !== "ms" ? 's' : ''}`);
        milliseconds -= value * unit.duration;
      }
    }

    return parts.join(", ").replace(/, ([a-zA-Z0-9 ]*)$/, " and $1") || '0 ms';
  }
}