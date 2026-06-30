import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { InventoryItem } from "../types";

// Helper to normalize Polish characters for standard PDF fonts (e.g., Helvetica)
// to prevent "unknown character" boxes (squares) while keeping it readable.
function sanitizeText(text: string | undefined): string {
  if (!text) return "";
  const polishMap: { [key: string]: string } = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
  };
  return text.split('').map(char => polishMap[char] || char).join('');
}

export function generateInventoryPDF(items: InventoryItem[], title: string = "Raport Inwentaryzacji Sprzetu Komputerowego") {
  // Initialize jsPDF (A4, portrait, mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString("pl-PL") + " " + now.toLocaleTimeString("pl-PL");

  // 1. PDF Title & Styling
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(sanitizeText("RAPORT INWENTARYZACYJNY IT"), 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(200, 220, 255);
  doc.text(sanitizeText(`Wygenerowano: ${dateStr}`), 14, 25);
  doc.text(sanitizeText(`Liczba urzadzen: ${items.length}`), 14, 31);

  // Decorative blue line below banner
  doc.setFillColor(59, 130, 246); // Blue-500
  doc.rect(0, 40, 210, 2, "F");

  // 2. Stats Section
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(sanitizeText("Podsumowanie zbiorcze"), 14, 53);

  const categories = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const statuses = items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const replacementsCount = items.filter(i => i.replacesItemId).length;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  let statsY = 60;
  doc.text(sanitizeText(`• Razem sprzetu: ${items.length} szt.`), 18, statsY);
  doc.text(sanitizeText(`• Laptopy: ${categories["Laptop"] || 0} szt.`), 18, statsY + 6);
  doc.text(sanitizeText(`• Komputery stacjonarne: ${categories["Komputer Stacjonarny"] || 0} szt.`), 18, statsY + 12);
  doc.text(sanitizeText(`• Monitory: ${categories["Monitor"] || 0} szt.`), 18, statsY + 18);

  doc.text(sanitizeText(`• W uzyciu: ${statuses["W użyciu"] || 0} szt.`), 110, statsY);
  doc.text(sanitizeText(`• W magazynie: ${statuses["W magazynie"] || 0} szt.`), 110, statsY + 6);
  doc.text(sanitizeText(`• Wycofane / Wymienione: ${(statuses["Wycofany"] || 0) + (statuses["Wymieniony"] || 0)} szt.`), 110, statsY + 12);
  doc.text(sanitizeText(`• Aktywne powiazania wymiany: ${replacementsCount} szt.`), 110, statsY + 18);

  // 3. Main Hardware Table
  const tableY = 90;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(sanitizeText("Wykaz urzadzen komputerowych"), 14, tableY - 4);

  // Prepare data for table
  const tableRows = items.map((item, index) => {
    // Check if replaces another item
    let replacementText = "-";
    if (item.replacesItemId) {
      const oldItem = items.find(i => i.id === item.replacesItemId);
      if (oldItem) {
        replacementText = `Zastepuje: ${oldItem.manufacturer} ${oldItem.model} (S/N: ${oldItem.serialNumber})`;
      } else {
        replacementText = "Zastepuje inne urzadzenie";
      }
    } else if (item.replacedByItemId) {
      const newItem = items.find(i => i.id === item.replacedByItemId);
      if (newItem) {
        replacementText = `Wymieniony na: ${newItem.manufacturer} ${newItem.model} (S/N: ${newItem.serialNumber})`;
      } else {
        replacementText = "Wymieniony na nowszy";
      }
    }

    return [
      (index + 1).toString(),
      sanitizeText(`${item.manufacturer} ${item.model}`),
      sanitizeText(item.serialNumber || "Brak S/N"),
      sanitizeText(item.category),
      sanitizeText(item.room || "-"),
      sanitizeText(item.processor || "-"),
      sanitizeText(`${item.ram || "-"}/${item.storage || "-"}`),
      sanitizeText(item.status),
      sanitizeText(replacementText)
    ];
  });

  autoTable(doc, {
    startY: tableY,
    head: [[
      sanitizeText("Lp."),
      sanitizeText("Sprzet (Producent & Model)"),
      sanitizeText("Numer Seryjny (S/N)"),
      sanitizeText("Kategoria"),
      sanitizeText("Sala / Lok."),
      sanitizeText("Procesor"),
      sanitizeText("RAM/Dysk"),
      sanitizeText("Status"),
      sanitizeText("Relacja wymiany")
    ]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      font: "helvetica",
      fontStyle: "bold",
      fontSize: 8,
      halign: "left"
    },
    bodyStyles: {
      font: "helvetica",
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 7 },
      1: { cellWidth: 32 },
      2: { cellWidth: 20 },
      3: { cellWidth: 17 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18 },
      6: { cellWidth: 14 },
      7: { cellWidth: 18 },
      8: { cellWidth: 38 }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer with page numbers
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        sanitizeText(`Strona ${data.pageNumber}`),
        196,
        287,
        { align: "right" }
      );
      doc.text(
        sanitizeText("System Inwentaryzacji Sprzetu Komputerowego z OCR i PDF"),
        14,
        287
      );
    }
  });

  // 4. Replacements Detailed Section
  const activeReplacements = items.filter(i => i.replacesItemId);
  if (activeReplacements.length > 0) {
    // Check if we need a new page or can draw on the same page
    let finalY = (doc as any).lastAutoTable.finalY || 150;
    if (finalY > 210) {
      doc.addPage();
      finalY = 20;
    } else {
      finalY += 15;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(sanitizeText("Szczegoly wymiany sprzetu komputerowego"), 14, finalY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    let offset = 8;
    activeReplacements.forEach((item, index) => {
      const oldItem = items.find(i => i.id === item.replacesItemId);
      if (oldItem) {
        if (finalY + offset > 275) {
          doc.addPage();
          finalY = 15;
          offset = 0;
        }

        doc.setFont("helvetica", "bold");
        doc.text(
          sanitizeText(`[Wymiana #${index + 1}]`), 
          14, 
          finalY + offset
        );
        doc.setFont("helvetica", "normal");
        
        let line = `Zastapiono stary sprzet: ${oldItem.manufacturer} ${oldItem.model} (S/N: ${oldItem.serialNumber}) nowym urzadzeniem: ${item.manufacturer} ${item.model} (S/N: ${item.serialNumber}). Status starego urzadzenia zmieniono na 'Wycofany', a nowego na 'W uzyciu'.`;
        if (item.room) {
          line += ` Wymiana dotyczy sali/lokalizacji: ${item.room}.`;
        }
        
        // Wrap text to fit page width
        const splitLine = doc.splitTextToSize(sanitizeText(line), 180);
        doc.text(splitLine, 14, finalY + offset + 5);
        
        offset += 6 + (splitLine.length * 4.5);
      }
    });
  }

  // Save PDF
  const filename = `raport_inwentaryzacji_${now.toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
