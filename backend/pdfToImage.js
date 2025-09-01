const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

async function pdfToImage(pdfBuffer) {
  // Save PDF to temp file
  const tempDir = os.tmpdir();
  const pdfPath = path.join(tempDir, `upload_${Date.now()}.pdf`);
  const outputPath = path.join(tempDir, `upload_${Date.now()}.png`);

  await fs.promises.writeFile(pdfPath, pdfBuffer);

  return new Promise((resolve, reject) => {
    // Use pdftoppm from poppler-utils to convert first page to PNG
    // Command: pdftoppm -png -singlefile input.pdf output
    execFile('pdftoppm', ['-png', '-singlefile', pdfPath, outputPath.replace(/\.png$/, '')], async (error, stdout, stderr) => {
      try {
        if (error) {
          reject(error);
          return;
        }
        // Read the generated PNG file
        const imageBuffer = await fs.promises.readFile(outputPath);
        // Clean up temp files
        await fs.promises.unlink(pdfPath);
        await fs.promises.unlink(outputPath);
        resolve(imageBuffer);
      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = pdfToImage;
