/**
 * Shared CSV export utility.
 * Replaces inline CSV logic duplicated across students/page.tsx and supervisors/page.tsx.
 *
 * Usage:
 *   exportToCSV([{ Name: "Ahmed", Reg: "001" }], "students-export");
 */

type CsvRow = Record<string, string | number | boolean | null | undefined>;

/**
 * Convert an array of objects to a CSV string and trigger a browser download.
 * @param rows    - Array of flat objects (keys become column headers)
 * @param filename - Download filename WITHOUT the .csv extension
 */
export function exportToCSV(rows: CsvRow[], filename: string): void {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);

    const escape = (val: string | number | boolean | null | undefined): string => {
        const str = val == null ? "" : String(val);
        // Wrap in quotes if contains comma, quote, or newline
        return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
    };

    const csvContent = [
        headers.map(escape).join(","),
        ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
