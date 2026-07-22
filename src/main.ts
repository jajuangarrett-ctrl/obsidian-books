import { Notice, Platform, Plugin, TAbstractFile, TFile, type WorkspaceLeaf } from 'obsidian';

import { t } from './i18n';
import { ReaderView, VIEW_TYPE_READER } from './reader/ReaderView';
import { migratePersistedData } from './settings-data';
import { ReaderSettingTab } from './settings-tab';
import type { PersistedData, PositionMap, ReaderSettings } from './types';

export default class ObsidianBooksPlugin extends Plugin {
	public settings!: ReaderSettings;
	public positions: PositionMap = {};

	private lastSaved = '';
	private immersiveDocument: Document | null = null;

	public async onload(): Promise<void> {
		const data = migratePersistedData(await this.loadData());
		this.settings = data.settings;
		this.positions = data.positions;
		this.lastSaved = JSON.stringify(this.dataBlob());

		this.registerView(VIEW_TYPE_READER, (leaf) => new ReaderView(leaf, this));

		this.addRibbonIcon('book-open', t('ribbonOpen'), () => {
			const file = this.app.workspace.getActiveFile();
			if (file?.extension === 'md') void this.openReader(file);
			else new Notice(t('needMarkdown'));
		});

		this.addCommand({
			id: 'open-current-in-reader',
			name: t('commandOpen'),
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (file?.extension !== 'md') return false;
				if (!checking) void this.openReader(file);
				return true;
			},
		});

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (!(file instanceof TFile) || file.extension !== 'md') return;
				menu.addItem((item) =>
					item
						.setTitle(t('menuOpen'))
						.setIcon('book-open')
						.onClick(() => void this.openReader(file)),
				);
			}),
		);

		this.addSettingTab(new ReaderSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => this.applyImmersive(leaf)),
		);
		this.registerEvent(
			this.app.vault.on('rename', (file, oldPath) => this.handleRename(file, oldPath)),
		);
		this.registerEvent(this.app.vault.on('delete', (file) => this.handleDelete(file)));
		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (!(file instanceof TFile)) return;
				for (const view of this.readerViews()) {
					if (view.file?.path === file.path) void view.renderFile();
				}
			}),
		);

		this.registerInterval(
			window.setInterval(() => {
				const serialized = JSON.stringify(this.dataBlob());
				if (serialized === this.lastSaved) return;
				void this.saveData(JSON.parse(serialized)).then(() => {
					this.lastSaved = serialized;
				});
			}, 2000),
		);

		await this.saveAll();
	}

	public onunload(): void {
		void this.saveAll();
		document.body.removeClass('books-immersive', 'books-chrome-hidden');
		if (this.immersiveDocument && this.immersiveDocument !== document) {
			this.immersiveDocument.body?.removeClass('books-immersive', 'books-chrome-hidden');
		}
		this.immersiveDocument = null;
	}

	public async saveAll(): Promise<void> {
		const data = this.dataBlob();
		await this.saveData(data);
		this.lastSaved = JSON.stringify(data);
	}

	public async openReader(file: TFile): Promise<void> {
		let leaf: WorkspaceLeaf;
		try {
			if (this.settings.openIn === 'current') leaf = this.app.workspace.getLeaf(false);
			else if (this.settings.openIn === 'split') leaf = this.app.workspace.getLeaf('split');
			else if (this.settings.openIn === 'window' && Platform.isDesktop) {
				leaf = this.app.workspace.getLeaf('window');
			} else leaf = this.app.workspace.getLeaf('tab');

			await leaf.setViewState({
				type: VIEW_TYPE_READER,
				active: true,
				state: { filePath: file.path },
			});
			this.app.workspace.revealLeaf(leaf);
			this.applyImmersive(leaf);
		} catch (error) {
			console.error('Obsidian Books could not open the reader.', error);
			new Notice('Obsidian Books could not open this note.');
		}
	}

	public refreshOpenViews(): void {
		for (const view of this.readerViews()) {
			view.applySettings();
			view.requestRepagination();
		}
		this.applyImmersive(this.app.workspace.activeLeaf);
	}

	public applyImmersive(leaf: WorkspaceLeaf | null): void {
		const ownerDocument = this.documentForLeaf(leaf);
		const isReader = leaf?.view instanceof ReaderView;
		const immersive = Boolean(isReader && this.settings.immersive);

		if (immersive) {
			if (this.immersiveDocument && this.immersiveDocument !== ownerDocument) {
				this.immersiveDocument.body?.removeClass('books-immersive', 'books-chrome-hidden');
			}
			ownerDocument.body?.addClass('books-immersive', 'books-chrome-hidden');
			this.immersiveDocument = ownerDocument;
			return;
		}

		ownerDocument.body?.removeClass('books-immersive', 'books-chrome-hidden');
		if (this.immersiveDocument === ownerDocument) this.immersiveDocument = null;
	}

	public toggleImmersiveChrome(ownerDocument: Document): void {
		ownerDocument.body?.toggleClass(
			'books-chrome-hidden',
			!ownerDocument.body.hasClass('books-chrome-hidden'),
		);
	}

	public showImmersiveChrome(ownerDocument: Document): void {
		ownerDocument.body?.removeClass('books-chrome-hidden');
	}

	public releaseImmersive(ownerDocument: Document): void {
		if (this.immersiveDocument !== ownerDocument) return;
		const activeLeaf = this.app.workspace.activeLeaf;
		if (
			activeLeaf?.view instanceof ReaderView &&
			this.documentForLeaf(activeLeaf) === ownerDocument
		) {
			return;
		}
		ownerDocument.body?.removeClass('books-immersive', 'books-chrome-hidden');
		this.immersiveDocument = null;
	}

	private dataBlob(): PersistedData {
		return {
			schemaVersion: 1,
			settings: this.settings,
			positions: this.positions,
		};
	}

	private readerViews(): ReaderView[] {
		return this.app.workspace
			.getLeavesOfType(VIEW_TYPE_READER)
			.map((leaf) => leaf.view)
			.filter((view): view is ReaderView => view instanceof ReaderView);
	}

	private documentForLeaf(leaf: WorkspaceLeaf | null): Document {
		return leaf?.view.containerEl.ownerDocument ?? document;
	}

	private movePosition(from: string, to: string): void {
		const position = this.positions[from];
		if (!position) return;
		this.positions[to] = position;
		delete this.positions[from];
	}

	private handleRename(file: TAbstractFile, oldPath: string): void {
		this.movePosition(oldPath, file.path);
		const prefix = `${oldPath}/`;
		for (const path of Object.keys(this.positions)) {
			if (path.startsWith(prefix)) {
				this.movePosition(path, `${file.path}/${path.slice(prefix.length)}`);
			}
		}

		for (const view of this.readerViews()) {
			if (view.file) view.filePath = view.file.path;
		}
	}

	private handleDelete(file: TAbstractFile): void {
		delete this.positions[file.path];
		const prefix = `${file.path}/`;
		for (const path of Object.keys(this.positions)) {
			if (path.startsWith(prefix)) delete this.positions[path];
		}

		for (const view of this.readerViews()) {
			if (view.filePath !== file.path && !view.filePath?.startsWith(prefix)) continue;
			view.file = null;
			view.filePath = null;
			void view.renderFile();
		}
	}
}

