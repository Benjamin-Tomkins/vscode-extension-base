import * as vscode from 'vscode';

export class SidebarTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string | vscode.TreeItemLabel,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly tooltip?: string,
        public readonly command?: vscode.Command,
        public readonly children?: SidebarTreeItem[],
        public readonly contextValue?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip;
        this.command = command;
        this.contextValue = contextValue;

        if (contextValue === 'category') {
            this.tooltip = `${label} Section`;
            switch (label) {
                case 'Jira':
                    this.iconPath = new vscode.ThemeIcon('issues');
                    break;
                case 'Confluence':
                    this.iconPath = new vscode.ThemeIcon('book');
                    break;
                case 'GitHub':
                    this.iconPath = new vscode.ThemeIcon('github');
                    break;
                case 'Ansible':
                    this.iconPath = new vscode.ThemeIcon('server');
                    break;
                default:
                    this.iconPath = new vscode.ThemeIcon('folder');
            }
            this.description = '';
        }
    }
}