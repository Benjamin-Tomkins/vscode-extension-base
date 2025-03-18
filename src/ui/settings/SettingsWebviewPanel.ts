import * as vscode from 'vscode';
import { SettingsManager } from '../../config/settingsManager';

/**
 * Manages a webview panel for Epic settings
 */
export class SettingsWebviewPanel {
    public static currentPanel: SettingsWebviewPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _settingsManager: SettingsManager;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, settingsManager: SettingsManager) {
        this._panel = panel;
        this._settingsManager = settingsManager;

        // Set initial HTML content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update webview content when the panel becomes visible
        this._panel.onDidChangeViewState(
            e => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'saveUrl':
                        await this._settingsManager.updateRepositoryUrl(message.repoType, message.url);
                        vscode.window.showInformationMessage(`URL for ${message.repoType} updated`);
                        break;
                        
                    case 'saveCredentials':
                        await this._settingsManager.storeCredential(message.repoType, {
                            username: message.username,
                            password: message.password
                        });
                        vscode.window.showInformationMessage(`Credentials for ${message.repoType} have been securely stored`);
                        // Update the UI to show credentials are stored
                        this._panel.webview.postMessage({
                            command: 'credentialsSaved',
                            repoType: message.repoType
                        });
                        break;
                        
                    case 'deleteCredentials':
                        await this._settingsManager.deleteCredential(message.repoType);
                        vscode.window.showInformationMessage(`Credentials for ${message.repoType} have been removed`);
                        // Update the UI to show credentials are removed
                        this._panel.webview.postMessage({
                            command: 'credentialsDeleted',
                            repoType: message.repoType
                        });
                        break;
                        
                    case 'getCredentialStatus':
                        const credential = await this._settingsManager.getCredential(message.repoType);
                        this._panel.webview.postMessage({
                            command: 'credentialStatus',
                            repoType: message.repoType,
                            hasCredentials: !!credential,
                            username: credential ? credential.username : ''
                        });
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    /**
     * Creates or shows the settings panel
     */
    public static createOrShow(extensionUri: vscode.Uri, settingsManager: SettingsManager) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (SettingsWebviewPanel.currentPanel) {
            SettingsWebviewPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Create a new panel
        const panel = vscode.window.createWebviewPanel(
            'epicSettings',
            'Epic Settings',
            column || vscode.ViewColumn.One,
            {
                // Enable JavaScript in the webview
                enableScripts: true,
                // Restrict the webview to only load resources from the `media` directory
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        SettingsWebviewPanel.currentPanel = new SettingsWebviewPanel(panel, settingsManager);
    }

    /**
     * Update the webview content
     */
    private async _update() {
        const repositories = this._settingsManager.getRepositorySettings();
        this._panel.webview.html = await this._getHtmlForWebview(repositories);
    }

    /**
     * Generate HTML content for the webview
     */
    private async _getHtmlForWebview(repositories: any): Promise<string> {
        const repoTypes = ['jira', 'confluence', 'github', 'ansible'];
        
        // Build all the repository sections
        const repoSections = repoTypes.map(repoType => {
            const repoSettings = repositories[repoType] || { url: '' };
            
            return `
            <div class="repository-section">
                <h2>${repoType.charAt(0).toUpperCase() + repoType.slice(1)}</h2>
                
                <div class="form-group">
                    <label for="${repoType}-url">URL:</label>
                    <input type="text" id="${repoType}-url" value="${repoSettings.url || ''}" 
                           placeholder="https://example.com">
                </div>
                
                <div class="form-group">
                    <button class="save-url-button" data-repo="${repoType}">Save URL</button>
                </div>
                
                <hr class="separator">
                
                <h3>Credentials</h3>
                <div class="form-group">
                    <label for="${repoType}-username">Username:</label>
                    <input type="text" id="${repoType}-username" placeholder="username">
                </div>
                
                <div class="form-group">
                    <label for="${repoType}-password">Password/Token:</label>
                    <input type="password" id="${repoType}-password" placeholder="password or token">
                </div>
                
                <div class="form-group buttons-row">
                    <button class="save-credentials-button" data-repo="${repoType}">Save Credentials</button>
                    <button class="delete-credentials-button" data-repo="${repoType}">Delete Credentials</button>
                </div>
                
                <div class="credential-status" id="${repoType}-credential-status">
                    Checking credential status...
                </div>
            </div>`;
        }).join('');

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Epic Settings</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    padding: 20px;
                    color: var(--vscode-foreground);
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                h1 {
                    color: var(--vscode-editor-foreground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                }
                
                .repository-section {
                    margin-bottom: 30px;
                    padding: 15px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 5px;
                    background-color: var(--vscode-editor-background);
                }
                
                .repository-section h2 {
                    margin-top: 0;
                    color: var(--vscode-editor-foreground);
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    color: var(--vscode-input-foreground);
                }
                
                .form-group input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border-radius: 3px;
                }
                
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 12px;
                    border-radius: 3px;
                    cursor: pointer;
                    margin-right: 10px;
                }
                
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .buttons-row {
                    display: flex;
                    flex-wrap: wrap;
                }
                
                .credential-status {
                    margin-top: 15px;
                    padding: 8px;
                    border-radius: 3px;
                    font-weight: bold;
                }
                
                .has-credentials {
                    background-color: var(--vscode-gitDecoration-addedResourceForeground);
                    color: var(--vscode-editor-background);
                }
                
                .no-credentials {
                    background-color: var(--vscode-gitDecoration-modifiedResourceForeground);
                    color: var(--vscode-editor-background);
                }
                
                .separator {
                    border: none;
                    border-top: 1px solid var(--vscode-panel-border);
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <h1>Epic Settings</h1>
            <p>Configure your repository URLs and credentials. Credentials are securely stored and will not be visible in your settings.json file.</p>
            
            ${repoSections}
            
            <script>
                (function() {
                    const vscode = acquireVsCodeApi();
                    
                    // Save URL buttons
                    document.querySelectorAll('.save-url-button').forEach(button => {
                        button.addEventListener('click', () => {
                            const repoType = button.getAttribute('data-repo');
                            const urlInput = document.getElementById(\`\${repoType}-url\`);
                            
                            vscode.postMessage({
                                command: 'saveUrl',
                                repoType: repoType,
                                url: urlInput.value
                            });
                        });
                    });
                    
                    // Save Credentials buttons
                    document.querySelectorAll('.save-credentials-button').forEach(button => {
                        button.addEventListener('click', () => {
                            const repoType = button.getAttribute('data-repo');
                            const username = document.getElementById(\`\${repoType}-username\`).value;
                            const password = document.getElementById(\`\${repoType}-password\`).value;
                            
                            if (!username || !password) {
                                alert('Both username and password/token are required');
                                return;
                            }
                            
                            vscode.postMessage({
                                command: 'saveCredentials',
                                repoType: repoType,
                                username: username,
                                password: password
                            });
                            
                            // Clear password field for security
                            document.getElementById(\`\${repoType}-password\`).value = '';
                        });
                    });
                    
                    // Delete Credentials buttons
                    document.querySelectorAll('.delete-credentials-button').forEach(button => {
                        button.addEventListener('click', () => {
                            const repoType = button.getAttribute('data-repo');
                            
                            vscode.postMessage({
                                command: 'deleteCredentials',
                                repoType: repoType
                            });
                        });
                    });
                    
                    // Check credential status for each repo type
                    document.querySelectorAll('.repository-section').forEach(section => {
                        const repoType = section.querySelector('h2').textContent.toLowerCase();
                        vscode.postMessage({
                            command: 'getCredentialStatus',
                            repoType: repoType
                        });
                    });
                    
                    // Handle messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.command) {
                            case 'credentialStatus':
                                const statusElement = document.getElementById(\`\${message.repoType}-credential-status\`);
                                const usernameInput = document.getElementById(\`\${message.repoType}-username\`);
                                
                                if (message.hasCredentials) {
                                    statusElement.textContent = \`Credentials stored for user: \${message.username}\`;
                                    statusElement.className = 'credential-status has-credentials';
                                    
                                    // Pre-fill username if available
                                    usernameInput.value = message.username;
                                } else {
                                    statusElement.textContent = 'No credentials stored';
                                    statusElement.className = 'credential-status no-credentials';
                                    usernameInput.value = '';
                                }
                                break;
                                
                            case 'credentialsSaved':
                                vscode.postMessage({
                                    command: 'getCredentialStatus',
                                    repoType: message.repoType
                                });
                                break;
                                
                            case 'credentialsDeleted':
                                const statusEl = document.getElementById(\`\${message.repoType}-credential-status\`);
                                const usernameEl = document.getElementById(\`\${message.repoType}-username\`);
                                
                                statusEl.textContent = 'No credentials stored';
                                statusEl.className = 'credential-status no-credentials';
                                usernameEl.value = '';
                                break;
                        }
                    });
                })();
            </script>
        </body>
        </html>`;
    }

    public dispose() {
        SettingsWebviewPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}