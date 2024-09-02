import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Variables para rastrear si los comandos se han ejecutado previamente
let firstFileCopyDone = false;
let firstDirectoryCopyDone = false;

// Variable para guardar el estado previo del portapapeles
let lastClipboardContent = '';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "copy-file-folder-name-and-content" is now active!');

	// Function to check if clipboard content has changed
	async function resetIfClipboardChanged() {
		const currentClipboardContent = await vscode.env.clipboard.readText();
		if (currentClipboardContent !== lastClipboardContent) {
			firstFileCopyDone = false;
			firstDirectoryCopyDone = false;
			lastClipboardContent = currentClipboardContent;  // Update the last clipboard content
		}
	}

	// Command to copy file name and content to clipboard
	const copyFileContent = vscode.commands.registerCommand('copy-file-folder-name-and-content.copyFileContent', async (uri: vscode.Uri) => {
		try {
			await resetIfClipboardChanged();  // Check and reset state if clipboard has changed

			if (!uri || !uri.fsPath) {
				vscode.window.showErrorMessage('No file selected or file path is invalid.');
				return;
			}
			
			const fileName = uri.fsPath.split('/').pop() || 'Untitled';
			const fileContent = fs.readFileSync(uri.fsPath, 'utf-8');

			let newClipboardContent = `=== ${fileName} ===\n${fileContent}`;
			
			if (firstFileCopyDone) {
				let currentClipboard = await vscode.env.clipboard.readText();
				newClipboardContent = `${currentClipboard}\n\n${newClipboardContent}`;
			}
			
			await vscode.env.clipboard.writeText(newClipboardContent);
			lastClipboardContent = newClipboardContent;  // Update the last clipboard content
			vscode.window.showInformationMessage('File content copied to clipboard!');

			firstFileCopyDone = true;
		} catch (err) {
			if (err instanceof Error) {
				vscode.window.showErrorMessage(`Failed to copy content: ${err.message}`);
			} else {
				vscode.window.showErrorMessage('An unknown error occurred.');
			}
		}
	});

	// Command to copy directory structure and content to clipboard
	const copyDirectoryContent = vscode.commands.registerCommand('copy-file-folder-name-and-content.copyDirectoryContent', async (uri: vscode.Uri) => {
		try {
			await resetIfClipboardChanged();  // Check and reset state if clipboard has changed

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

			let newClipboardContent = `=== Directory Structure: ${uri.fsPath.split('/').pop()} ===\n${readDirectory(uri.fsPath, uri.fsPath)}`;
			
			if (firstDirectoryCopyDone) {
				let currentClipboard = await vscode.env.clipboard.readText();
				newClipboardContent = `${currentClipboard}\n\n${newClipboardContent}`;
			}

			await vscode.env.clipboard.writeText(newClipboardContent);
			lastClipboardContent = newClipboardContent;  // Update the last clipboard content
			vscode.window.showInformationMessage('Directory structure and content copied to clipboard!');

			firstDirectoryCopyDone = true;
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
	const disposable = vscode.commands.registerCommand('copy-file-folder-name-and-content.helloWorld', () => {
		vscode.window.showInformationMessage('Esta es una extension de Zhatra!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
