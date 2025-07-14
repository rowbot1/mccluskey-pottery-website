// Script to generate PDF from the pottery care guide HTML
// Can be run with Node.js using Puppeteer or similar tools

const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
    // Launch browser
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        // Create new page
        const page = await browser.newPage();
        
        // Load the HTML file
        const htmlPath = `file://${path.join(__dirname, 'pottery-care-guide.html')}`;
        await page.goto(htmlPath, {
            waitUntil: 'networkidle0'
        });

        // Generate PDF with print-friendly settings
        await page.pdf({
            path: 'McCluskey-Pottery-Care-Guide.pdf',
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: false,
            margin: {
                top: '0',
                right: '0',
                bottom: '0',
                left: '0'
            },
            preferCSSPageSize: true
        });

        console.log('PDF generated successfully: McCluskey-Pottery-Care-Guide.pdf');
        
        // Also generate a low-res version for web download
        await page.pdf({
            path: 'McCluskey-Pottery-Care-Guide-Web.pdf',
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: false,
            margin: {
                top: '0',
                right: '0',
                bottom: '0',
                left: '0'
            },
            preferCSSPageSize: true,
            scale: 0.8
        });

        console.log('Web version PDF generated successfully: McCluskey-Pottery-Care-Guide-Web.pdf');

    } catch (error) {
        console.error('Error generating PDF:', error);
    } finally {
        await browser.close();
    }
}

// Alternative method using jsPDF (for client-side generation)
function generatePDFClientSide() {
    const script = `
    <!-- Add to pottery-care-guide.html for client-side PDF generation -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
    <script>
    function downloadPDF() {
        const element = document.body;
        const opt = {
            margin: 0,
            filename: 'McCluskey-Pottery-Care-Guide.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Use html2pdf library
        html2pdf().set(opt).from(element).save();
    }
    </script>
    
    <!-- Add download button -->
    <button onclick="downloadPDF()" style="position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #2A5434; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Download PDF
    </button>
    `;
    
    return script;
}

// Run the PDF generation
if (require.main === module) {
    generatePDF();
}

module.exports = { generatePDF };