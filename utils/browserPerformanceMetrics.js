import fs from 'fs';
import path from 'path';

const browserData = [];
let lastNavigation = 0;

async function getBrowserMetrics(page, action, task, scenario, step) {
    console.log(`\n--- Browser Metrics---`);
    const perfTimings = await page.evaluate((prevNavStart) => {
        const perf = performance.getEntriesByType('navigation')[0];
        const presentNavigation = performance.timeOrigin;
        if (prevNavStart === presentNavigation) { return { metrics: {}, presentNavigation }; }

        const metrics = {
            startTime: performance.timeOrigin,
            ttfb: perf.responseStart - perf.requestStart, // Time to First Byte
            ttlb: perf.responseEnd - perf.requestStart,   // Time to Last Byte
            domInteractive: perf.domInteractive,
            pageLoad: perf.loadEventEnd,
            firstResponse: perf.responseStart,
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
        return { metrics, presentNavigation };
    }, lastNavigation);
    lastNavigation = perfTimings.presentNavigation;
    if (Object.keys(perfTimings.metrics).length > 0) {
        browserData.push({
            task,
            scenario,
            step,
            action,
            browserMetrics: perfTimings.metrics,
        });
    }

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