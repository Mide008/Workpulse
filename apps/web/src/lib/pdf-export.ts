import jsPDF from 'jspdf'
import { toPng } from 'html-to-image'

export interface PDFExportOptions {
  elementId: string
  filename: string
  title?: string
}

export async function exportToPDF({ elementId, filename, title }: PDFExportOptions) {
  const element = document.getElementById(elementId)
  if (!element) throw new Error(`Element #${elementId} not found`)

  const imgData = await toPng(element, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: '#0f172a',
    filter: (node) => {
      // Skip elements that cause color parsing issues
      const exclusions = ['SCRIPT', 'STYLE']
      return !exclusions.includes(node.nodeName)
    },
  })

  const img = new Image()
  img.src = imgData
  await new Promise(resolve => { img.onload = resolve })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = 210
  const pageHeight = 297
  const imgWidth = pageWidth
  const imgHeight = (img.height * imgWidth) / img.width

  // Header bar
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
  pdf.text(
    `Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    pageWidth - 8, 7, { align: 'right' }
  )

  const startY = 14
  const availableHeight = pageHeight - startY - 10

  if (imgHeight <= availableHeight) {
    pdf.addImage(imgData, 'PNG', 0, startY, imgWidth, imgHeight)
  } else {
    // Multi-page: slice the image
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)

    let sliceY = 0
    let isFirst = true

    while (sliceY < img.height) {
      const pageAvailPx = isFirst
        ? Math.round((availableHeight * img.width) / imgWidth)
        : Math.round(((pageHeight - 8) * img.width) / imgWidth)

      const sliceH = Math.min(pageAvailPx, img.height - sliceY)
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = img.width
      sliceCanvas.height = sliceH
      const sCtx = sliceCanvas.getContext('2d')!
      sCtx.drawImage(canvas, 0, sliceY, img.width, sliceH, 0, 0, img.width, sliceH)

      const sliceData = sliceCanvas.toDataURL('image/png')
      const sliceHeightMm = (sliceH * imgWidth) / img.width

      if (!isFirst) pdf.addPage()
      pdf.addImage(sliceData, 'PNG', 0, isFirst ? startY : 4, imgWidth, sliceHeightMm)

      sliceY += sliceH
      isFirst = false
    }
  }

  // Footer
  pdf.setFillColor(15, 23, 42)
  pdf.rect(0, pageHeight - 8, pageWidth, 8, 'F')
  pdf.setTextColor(71, 85, 105)
  pdf.setFontSize(7)
  pdf.text('Confidential — WorkPulse Performance Report', pageWidth / 2, pageHeight - 3, { align: 'center' })

  pdf.save(`${filename}.pdf`)
}