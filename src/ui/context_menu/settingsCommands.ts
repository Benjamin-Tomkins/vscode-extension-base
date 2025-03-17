import * as vscode from 'vscode';

export function registerSettingsCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('epic.openSettings', () => {
            vscode.window.showInformationMessage('Opening Epic extension settings');
        })
    );
}