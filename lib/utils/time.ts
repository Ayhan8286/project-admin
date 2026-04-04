/**
 * Time utility for converting between "h:mm AM/PM" and "HH:mm" (input type="time")
 */

export function toTimeInput(timeStr: string | null | undefined): string {
    if (!timeStr) return "";
    
    // If it's already in HH:mm format
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;

    // Parse "h:mm AM/PM"
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return "";

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

export function fromTimeInput(timeStr: string | null | undefined): string {
    if (!timeStr) return "";

    // Parse "HH:mm"
    const [hStr, mStr] = timeStr.split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    
    if (isNaN(h) || isNaN(m)) return "";

    const period = h >= 12 ? "PM" : "AM";
    let displayH = h % 12;
    if (displayH === 0) displayH = 12;

    const displayM = m.toString().padStart(2, "0");

    return `${displayH}:${displayM} ${period}`;
}

export function convertPkToUk(pkTime: string): string {
    if (!pkTime) return "";
    
    // Normalize to HH:mm for processing
    const hhmm = pkTime.includes("M") || pkTime.includes("m") ? toTimeInput(pkTime) : pkTime;
    if (!hhmm || !hhmm.includes(":")) return "";

    const [hStr, mStr] = hhmm.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr;
    
    // Subtract 5 hours for UKT (UTC+0) from PKT (UTC+5)
    h -= 5;
    if (h < 0) h += 24;

    const ukHhmm = `${h.toString().padStart(2, "0")}:${m}`;
    
    // Return in the same format as input
    return (pkTime.includes("M") || pkTime.includes("m")) ? fromTimeInput(ukHhmm) : ukHhmm;
}
