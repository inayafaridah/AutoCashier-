import { spawn, ChildProcess } from 'child_process';
import path from 'path';

class RealtimeVisionService {
    private static instance: RealtimeVisionService;
    private visionProcess: ChildProcess | null = null;

    private constructor() {}

    public static getInstance(): RealtimeVisionService {
        if (!RealtimeVisionService.instance) {
            RealtimeVisionService.instance = new RealtimeVisionService();
        }
        return RealtimeVisionService.instance;
    }

    /**
     * Starts the optimized Python vision scanner.
     * This process remains running in the background.
     */
    public startScanner(): void {
        if (this.visionProcess) {
            console.warn('[VisionService] Scanner is already running.');
            return;
        }

        const scriptPath = path.join(process.cwd(), 'scripts', 'run_scanner.py');
        console.log('[VisionService] Initializing Neural Engine at:', scriptPath);

        // Spawn the python process
        this.visionProcess = spawn('python', [scriptPath]);

        // Handle detections from Python (stdout)
        this.visionProcess.stdout?.on('data', (data) => {
            const output = data.toString().trim();
            try {
                // The python script prints JSON per line
                const lines = output.split('\n');
                for (const line of lines) {
                    if (line.startsWith('{')) {
                        const scanResult = JSON.parse(line);
                        this.handleDetection(scanResult);
                    } else {
                        // Regular logs from python
                        console.log(`[Vision Engine] ${line}`);
                    }
                }
            } catch (err) {
                console.error('[VisionService] Parse Error:', output);
            }
        });

        // Handle errors from Python (stderr)
        this.visionProcess.stderr?.on('data', (data) => {
            const errorMsg = data.toString();
            // OpenCV warnings or model download progress often go here
            if (errorMsg.includes('WARN')) {
                console.warn(`[Vision OpenCV] ${errorMsg.trim()}`);
            } else {
                console.error(`[Vision Error] ${errorMsg.trim()}`);
            }
        });

        this.visionProcess.on('close', (code) => {
            console.log(`[VisionService] Scanner process exited with code ${code}`);
            this.visionProcess = null;
        });
    }

    private handleDetection(result: any): void {
        const objects = result.all_objects?.map((o: any) => `${o.label}(${Math.round(o.confidence * 100)}%)`).join(', ') || 'none';
        
        if (result.detected) {
            console.log(`[Vision MATCH] ✅ ${result.product_name} (Rp ${result.price}) | All: [${objects}]`);
        } else {
            // Log raw objects even if no product match found
            console.log(`[Vision Scan] 🔍 Frame: [${objects}]`);
        }
        
        // TODO: Integrate with Socket.io to push real-time detection to the POS Frontend
        // global.io?.emit('ai-detection', result);
    }

    public stopScanner(): void {
        if (this.visionProcess) {
            this.visionProcess.kill();
            this.visionProcess = null;
            console.log('[VisionService] Scanner stopped.');
        }
    }
}

export default RealtimeVisionService;
