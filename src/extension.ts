import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "Clipboard Content Copier" is now active!');

	// Command to copy file name and content to clipboard
	const copyFileContent = vscode.commands.registerCommand('clipboard-content-copier.copyFileContent', async (uri: vscode.Uri) => {
		try {
			if (!uri || !uri.fsPath) {
				vscode.window.showErrorMessage('No file selected or file path is invalid.');
				return;
			}
			
			const fileName = uri.fsPath.split('/').pop() || 'Untitled';
			const fileContent = fs.readFileSync(uri.fsPath, 'utf-8');

			const newClipboardContent = `=== ${fileName} ===\n${fileContent}`;
			
			await vscode.env.clipboard.writeText(newClipboardContent);
			vscode.window.showInformationMessage('File content copied to clipboard!');
		} catch (err) {
			if (err instanceof Error) {
				vscode.window.showErrorMessage(`Failed to copy content: ${err.message}`);
			} else {
				vscode.window.showErrorMessage('An unknown error occurred.');
			}
		}
	});

	// Command to copy directory structure and content to clipboard
	const copyDirectoryContent = vscode.commands.registerCommand('clipboard-content-copier.copyDirectoryContent', async (uri: vscode.Uri) => {
		try {
			if (!uri || !uri.fsPath || !fs.lstatSync(uri.fsPath).isDirectory()) {
				vscode.window.showErrorMessage('No directory selected or invalid path.');
				return;
			}

			const readDirectory = (dirPath: string, baseDir: string, depth: number = 0, prefix = ''): string => {
				let result = '';
				const indent = depth > 0 ? `${prefix}${depth > 1 ? '│   ' : ''}` : ''; 
				const files = fs.readdirSync(dirPath);
				const lastFile = files[files.length - 1];

				files.forEach((file, index) => {
					const filePath = path.join(dirPath, file);
					const relativePath = path.relative(baseDir, filePath);
					const stats = fs.statSync(filePath);
					const isLastFile = file === lastFile;

					if (stats.isDirectory()) {
						result += `${indent}${isLastFile ? '└──' : '├──'} Directory: ${relativePath}/\n`;
						result += readDirectory(filePath, baseDir, depth + 1, `${indent}${isLastFile ? '    ' : '│   '}`);
					} else {
						const fileContent = fs.readFileSync(filePath, 'utf-8')
							.split('\n')
							.map(line => `${indent}│   ${line}`)
							.join('\n');  
						result += `${indent}${isLastFile ? '└──' : '├──'} File: ${relativePath}\n`;
						result += `${indent}│   --------------------\n`;
						result += `${fileContent}\n`;
						result += `${indent}│   --------------------\n\n`;
					}
				});

				return result;
			};

			const newClipboardContent = `=== Directory Structure: ${uri.fsPath.split('/').pop()} ===\n${readDirectory(uri.fsPath, uri.fsPath)}`;

			await vscode.env.clipboard.writeText(newClipboardContent);
			vscode.window.showInformationMessage('Directory structure and content copied to clipboard!');
		} catch (err) {
			if (err instanceof Error) {
				vscode.window.showErrorMessage(`Failed to copy directory content: ${err.message}`);
			} else {
				vscode.window.showErrorMessage('An unknown error occurred.');
			}
		}
	});

	context.subscriptions.push(copyFileContent);
	context.subscriptions.push(copyDirectoryContent);

	// Example existing command
	const disposable = vscode.commands.registerCommand('clipboard-content-copier.helloWorld', () => {
		vscode.window.showInformationMessage('This is Clipboard Content Copier extension!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
