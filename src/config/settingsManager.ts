import * as vscode from 'vscode';

/**
 * Handles all settings and secrets for the Epic extension
 */
export class SettingsManager {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        
        // Ensure default settings are in place
        this.initializeDefaultSettings();
    }

    /**
     * Initialize default settings if they don't exist
     */
    private async initializeDefaultSettings(): Promise<void> {
        const config = vscode.workspace.getConfiguration('epic');
        const repositories = config.get('repositories');
        
        if (!repositories) {
            // Set default repository structure
            await config.update('repositories', {
                jira: { url: '' },
                confluence: { url: '' },
                github: { url: '' },
                ansible: { url: '' }
            }, vscode.ConfigurationTarget.Global);
        }
    }

    /**
     * Gets repository settings from VS Code configuration
     */
    getRepositorySettings(): any {
        const config = vscode.workspace.getConfiguration('epic');
        return config.get('repositories') || {};
    }

    /**
     * Updates a specific repository URL in settings
     */
    async updateRepositoryUrl(repoType: string, url: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('epic');
        const repositories = config.get('repositories') as any || {};
        
        if (!repositories[repoType]) {
            repositories[repoType] = {};
        }
        
        repositories[repoType].url = url;
        await config.update('repositories', repositories, vscode.ConfigurationTarget.Global);
    }

    /**
     * Stores a secret credential for a specific repository
     */
    async storeCredential(repoType: string, credential: any): Promise<void> {
        await this.context.secrets.store(`epic.${repoType}.credential`, JSON.stringify(credential));
    }

    /**
     * Retrieves a secret credential for a specific repository
     */
    async getCredential(repoType: string): Promise<any | undefined> {
        const credentialJson = await this.context.secrets.get(`epic.${repoType}.credential`);
        if (credentialJson) {
            try {
                return JSON.parse(credentialJson);
            } catch (error) {
                console.error(`Failed to parse credential for ${repoType}:`, error);
                return undefined;
            }
        }
        return undefined;
    }

    /**
     * Deletes a stored credential
     */
    async deleteCredential(repoType: string): Promise<void> {
        await this.context.secrets.delete(`epic.${repoType}.credential`);
    }

    /**
     * Updates settings and notifies listeners
     */
    async updateSettings(newSettings: any, scope: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global): Promise<void> {
        const config = vscode.workspace.getConfiguration('epic');
        
        // Update individual settings to avoid overwriting unrelated settings
        for (const key in newSettings) {
            if (Object.prototype.hasOwnProperty.call(newSettings, key)) {
                await config.update(key, newSettings[key], scope);
            }
        }
    }
}