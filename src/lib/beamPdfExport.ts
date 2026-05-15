import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getCompanySettings } from "./orderNumberGenerator";

export const exportBeamReconciliationToPDF = (record: any) => {
  const doc = new jsPDF();
  let yPos = 20;

  // Get company settings for logo
  const companySettings = getCompanySettings();

  // Company Logo and Header
  if (companySettings.logo) {
    try {
      doc.addImage(companySettings.logo, "JPEG", 20, 10, 30, 20);
    } catch (error) {
      console.log("Could not add logo to PDF:", error);
    }
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(companySettings.name || "Textile Company", 60, 20);

  doc.setFontSize(16);
  doc.text("Beam Reconciliation Report", 105, 35, { align: "center" });

  yPos = 50;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Basic Information (Tab 1)
  doc.setFont("helvetica", "bold");
  doc.text("BASIC INFORMATION", 20, yPos);
  yPos += 10;

  doc.setFont("helvetica", "normal");
  const basicData = [
    ["Field", "Value"],
    ["Sl No", record.slNo || ""],
    ["GPT No", record.gptNo || ""],
    ["Job Order No", record.jobOrderNo || ""],
    ["Job Order Date", record.jobOrderDate || ""],
    ["Created Date & Time", record.createdDateTime || ""],
    ["Weaver Name", record.weaverName || ""],
    ["Loom ID", record.loomId || ""],
    ["Status", record.status || ""],
    ["Prepared By", record.preparedBy || ""],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [basicData[0]],
    body: basicData.slice(1),
    theme: "grid",
    styles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: "bold" } },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Construction Details
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTION DETAILS", 20, yPos);
  yPos += 10;

  const construction = record.construction;
  const constructionData = [
    ["Field", "Value"],
    ["Construction", construction?.construction || ""],
    ["GSM", construction?.gsm || ""],
    ["Width (inches)", construction?.width || ""],
    ["Warp Yarn Count", construction?.warpYarnCount || ""],
    ["Weft Yarn Count", construction?.weftYarnCount || ""],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [constructionData[0]],
    body: constructionData.slice(1),
    theme: "grid",
    styles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: "bold" } },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Technical Details (Tab 2)
  doc.setFont("helvetica", "bold");
  doc.text("TECHNICAL DETAILS", 20, yPos);
  yPos += 10;

  const technicalData = [
    ["Parameter", "Value"],
    ["Warp Meters", `${record.warpMtr || 0} m`],
    ["Expected Fabric Meters", `${record.expectedFabricMeters || 0} m`],
    ["Ends", record.ends?.toString() || ""],
    ["Ends per Dent", record.endsPerDent?.toString() || ""],
    ["Reed Space", `${record.reedSpace || 0} cm`],
    ["Weft Weight", `${record.weftWt || 0} gms/mtr`],
    ["Reed Count", record.reedCount?.toString() || ""],
    ["Crimp Percentage", `${record.crimpPercentage || 0}%`],
    ["Required Weft", `${record.reqWeft || 0} kg`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [technicalData[0]],
    body: technicalData.slice(1),
    theme: "grid",
    styles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: "bold" } },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Add new page if needed
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  // Yarn Details (Tab 3)
  doc.setFont("helvetica", "bold");
  doc.text("YARN OUTWARD DETAILS", 20, yPos);
  yPos += 10;

  if (record.yarnOutwardDetails && record.yarnOutwardDetails.length > 0) {
    const outwardHeaders = ["Date", "DC No", "Mill", "LOT", "KGS", "Signature"];
    const outwardData = record.yarnOutwardDetails.map((entry: any) => [
      entry.date,
      entry.dcNo,
      entry.mill,
      entry.lot,
      entry.kgs.toString(),
      entry.signature,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [outwardHeaders],
      body: outwardData,
      theme: "grid",
      styles: { fontSize: 8 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFont("helvetica", "normal");
    doc.text("No yarn outward records", 20, yPos);
    yPos += 15;
  }

  // Quality Details (Tab 4)
  doc.setFont("helvetica", "bold");
  doc.text("QUALITY DETAILS", 20, yPos);
  yPos += 10;

  const qualityData = [
    ["Parameter", "Value"],
    ["Weft Count", record.weftQuality?.count || ""],
    ["Mill", record.weftQuality?.mill || ""],
    ["Weight (Kgs)", record.weftQuality?.kgs?.toString() || ""],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [qualityData[0]],
    body: qualityData.slice(1),
    theme: "grid",
    styles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: "bold" } },
  });

  // Save PDF
  doc.save(
    `beam-reconciliation-${record.gptNo}-${new Date().toISOString().split("T")[0]}.pdf`,
  );
};
