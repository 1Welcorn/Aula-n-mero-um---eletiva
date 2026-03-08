const initApp = () => {
    try {
        console.log('Cordel Interativo: Iniciando scripts...');
        
        const btnTVMode = document.getElementById('btnTVMode');
        const logoTVTrigger = document.getElementById('logoTVTrigger');
        const body = document.body;

        if (!body) {
            console.error('Erro: Elemento body não encontrado.');
            return;
        }

        // 1. Gestão de Estado do Modo TV
        try {
            if (localStorage.getItem('tvMode') === 'true') {
                body.classList.add('tv-mode');
            }
        } catch (e) {}

        if (btnTVMode) {
            btnTVMode.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isTVActive = body.classList.contains('tv-mode');
                if (!isTVActive) {
                    body.classList.add('tv-mode');
                    try { localStorage.setItem('tvMode', 'true'); } catch (e) {}
                    
                    const doc = document.documentElement;
                    const requestFS = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;
                    if (requestFS) {
                        requestFS.call(doc).catch(err => {
                            console.warn('Fullscreen bloqueado:', err);
                        });
                    }
                } else {
                    body.classList.remove('tv-mode');
                    try { localStorage.setItem('tvMode', 'false'); } catch (e) {}
                    
                    const exitFS = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
                    if (exitFS) exitFS.call(document).catch(() => {});
                }
            });
        }

        if (logoTVTrigger) {
            logoTVTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isTVActive = body.classList.contains('tv-mode');
                if (!isTVActive) {
                    body.classList.add('tv-mode');
                    try { localStorage.setItem('tvMode', 'true'); } catch (e) {}
                    const doc = document.documentElement;
                    const requestFS = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;
                    if (requestFS) requestFS.call(doc).catch(() => {});
                } else {
                    body.classList.remove('tv-mode');
                    try { localStorage.setItem('tvMode', 'false'); } catch (e) {}
                    const exitFS = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
                    if (exitFS) exitFS.call(document).catch(() => {});
                }
            });
        }

        const handleFullscreenChange = () => {
            const isFullscreen = !!(document.fullscreenElement || 
                                   document.webkitFullscreenElement || 
                                   document.mozFullScreenElement || 
                                   document.msFullscreenElement);
            
            if (isFullscreen) {
                body.classList.add('tv-mode');
            }
        };

        window.addEventListener('keydown', (e) => {
            if (e.key === 'F11') {
                setTimeout(() => {
                    const isFullscreen = !!(document.fullscreenElement || window.innerWidth === screen.width);
                    if (isFullscreen) body.classList.add('tv-mode');
                }, 100);
            }
            if (e.key === 'Escape' && body.classList.contains('tv-mode')) {
                body.classList.remove('tv-mode');
            }
        });

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        // 2. Navegação SPA para manter Fullscreen
        let isNavigating = false;
        let navAbortController = null;
        const pageCache = new Map(); // Cache para armazenar o conteúdo das páginas

        let spinner = document.querySelector('.nav-loading-spinner');
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.className = 'nav-loading-spinner';
            document.body.appendChild(spinner);
        }

        const handleNavigation = async (url, isPrefetch = false) => {
            if (!url || url.startsWith('javascript:')) return;
            
            const targetUrl = new URL(url, window.location.href).href;
            const currentUrl = window.location.href;
            
            // Se já estiver no cache e não for prefetch, usa o cache
            if (!isPrefetch && pageCache.has(targetUrl)) {
                console.log(`SPA: Usando cache para ${targetUrl}`);
                renderPage(pageCache.get(targetUrl), targetUrl);
                return;
            }

            if (isNavigating && !isPrefetch) {
                console.warn('SPA: Navegação em curso, cancelando anterior');
                if (navAbortController) navAbortController.abort();
            }

            if (!isPrefetch) {
                console.log(`SPA: Iniciando transição para ${targetUrl}`);
                const currentMain = document.querySelector('main');
                if (currentMain) {
                    currentMain.style.transition = 'opacity 0.15s ease';
                    currentMain.style.opacity = '0.5';
                }
                if (spinner) spinner.style.display = 'block';
                isNavigating = true;
                navAbortController = new AbortController();
            }

            const navTimeout = !isPrefetch ? setTimeout(() => {
                if (isNavigating) {
                    console.error('SPA: Timeout - Forçando recarregamento nativo');
                    window.location.href = targetUrl;
                }
            }, 8000) : null;
            
            try {
                const response = await fetch(targetUrl, { 
                    signal: navAbortController?.signal,
                    priority: isPrefetch ? 'low' : 'high'
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                const pageData = {
                    mainContent: doc.querySelector('main')?.innerHTML,
                    mainClass: doc.querySelector('main')?.className,
                    title: doc.title,
                    scripts: Array.from(doc.querySelectorAll('script')).map(s => ({
                        src: s.src,
                        textContent: s.textContent,
                        attributes: Array.from(s.attributes).map(a => ({ name: a.name, value: a.value }))
                    }))
                };

                // Armazenar no cache
                pageCache.set(targetUrl, pageData);

                if (!isPrefetch) {
                    renderPage(pageData, targetUrl);
                }
            } catch (err) {
                if (err.name === 'AbortError') {
                    console.log('SPA: Navegação abortada.');
                } else if (!isPrefetch) {
                    console.error('SPA: Erro crítico:', err);
                    window.location.href = targetUrl;
                }
            } finally {
                if (!isPrefetch) {
                    if (navTimeout) clearTimeout(navTimeout);
                    const currentMain = document.querySelector('main');
                    if (currentMain) currentMain.style.opacity = '1';
                    if (spinner) spinner.style.display = 'none';
                    isNavigating = false;
                    navAbortController = null;
                }
            }
        };

        function renderPage(pageData, targetUrl) {
            const currentMain = document.querySelector('main');
            const currentUrl = window.location.href;

            if (pageData.mainContent && currentMain) {
                console.log('SPA: Atualizando conteúdo <main>');
                currentMain.innerHTML = pageData.mainContent;
                currentMain.className = pageData.mainClass;
                window.scrollTo(0, 0);
                
                document.title = pageData.title;
                if (currentUrl !== targetUrl) {
                    history.pushState({ url: targetUrl }, pageData.title, targetUrl);
                }
                
                // Re-executar scripts
                pageData.scripts.forEach(scriptData => {
                    if (scriptData.src && scriptData.src.includes('app.js')) return;
                    
                    const newScript = document.createElement('script');
                    scriptData.attributes.forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    if (scriptData.src) {
                        newScript.src = scriptData.src;
                    } else {
                        newScript.textContent = scriptData.textContent;
                    }
                    document.body.appendChild(newScript);
                    if (!scriptData.src) newScript.remove();
                });
                
                reinitializePageScripts();
                console.log('SPA: Navegação concluída.');
            } else {
                window.location.href = targetUrl;
            }
        }

        function reinitializePageScripts() {
            const path = window.location.pathname;
            if (path.includes('quiz.html')) {
                if (typeof loadQuestion === 'function') {
                    loadQuestion();
                } else {
                    setTimeout(() => { if (typeof loadQuestion === 'function') loadQuestion(); }, 150);
                }
            }
        }

        // Interceptar cliques e hovers para prefetch
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                const isInternal = link.origin === window.location.origin || link.href.startsWith('/') || !link.href.includes('://');
                
                if (isInternal) {
                    if (link.target === '_blank' || 
                        link.hasAttribute('download') || 
                        link.classList.contains('back-link') || 
                        link.href.startsWith('javascript:') ||
                        (link.getAttribute('href') && link.getAttribute('href').startsWith('#'))) {
                        return;
                    }
                    
                    e.preventDefault();
                    handleNavigation(link.href);
                }
            }
        });

        // Prefetch ao passar o mouse
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && !link.href.startsWith('javascript:') && !link.getAttribute('href')?.startsWith('#')) {
                const targetUrl = new URL(link.href, window.location.href).href;
                if (!pageCache.has(targetUrl)) {
                    handleNavigation(targetUrl, true);
                }
            }
        }, { passive: true });

        window.addEventListener('popstate', (e) => {
            handleNavigation(window.location.href);
        });

        // 3. Expansor Magnético (Maximized Cards) via Delegação de Eventos
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (!card) return;

            if (e.target.closest('.close-btn') || e.target.closest('a')) return;

            if (card.classList.contains('hub-card')) {
                const isTVActive = body.classList.contains('tv-mode');
                const url = card.dataset.url;
                
                if (!isTVActive) {
                    body.classList.add('tv-mode');
                    try { localStorage.setItem('tvMode', 'true'); } catch (e) {}
                    const doc = document.documentElement;
                    const requestFS = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;
                    
                    if (requestFS) {
                        const fsPromise = requestFS.call(doc);
                        if (fsPromise instanceof Promise) {
                            fsPromise.then(() => {
                                if (url) handleNavigation(url);
                            }).catch(() => {
                                if (url) handleNavigation(url);
                            });
                        } else {
                            if (url) handleNavigation(url);
                        }
                    } else {
                        if (url) handleNavigation(url);
                    }
                } else {
                    if (url) handleNavigation(url);
                }
                return;
            }

            if (!card.classList.contains('maximized')) {
                maximizeCard(card);
            }
        });

        function maximizeCard(card) {
            card.classList.add('maximized');
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.className = 'close-btn';
            closeBtn.setAttribute('aria-label', 'Fechar');
            card.appendChild(closeBtn);

            const close = (e) => {
                if (e) e.stopPropagation();
                card.classList.remove('maximized');
                closeBtn.remove();
                document.removeEventListener('keydown', escHandler);
            };

            closeBtn.onclick = close;
            const escHandler = (e) => {
                if (e.key === 'Escape') close(e);
            };
            document.addEventListener('keydown', escHandler);
        }

        console.log('Cordel Interativo: Scripts inicializados com sucesso.');
    } catch (globalError) {
        console.error('Erro crítico na inicialização do Cordel Interativo:', globalError);
    }
};

// Inicialização segura
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
