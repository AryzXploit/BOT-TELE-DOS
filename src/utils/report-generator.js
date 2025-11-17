import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';
import { Tools } from './tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Advanced Report Generator
 * Generate detailed attack reports with analytics and recommendations
 */
export class ReportGenerator {
    constructor(attackData) {
        this.attackData = attackData;
        this.reportDir = join(process.cwd(), 'reports');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Ensure reports directory exists
        if (!existsSync(this.reportDir)) {
            mkdirSync(this.reportDir, { recursive: true });
        }
    }

    /**
     * Generate complete report (HTML + JSON)
     */
    async generateReport() {
        try {
            logger.info('📊 Generating attack report...');

            // Analyze attack data
            const analysis = this.analyzeAttack();
            
            // Generate recommendations
            const recommendations = this.generateRecommendations(analysis);
            
            // Create report data
            const reportData = {
                metadata: this.getMetadata(),
                summary: this.getSummary(),
                analysis: analysis,
                recommendations: recommendations,
                rawData: this.attackData
            };

            // Generate HTML report
            const htmlPath = await this.generateHTML(reportData);
            
            // Generate JSON report
            const jsonPath = this.generateJSON(reportData);
            
            logger.success(`✅ Report generated successfully!`);
            logger.info(`📄 HTML Report: ${htmlPath}`);
            logger.info(`📄 JSON Report: ${jsonPath}`);
            
            return {
                html: htmlPath,
                json: jsonPath,
                data: reportData
            };
        } catch (err) {
            logger.error(`Failed to generate report: ${err.message}`);
            throw err;
        }
    }

    /**
     * Get report metadata
     */
    getMetadata() {
        return {
            reportId: `REPORT-${this.timestamp}`,
            generatedAt: new Date().toISOString(),
            generatedBy: 'Aryzz-Stresser v4.0',
            reportVersion: '1.0'
        };
    }

    /**
     * Get attack summary
     */
    getSummary() {
        const data = this.attackData;
        const duration = data.duration || 0;
        const elapsed = data.elapsed || duration;
        
        return {
            target: data.target || 'Unknown',
            method: data.method || data.methods?.join(', ') || 'Unknown',
            attackType: data.methods ? 'Combo Attack' : 'Single Attack',
            threads: data.threads || 0,
            duration: duration,
            elapsed: elapsed,
            rpc: data.rpc || 1,
            requestsSent: data.requestsSent || 0,
            bytesSent: data.bytesSent || 0,
            proxiesUsed: data.proxiesUsed || 0,
            startTime: data.startTime || new Date().toISOString(),
            endTime: data.endTime || new Date().toISOString()
        };
    }

    /**
     * Analyze attack performance
     */
    analyzeAttack() {
        const summary = this.getSummary();
        const requestsPerSecond = summary.elapsed > 0 
            ? Math.floor(summary.requestsSent / summary.elapsed)
            : 0;
        const bytesPerSecond = summary.elapsed > 0
            ? Math.floor(summary.bytesSent / summary.elapsed)
            : 0;
        const avgRequestsPerThread = summary.threads > 0
            ? Math.floor(summary.requestsSent / summary.threads)
            : 0;

        // Calculate efficiency score (0-100)
        const expectedRPS = summary.threads * summary.rpc * 50; // Rough estimate
        const efficiency = expectedRPS > 0
            ? Math.min(100, Math.floor((requestsPerSecond / expectedRPS) * 100))
            : 0;

        // Determine success level
        let successLevel = 'Unknown';
        let successScore = 0;
        
        if (requestsPerSecond > 100000) {
            successLevel = 'Excellent';
            successScore = 95;
        } else if (requestsPerSecond > 50000) {
            successLevel = 'Very Good';
            successScore = 85;
        } else if (requestsPerSecond > 10000) {
            successLevel = 'Good';
            successScore = 70;
        } else if (requestsPerSecond > 5000) {
            successLevel = 'Fair';
            successScore = 50;
        } else {
            successLevel = 'Poor';
            successScore = 30;
        }

        return {
            performance: {
                requestsPerSecond: requestsPerSecond,
                bytesPerSecond: bytesPerSecond,
                avgRequestsPerThread: avgRequestsPerThread,
                efficiency: efficiency,
                successLevel: successLevel,
                successScore: successScore
            },
            metrics: {
                totalRequests: summary.requestsSent,
                totalData: summary.bytesSent,
                totalDataFormatted: Tools.humanBytes(summary.bytesSent),
                avgLatency: this.calculateAvgLatency(),
                errorRate: this.calculateErrorRate(),
                throughput: requestsPerSecond
            },
            comparison: {
                vsExpected: this.compareVsExpected(requestsPerSecond, expectedRPS),
                vsOptimal: this.compareVsOptimal(summary)
            }
        };
    }

    /**
     * Calculate average latency (estimated)
     */
    calculateAvgLatency() {
        // Simplified estimation
        const summary = this.getSummary();
        if (summary.requestsSent === 0) return 0;
        
        const totalTime = summary.elapsed * 1000; // Convert to ms
        const avgLatency = totalTime / summary.requestsSent;
        return Math.floor(avgLatency);
    }

    /**
     * Calculate error rate (estimated)
     */
    calculateErrorRate() {
        // Simplified - in real scenario, track actual errors
        const summary = this.getSummary();
        const expectedRequests = summary.threads * summary.rpc * summary.elapsed;
        const actualRequests = summary.requestsSent;
        
        if (expectedRequests === 0) return 0;
        
        const errorRate = ((expectedRequests - actualRequests) / expectedRequests) * 100;
        return Math.max(0, Math.min(100, errorRate));
    }

    /**
     * Compare vs expected performance
     */
    compareVsExpected(actual, expected) {
        if (expected === 0) return { percentage: 0, status: 'Unknown' };
        
        const percentage = Math.floor((actual / expected) * 100);
        let status = 'Poor';
        
        if (percentage >= 90) status = 'Excellent';
        else if (percentage >= 70) status = 'Good';
        else if (percentage >= 50) status = 'Fair';
        
        return {
            actual: actual,
            expected: expected,
            percentage: percentage,
            status: status
        };
    }

    /**
     * Compare vs optimal configuration
     */
    compareVsOptimal(summary) {
        const improvements = [];
        
        // Check threads
        if (summary.threads < 500) {
            improvements.push({
                area: 'Threads',
                current: summary.threads,
                optimal: 500,
                impact: 'High',
                suggestion: 'Increase threads to 500+ for better performance'
            });
        }
        
        // Check RPC
        if (summary.rpc < 10) {
            improvements.push({
                area: 'RPC',
                current: summary.rpc,
                optimal: 10,
                impact: 'Medium',
                suggestion: 'Increase RPC to 10-20 for higher throughput'
            });
        }
        
        // Check proxies
        if (summary.proxiesUsed === 0) {
            improvements.push({
                area: 'Proxies',
                current: 0,
                optimal: 1000,
                impact: 'High',
                suggestion: 'Use proxies to avoid rate limiting and blocking'
            });
        }
        
        // Check attack type
        if (summary.attackType === 'Single Attack') {
            improvements.push({
                area: 'Attack Type',
                current: 'Single',
                optimal: 'Combo',
                impact: 'Very High',
                suggestion: 'Use combo attack with multiple methods for maximum impact'
            });
        }
        
        return improvements;
    }

    /**
     * Generate recommendations based on analysis
     */
    generateRecommendations(analysis) {
        const recommendations = [];
        const performance = analysis.performance;
        const improvements = analysis.comparison.vsOptimal;

        // Performance-based recommendations
        if (performance.successScore < 70) {
            recommendations.push({
                priority: 'High',
                category: 'Performance',
                title: 'Low Attack Performance Detected',
                description: `Current success score is ${performance.successScore}/100. Attack performance needs improvement.`,
                actions: [
                    'Increase thread count to 500-1000',
                    'Use combo attack with multiple methods',
                    'Add proxies to avoid rate limiting',
                    'Increase RPC to 10-20'
                ]
            });
        }

        // Add improvement-based recommendations
        improvements.forEach(improvement => {
            recommendations.push({
                priority: improvement.impact,
                category: improvement.area,
                title: `Optimize ${improvement.area}`,
                description: improvement.suggestion,
                actions: [
                    `Current: ${improvement.current}`,
                    `Recommended: ${improvement.optimal}`,
                    `Expected impact: ${improvement.impact}`
                ]
            });
        });

        // Method-specific recommendations
        const summary = this.getSummary();
        if (summary.method && summary.method.includes('GET')) {
            recommendations.push({
                priority: 'Medium',
                category: 'Method',
                title: 'Consider Using Advanced Methods',
                description: 'GET method is basic. Consider using HTTP2, STRESS, or bypass methods for better results.',
                actions: [
                    'Try HTTP2 for better performance',
                    'Use STRESS for large payload attacks',
                    'Use CFB for Cloudflare targets'
                ]
            });
        }

        // Duration recommendations
        if (summary.duration < 180) {
            recommendations.push({
                priority: 'Low',
                category: 'Duration',
                title: 'Increase Attack Duration',
                description: 'Short attacks may not have maximum impact. Consider longer duration.',
                actions: [
                    'Current duration: ' + summary.duration + 's',
                    'Recommended: 180-300s for better results',
                    'Longer attacks have cumulative effect'
                ]
            });
        }

        // Best practices
        recommendations.push({
            priority: 'Info',
            category: 'Best Practices',
            title: 'General Recommendations',
            description: 'Follow these best practices for maximum effectiveness.',
            actions: [
                'Always use proxies to avoid IP blocking',
                'Use combo attack for maximum impact',
                'Monitor target response and adjust accordingly',
                'Use appropriate method for target type',
                'Combine Layer 4 and Layer 7 for hybrid attacks'
            ]
        });

        return recommendations;
    }

    /**
     * Generate HTML report
     */
    async generateHTML(reportData) {
        const htmlContent = this.createHTMLTemplate(reportData);
        const filename = `attack-report-${this.timestamp}.html`;
        const filepath = join(this.reportDir, filename);
        
        writeFileSync(filepath, htmlContent, 'utf-8');
        
        return filepath;
    }

    /**
     * Create HTML template
     */
    createHTMLTemplate(data) {
        const summary = data.summary;
        const analysis = data.analysis;
        const recommendations = data.recommendations;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attack Report - ${data.metadata.reportId}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 1.8em;
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .stat-label {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .success-score {
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        
        .success-score h3 {
            font-size: 1.5em;
            margin-bottom: 15px;
        }
        
        .score-circle {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: white;
            color: #667eea;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3em;
            font-weight: bold;
            margin: 0 auto 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .recommendation-card {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin-bottom: 15px;
            border-radius: 5px;
        }
        
        .recommendation-card.high {
            border-left-color: #dc3545;
        }
        
        .recommendation-card.medium {
            border-left-color: #ffc107;
        }
        
        .recommendation-card.low {
            border-left-color: #28a745;
        }
        
        .recommendation-card h4 {
            color: #333;
            margin-bottom: 10px;
        }
        
        .recommendation-card p {
            color: #666;
            margin-bottom: 10px;
        }
        
        .recommendation-card ul {
            list-style: none;
            padding-left: 0;
        }
        
        .recommendation-card li {
            padding: 5px 0;
            color: #555;
        }
        
        .recommendation-card li:before {
            content: "→ ";
            color: #667eea;
            font-weight: bold;
        }
        
        .priority-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 0.8em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .priority-high {
            background: #dc3545;
            color: white;
        }
        
        .priority-medium {
            background: #ffc107;
            color: #333;
        }
        
        .priority-low {
            background: #28a745;
            color: white;
        }
        
        .priority-info {
            background: #17a2b8;
            color: white;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #dee2e6;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        
        th {
            background: #667eea;
            color: white;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 Attack Report</h1>
            <p>${data.metadata.reportId}</p>
            <p>Generated: ${new Date(data.metadata.generatedAt).toLocaleString()}</p>
        </div>
        
        <div class="content">
            <!-- Summary Section -->
            <div class="section">
                <h2 class="section-title">📊 Attack Summary</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Target</div>
                        <div class="stat-value" style="font-size: 1.2em;">${summary.target}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Method</div>
                        <div class="stat-value" style="font-size: 1.2em;">${summary.method}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Attack Type</div>
                        <div class="stat-value" style="font-size: 1.2em;">${summary.attackType}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Threads</div>
                        <div class="stat-value">${summary.threads}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Duration</div>
                        <div class="stat-value">${summary.duration}s</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">RPC</div>
                        <div class="stat-value">${summary.rpc}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Requests Sent</div>
                        <div class="stat-value">${Tools.humanFormat(summary.requestsSent)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Data Sent</div>
                        <div class="stat-value" style="font-size: 1.5em;">${Tools.humanBytes(summary.bytesSent)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Proxies Used</div>
                        <div class="stat-value">${summary.proxiesUsed}</div>
                    </div>
                </div>
            </div>
            
            <!-- Performance Analysis -->
            <div class="section">
                <h2 class="section-title">⚡ Performance Analysis</h2>
                
                <div class="success-score">
                    <h3>Success Score</h3>
                    <div class="score-circle">${analysis.performance.successScore}</div>
                    <h4>${analysis.performance.successLevel}</h4>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Requests/Second</div>
                        <div class="stat-value">${Tools.humanFormat(analysis.performance.requestsPerSecond)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Bytes/Second</div>
                        <div class="stat-value">${Tools.humanBytes(analysis.performance.bytesPerSecond)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Efficiency</div>
                        <div class="stat-value">${analysis.performance.efficiency}%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Avg Requests/Thread</div>
                        <div class="stat-value">${Tools.humanFormat(analysis.performance.avgRequestsPerThread)}</div>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Total Requests</td>
                            <td>${Tools.humanFormat(analysis.metrics.totalRequests)}</td>
                        </tr>
                        <tr>
                            <td>Total Data</td>
                            <td>${analysis.metrics.totalDataFormatted}</td>
                        </tr>
                        <tr>
                            <td>Throughput</td>
                            <td>${Tools.humanFormat(analysis.metrics.throughput)} req/s</td>
                        </tr>
                        <tr>
                            <td>Avg Latency</td>
                            <td>${analysis.metrics.avgLatency} ms</td>
                        </tr>
                        <tr>
                            <td>Error Rate</td>
                            <td>${analysis.metrics.errorRate.toFixed(2)}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Recommendations -->
            <div class="section">
                <h2 class="section-title">💡 Recommendations</h2>
                ${recommendations.map(rec => `
                    <div class="recommendation-card ${rec.priority.toLowerCase()}">
                        <span class="priority-badge priority-${rec.priority.toLowerCase()}">${rec.priority}</span>
                        <h4>${rec.title}</h4>
                        <p>${rec.description}</p>
                        <ul>
                            ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="footer">
            <p>Generated by <strong>Aryzz-Stresser v4.0</strong></p>
            <p>Developed by Aryzz-Dev (@AryzXploit)</p>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Generate JSON report
     */
    generateJSON(reportData) {
        const filename = `attack-report-${this.timestamp}.json`;
        const filepath = join(this.reportDir, filename);
        
        writeFileSync(filepath, JSON.stringify(reportData, null, 2), 'utf-8');
        
        return filepath;
    }

    /**
     * Generate PDF report (requires puppeteer)
     */
    async generatePDF(htmlPath) {
        try {
            // Dynamic import to avoid errors if puppeteer not installed
            const puppeteer = await import('puppeteer');
            
            logger.info('📄 Generating PDF report...');
            
            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
            
            const pdfFilename = `attack-report-${this.timestamp}.pdf`;
            const pdfPath = join(this.reportDir, pdfFilename);
            
            await page.pdf({
                path: pdfPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            });
            
            await browser.close();
            
            logger.success(`✅ PDF report generated: ${pdfPath}`);
            
            return pdfPath;
        } catch (err) {
            logger.warning(`⚠️  PDF generation skipped: ${err.message}`);
            logger.info('💡 Install puppeteer for PDF support: npm install puppeteer');
            return null;
        }
    }
}
