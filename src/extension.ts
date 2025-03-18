import * as vscode from 'vscode';
import { SidebarView } from './ui/sidebar/SidebarView';
import { registerFeatureCommands } from './ui/context_menu/featureCommands';
import { registerSettingsCommands } from './ui/context_menu/settingsCommands';
import { registerOptionCommands } from './ui/context_menu/optionCommands';
import { SettingsManager } from './config/settingsManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "epic" is now active!');
    
    // Initialize settings manager with the extension context
    const settingsManager = new SettingsManager(context);
    
    const sidebarView = new SidebarView();
    vscode.window.registerTreeDataProvider('epicExplorer', sidebarView);
    
    // Register all command groups
    registerFeatureCommands(context, sidebarView);
    registerSettingsCommands(context, settingsManager);
    registerOptionCommands(context);
    
    const disposable = vscode.commands.registerCommand('epic.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from epic!');
    });
    
    context.subscriptions.push(disposable);

    // Register a listener for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('epic')) {
                // Refresh your UI or update any cached settings
                sidebarView.refresh();
            }
        })
    );
}

export function deactivate() {}
