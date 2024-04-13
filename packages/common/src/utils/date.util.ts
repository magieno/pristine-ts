import {injectable} from "tsyringe"
@injectable()
export class DateUtil {
    formatDuration(milliseconds: number) {
        if(milliseconds === 0) {
            return "0ms";
        }

        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const years = Math.floor(days / 365);

        const parts = [];
        if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
        if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
        if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
        parts.push(`${seconds % 60} second${seconds % 60 > 1 ? 's' : ''}`);

        return parts.join(", ").replace(/, (.*)$/, " and $1");
    }
}