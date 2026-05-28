import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFExportOptions {
  elementId: string
  filename: string
  title?: string
}

export async function exportToPDF({ elementId, filename, title }: PDFExportOptions) {
  const element = document.getElementById(elementId)
  if (!element) throw new Error(`Element #${elementId} not found`)

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#0f172a',
    logging: false,
    windowWidth: 1200,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageWidth = 210
  const pageHeight = 297
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  // Add header
  pdf.setFillColor(15, 23, 42)
  pdf.rect(0, 0, pageWidth, 12, 'F')
  pdf.setTextColor(99, 102, 241)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.text('WORKPULSE', 8, 7)
  if (title) {
    pdf.setTextColor(148, 163, 184)
    pdf.setFont('helvetica', 'normal')
    pdf.text(title, pageWidth / 2, 7, { align: 'center' })
  }
  pdf.setTextColor(100, 116, 139)
  pdf.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 8, 7, { align: 'right' })

  // Add content — handle multi-page
  let yPos = 14
  const remainingHeight = pageHeight - yPos - 10

  if (imgHeight <= remainingHeight) {
    pdf.addImage(imgData, 'PNG', 0, yPos, imgWidth, imgHeight)
  } else {
    let sourceY = 0
    let isFirstPage = true

    while (sourceY < canvas.height) {
      const availablePageHeight = isFirstPage ? remainingHeight : pageHeight - 4
      const sourceHeight = Math.min((availablePageHeight * canvas.width) / imgWidth, canvas.height - sourceY)

      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = sourceHeight
      const ctx = pageCanvas.getContext('2d')!
      ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight)

      const pageImgData = pageCanvas.toDataURL('image/png')
      const pageImgHeight = (sourceHeight * imgWidth) / canvas.width

      if (!isFirstPage) { pdf.addPage(); yPos = 4 }
      pdf.addImage(pageImgData, 'PNG', 0, yPos, imgWidth, pageImgHeight)

      sourceY += sourceHeight
      isFirstPage = false
    }
  }

  // Footer on last page
  pdf.setFillColor(15, 23, 42)
  pdf.rect(0, pageHeight - 8, pageWidth, 8, 'F')
  pdf.setTextColor(71, 85, 105)
  pdf.setFontSize(7)
  pdf.text('Confidential — WorkPulse Performance Report', pageWidth / 2, pageHeight - 3, { align: 'center' })

  pdf.save(`${filename}.pdf`)
}