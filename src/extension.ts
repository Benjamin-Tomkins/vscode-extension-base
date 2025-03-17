import * as vscode from 'vscode';
import { SidebarView } from './ui/sidebar/SidebarView';
import { registerFeatureCommands } from './ui/context_menu/featureCommands';
import { registerSettingsCommands } from './ui/context_menu/settingsCommands';
import { registerOptionCommands } from './ui/context_menu/optionCommands';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "epic" is now active!');

    const sidebarView = new SidebarView();
    vscode.window.registerTreeDataProvider('epicExplorer', sidebarView);

    // Register all command groups
    registerFeatureCommands(context, sidebarView);
    registerSettingsCommands(context);
    registerOptionCommands(context);

    const disposable = vscode.commands.registerCommand('epic.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from epic!');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
