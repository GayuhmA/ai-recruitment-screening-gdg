import "dotenv/config";

export function mustEnv(name: string): string {
    const value = process.env[name];
    if (!value || !value.trim()) {
        throw new Error(`Missing env: ${name}`);
    }
    return value.trim();
}
