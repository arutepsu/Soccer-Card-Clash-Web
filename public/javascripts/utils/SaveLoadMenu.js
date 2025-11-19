import { fileIOApi } from '../api/FileIOApi.js';

export class SaveLoadMenu {
  constructor() {
    this.isOpen = false;
    this.savedGames = [];
    this.onGameLoaded = null; // Callback when a game is loaded
  }

  async show() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    await this.createMenuHTML();
    await this.refreshGameList();
  }

  
  hide() {
    const menu = document.getElementById('save-load-menu');
    if (menu) {
      menu.remove();
    }
    this.isOpen = false;
  }

  async createMenuHTML() {
    // Remove existing menu if any
    this.hide();

    const menuHTML = `
      <div id="save-load-menu" class="save-load-menu">
        <div class="save-load-content">
          <div class="save-load-header">
            <h2>Save / Load Game</h2>
            <button class="close-btn" id="close-menu-btn">&times;</button>
          </div>
          <div class="save-load-body">
            <!-- Save Section -->
            <div class="save-section">
              <h3>Save Game</h3>
              <div class="save-controls">
                <input 
                  type="text" 
                  id="save-filename" 
                  placeholder="Enter filename (e.g., mygame.json)"
                  value="game.json"
                />
                <button id="save-btn" class="action-btn save-btn">Save</button>
                <button id="quick-save-btn" class="action-btn quick-btn">Quick Save</button>
              </div>
            </div>
            <!-- Load Section ohne Load-Button -->
            <div class="load-section">
              <h3>Load Game</h3>
              <div class="load-controls">
                <button id="refresh-btn" class="action-btn refresh-btn">Refresh List</button>
              </div>
              <div id="saved-games-list" class="saved-games-list">
                <p class="loading">Loading saved games...</p>
              </div>
            </div>
          </div>
          <div class="save-load-footer">
            <p class="info-text">Games are saved in the 'games/' folder</p>
          </div>
        </div>
        <!-- Load-Buttons außerhalb des Containers -->
        <div id="external-load-buttons" style="width:100%;display:flex;justify-content:center;margin-top:16px;"></div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', menuHTML);
    this.attachEventListeners();
  }

  /**
   * Attach event listeners to menu elements
   */
  attachEventListeners() {
    // Close button
    document.getElementById('close-menu-btn')?.addEventListener('click', () => {
      this.hide();
    });

    // Save button
    document.getElementById('save-btn')?.addEventListener('click', async () => {
      await this.handleSave();
    });

    // Quick save button
    document.getElementById('quick-save-btn')?.addEventListener('click', async () => {
      await this.handleQuickSave();
    });

    // Refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', async () => {
      await this.refreshGameList();
    });

    // Close on background click
    document.getElementById('save-load-menu')?.addEventListener('click', (e) => {
      if (e.target.id === 'save-load-menu') {
        this.hide();
      }
    });
  }

 
  async handleSave() {
    const filenameInput = document.getElementById('save-filename');
    let filename = filenameInput?.value.trim() || 'game.json';
    
    // Ensure .json extension
    if (!filename.endsWith('.json')) {
      filename += '.json';
    }

    try {
      const result = await fileIOApi.saveGame(filename);
      this.showMessage(`Game saved successfully to ${filename}`, 'success');
      await this.refreshGameList();
    } catch (error) {
      this.showMessage(`Error saving game: ${error.message}`, 'error');
    }
  }

 
  async handleQuickSave() {
    try {
      const result = await fileIOApi.quickSave();
      this.showMessage('Game quick-saved to game.json', 'success');
      await this.refreshGameList();
    } catch (error) {
      this.showMessage(`Error quick-saving: ${error.message}`, 'error');
    }
  }


  async handleLoad(filename) {
    try {
      const gameState = await fileIOApi.loadGame(filename);
      this.showMessage(`Game loaded from ${filename}`, 'success');
      
      // Trigger callback if set
      if (this.onGameLoaded) {
        this.onGameLoaded(gameState);
      }
      
      // Close menu after successful load
      setTimeout(() => this.hide(), 1000);
    } catch (error) {
      this.showMessage(`Error loading game: ${error.message}`, 'error');
    }
  }

  async handleDelete(filename) {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      await fileIOApi.deleteGame(filename);
      this.showMessage(`Deleted ${filename}`, 'success');
      await this.refreshGameList();
    } catch (error) {
      this.showMessage(`Error deleting game: ${error.message}`, 'error');
    }
  }


  async refreshGameList() {
    const listContainer = document.getElementById('saved-games-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<p class="loading">Loading...</p>';

    try {
      this.savedGames = await fileIOApi.listSavedGames();
      
      if (this.savedGames.length === 0) {
        listContainer.innerHTML = '<p class="no-games">No saved games found</p>';
        return;
      }

      listContainer.innerHTML = this.savedGames.map(filename => `
        <div class="game-item-wrapper">
          <div class="game-item">
            <span class="game-name">${filename}</span>
          </div>
          <div class="game-actions">
            <button class="delete-game-btn" data-filename="${filename}">Delete</button>
          </div>
        </div>
      `).join('');

      const externalLoadButtons = document.getElementById('external-load-buttons');
      if (externalLoadButtons) {
        externalLoadButtons.innerHTML = this.savedGames.map(filename => `
          <button class="load-game-btn" data-filename="${filename}" style="margin:0 8px;">Load ${filename}</button>
        `).join('');
        externalLoadButtons.querySelectorAll('.load-game-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const filename = e.target.dataset.filename;
            this.handleLoad(filename);
          });
        });
      }

      // Attach event listeners to delete buttons
      listContainer.querySelectorAll('.delete-game-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const filename = e.target.dataset.filename;
          this.handleDelete(filename);
        });
      });

    } catch (error) {
      listContainer.innerHTML = `<p class="error">Error loading games: ${error.message}</p>`;
    }
  }

 
  showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `save-load-message ${type}`;
    messageDiv.textContent = message;
    
    const menu = document.getElementById('save-load-menu');
    if (menu) {
      menu.appendChild(messageDiv);
      
      setTimeout(() => {
        messageDiv.remove();
      }, 3000);
    }
  }
}

// Export singleton instance
export const saveLoadMenu = new SaveLoadMenu();
