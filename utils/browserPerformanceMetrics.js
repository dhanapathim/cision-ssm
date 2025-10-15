import fs from 'fs';
import path from 'path';

const browserData = [];
async function getBrowserMetrics(page, action, task, scenario, step) {
    console.log(`\n--- Browser Metrics---`);
    const perfTimings = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0]


        return {
            ttfb: perf.responseStart - perf.requestStart, // Time to First Byte
            ttlb: perf.responseEnd - perf.requestStart,   // Time to Last Byte
            domInteractive: perf.domInteractive ,
            pageLoad: perf.loadEventEnd ,
            firstResponse: perf.responseStart ,
            backendTime: perf.responseStart - perf.requestStart,
            domContentLoaded: perf.domContentLoadedEventEnd,
            networkLatency: perf.connectEnd - perf.connectStart,
            onLoad: perf.loadEventEnd - perf.loadEventStart,
            dnsLookup: perf.domainLookupEnd - perf.domainLookupStart,
            connectionTime: perf.connectEnd - perf.connectStart,
            transferSize: perf.transferSize,                     // Total bytes transferred including headers
            encodedBodySize: perf.encodedBodySize,               // Compressed body
            decodedBodySize: perf.decodedBodySize
        };
    });
    browserData.push({
        task,
        scenario,
        step,
        action,
        browserMetrics: perfTimings,
    });
}
export function writeBrowserMetricsToFile(fileName = 'browserMetrics', filePath) {
    if (browserData.length > 0) {
        fileName = fileName + ".json"
        const METRICS_FILE = path.join(filePath, "browser", fileName);
        const dir = path.dirname(METRICS_FILE);
        // ✅ 1. Ensure directory exists (recursive = create nested folders if missing)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        console.log(browserData.length + ' total steps recorded for browserMetrics.');
        fs.writeFileSync(METRICS_FILE, JSON.stringify(browserData, null, 2), 'utf-8');
        console.log(`✅ A11y metrics written to ${METRICS_FILE}`);
    }
}
export { getBrowserMetrics };