import * as vscode from 'vscode';
import { SidebarTreeItem } from './SidebarTreeItem';

export class SidebarView implements vscode.TreeDataProvider<SidebarTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SidebarTreeItem | undefined | null | void> = new vscode.EventEmitter<SidebarTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SidebarTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private jiraItems: SidebarTreeItem[] = [
        new SidebarTreeItem('View Issues', vscode.TreeItemCollapsibleState.None, 'Browse Jira issues', {
            command: 'epic.selectFeature',
            title: 'Select Feature',
            arguments: ['jira.viewIssues']
        }, undefined, 'feature'),
        new SidebarTreeItem('Create Issue', vscode.TreeItemCollapsibleState.None, 'Create a new Jira issue', {
            command: 'epic.selectFeature',
            title: 'Select Feature',
            arguments: ['jira.createIssue']
        }, undefined, 'feature')
    ];

    private confluenceItems: SidebarTreeItem[] = [
        new SidebarTreeItem('Browse Pages', vscode.TreeItemCollapsibleState.None, 'Browse Confluence pages', {
            command: 'epic.selectFeature',
            title: 'Select Feature',
            arguments: ['confluence.browsePages']
        }, undefined, 'feature'),
        new SidebarTreeItem('Create Page', vscode.TreeItemCollapsibleState.None, 'Create a new Confluence page', {
            command: 'epic.selectFeature',
            title: 'Select Feature',
            arguments: ['confluence.createPage']
        }, undefined, 'feature')
    ];

    private githubItems: SidebarTreeItem[] = [
        new SidebarTreeItem('View PRs', vscode.TreeItemCollapsibleState.None, 'Browse GitHub pull requests', {
            command: 'epic.selectFeature',
            title: 'Select Feature',
            arguments: ['github.viewPRs']
        }, undefined, 'feature'),
        new SidebarTreeItem('Create PR', vscode.TreeItemCollapsibleState.None, 'Create a new pull request', {
            command: 'epic.selectFeature',
            title: 'Select Feature',
            arguments: ['github.createPR']
        }, undefined, 'feature')
    ];

    private ansibleItems: SidebarTreeItem[] = [
        new SidebarTreeItem('Playbooks', vscode.TreeItemCollapsibleState.None, 'Browse Ansible playbooks', {
            command: 'epic.selectFeature',
            title: 'Select Feature',
            arguments: ['ansible.playbooks']
        }, undefined, 'feature'),
        new SidebarTreeItem('Run Playbook', vscode.TreeItemCollapsibleState.None, 'Execute an Ansible playbook', {
            command: 'epic.selectFeature',
            title: 'Select Feature',
            arguments: ['ansible.runPlaybook']
        }, undefined, 'feature')
    ];

    private rootItems: SidebarTreeItem[] = [
        new SidebarTreeItem('Jira', vscode.TreeItemCollapsibleState.Collapsed, undefined, undefined, this.jiraItems, 'category'),
        new SidebarTreeItem('Confluence', vscode.TreeItemCollapsibleState.Collapsed, undefined, undefined, this.confluenceItems, 'category'),
        new SidebarTreeItem('GitHub', vscode.TreeItemCollapsibleState.Collapsed, undefined, undefined, this.githubItems, 'category'),
        new SidebarTreeItem('Ansible', vscode.TreeItemCollapsibleState.Collapsed, undefined, undefined, this.ansibleItems, 'category')
    ];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SidebarTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SidebarTreeItem): Thenable<SidebarTreeItem[]> {
        if (!element) {
            return Promise.resolve(this.rootItems);
        } else {
            switch (element.label) {
                case 'Jira':
                    return Promise.resolve(this.jiraItems);
                case 'Confluence':
                    return Promise.resolve(this.confluenceItems);
                case 'GitHub':
                    return Promise.resolve(this.githubItems);
                case 'Ansible':
                    return Promise.resolve(this.ansibleItems);
                default:
                    return Promise.resolve([]);
            }
        }
    }
}