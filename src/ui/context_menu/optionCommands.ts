import * as vscode from 'vscode';

export function registerOptionCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('epic.option1', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.selection;
                const selectedText = editor.document.getText(selection);
                vscode.window.showInformationMessage(`Option 1 selected: ${selectedText || 'No text selected'}`);
            } else {
                vscode.window.showInformationMessage('Option 1 selected (no active editor)');
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('epic.option2', () => {
            vscode.window.showQuickPick(['Choice A', 'Choice B', 'Choice C'], {
                placeHolder: 'Select an option',
                canPickMany: false
            }).then(selection => {
                if (selection) {
                    vscode.window.showInformationMessage(`You selected: ${selection}`);
                }
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('epic.option3', () => {
            vscode.window.showInputBox({
                prompt: 'Enter a value',
                placeHolder: 'Example: some text'
            }).then(value => {
                if (value) {
                    vscode.window.showInformationMessage(`You entered: ${value}`);
                }
            });
        })
    );
}