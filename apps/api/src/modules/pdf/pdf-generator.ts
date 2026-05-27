import type { GeneratedPaper } from "@vedaai/shared";
import PDFDocument from "pdfkit";

interface PdfMeta {
  assignmentTitle: string;
  className: string;
  dueDate: string;
}

function ensureSpace(doc: PDFKit.PDFDocument, minY: number): void {
  if (doc.y < minY) return;
  if (doc.y > 730) {
    doc.addPage();
  }
}

function writeHeading(doc: PDFKit.PDFDocument, label: string): void {
  doc.moveDown(0.8);
  ensureSpace(doc, 730);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#111111").text(label);
  doc.moveDown(0.25);
}

export async function createQuestionPaperPdf(
  paper: GeneratedPaper,
  meta: PdfMeta
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margins: {
      top: 48,
      right: 48,
      bottom: 48,
      left: 48
    }
  });

  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer | Uint8Array) =>
      chunks.push(Buffer.from(chunk))
    );
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.font("Helvetica-Bold").fontSize(18).fillColor("#111111").text(paper.schoolName, {
    align: "center"
  });
  doc.font("Helvetica").fontSize(11).fillColor("#444444").text(paper.schoolAddress, {
    align: "center"
  });

  doc.moveDown(0.8);
  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor("#111111")
    .text(meta.assignmentTitle || paper.title, { align: "center" });
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#333333")
    .text(`Subject: ${paper.subject}  |  Class: ${meta.className}`, {
      align: "center"
    });
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#333333")
    .text(`Due Date: ${new Date(meta.dueDate).toLocaleDateString("en-IN")}`, {
      align: "center"
    });

  writeHeading(doc, "Student Information");
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#222222")
    .text("Name: ____________________________", { continued: true })
    .text("    Roll Number: ____________________________");
  doc.text("Section: ____________________________");

  writeHeading(doc, "Exam Details");
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#222222")
    .text(`Time Allowed: ${paper.durationMinutes} minutes`);
  doc.text(`Maximum Marks: ${paper.maxMarks}`);

  writeHeading(doc, "General Instructions");
  paper.generalInstructions.forEach((instruction, index) => {
    ensureSpace(doc, 730);
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#222222")
      .text(`${index + 1}. ${instruction}`);
  });

  for (const section of paper.sections) {
    writeHeading(doc, section.title);
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#333333")
      .text(section.instruction);
    doc.moveDown(0.2);

    section.questions.forEach((question, index) => {
      ensureSpace(doc, 730);
      const difficulty =
        question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1);
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#222222")
        .text(`${index + 1}. ${question.text}`);
      doc
        .font("Helvetica-Oblique")
        .fontSize(10)
        .fillColor("#555555")
        .text(`Difficulty: ${difficulty}  |  Marks: ${question.marks}`);
      doc.moveDown(0.25);
    });
  }

  writeHeading(doc, "Answer Key");
  paper.answerKey.forEach((answer, index) => {
    ensureSpace(doc, 730);
    doc
      .font("Helvetica")
      .fontSize(10.5)
      .fillColor("#222222")
      .text(`${index + 1}. ${answer}`);
  });

  doc.end();
  return done;
}
