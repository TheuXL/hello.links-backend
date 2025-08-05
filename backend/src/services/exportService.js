const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

/**
 * Exports click data to CSV format
 * @param {Array} clicks - Array of click objects
 * @returns {String} - CSV formatted string
 */
const exportClicksToCsv = (clicks) => {
    try {
        // Define fields to include in the CSV
        const fields = [
            {
                label: 'Timestamp',
                value: 'timestamp'
            },
            {
                label: 'IP Address',
                value: 'ip'
            },
            {
                label: 'Country',
                value: row => (row.geo && row.geo.country) ? row.geo.country : 'Unknown'
            },
            {
                label: 'City',
                value: row => (row.geo && row.geo.city) ? row.geo.city : 'Unknown'
            },
            {
                label: 'Device Type',
                value: row => (row.device && row.device.type) ? row.device.type : 'Unknown'
            },
            {
                label: 'Browser',
                value: row => (row.device && row.device.browser) ? row.device.browser : 'Unknown'
            },
            {
                label: 'OS',
                value: row => (row.device && row.device.os) ? row.device.os : 'Unknown'
            },
            {
                label: 'Referer',
                value: 'referer'
            },
            {
                label: 'Traffic Source',
                value: 'refererCategory'
            },
            {
                label: 'UTM Source',
                value: row => (row.utm && row.utm.source) ? row.utm.source : ''
            },
            {
                label: 'UTM Medium',
                value: row => (row.utm && row.utm.medium) ? row.utm.medium : ''
            },
            {
                label: 'UTM Campaign',
                value: row => (row.utm && row.utm.campaign) ? row.utm.campaign : ''
            },
            {
                label: 'Language',
                value: 'language'
            },
            {
                label: 'Is Bot',
                value: row => row.isBot ? 'Yes' : 'No'
            },
            {
                label: 'First Visit',
                value: row => row.isFirstVisit ? 'Yes' : 'No'
            }
        ];

        // Create the parser
        const parser = new Parser({ fields });
        
        // Convert to CSV
        return parser.parse(clicks);
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        throw new Error('Failed to generate CSV export');
    }
};

/**
 * Formats a date object for use in filenames
 * @param {Date} date - Date object
 * @returns {String} - Formatted date string (YYYY-MM-DD_HH-MM-SS)
 */
const formatDateForFilename = (date = new Date()) => {
    return date.toISOString()
        .replace(/T/, '_')
        .replace(/\..+/, '')
        .replace(/:/g, '-');
};

/**
 * Exports click data to a PDF buffer.
 * @param {Array} clicks - Array of click objects.
 * @param {Object} linkInfo - Object containing link details like alias and originalUrl.
 * @returns {Promise<Buffer>} - A promise that resolves with the PDF buffer.
 */
const exportClicksToPdf = (clicks, linkInfo) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                resolve(Buffer.concat(buffers));
            });
            doc.on('error', reject);

            // --- PDF Content ---

            // Header
            doc.fontSize(20).text('Click Report', { align: 'center' });
            doc.fontSize(12).text(`Link: /${linkInfo.alias}`, { align: 'center' });
            doc.fontSize(10).text(`Destination: ${linkInfo.originalUrl}`, { align: 'center' });
            doc.moveDown(2);

            // Summary
            doc.fontSize(14).text('Summary', { underline: true });
            doc.fontSize(10).text(`Total Clicks: ${clicks.length}`);
            doc.moveDown();

            // Clicks Table Header
            doc.fontSize(12).text('Detailed Clicks:', { underline: true });
            doc.moveDown();
            
            const tableTop = doc.y;
            const itemX = 50;
            const dateX = 150;
            const geoX = 250;
            const deviceX = 400;

            doc.fontSize(10)
               .text('Timestamp', itemX, tableTop, { bold: true })
               .text('IP / Geo', dateX, tableTop, { bold: true })
               .text('Device / Browser', geoX, tableTop, { bold: true })
               .text('Bot?', deviceX, tableTop, { bold: true });
            doc.moveTo(itemX - 10, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            // Clicks Table Rows
            clicks.forEach(click => {
                const y = doc.y;
                doc.fontSize(8)
                   .text(new Date(click.timestamp).toLocaleString(), itemX, y)
                   .text(`${click.ip || 'N/A'} - ${click.geo?.country || 'N/A'}`, dateX, y)
                   .text(`${click.device?.type || 'N/A'} / ${click.device?.browser || 'N/A'}`, geoX, y)
                   .text(click.isBot ? 'Yes' : 'No', deviceX, y);
                doc.moveDown(1.5);
            });
            
            // --- End PDF Content ---

            doc.end();
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            reject(new Error('Failed to generate PDF export'));
        }
    });
};

module.exports = {
    exportClicksToCsv,
    formatDateForFilename,
    exportClicksToPdf
}; 