// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// TreeItem class for our sidebar items
class EpicTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly description?: string,
    public readonly command?: vscode.Command,
    public readonly children?: EpicTreeItem[],
    public readonly contextValue?: string
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.command = command;
    this.contextValue = contextValue;
    
    // Apply styling to category items
    if (contextValue === 'category') {
      // Make category labels visually distinct with both color and icon
      this.tooltip = `${label} Section`;
      
      // Use a colored icon to represent the section
      switch(label) {
        case 'Jira':
          this.iconPath = new vscode.ThemeIcon('tasklist', new vscode.ThemeColor('charts.blue'));
          break;
        case 'Confluence':
          this.iconPath = new vscode.ThemeIcon('book', new vscode.ThemeColor('charts.green'));
          break;
        case 'GitHub':
          this.iconPath = new vscode.ThemeIcon('git-merge', new vscode.ThemeColor('charts.orange'));
          break;
        case 'Ansible':
          this.iconPath = new vscode.ThemeIcon('server-environment', new vscode.ThemeColor('charts.red'));
          break;
        default:
          this.iconPath = new vscode.ThemeIcon('folder', new vscode.ThemeColor('charts.purple'));
      }
      
      // Just use the normal label instead of trying to add an icon as text
      // and don't use uppercase as it's visually noisy
      // The icon is already set via iconPath
      
      // Remove the description that was causing the dashes
      this.description = '';
      
      // Apply font weight through label format
      this.label = label;
    }
  }
}

// TreeDataProvider for our sidebar
class EpicTreeDataProvider implements vscode.TreeDataProvider<EpicTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<EpicTreeItem | undefined | null | void> = new vscode.EventEmitter<EpicTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<EpicTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private jiraItems: EpicTreeItem[] = [
    new EpicTreeItem(
      'View Issues',
      vscode.TreeItemCollapsibleState.None,
      'Browse Jira issues',
      {
        command: 'epic.selectFeature',
        title: 'Select Feature',
        arguments: ['jira.viewIssues']
      },
      undefined,
      'feature'
    ),
    new EpicTreeItem(
      'Create Issue',
      vscode.TreeItemCollapsibleState.None,
      'Create a new Jira issue',
      {
        command: 'epic.selectFeature',
        title: 'Select Feature',
        arguments: ['jira.createIssue']
      },
      undefined,
      'feature'
    )
  ];

  private confluenceItems: EpicTreeItem[] = [
    new EpicTreeItem(
      'Browse Pages',
      vscode.TreeItemCollapsibleState.None,
      'Browse Confluence pages',
      {
        command: 'epic.selectFeature',
        title: 'Select Feature',
        arguments: ['confluence.browsePages']
      },
      undefined,
      'feature'
    ),
    new EpicTreeItem(
      'Create Page',
      vscode.TreeItemCollapsibleState.None,
      'Create a new Confluence page',
      {
        command: 'epic.selectFeature',
        title: 'Select Feature',
        arguments: ['confluence.createPage']
      },
      undefined,
      'feature'
    )
  ];

  private githubItems: EpicTreeItem[] = [
    new EpicTreeItem(
      'View PRs',
      vscode.TreeItemCollapsibleState.None,
      'Browse GitHub pull requests',
      {
        command: 'epic.selectFeature',
        title: 'Select Feature',
        arguments: ['github.viewPRs']
      },
      undefined,
      'feature'
    ),
    new EpicTreeItem(
      'Create PR',
      vscode.TreeItemCollapsibleState.None,
      'Create a new pull request',
      {
        command: 'epic.selectFeature',
        title: 'Select Feature',
        arguments: ['github.createPR']
      },
      undefined,
      'feature'
    )
  ];

  private ansibleItems: EpicTreeItem[] = [
    new EpicTreeItem(
      'Playbooks',
      vscode.TreeItemCollapsibleState.None,
      'Browse Ansible playbooks',
      {
        command: 'epic.selectFeature',
        title: 'Select Feature',
        arguments: ['ansible.playbooks']
      },
      undefined,
      'feature'
    ),
    new EpicTreeItem(
      'Run Playbook',
      vscode.TreeItemCollapsibleState.None,
      'Execute an Ansible playbook',
      {
        command: 'epic.selectFeature',
        title: 'Select Feature',
        arguments: ['ansible.runPlaybook']
      },
      undefined,
      'feature'
    )
  ];

  // Root level items (categories)
  private rootItems: EpicTreeItem[] = [
    new EpicTreeItem(
      'Jira',
      vscode.TreeItemCollapsibleState.Expanded, // Change to Expanded to show children by default
      '',  // Remove description here
      undefined,
      this.jiraItems,
      'category'
    ),
    new EpicTreeItem(
      'Confluence',
      vscode.TreeItemCollapsibleState.Expanded, // Change to Expanded to show children by default
      '',  // Remove description here
      undefined,
      this.confluenceItems,
      'category'
    ),
    new EpicTreeItem(
      'GitHub',
      vscode.TreeItemCollapsibleState.Expanded, // Change to Expanded to show children by default
      '',  // Remove description here
      undefined,
      this.githubItems,
      'category'
    ),
    new EpicTreeItem(
      'Ansible',
      vscode.TreeItemCollapsibleState.Expanded, // Change to Expanded to show children by default
      '',  // Remove description here
      undefined,
      this.ansibleItems,
      'category'
    ),
    new EpicTreeItem(
      'Settings',
      vscode.TreeItemCollapsibleState.None,
      'Configure extension settings',
      {
        command: 'epic.openSettings',
        title: 'Open Settings',
        arguments: []
      },
      undefined,
      'setting'
    )
  ];

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: EpicTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: EpicTreeItem): Thenable<EpicTreeItem[]> {
    if (!element) {
      // Return root items (categories)
      return Promise.resolve(this.rootItems);
    } else {
      // Check if we need to return children for a specific category by comparing its label
      // This is more efficient than the switch-case we had before
      const label = element.label.toString();
      if (label === 'Jira') {
        return Promise.resolve(this.jiraItems);
      } else if (label === 'Confluence') {
        return Promise.resolve(this.confluenceItems);
      } else if (label === 'GitHub') {
        return Promise.resolve(this.githubItems);
      } else if (label === 'Ansible') {
        return Promise.resolve(this.ansibleItems);
      } else {
        return Promise.resolve([]);
      }
    }
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "epic" is now active!');

  // Create the tree data provider
  const epicTreeDataProvider = new EpicTreeDataProvider();
  
  // Register the tree data provider for the epicExplorer view
  vscode.window.registerTreeDataProvider('epicExplorer', epicTreeDataProvider);

  // Register the refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('epic.refreshEntry', () => {
      epicTreeDataProvider.refresh();
      vscode.window.showInformationMessage('Epic Explorer refreshed');
    })
  );

  // Register the feature selection command
  context.subscriptions.push(
    vscode.commands.registerCommand('epic.selectFeature', (featureId: string) => {
      vscode.window.showInformationMessage(`Selected feature: ${featureId}`);
      // Here you would implement the specific feature functionality
    })
  );

  // Register the settings command
  context.subscriptions.push(
    vscode.commands.registerCommand('epic.openSettings', () => {
      vscode.window.showInformationMessage('Opening Epic extension settings');
      // Here you would implement opening settings or showing a configuration UI
    })
  );

  // Register custom menu option commands
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

  // The original hello world command
  const disposable = vscode.commands.registerCommand('epic.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from epic!');
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
