import * as vscode from 'vscode';
import { SettingsManager } from '../../config/settingsManager';
import { SettingsWebviewPanel } from '../settings/SettingsWebviewPanel';

export function registerSettingsCommands(context: vscode.ExtensionContext, settingsManager: SettingsManager) {
    // Command to open our custom settings UI panel
    context.subscriptions.push(
        vscode.commands.registerCommand('epic.openSettings', () => {
            SettingsWebviewPanel.createOrShow(context.extensionUri, settingsManager);
        })
    );

    // Command to configure credentials securely
    context.subscriptions.push(
        vscode.commands.registerCommand('epic.configureCredentials', async (preSelectedRepo?: string) => {
            // Use preSelectedRepo if provided (from webview), otherwise show quick pick
            let repoType = preSelectedRepo;
            
            if (!repoType) {
                repoType = await vscode.window.showQuickPick(
                    ['jira', 'confluence', 'github', 'ansible'],
                    { placeHolder: 'Select repository type to configure credentials' }
                );
            }
            
            if (!repoType) {
                return;
            }

            const username = await vscode.window.showInputBox({
                prompt: `Enter username for ${repoType}`,
                placeHolder: 'username'
            });

            if (username === undefined) {
                return;
            }

            const password = await vscode.window.showInputBox({
                prompt: `Enter API token or password for ${repoType}`,
                password: true // This masks the input for security
            });

            if (password === undefined) {
                return;
            }

            // Store credentials securely
            await settingsManager.storeCredential(repoType, { username, password });
            vscode.window.showInformationMessage(`Credentials for ${repoType} stored securely`);
        })
    );

    // Command to configure repository URLs
    context.subscriptions.push(
        vscode.commands.registerCommand('epic.configureRepositoryUrl', async () => {
            const repoType = await vscode.window.showQuickPick(
                ['jira', 'confluence', 'github', 'ansible'],
                { placeHolder: 'Select repository type to configure URL' }
            );
            
            if (!repoType) {
                return;
            }

            const repositories = settingsManager.getRepositorySettings();
            const currentUrl = repositories[repoType]?.url || '';

            const url = await vscode.window.showInputBox({
                prompt: `Enter URL for ${repoType}`,
                value: currentUrl,
                placeHolder: 'https://example.com'
            });

            if (url === undefined) {
                return;
            }

            // Update repository URL in settings
            await settingsManager.updateRepositoryUrl(repoType, url);
            vscode.window.showInformationMessage(`URL for ${repoType} updated`);
        })
    );

    // Listen for settings changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('epic')) {
                // Handle any necessary updates when settings change
                console.log('Epic settings changed');
            }
        })
    );
}