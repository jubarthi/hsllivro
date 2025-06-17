// PDF.js integration for real PDF loading
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

class RealFlipbook {
    constructor(container) {
        this.container = container;
        this.pdfPath = 'mkt-medico-jubarthi.pdf';
        this.pdfDoc = null;
        this.pages = [];
        this.currentPage = 0;
        this.totalPages = 0;
        this.isAnimating = false;
        this.pageElements = [];
        this.scale = 1.2;
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadPDF();
            await this.renderAllPages();
            this.setupFlipbook();
            this.setupControls();
            this.setupTouchEvents();
            this.updatePageCounter();
            
            console.log('Flipbook inicializado com sucesso!');
        } catch (error) {
            console.error('Erro ao carregar PDF:', error);
            this.showError();
        }
    }
    
    async loadPDF() {
        const loadingTask = pdfjsLib.getDocument(this.pdfPath);
        this.pdfDoc = await loadingTask.promise;
        this.totalPages = this.pdfDoc.numPages;
        console.log(`PDF carregado: ${this.totalPages} páginas`);
    }
    
    async renderAllPages() {
        this.container.innerHTML = '<div class="loading-pdf"><i class="fas fa-spinner fa-spin"></i> Carregando livro...</div>';
        
        for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
            const page = await this.pdfDoc.getPage(pageNum);
            const canvas = await this.renderPageToCanvas(page);
            this.createPageElement(canvas, pageNum - 1);
        }
        
        this.container.querySelector('.loading-pdf')?.remove();
    }
    
    async renderPageToCanvas(page) {
        const viewport = page.getViewport({ scale: this.scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        return canvas;
    }
    
    createPageElement(canvas, index) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'flipbook-page';
        pageDiv.style.cssText = `
            position: absolute;
            width: 50%;
            height: 100%;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            overflow: hidden;
            transform-origin: left center;
            transform-style: preserve-3d;
            transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1);
            z-index: ${this.totalPages - index};
            cursor: pointer;
        `;
        
        // Ajustar canvas para caber na página
        canvas.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
        `;
        
        pageDiv.appendChild(canvas);
        this.container.appendChild(pageDiv);
        this.pageElements.push(pageDiv);
        
        // Configurar página inicial
        if (index > 0) {
            pageDiv.style.transform = 'rotateY(0deg)';
        }
    }
    
    setupFlipbook() {
        this.container.style.cssText = `
            position: relative;
            width: 100%;
            max-width: 900px;
            height: 600px;
            margin: 0 auto;
            perspective: 1400px;
            background: linear-gradient(145deg, #f0f0f0, #e0e0e0);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            overflow: hidden;
        `;
    }
    
    setupControls() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevPage());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
        }
        
        // Navegação por teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prevPage();
            } else if (e.key === 'ArrowRight') {
                this.nextPage();
            }
        });
        
        // Clique na página para avançar
        this.pageElements.forEach((page, index) => {
            page.addEventListener('click', (e) => {
                const rect = page.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pageWidth = rect.width;
                
                if (clickX > pageWidth / 2) {
                    this.nextPage();
                } else {
                    this.prevPage();
                }
            });
        });
    }
    
    setupTouchEvents() {
        let startX = 0;
        let endX = 0;
        
        this.container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        this.container.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            this.handleSwipe(startX, endX);
        }, { passive: true });
        
        // Eventos de mouse para desktop
        let isMouseDown = false;
        
        this.container.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            startX = e.clientX;
        });
        
        this.container.addEventListener('mouseup', (e) => {
            if (isMouseDown) {
                endX = e.clientX;
                this.handleSwipe(startX, endX);
                isMouseDown = false;
            }
        });
        
        this.container.addEventListener('mouseleave', () => {
            isMouseDown = false;
        });
    }
    
    handleSwipe(startX, endX) {
        const threshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe para esquerda - próxima página
                this.nextPage();
            } else {
                // Swipe para direita - página anterior
                this.prevPage();
            }
        }
    }
    
    nextPage() {
        if (this.isAnimating || this.currentPage >= this.totalPages - 1) {
            return;
        }
        
        this.isAnimating = true;
        const currentPageElement = this.pageElements[this.currentPage];
        
        // Efeito de virar página para a esquerda
        currentPageElement.style.transform = 'rotateY(-180deg)';
        currentPageElement.style.zIndex = this.currentPage;
        
        // Som de virar página (opcional)
        this.playPageTurnSound();
        
        this.currentPage++;
        this.updatePageCounter();
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 800);
    }
    
    prevPage() {
        if (this.isAnimating || this.currentPage <= 0) {
            return;
        }
        
        this.isAnimating = true;
        this.currentPage--;
        
        const pageToShow = this.pageElements[this.currentPage];
        
        // Retornar página da posição virada
        pageToShow.style.transform = 'rotateY(0deg)';
        pageToShow.style.zIndex = this.totalPages - this.currentPage;
        
        // Som de virar página (opcional)
        this.playPageTurnSound();
        
        this.updatePageCounter();
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 800);
    }
    
    updatePageCounter() {
        const counter = document.getElementById('pageCounter');
        if (counter) {
            counter.textContent = `${this.currentPage + 1} / ${this.totalPages}`;
        }
        
        // Atualizar estado dos botões
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 0;
            prevBtn.style.opacity = this.currentPage <= 0 ? '0.5' : '1';
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages - 1;
            nextBtn.style.opacity = this.currentPage >= this.totalPages - 1 ? '0.5' : '1';
        }
    }
    
    goToPage(pageNumber) {
        if (pageNumber < 0 || pageNumber >= this.totalPages || this.isAnimating) {
            return;
        }
        
        this.isAnimating = true;
        
        // Animar para a página alvo
        for (let i = 0; i < pageNumber; i++) {
            this.pageElements[i].style.transform = 'rotateY(-180deg)';
            this.pageElements[i].style.zIndex = i;
        }
        
        for (let i = pageNumber; i < this.totalPages; i++) {
            this.pageElements[i].style.transform = 'rotateY(0deg)';
            this.pageElements[i].style.zIndex = this.totalPages - i;
        }
        
        this.currentPage = pageNumber;
        this.updatePageCounter();
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 800);
    }
    
    playPageTurnSound() {
        // Efeito sonoro opcional (descomente se tiver arquivo de som)
        // const audio = new Audio('page-turn.mp3');
        // audio.volume = 0.3;
        // audio.play().catch(() => {});
    }
    
    showError() {
        this.container.innerHTML = `
            <div class="pdf-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao carregar o livro</h3>
                <p>Verifique se o arquivo "mkt-medico-jubarthi.pdf" está na pasta correta.</p>
                <button onclick="location.reload()" class="retry-btn">
                    <i class="fas fa-refresh"></i> Tentar novamente
                </button>
            </div>
        `;
    }
}

// Funcionalidade de fullscreen
function toggleFullscreen() {
    const flipbookSection = document.getElementById('flipbook');
    
    if (!document.fullscreenElement) {
        flipbookSection.requestFullscreen().then(() => {
            flipbookSection.classList.add('fullscreen-mode');
        });
    } else {
        document.exitFullscreen().then(() => {
            flipbookSection.classList.remove('fullscreen-mode');
        });
    }
}

// Inicialização quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    const flipbookContainer = document.querySelector('#flipbook .flipbook');
    if (flipbookContainer) {
        window.realFlipbook = new RealFlipbook(flipbookContainer);
    }
    
    // Adicionar barra de progresso de leitura
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.innerHTML = '<div class="progress-fill"></div>';
    
    const progressStyles = `
        .reading-progress {
            position: fixed;
            top: 80px;
            left: 0;
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            z-index: 999;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #2C8C74, #4FB89D);
            width: 0%;
            transition: width 0.3s ease;
        }
        .loading-pdf {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            font-size: 18px;
            color: #2C8C74;
        }
        .pdf-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            color: #666;
        }
        .pdf-error i {
            font-size: 48px;
            color: #e74c3c;
            margin-bottom: 20px;
        }
        .retry-btn {
            margin-top: 20px;
            padding: 12px 24px;
            background: #2C8C74;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = progressStyles;
    document.head.appendChild(styleSheet);
    document.body.appendChild(progressBar);
    
    // Atualizar progresso baseado na página atual
    function updateProgress() {
        if (window.realFlipbook) {
            const progress = ((window.realFlipbook.currentPage + 1) / window.realFlipbook.totalPages) * 100;
            progressBar.querySelector('.progress-fill').style.width = `${progress}%`;
        }
    }
    
    // Monitorar mudanças de página
    setInterval(updateProgress, 200);
    
    // Adicionar botão fullscreen
    const controls = document.querySelector('.flipbook-controls');
    if (controls) {
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'control-btn';
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> Tela Cheia';
        fullscreenBtn.onclick = toggleFullscreen;
        controls.appendChild(fullscreenBtn);
    }
});
