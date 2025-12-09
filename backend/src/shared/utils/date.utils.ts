export function hoursFromNow(hours: number): Date {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function parseTimeToSeconds(timeString: string): number {
    const value = parseInt(timeString);
    const unit = timeString.slice(-1);

    switch (unit) {
        case 'h': return value * 60 * 60;
        case 'd': return value * 24 * 60 * 60;
        case 'm': return value * 60;
        case 's': return value;
        default: return value * 60 * 60;
    }
}