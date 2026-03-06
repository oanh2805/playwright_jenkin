import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Environment utilities for managing configuration across different environments
 * Supports loading environment variables from .env, qa.env, stg.env files
 */
export class EnvUtils {
    private static instance: EnvUtils;
    private config: { [key: string]: string } = {};

    /**
     * Singleton pattern to ensure single instance of environment configuration
     * @returns EnvUtils instance
     */
    public static getInstance(): EnvUtils {
        if (!EnvUtils.instance) {
            EnvUtils.instance = new EnvUtils();
        }
        return EnvUtils.instance;
    }

    /**
     * Private constructor to initialize environment configuration
     */
    private constructor() {
        this.loadEnvironmentConfig();
    }

    /**
     * Load environment configuration based on ENV variable or default to .env
     * Priority: ENV specific file (qa.env, stg.env) -> .env -> process.env
     */
    private loadEnvironmentConfig(): void {
        try {
            const environment: string = process.env.ENV || 'default';
            const rootPath: string = path.resolve(__dirname, '../../');
            
            // Load default .env first
            const defaultEnvPath: string = path.join(rootPath, '.env');
            dotenv.config({ path: defaultEnvPath });
            
            // Load environment specific config if specified
            if (environment !== 'default') {
                const envFilePath: string = path.join(rootPath, `${environment}.env`);
                dotenv.config({ path: envFilePath, override: true });
            }
            
            // Store configuration in local object for easy access
            this.config = Object.fromEntries(
                Object.entries(process.env).filter(([, value]) => value !== undefined)
            ) as { [key: string]: string };
            
            console.log(`Environment configuration loaded successfully for: ${environment}`);
        } catch (error) {
            console.error('Failed to load environment configuration:', error);
            throw new Error(`Environment configuration loading failed: ${error}`);
        }
    }

    /**
     * Get configuration value by key with optional default value
     * @param key - Configuration key
     * @param defaultValue - Default value if key not found
     * @returns Configuration value or default
     */
    public get(key: string, defaultValue?: string): string {
        const value: string | undefined = this.config[key] || process.env[key];
        if (!value && !defaultValue) {
            throw new Error(`Required environment variable '${key}' is not set`);
        }
        return value || defaultValue || '';
    }

    /**
     * Get configuration value as number
     * @param key - Configuration key
     * @param defaultValue - Default value if key not found
     * @returns Configuration value as number
     */
    public getNumber(key: string, defaultValue?: number): number {
        const value: string = this.get(key, defaultValue?.toString());
        const numberValue: number = parseInt(value, 10);
        if (isNaN(numberValue)) {
            throw new Error(`Environment variable '${key}' is not a valid number: ${value}`);
        }
        return numberValue;
    }

    /**
     * Get configuration value as boolean
     * @param key - Configuration key
     * @param defaultValue - Default value if key not found
     * @returns Configuration value as boolean
     */
    public getBoolean(key: string, defaultValue?: boolean): boolean {
        const value: string = this.get(key, defaultValue?.toString());
        return value.toLowerCase() === 'true';
    }

    /**
     * Get base URL for the application
     * @returns Base URL string
     */
    public getBaseUrl(): string {
        return this.get('BASE_URL', 'https://www.levents.asia/');
    }

    /**
     * Get test user credentials
     * @returns Object containing phone and password
     */
    public getTestCredentials(): { phone: string; password: string } {
        return {
            phone: this.get('TEST_PHONE'),
            password: this.get('TEST_PASSWORD')
        };
    }

    /**
     * Get browser configuration
     * @returns Object containing browser settings
     */
    public getBrowserConfig(): { 
        browser: string; 
        headed: boolean; 
        slowMo: number; 
        timeout: number 
    } {
        return {
            browser: this.get('BROWSER', 'firefox'),
            headed: this.getBoolean('HEADED', false),
            slowMo: this.getNumber('SLOW_MO', 0),
            timeout: this.getNumber('APP_TIMEOUT', 30000)
        };
    }
}