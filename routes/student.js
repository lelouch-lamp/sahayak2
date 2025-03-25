const express = require("express");
const router = express.Router();
const Assessment = require("../models/Assessment");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// 📌 Route to render the student dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const assessments = await Assessment.find(); // Fetch all assessments
    res.render("student/dashboard", { assessments });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// 📌 Route to render assessments page dynamically based on type
router.get("/assessments/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const assessments = await Assessment.find({ type });

    if (!assessments.length) {
      return res.status(404).send(`No assessments found for type: ${type}`);
    }

    res.render("student/assessments", { type, assessments });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/assessments/:type/pdf", async (req, res) => {
  try {
    const { type } = req.params;
    const assessments = await Assessment.find({ type });

    if (!assessments.length) {
      return res.status(404).send(`No assessments found for type: ${type}`);
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, "../public/reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Define file path
    const filePath = path.join(reportsDir, `${type}-assessments.pdf`);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add Logo & Header
    const logoPath = path.join(__dirname, "../public/images/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 100 });
    }

    // Main Title with Dash-Separated Tagline
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text("Ishanya Foundation", { align: "center" })
      .moveDown(0.3);

    // Tagline with Dash
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#666666")
      .text("— Journey to Inclusion —", { align: "center" })
      .moveDown(0.8);

    // Assessment Type
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor("#007bff")
      .text(`${type.charAt(0).toUpperCase() + type.slice(1)} Assessments`, { align: "center" })
      .moveDown(1);

    // Horizontal Line
    doc
      .strokeColor("#007bff")
      .lineWidth(1.5)
      .moveTo(50, 200)
      .lineTo(550, 200)
      .stroke();

    // Table Configuration
    const tableTop = 230;
    const columnWidths = [40, 200, 80, 100, 120];
    const startX = 50;
    const tableHeaderHeight = 35;
    const rowHeight = 35;

    // Table Header
    doc
      .fillColor("#007bff")
      .rect(startX, tableTop, 500, tableHeaderHeight)
      .fill();

    doc.fillColor("white").font("Helvetica-Bold").fontSize(12);
    const headers = ["#", "Assessment Name", "Score", "Date", "Comments"];
    headers.forEach((header, index) => {
      const x = startX + columnWidths.slice(0, index).reduce((a, b) => a + b, 0);
      doc.text(header, x, tableTop + 10, { 
        width: columnWidths[index], 
        align: index === 0 ? "center" : index === 2 ? "center" : "left" 
      });
    });

    // Table Rows
    doc.fillColor("black").font("Helvetica").fontSize(11);
    assessments.forEach((assessment, index) => {
      const yPosition = tableTop + tableHeaderHeight + (index * rowHeight);
      
      // Alternating row background
      if (index % 2 !== 0) {
        doc.fillColor("#f4f4f4")
           .rect(startX, yPosition, 500, rowHeight)
           .fill();
      }

      doc.fillColor("black");
      const rowData = [
        `${index + 1}`,
        assessment.assessmentName,
        `${assessment.score}/5`,
        new Date(assessment.date).toLocaleDateString(),
        assessment.comments || "N/A"
      ];

      rowData.forEach((data, colIndex) => {
        const x = startX + columnWidths.slice(0, colIndex).reduce((a, b) => a + b, 0);
        doc.text(data, x, yPosition + 10, { 
          width: columnWidths[colIndex], 
          align: colIndex === 0 ? "center" : colIndex === 2 ? "center" : "left" 
        });
      });
    });

    // Footer
    doc
      .strokeColor("#007bff")
      .lineWidth(0.5)
      .moveTo(50, 750)
      .lineTo(550, 750)
      .stroke();

    doc
      .fontSize(10)
      .fillColor("#666")
      .text("© 2025 Ishanya Foundation | Journey to Inclusion", 50, 760, { align: "left" })
      .text("Page 1", 500, 760, { align: "right" });

    doc.end();
    stream.on("finish", () => {
      res.download(filePath);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating PDF");
  }
});

module.exports = router;