/**
 * Window Manager Module
 * Handles creating and managing modal windows
 */

// Create and open a modal window with the given page URL
function openModal(pageUrl) {
  // Create modal overlay
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  // Create modal window
  var modal = document.createElement('div');
  modal.className = 'modal-window';
  
  // Create modal header with close button
  var header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <span class="modal-title">${pageUrl}</span>
    <button class="modal-close">×</button>
  `;
  
  // Create modal content iframe
  var content = document.createElement('div');
  content.className = 'modal-content';
  content.innerHTML = `<iframe src="${pageUrl}" frameborder="0"></iframe>`;
  
  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(content);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Close functionality
  var closeBtn = header.querySelector('.modal-close');
  closeBtn.addEventListener('click', function() {
    document.body.removeChild(overlay);
  });
  
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
  
  // Return the modal overlay element for potential further manipulation
  return overlay;
}

// Advanced window management class
class WindowManager {
  constructor() {
    this.windows = [];
    this.zIndex = 1000;
    this.activeWindow = null;
    this.windowIdCounter = 0;
  }

  createWindow(pageUrl, options = {}) {
    const id = `window-${++this.windowIdCounter}`;
    const title = this.getPageTitle(pageUrl);
    
    // Create window overlay
    const element = document.createElement('div');
    element.className = 'window-overlay';
    element.id = id;
    
    // Create window container
    const container = document.createElement('div');
    container.className = 'window-container';
    container.style.width = options.width || '800px';
    container.style.height = options.height || '600px';
    container.style.left = options.left || '50px';
    container.style.top = options.top || '50px';
    container.style.zIndex = ++this.zIndex;
    
    // Create window header
    const header = document.createElement('div');
    header.className = 'window-header';
    header.innerHTML = `
      <span class="window-title">${title}</span>
      <div class="window-controls">
        <button class="window-minimize">_</button>
        <button class="window-maximize">□</button>
        <button class="window-close">×</button>
      </div>
    `;
    
    // Create window content
    const content = document.createElement('div');
    content.className = 'window-content';
    content.innerHTML = `<iframe src="${pageUrl}" frameborder="0"></iframe>`;
    
    // Create resize handles
    const resizeHandles = this.createResizeHandles();
    
    // Assemble window
    container.appendChild(header);
    container.appendChild(content);
    resizeHandles.forEach(handle => container.appendChild(handle));
    element.appendChild(container);
    document.body.appendChild(element);
    
    // Create window state
    const windowState = {
      id,
      element,
      container,
      header,
      content,
      isMaximized: false,
      isMinimized: false,
      originalBounds: null,
      isDragging: false,
      isResizing: false
    };
    
    this.windows.push(windowState);
    this.activeWindow = windowState;
    
    // Add event listeners
    this.addWindowEvents(windowState);
    
    return windowState;
  }

  createResizeHandles() {
    const handles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    return handles.map(direction => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-${direction}`;
      handle.dataset.direction = direction;
      return handle;
    });
  }

  addWindowEvents(windowState) {
    const { element, container, header } = windowState;
    
    // Window controls
    const minimizeBtn = header.querySelector('.window-minimize');
    const maximizeBtn = header.querySelector('.window-maximize');
    const closeBtn = header.querySelector('.window-close');
    
    minimizeBtn.addEventListener('click', () => this.minimizeWindow(windowState));
    maximizeBtn.addEventListener('click', () => this.toggleMaximize(windowState));
    closeBtn.addEventListener('click', () => this.closeWindow(windowState));
    
    // Window dragging
    header.addEventListener('mousedown', (e) => this.startDrag(e, windowState));
    
    // Window focus
    element.addEventListener('mousedown', () => this.focusWindow(windowState));
    
    // Resize handles
    const resizeHandles = container.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => this.startResize(e, windowState, handle.dataset.direction));
    });
    
    // Double click to maximize
    header.addEventListener('dblclick', () => this.toggleMaximize(windowState));
  }

  startDrag(e, windowState) {
    if (windowState.isMaximized) return;
    
    windowState.isDragging = true;
    this.focusWindow(windowState);
    
    const rect = windowState.container.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    const onMouseMove = (e) => {
      if (!windowState.isDragging) return;
      
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      
      windowState.container.style.left = Math.max(0, x) + 'px';
      windowState.container.style.top = Math.max(0, y) + 'px';
    };
    
    const onMouseUp = () => {
      windowState.isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  startResize(e, windowState, direction) {
    if (windowState.isMaximized) return;
    
    windowState.isResizing = true;
    this.focusWindow(windowState);
    
    const rect = windowState.container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;
    const startLeft = rect.left;
    const startTop = rect.top;
    
    const onMouseMove = (e) => {
      if (!windowState.isResizing) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;
      
      if (direction.includes('e')) newWidth = startWidth + deltaX;
      if (direction.includes('w')) {
        newWidth = startWidth - deltaX;
        newLeft = startLeft + deltaX;
      }
      if (direction.includes('s')) newHeight = startHeight + deltaY;
      if (direction.includes('n')) {
        newHeight = startHeight - deltaY;
        newTop = startTop + deltaY;
      }
      
      // Apply minimum size constraints
      newWidth = Math.max(300, newWidth);
      newHeight = Math.max(200, newHeight);
      
      windowState.container.style.width = newWidth + 'px';
      windowState.container.style.height = newHeight + 'px';
      windowState.container.style.left = newLeft + 'px';
      windowState.container.style.top = newTop + 'px';
    };
    
    const onMouseUp = () => {
      windowState.isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  toggleMaximize(windowState) {
    if (windowState.isMaximized) {
      this.restoreWindow(windowState);
    } else {
      this.maximizeWindow(windowState);
    }
  }

  maximizeWindow(windowState) {
    if (!windowState.originalBounds) {
      const rect = windowState.container.getBoundingClientRect();
      windowState.originalBounds = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      };
    }
    
    windowState.container.style.left = '0px';
    windowState.container.style.top = '0px';
    windowState.container.style.width = '100vw';
    windowState.container.style.height = '100vh';
    windowState.isMaximized = true;
  }

  restoreWindow(windowState) {
    if (windowState.originalBounds) {
      windowState.container.style.left = windowState.originalBounds.left + 'px';
      windowState.container.style.top = windowState.originalBounds.top + 'px';
      windowState.container.style.width = windowState.originalBounds.width + 'px';
      windowState.container.style.height = windowState.originalBounds.height + 'px';
    }
    windowState.isMaximized = false;
  }

  minimizeWindow(windowState) {
    windowState.element.style.display = 'none';
    windowState.isMinimized = true;
  }

  focusWindow(windowState) {
    windowState.container.style.zIndex = ++this.zIndex;
    this.activeWindow = windowState;
  }

  closeWindow(windowState) {
    document.body.removeChild(windowState.element);
    this.windows = this.windows.filter(w => w.id !== windowState.id);
    if (this.activeWindow === windowState) {
      this.activeWindow = this.windows.length > 0 ? this.windows[this.windows.length - 1] : null;
    }
  }

  getPageTitle(pageUrl) {
    const parts = pageUrl.split('/');
    return parts[parts.length - 1] || 'Window';
  }
}

// Export both the simple modal functionality and the advanced window manager
window.WindowManager = {
  openModal: openModal,
  advanced: new WindowManager()
};
