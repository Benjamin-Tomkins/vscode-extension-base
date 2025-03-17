import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export function registerSettingsCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('epic.openSettings', () => {
            const homedir = os.homedir();
            const configPath = path.join(homedir, '.epicrc');
            
            // Create file if it doesn't exist
            if (!fs.existsSync(configPath)) {
                fs.writeFileSync(configPath, '# Epic Extension Configuration\n', 'utf8');
            }

            // Open the file in VS Code
            vscode.workspace.openTextDocument(configPath).then(doc => {
                vscode.window.showTextDocument(doc);
            });
        })
    );
}