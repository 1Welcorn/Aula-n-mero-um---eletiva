document.addEventListener('DOMContentLoaded', () => {
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
        // Inicializar estado do localStorage
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
                    // Entrar em modo TV
                    body.classList.add('tv-mode');
                    try { localStorage.setItem('tvMode', 'true'); } catch (e) {}
                    
                    // Tenta entrar em Fullscreen (OBRIGATÓRIO ser direto no clique)
                    const doc = document.documentElement;
                    const requestFS = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;
                    if (requestFS) {
                        requestFS.call(doc).catch(err => {
                            console.warn('Fullscreen bloqueado:', err);
                        });
                    }
                } else {
                    // Sair do modo TV
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

        // Sincronizar apenas se o usuário sair do Fullscreen via ESC ou usar F11
        const handleFullscreenChange = () => {
            const isFullscreen = !!(document.fullscreenElement || 
                                   document.webkitFullscreenElement || 
                                   document.mozFullScreenElement || 
                                   document.msFullscreenElement);
            
            if (isFullscreen) {
                body.classList.add('tv-mode');
            } else {
                console.log('Fullscreen encerrado.');
            }
        };

        // Ouvir tecla F11 para sincronizar layout
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F11') {
                // Aguarda um instante para o navegador processar o fullscreen nativo
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
        const handleNavigation = async (url) => {
            if (isNavigating || !url || url.startsWith('javascript:')) return;
            
            const currentMain = document.querySelector('main');
            if (currentMain) currentMain.style.opacity = '0.5';
            isNavigating = true;
            
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Falha ao carregar página');
                
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Atualizar conteúdo do main
                const newMain = doc.querySelector('main');
                if (newMain && currentMain) {
                    currentMain.innerHTML = newMain.innerHTML;
                    // Atualizar classes do main se necessário
                    currentMain.className = newMain.className;
                    // Re-scrolar para o topo
                    window.scrollTo(0, 0);
                }
                
                // Atualizar título
                document.title = doc.title;
                
                // Executar scripts da nova página
                const scripts = doc.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    if (oldScript.src) {
                        if (oldScript.src.includes('app.js')) return;
                        newScript.src = oldScript.src;
                    } else {
                        newScript.textContent = oldScript.textContent;
                    }
                    document.body.appendChild(newScript);
                    if (!oldScript.src) newScript.remove();
                });
                
                // Atualizar URL se não for popstate
                if (window.location.href !== url) {
                    history.pushState({ url }, doc.title, url);
                }
                
                // Re-inicializar componentes específicos da nova página
                reinitializePageScripts();
                
            } catch (err) {
                console.error('Erro na navegação SPA:', err);
                // Fallback para navegação normal apenas se não for erro de cancelamento
                if (err.name !== 'AbortError') {
                    window.location.href = url;
                }
            } finally {
                if (currentMain) currentMain.style.opacity = '1';
                isNavigating = false;
            }
        };

        function reinitializePageScripts() {
            // Re-inicializar Quiz se estiver na página de quiz
            if (window.location.pathname.includes('quiz.html')) {
                if (typeof loadQuestion === 'function') loadQuestion();
            }
        }

        // Interceptar cliques em links da navegação
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && link.origin === window.location.origin) {
                // Ignorar links com target="_blank", links de download, ou links com classe back-link
                if (link.target === '_blank' || link.hasAttribute('download') || link.classList.contains('back-link') || link.href.startsWith('javascript:')) {
                    return;
                }
                
                e.preventDefault();
                handleNavigation(link.href);
            }
        });

        // Lidar com botão voltar do navegador
        window.addEventListener('popstate', (e) => {
            handleNavigation(window.location.href);
        });

        // 3. Expansor Magnético (Maximized Cards) via Delegação de Eventos
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (!card) return;

            // Se clicou no botão de fechar ou em algo interno que não deve triggar o card
            if (e.target.closest('.close-btn') || e.target.closest('a')) return;

            console.log('Cartão clicado:', card.querySelector('h3')?.innerText);
            
            // Lógica especial para Hub Cards (Início)
            if (card.classList.contains('hub-card')) {
                const isTVActive = body.classList.contains('tv-mode');
                const url = card.dataset.url;
                
                if (!isTVActive) {
                    body.classList.add('tv-mode');
                    try { localStorage.setItem('tvMode', 'true'); } catch (e) {}
                    const doc = document.documentElement;
                    const requestFS = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;
                    if (requestFS) {
                        requestFS.call(doc).then(() => {
                            if (url) handleNavigation(url);
                        }).catch(err => {
                            console.warn('Fullscreen bloqueado:', err);
                            if (url) handleNavigation(url);
                        });
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
            
            // Criar botão de fechar
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
});
