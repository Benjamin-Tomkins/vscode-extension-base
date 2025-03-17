import * as vscode from 'vscode';

export function registerFeatureCommands(context: vscode.ExtensionContext, epicTreeDataProvider: any) {
    context.subscriptions.push(
        vscode.commands.registerCommand('epic.refreshEntry', () => {
            epicTreeDataProvider.refresh();
            vscode.window.showInformationMessage('Epic Explorer refreshed');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('epic.selectFeature', (featureId: string) => {
            vscode.window.showInformationMessage(`Selected feature: ${featureId}`);
        })
    );
}