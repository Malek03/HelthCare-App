const fs = require('fs');
const path = require('path');

const pwaHeadTags = `
    <!-- PWA Setup -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#1a237e">
    <link rel="apple-touch-icon" href="/icons/icon.svg">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
`;

const pwaScriptTag = `
    <!-- Register Service Worker -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').then(reg => {
            console.log('Service Worker registered!', reg);
          }).catch(err => {
            console.log('Service Worker registration failed: ', err);
          });
        });
      }
    </script>
`;

function processHtmlFiles(dir) {
    fs.readdir(dir, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            const filePath = path.join(dir, file);
            fs.stat(filePath, (err, stat) => {
                if (err) throw err;
                if (stat.isFile() && file.endsWith('.html')) {
                    fs.readFile(filePath, 'utf8', (err, data) => {
                        if (err) throw err;
                        
                        let modified = false;
                        let newContent = data;

                        // Add manifest tags if not present
                        if (!newContent.includes('manifest.json')) {
                            newContent = newContent.replace('</head>', pwaHeadTags + '\n</head>');
                            modified = true;
                        }

                        // Add SW script if not present
                        if (!newContent.includes('serviceWorker.register')) {
                            newContent = newContent.replace('</body>', pwaScriptTag + '\n</body>');
                            modified = true;
                        }

                        if (modified) {
                            fs.writeFile(filePath, newContent, 'utf8', (err) => {
                                if (err) throw err;
                                console.log('Updated ' + file + ' for PWA');
                            });
                        }
                    });
                }
            });
        }
    });
}

processHtmlFiles(path.join(__dirname, 'frontend'));
