import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { DailyReport } from "@/lib/api/reports";

export async function generateMonthlyReportPDF(reports: DailyReport[], studentName: string, studentRoll: string, month: string) {
    const doc = new jsPDF();
    const teacherName = reports[0]?.teacher?.name || "N/A";
    
    // Aggregation Logic
    const totalReports = reports.length;
    const presentCount = reports.filter(r => r.metadata?.attendanceStatus === "Present").length;
    const avgNamaz = reports.reduce((acc, r) => acc + (r.metadata?.namazCount || 0), 0) / totalReports;
    const avgDuration = reports.reduce((acc, r) => acc + (r.metadata?.durationMinutes || 0), 0) / totalReports;
    const practiceYes = reports.filter(r => r.metadata?.lessonPractice === "Yes").length;
    const goodBehavior = reports.filter(r => ["Excellent", "Very Good"].includes(r.metadata?.behavior || "")).length;
    
    // Remarks Logic
    const attendanceRemark = (presentCount / totalReports) > 0.8 
        ? "Excellent attendance record, showing great commitment."
        : "Attendance is below expectations, consider focusing more on regular participation.";
        
    const namazRemark = avgNamaz > 4 
        ? "MashaAllah, consistently punctual with all five daily prayers."
        : "Consider working on improving your punctuality to ensure timely prayer.";
        
    const durationRemark = avgDuration > 20 
        ? `Consistently dedicating an average of ${Math.round(avgDuration)} minutes to each lesson.`
        : "Invalid input for lesson duration.";
        
    const practiceRemark = (practiceYes / totalReports) > 0.7 
        ? "Dedicated practice observed, showing steady improvement."
        : "Lesson practice is below expectations, please dedicate more time and effort to practicing.";
        
    const behaviorRemark = (goodBehavior / totalReports) > 0.8 
        ? "Exemplary behavior in class, maintaining a positive learning environment."
        : "Consider improving your behavior to ensure a positive environment and better outcomes.";

    // Header
    doc.setFontSize(22);
    doc.setTextColor(33, 150, 243); // Blue
    doc.text(month, 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Teacher Name: ${teacherName}`, 20, 35);
    
    autoTable(doc, {
        startY: 45,
        head: [['Name of Student', studentName, 'Roll No', studentRoll]],
        body: [],
        theme: 'plain',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Contents', 'Remarks']],
        body: [
            ['Attendance', attendanceRemark],
            ['Namaz Punctuality', namazRemark],
            ['Average Lesson Duration', durationRemark],
            ['Lesson Practice', practiceRemark],
            ['Completed Quran', "Please continue with your Quran completion journey, working through each Juz at a steady pace."],
            ['Behavior', behaviorRemark],
        ],
        theme: 'grid',
        headStyles: { fillColor: [33, 150, 243], textColor: [255, 255, 255] },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 'auto' }
        },
        styles: { fontSize: 10, cellPadding: 5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text("Teacher's Overall Remarks", 20, finalY);
    doc.line(20, finalY + 2, 190, finalY + 2);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(reports[0]?.description || "The student is showing consistent effort and progress in their Quranic studies.", 20, finalY + 10, { maxWidth: 170 });

    doc.save(`${studentName}_Monthly_Report_${month}.pdf`);
}
